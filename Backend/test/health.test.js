import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.REPOSITORY_MODE = 'memory';

test('health endpoint is available', async () => {
  const app = await createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
  server.close();
});
