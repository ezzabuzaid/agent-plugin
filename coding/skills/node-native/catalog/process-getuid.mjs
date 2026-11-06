// Whether the process runs as the root user.
const isRoot = () => process.getuid?.() === 0;

export default {
  apis: ['process:process.getuid'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-root@3.0.0': {
      default: {
        native: () => isRoot(),
        package: ({ default: isRootUser }) => isRootUser(),
      },
    },
    'is-elevated@4.0.0': {
      default: {
        native: () => isRoot(),
        package: ({ default: isElevated }) => isElevated(),
      },
    },
  },
};
