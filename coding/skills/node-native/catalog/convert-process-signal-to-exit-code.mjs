// The shell's exit status for a process killed by a signal: 128 + the signal number.
import { constants } from 'node:os';
import { convertProcessSignalToExitCode } from 'node:util';

const names = ['SIGHUP', 'SIGINT', 'SIGKILL', 'SIGTERM', 'SIGUSR1'];

export default {
  apis: ['util:util.convertProcessSignalToExitCode'],
  reviewedAt: 'v26.13.0',
  idioms: {
    plus128: {
      seed: '128\\s*\\+\\s*(os\\.)?constants\\.signals|constants\\.signals\\[[^\\]]+\\]\\s*\\+\\s*128',
      native: () => names.map((name) => convertProcessSignalToExitCode(name)),
      idiom: () => names.map((name) => 128 + constants.signals[name]),
    },
  },
};
