import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.REPOSITORY_MODE = 'memory';

async function setup() {
  const app = await createApp();
  const server = app.listen(0);
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function registerUser(base, payload) {
  const res = await fetch(`${base}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

test('default registration assigns P04 and enforces RBAC on users, analytics, and user updates', async (t) => {
  const { server, base } = await setup();
  t.after(() => server.close());

  const clientReg = await registerUser(base, {
    nome: '<b>Cliente</b>',
    email: 'cliente@test.local',
    password: 'password123',
  });
  assert.equal(clientReg.status, 201);
  assert.equal(clientReg.body.user.papel, 'P04');
  assert.equal(clientReg.body.user.nome, 'Cliente');

  const clientToken = clientReg.body.token;
  assert.equal((await fetch(`${base}/api/v1/users`, { headers: { authorization: `Bearer ${clientToken}` } })).status, 403);
  assert.equal((await fetch(`${base}/api/v1/analytics`, { headers: { authorization: `Bearer ${clientToken}` } })).status, 403);
  assert.equal((await fetch(`${base}/api/v1/pedidos`, { headers: { authorization: `Bearer ${clientToken}` } })).status, 200);
  assert.equal((await fetch(`${base}/api/v1/users/${clientReg.body.user.id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${clientToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ papel: 'P05' }),
  })).status, 403);

  const adminReg = await registerUser(base, {
    nome: 'Admin',
    email: 'admin@test.local',
    password: 'password123',
    papel: 'P05',
  });
  assert.equal(adminReg.status, 201);
  const adminToken = adminReg.body.token;

  const usersRes = await fetch(`${base}/api/v1/users`, { headers: { authorization: `Bearer ${adminToken}` } });
  assert.equal(usersRes.status, 200);
  const usersList = await usersRes.json();
  assert.ok(usersList.length >= 2);
  assert.equal(usersList[0].passwordHash, undefined);

  assert.equal((await fetch(`${base}/api/v1/analytics`, { headers: { authorization: `Bearer ${adminToken}` } })).status, 200);

  const patchRole = await fetch(`${base}/api/v1/users/${clientReg.body.user.id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ papel: 'P03' }),
  });
  assert.equal(patchRole.status, 200);
  const updatedUser = await patchRole.json();
  assert.equal(updatedUser.papel, 'P03');
  assert.equal(updatedUser.passwordHash, undefined);

  const logsRes = await fetch(`${base}/api/v1/analytics`, { headers: { authorization: `Bearer ${adminToken}` } });
  const logs = await logsRes.json();
  assert.ok(logs.some((log) => log.acao === 'ALTERACAO_PERFIL' && log.recurso === 'Utilizador' && log.detalhes?.targetId === clientReg.body.user.id));

  const poReg = await registerUser(base, {
    nome: 'Product Owner',
    email: 'po@test.local',
    password: 'password123',
    papel: 'P01',
  });
  const poToken = poReg.body.token;
  assert.equal((await fetch(`${base}/api/v1/users`, { headers: { authorization: `Bearer ${poToken}` } })).status, 200);
  assert.equal((await fetch(`${base}/api/v1/analytics`, { headers: { authorization: `Bearer ${poToken}` } })).status, 200);
  assert.equal((await fetch(`${base}/api/v1/users/${clientReg.body.user.id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${poToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ papel: 'P02' }),
  })).status, 403);
  assert.equal((await fetch(`${base}/api/v1/users/${clientReg.body.user.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${poToken}` },
  })).status, 403);

  const deactivateRes = await fetch(`${base}/api/v1/users/${clientReg.body.user.id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ ativo: false }),
  });
  assert.equal(deactivateRes.status, 200);

  const deactivatedLogin = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@test.local', password: 'password123' }),
  });
  assert.equal(deactivatedLogin.status, 403);
});

test('routes domain lifecycle actions cleanly through HTTP before resourceRouter', async (t) => {
  const { server, base } = await setup();
  t.after(() => server.close());

  const clientReg = await registerUser(base, {
    nome: 'Autor',
    email: 'autor@test.local',
    password: 'password123',
  });
  const poReg = await registerUser(base, {
    nome: 'PO',
    email: 'po2@test.local',
    password: 'password123',
    papel: 'P01',
  });

  const createPedidoRes = await fetch(`${base}/api/v1/pedidos`, {
    method: 'POST',
    headers: { authorization: `Bearer ${clientReg.body.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Autenticação OAuth2',
      descricao: 'Permitir login federado com conta corporativa',
      categoria: 'NOVA_FUNCIONALIDADE',
    }),
  });
  assert.equal(createPedidoRes.status, 201);
  const pedido = await createPedidoRes.json();

  const similarRes = await fetch(`${base}/api/v1/pedidos/semelhantes?q=autenticacao`, {
    headers: { authorization: `Bearer ${clientReg.body.token}` },
  });
  assert.equal(similarRes.status, 200);
  const similarBody = await similarRes.json();
  assert.equal(similarBody.matches.length, 1);

  assert.equal((await fetch(`${base}/api/v1/pedidos/${pedido.idPedido}/ia-priorizacao`, {
    method: 'POST',
    headers: { authorization: `Bearer ${clientReg.body.token}` },
  })).status, 403);

  const aiRes = await fetch(`${base}/api/v1/pedidos/${pedido.idPedido}/ia-priorizacao`, {
    method: 'POST',
    headers: { authorization: `Bearer ${poReg.body.token}` },
  });
  assert.equal(aiRes.status, 200);
  const aiBody = await aiRes.json();
  assert.equal(aiBody.advisoryOnly, true);

  const commentRes = await fetch(`${base}/api/v1/pedidos/${pedido.idPedido}/comentarios`, {
    method: 'POST',
    headers: { authorization: `Bearer ${poReg.body.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ conteudo: 'Vamos analisar este pedido na próxima triagem.' }),
  });
  assert.equal(commentRes.status, 201);

  const patchEstado = await fetch(`${base}/api/v1/pedidos/${pedido.idPedido}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${poReg.body.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ estado: 'EM_ANALISE' }),
  });
  assert.equal(patchEstado.status, 200);

  const deleteBlocked = await fetch(`${base}/api/v1/pedidos/${pedido.idPedido}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${clientReg.body.token}` },
  });
  assert.equal(deleteBlocked.status, 409);

  const createSecond = await fetch(`${base}/api/v1/pedidos`, {
    method: 'POST',
    headers: { authorization: `Bearer ${clientReg.body.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Pedido temporário',
      descricao: 'Para eliminar enquanto SUBMETIDO',
      categoria: 'MELHORIA',
    }),
  });
  const secondPedido = await createSecond.json();
  const deleteOk = await fetch(`${base}/api/v1/pedidos/${secondPedido.idPedido}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${clientReg.body.token}` },
  });
  assert.equal(deleteOk.status, 204);
});
