// Test-process guard only. No production package uses or depends on this file.
const deny = () => { throw new Error('NETWORK_DISABLED_BY_TEST'); };
globalThis.fetch = deny;
for (const name of ['node:http', 'node:https']) {
  const client = require(name);
  client.request = deny;
  client.get = deny;
}
const net = require('node:net');
net.connect = deny;
net.createConnection = deny;
require('node:tls').connect = deny;
require('node:module').syncBuiltinESMExports();
