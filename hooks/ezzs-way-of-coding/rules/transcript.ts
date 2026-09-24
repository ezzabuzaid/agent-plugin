import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export type TranscriptEntry = {
  type?: string;
  isMeta?: boolean;
  sourceToolAssistantUUID?: string | null;
  message?: {
    role?: string;
    content?: unknown;
  };
  payload?: {
    turn_id?: string;
  };
};

/**
 * Streams one parsed entry per JSONL line. An unreadable transcript and an
 * unparsable line both yield nothing rather than throwing, so a caller can
 * treat "no transcript" and "no match" the same way. Consumers may stop early;
 * the file handle is released either way.
 */
export async function* readTranscriptEntries(
  transcriptPath: string,
): AsyncGenerator<TranscriptEntry> {
  const input = createReadStream(transcriptPath, { encoding: 'utf8' });

  try {
    const lines = createInterface({ input, crlfDelay: Infinity });

    for await (const line of lines) {
      if (line.length === 0) continue;

      let entry: TranscriptEntry;
      try {
        entry = JSON.parse(line) as TranscriptEntry;
      } catch {
        continue;
      }

      yield entry;
    }
  } catch {
    return;
  } finally {
    input.destroy();
  }
}
