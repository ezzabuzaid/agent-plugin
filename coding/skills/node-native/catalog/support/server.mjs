// Runs a probe against a local server, so no probe leaves the machine.
// `server` is an http.Server the entry has set up (a request listener, an
// upgrade listener); it listens on a free port of 127.0.0.1, `call` gets the
// base URL (`<scheme>://127.0.0.1:<port>`), and the server and every
// connection to it close once `call` settles.
import { once } from 'node:events';

export async function served(server, call, { scheme = 'http' } = {}) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await call(`${scheme}://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
