// Size and free space of the file system that holds a path.
import { statfsSync } from 'node:fs';
import { statfs } from 'node:fs/promises';
import { tmpdir } from 'node:os';

// Free space changes between two calls, so only the total size is compared.
const size = ({ blocks, bsize }) => blocks * bsize;

export default {
  apis: ['fs:fsPromises.statfs', 'fs:fs.statfs', 'fs:fs.statfsSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'check-disk-space@4.0.0': {
      checkDiskSpace: {
        native: async () => size(await statfs(tmpdir())),
        package: async ({ checkDiskSpace }) => (await checkDiskSpace(tmpdir())).size,
      },
      'checkDiskSpace: sync': {
        native: () => size(statfsSync(tmpdir())),
        package: async ({ checkDiskSpace }) => (await checkDiskSpace(tmpdir())).size,
      },
      'checkDiskSpace: free': {
        gap: 'free space is bavail * bsize; there is no free field',
        native: async () => typeof (await statfs(tmpdir())).free,
        package: async ({ checkDiskSpace }) => typeof (await checkDiskSpace(tmpdir())).free,
      },
      'checkDiskSpace: diskPath': {
        gap: 'does not name the mount point; checkDiskSpace returns it as diskPath',
        native: async () => typeof (await statfs(tmpdir())).diskPath,
        package: async ({ checkDiskSpace }) => typeof (await checkDiskSpace(tmpdir())).diskPath,
      },
    },
  },
};
