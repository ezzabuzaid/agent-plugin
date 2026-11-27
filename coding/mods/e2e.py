#!/usr/bin/env python3
"""Real-run proof of the rollover mod: one interactive Claude Code session, end to end.

The unit tests (`claude plugin test coding/mods`) stand in for the engine. This drives the
real engine instead: a terminal session (in a pseudo-terminal, with the user's own settings
and hooks) loads this checkout's coding plugin with a low `rolloverPercent`, gets pushed past
it, and must write a continuation, /clear, and resume from it in a new conversation.

    python3 -I coding/mods/e2e.py <empty work folder> [--percent 12] [--wait 420]

It spends the plan's quota (about 10 model requests) and ends within about 10 minutes. It prints one JSON verdict and exits 0
only when every check holds. The child session and its pseudo-terminal are stopped at the end;
the transcripts stay under ~/.claude/projects/ as evidence. Python, because Node has no
pseudo-terminal of its own.
"""
import argparse, glob, json, os, pty, select, signal, struct, subprocess, sys, time, fcntl, termios

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CODING = f'{REPO}/coding'
BIG_FILES = [f'{REPO}/hooks/ezzs-way-of-coding/rules.test.ts', f'{REPO}/coding/skills/node-native/surface.json']
HOME = os.path.expanduser('~')
TRAJECTORY = '7.62.0'  # the @deepagents/trajectory release whose bin this reads (its ADR 0010)

parser = argparse.ArgumentParser()
parser.add_argument('work')
parser.add_argument('--percent', type=int, default=12)
parser.add_argument('--wait', type=int, default=420, help='seconds to wait for the rollover')
parser.add_argument('--claude', default=f'{HOME}/.local/bin/claude')
args = parser.parse_args()
work = os.path.abspath(args.work)
os.makedirs(work, exist_ok=True)
settings = f'{work}.settings.json'
with open(settings, 'w') as f:
    json.dump({'pluginConfigs': {'coding@inline': {'options': {'rolloverPercent': args.percent}}}}, f)

# The child is a session of its own: nothing of the caller's session or terminal leaks in.
env = {k: v for k, v in os.environ.items() if not k.startswith(('CLAUDE', 'CMUX', 'ANTHROPIC'))}
env['TERM'] = 'xterm-256color'
pid, fd = pty.fork()
if pid == 0:
    os.chdir(work)
    os.execve(args.claude, [args.claude, '--plugin-dir', CODING, '--settings', settings], env)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 200, 0, 0))
screen = b''


def pump(seconds):
    global screen
    end = time.time() + seconds
    while time.time() < end:
        ready, _, _ = select.select([fd], [], [], 0.5)
        if ready:
            try:
                screen = (screen + os.read(fd, 65536))[-200_000:]
            except OSError:
                return False
    return True


def type_line(text):
    for ch in text:
        os.write(fd, ch.encode())
        time.sleep(0.01)
    time.sleep(0.4)
    os.write(fd, b'\r')


def transcripts():
    folders = [p for p in glob.glob(f'{HOME}/.claude/projects/*') if p.endswith(os.path.basename(work))]
    return sorted(glob.glob(f'{folders[0]}/*.jsonl'), key=os.path.getmtime) if folders else []


def steps(path):
    """The transcript's ATIF steps, read through @deepagents/trajectory's CLI (its ADR 0010)."""
    out = subprocess.run(['npx', '--yes', f'--package=@deepagents/trajectory@{TRAJECTORY}', 'trajectory', 'read', 'claude-code', path],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)['trajectory']['steps']


def claude_code(step):
    return (step.get('extra') or {}).get('claude_code') or {}


def turn_ends(path):
    return sum(1 for s in steps(path) if s['source'] == 'system' and (claude_code(s).get('system') or {}).get('subtype') in ('stop_hook_summary', 'turn_duration'))


def wait_for(predicate, seconds):
    end = time.time() + seconds
    while time.time() < end:
        if not pump(2):
            return False
        if predicate():
            return True
    return False


def first_text(path, needle):
    return any(isinstance(s.get('message'), str) and needle in s['message'] for s in steps(path))


def read_it(path, target):
    return any(target in json.dumps(call['arguments']) for s in steps(path) for call in s.get('tool_calls') or [])


def meter(session_id):
    try:
        with open(f'{HOME}/.claude/context-meter/{session_id}.json') as f:
            return json.load(f).get('usedPercentage')
    except FileNotFoundError:
        return None


verdict = {}
try:
    pump(10)
    if b'trust' in screen.lower():
        os.write(fd, b'\r')
        pump(6)
    type_line('Say hi in one word.')
    wait_for(lambda: transcripts() and turn_ends(transcripts()[-1]) >= 1, 120)
    old = transcripts()[-1]
    old_id = os.path.basename(old)[:-len('.jsonl')]
    continuation = f'{HOME}/.claude/continuations/{old_id}.md'
    reads = ', '.join(f'{p} (whole, in 2000-line pages)' for p in BIG_FILES)
    type_line(f'Use the Read tool to read {reads}. Then reply with only the word done.')
    rolled = wait_for(lambda: any(t != old and turn_ends(t) >= 1 for t in transcripts()), args.wait)
    new = next((t for t in reversed(transcripts()) if t != old), None)
    new_id = os.path.basename(new)[:-len('.jsonl')] if new else None
    verdict = {
        'old_session': old_id,
        'asked_in_ezz_words': first_text(old, "don't cancel anything but the handoff should be aware"),
        'continuation_written': os.path.exists(continuation) and os.path.getsize(continuation) > 0,
        'cleared_into_new_session': rolled and new is not None,
        'resume_prompt_in_new_session': bool(new) and first_text(new, f'Continue session {old_id}'),
        'new_session_read_continuation': bool(new) and read_it(new, continuation),
        'percent_old_then_new': [meter(old_id), meter(new_id) if new_id else None],
        'transcripts': [old, new],
    }
finally:
    try:
        type_line('/exit')
        pump(8)
        os.kill(pid, signal.SIGTERM)
    except OSError:
        pass
    os.waitpid(pid, 0)

checks = [v for k, v in verdict.items() if isinstance(v, bool)]
print(json.dumps(verdict, indent=2))
sys.exit(0 if checks and all(checks) else 1)
