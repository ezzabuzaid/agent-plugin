// The current user's home directory.
import { homedir } from 'node:os';

export default {
  apis: ['os:os.homedir'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'os-homedir@2.0.0': {
      default: {
        native: () => homedir(),
        package: ({ default: osHomedir }) => osHomedir(),
      },
    },
    'user-home@3.0.0': {
      default: {
        native: () => homedir(),
        package: ({ default: userHome }) => userHome,
      },
    },
  },
};
