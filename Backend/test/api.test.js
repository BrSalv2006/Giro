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

async function apiJson(base, path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = res.status === 204 ? null : await res.json();
  return { status: res.status, body: payload };
}

async function registerUser(base, payload) {
  return apiJson(base, '/api/v1/auth/register', { method: 'POST', body: payload });
}

test('DA-00 full automatic Pedido lifecycle via HTTP with HistoricoPedido, deduplicated Notificacoes, and Logs', async (t) => {
  const { server, base } = await setup();
  t.after(() => server.close());

  const authorReg = await registerUser(base, { nome: 'Autor', email: 'author-da00@test.local', password: 'password123' });
  const voterReg = await registerUser(base, { nome: 'Votante', email: 'voter-da00@test.local', password: 'password123' });
  const poReg = await registerUser(base, { nome: 'PO', email: 'po-da00@test.local', password: 'password123', papel: 'P01' });
  const devReg = await registerUser(base, { nome: 'Dev', email: 'dev-da00@test.local', password: 'password123', papel: 'P03' });

  const authorToken = authorReg.body.token;
  const voterToken = voterReg.body.token;
  const poToken = poReg.body.token;
  const devToken = devReg.body.token;
  const authorId = authorReg.body.user.id;
  const voterId = voterReg.body.user.id;
  const poId = poReg.body.user.id;
  const devId = devReg.body.user.id;

  const createdPedido = await apiJson(base, '/api/v1/pedidos', {
    method: 'POST',
    token: authorToken,
    body: {
      titulo: 'Pipeline automática DA-00',
      descricao: 'Sincronizar estado do pedido com ciclo das User Stories',
      categoria: 'NOVA_FUNCIONALIDADE',
      tags: ['da-00', 'workflow'],
    },
  });
  assert.equal(createdPedido.status, 201);
  const pedidoId = createdPedido.body.idPedido;
  assert.equal(createdPedido.body.estado, 'SUBMETIDO');

  // Author and voter both vote; author must receive only 1 notification per state transition
  assert.equal((await apiJson(base, `/api/v1/pedidos/${pedidoId}/votos`, { method: 'POST', token: authorToken })).status, 201);
  assert.equal((await apiJson(base, `/api/v1/pedidos/${pedidoId}/votos`, { method: 'POST', token: voterToken })).status, 201);

  const createdSprint = await apiJson(base, '/api/v1/sprints', {
    method: 'POST',
    token: poToken,
    body: {
      numeroSprint: 1,
      dataInicio: '2026-11-01',
      dataFim: '2026-11-15',
      capacidadeMaxima: 20,
    },
  });
  assert.equal(createdSprint.status, 201);
  const sprintId = createdSprint.body.idSprint;

  const getPedido = async () => {
    const res = await apiJson(base, '/api/v1/pedidos', { token: poToken });
    assert.equal(res.status, 200);
    return res.body.find((p) => p.idPedido === pedidoId);
  };
  const getPedidoNotifications = async () => {
    const res = await apiJson(base, '/api/v1/notifications', { token: authorToken });
    assert.equal(res.status, 200);
    return res.body.filter((n) => n.idPedido === pedidoId && n.tipo === 'ALTERACAO_ESTADO');
  };
  const getStateLogs = async () => {
    const res = await apiJson(base, '/api/v1/analytics', { token: poToken });
    assert.equal(res.status, 200);
    return res.body.filter((l) => l.acao === 'ALTERACAO_ESTADO_PEDIDO' && l.detalhes?.idPedido === pedidoId);
  };

  // 1. SUBMETIDO -> EM_ANALISE (PO)
  const emAnalise = await apiJson(base, `/api/v1/pedidos/${pedidoId}`, {
    method: 'PATCH',
    token: poToken,
    body: { estado: 'EM_ANALISE' },
  });
  assert.equal(emAnalise.status, 200);
  assert.equal(emAnalise.body.estado, 'EM_ANALISE');
  assert.equal((await getPedido()).historico.length, 1);
  assert.equal((await getPedidoNotifications()).length, 2);

  // 2. EM_ANALISE -> APROVADO (PO)
  const aprovado = await apiJson(base, `/api/v1/pedidos/${pedidoId}`, {
    method: 'PATCH',
    token: poToken,
    body: { estado: 'APROVADO', impactoNegocio: 9, esforcoEstimado: 5 },
  });
  assert.equal(aprovado.status, 200);
  assert.equal(aprovado.body.estado, 'APROVADO');
  assert.equal((await getPedido()).historico.length, 2);
  assert.equal((await getPedidoNotifications()).length, 4);

  // 3. APROVADO -> PLANEADO (auto on createStory with idSprint)
  const us1 = await apiJson(base, '/api/v1/user-stories', {
    method: 'POST',
    token: poToken,
    body: {
      codigoUs: 'US100',
      titulo: 'Backend de sincronização',
      descricao: 'Como PO, quero sincronização automática, para manter estado atualizado',
      criteriosAceitacao: 'Atualizar Pedido para PLANEADO ao atribuir Sprint',
      storyPoints: 5,
      idPedido: pedidoId,
      idSprint: sprintId,
      idResponsavel: devId,
    },
  });
  assert.equal(us1.status, 201);
  let currentPedido = await getPedido();
  assert.equal(currentPedido.estado, 'PLANEADO');
  assert.equal(currentPedido.historico.length, 3);
  assert.equal(currentPedido.historico[2].estadoAnterior, 'APROVADO');
  assert.equal(currentPedido.historico[2].idEditor, poId);
  let notifications = await getPedidoNotifications();
  assert.equal(notifications.length, 6);
  let logs = await getStateLogs();
  assert.ok(logs.some((l) => l.detalhes.estadoAnterior === 'APROVADO' && l.detalhes.estadoNovo === 'PLANEADO' && l.idUtilizador === poId));

  // Creating a second UserStory on an already-PLANEADO Pedido must not emit duplicate transition
  const us2 = await apiJson(base, '/api/v1/user-stories', {
    method: 'POST',
    token: poToken,
    body: {
      codigoUs: 'US101',
      titulo: 'UI de estado automático',
      descricao: 'Como PO, quero ver o estado no painel, para acompanhar progresso',
      criteriosAceitacao: 'Refletir estado atualizado no frontend',
      storyPoints: 3,
      idPedido: pedidoId,
      idSprint: sprintId,
      idResponsavel: devId,
    },
  });
  assert.equal(us2.status, 201);
  assert.equal((await getPedido()).estado, 'PLANEADO');
  assert.equal((await getPedido()).historico.length, 3);
  assert.equal((await getPedidoNotifications()).length, 6);

  // 4. PLANEADO -> EM_DESENVOLVIMENTO (auto when story moves to EM_PROGRESSO)
  const inProgress = await apiJson(base, `/api/v1/user-stories/${us1.body.item.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'EM_PROGRESSO' },
  });
  assert.equal(inProgress.status, 200);
  currentPedido = await getPedido();
  assert.equal(currentPedido.estado, 'EM_DESENVOLVIMENTO');
  assert.equal(currentPedido.historico.length, 4);
  assert.equal(currentPedido.historico[3].estadoAnterior, 'PLANEADO');
  assert.equal(currentPedido.historico[3].idEditor, devId);
  assert.equal((await getPedidoNotifications()).length, 8);
  logs = await getStateLogs();
  assert.ok(logs.some((l) => l.detalhes.estadoAnterior === 'PLANEADO' && l.detalhes.estadoNovo === 'EM_DESENVOLVIMENTO' && l.idUtilizador === devId));

  // Moving to EM_REVISAO while already EM_DESENVOLVIMENTO keeps Pedido unchanged without duplicate audit
  const inReview = await apiJson(base, `/api/v1/user-stories/${us1.body.item.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'EM_REVISAO' },
  });
  assert.equal(inReview.status, 200);
  assert.equal((await getPedido()).estado, 'EM_DESENVOLVIMENTO');
  assert.equal((await getPedido()).historico.length, 4);
  assert.equal((await getPedidoNotifications()).length, 8);

  // Completing story without positive tempoRegistado is rejected (HTTP 400)
  const rejectedDone = await apiJson(base, `/api/v1/user-stories/${us1.body.item.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'CONCLUIDO', tempoRegistado: 0 },
  });
  assert.equal(rejectedDone.status, 400);

  // Completing US100 while US101 is still open keeps Pedido in EM_DESENVOLVIMENTO
  const us1Done = await apiJson(base, `/api/v1/user-stories/${us1.body.item.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'CONCLUIDO', tempoRegistado: 5 },
  });
  assert.equal(us1Done.status, 200);
  assert.equal((await getPedido()).estado, 'EM_DESENVOLVIMENTO');
  assert.equal((await getPedido()).historico.length, 4);
  assert.equal((await getPedidoNotifications()).length, 8);

  // 5. EM_DESENVOLVIMENTO -> CONCLUIDO (auto when ALL stories reach CONCLUIDO with tempoRegistado > 0)
  const us2Done = await apiJson(base, `/api/v1/user-stories/${us2.body.item.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'CONCLUIDO', tempoRegistado: 3 },
  });
  assert.equal(us2Done.status, 200);
  currentPedido = await getPedido();
  assert.equal(currentPedido.estado, 'CONCLUIDO');
  assert.deepEqual(
    currentPedido.historico.map((h) => h.estadoAnterior),
    ['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'PLANEADO', 'EM_DESENVOLVIMENTO']
  );
  assert.equal(currentPedido.historico[4].idEditor, devId);

  notifications = await getPedidoNotifications();
  assert.equal(notifications.length, 10);
  assert.equal(notifications.filter((n) => n.idUtilizador === authorId).length, 5);
  assert.equal(notifications.filter((n) => n.idUtilizador === voterId).length, 5);

  logs = await getStateLogs();
  assert.deepEqual(
    logs.map((l) => [l.detalhes.estadoAnterior, l.detalhes.estadoNovo]),
    [
      ['SUBMETIDO', 'EM_ANALISE'],
      ['EM_ANALISE', 'APROVADO'],
      ['APROVADO', 'PLANEADO'],
      ['PLANEADO', 'EM_DESENVOLVIMENTO'],
      ['EM_DESENVOLVIMENTO', 'CONCLUIDO'],
    ]
  );
});

test('DA-00 transitions APROVADO -> PLANEADO on updateStory sprint assignment and APROVADO -> EM_DESENVOLVIMENTO on EM_REVISAO', async (t) => {
  const { server, base } = await setup();
  t.after(() => server.close());

  const authorReg = await registerUser(base, { nome: 'Autor', email: 'author-alt@test.local', password: 'password123' });
  const poReg = await registerUser(base, { nome: 'PO', email: 'po-alt@test.local', password: 'password123', papel: 'P01' });
  const devReg = await registerUser(base, { nome: 'Dev', email: 'dev-alt@test.local', password: 'password123', papel: 'P03' });

  const authorToken = authorReg.body.token;
  const poToken = poReg.body.token;
  const devToken = devReg.body.token;
  const poId = poReg.body.user.id;
  const devId = devReg.body.user.id;

  const sprint = (await apiJson(base, '/api/v1/sprints', {
    method: 'POST',
    token: poToken,
    body: { numeroSprint: 2, dataInicio: '2026-11-16', dataFim: '2026-11-30', capacidadeMaxima: 15 },
  })).body;

  // Pedido A: Backlog story created without sprint, then assigned to sprint via PATCH
  const pedidoA = (await apiJson(base, '/api/v1/pedidos', {
    method: 'POST',
    token: authorToken,
    body: { titulo: 'Pedido A', descricao: 'Planeamento diferido', categoria: 'MELHORIA' },
  })).body;
  await apiJson(base, `/api/v1/pedidos/${pedidoA.idPedido}`, { method: 'PATCH', token: poToken, body: { estado: 'APROVADO' } });

  const backlogStory = (await apiJson(base, '/api/v1/user-stories', {
    method: 'POST',
    token: poToken,
    body: {
      codigoUs: 'US200',
      titulo: 'História no backlog',
      descricao: 'Sem sprint inicial',
      criteriosAceitacao: 'Fica APROVADO até atribuição de sprint',
      idPedido: pedidoA.idPedido,
    },
  })).body.item;

  let pedidos = (await apiJson(base, '/api/v1/pedidos', { token: poToken })).body;
  assert.equal(pedidos.find((p) => p.idPedido === pedidoA.idPedido).estado, 'APROVADO');

  const assigned = await apiJson(base, `/api/v1/user-stories/${backlogStory.idTarefa}`, {
    method: 'PATCH',
    token: poToken,
    body: { idSprint: sprint.idSprint },
  });
  assert.equal(assigned.status, 200);

  pedidos = (await apiJson(base, '/api/v1/pedidos', { token: poToken })).body;
  const updatedA = pedidos.find((p) => p.idPedido === pedidoA.idPedido);
  assert.equal(updatedA.estado, 'PLANEADO');
  assert.equal(updatedA.historico.length, 2);
  assert.equal(updatedA.historico[1].estadoAnterior, 'APROVADO');
  assert.equal(updatedA.historico[1].idEditor, poId);

  // Pedido B: Direct transition APROVADO -> EM_DESENVOLVIMENTO when story enters EM_REVISAO
  const pedidoB = (await apiJson(base, '/api/v1/pedidos', {
    method: 'POST',
    token: authorToken,
    body: { titulo: 'Pedido B', descricao: 'Entrada direta em revisão', categoria: 'BUG' },
  })).body;
  await apiJson(base, `/api/v1/pedidos/${pedidoB.idPedido}`, { method: 'PATCH', token: poToken, body: { estado: 'APROVADO' } });

  const directStory = (await apiJson(base, '/api/v1/user-stories', {
    method: 'POST',
    token: poToken,
    body: {
      codigoUs: 'US201',
      titulo: 'Correção rápida',
      descricao: 'Vai direto para revisão',
      criteriosAceitacao: 'Transiciona pedido APROVADO -> EM_DESENVOLVIMENTO',
      idPedido: pedidoB.idPedido,
    },
  })).body.item;

  const movedReview = await apiJson(base, `/api/v1/user-stories/${directStory.idTarefa}`, {
    method: 'PATCH',
    token: devToken,
    body: { estadoTecnico: 'EM_REVISAO' },
  });
  assert.equal(movedReview.status, 200);

  pedidos = (await apiJson(base, '/api/v1/pedidos', { token: poToken })).body;
  const updatedB = pedidos.find((p) => p.idPedido === pedidoB.idPedido);
  assert.equal(updatedB.estado, 'EM_DESENVOLVIMENTO');
  assert.equal(updatedB.historico.length, 2);
  assert.equal(updatedB.historico[1].estadoAnterior, 'APROVADO');
  assert.equal(updatedB.historico[1].idEditor, devId);

  const notifications = (await apiJson(base, '/api/v1/notifications', { token: authorToken })).body;
  assert.ok(notifications.some((n) => n.idPedido === pedidoA.idPedido && n.tipo === 'ALTERACAO_ESTADO' && n.mensagem.includes('PLANEADO')));
  assert.ok(notifications.some((n) => n.idPedido === pedidoB.idPedido && n.tipo === 'ALTERACAO_ESTADO' && n.mensagem.includes('EM_DESENVOLVIMENTO')));

  const logs = (await apiJson(base, '/api/v1/analytics', { token: poToken })).body;
  assert.ok(logs.some((l) => l.acao === 'ALTERACAO_ESTADO_PEDIDO' && l.detalhes?.idPedido === pedidoA.idPedido && l.detalhes?.estadoNovo === 'PLANEADO'));
  assert.ok(logs.some((l) => l.acao === 'ALTERACAO_ESTADO_PEDIDO' && l.detalhes?.idPedido === pedidoB.idPedido && l.detalhes?.estadoNovo === 'EM_DESENVOLVIMENTO'));
});

test('Sprint lifecycle HTTP routes enforce RBAC (P01/P02/P05) and roll-over incomplete stories', async (t) => {
  const { server, base } = await setup();
  t.after(() => server.close());

  const smReg = await registerUser(base, { nome: 'Scrum Master', email: 'sm-sprint@test.local', password: 'password123', papel: 'P02' });
  const devReg = await registerUser(base, { nome: 'Programador', email: 'dev-sprint@test.local', password: 'password123', papel: 'P03' });
  const clientReg = await registerUser(base, { nome: 'Cliente', email: 'cli-sprint@test.local', password: 'password123' });

  const smToken = smReg.body.token;
  const devToken = devReg.body.token;
  const clientToken = clientReg.body.token;

  // P03 & P04 cannot create/edit/delete sprints
  assert.equal((await apiJson(base, '/api/v1/sprints', {
    method: 'POST', token: devToken, body: { numeroSprint: 1, dataInicio: '2026-11-01', dataFim: '2026-11-15' },
  })).status, 403);
  assert.equal((await apiJson(base, '/api/v1/sprints', {
    method: 'POST', token: clientToken, body: { numeroSprint: 1, dataInicio: '2026-11-01', dataFim: '2026-11-15' },
  })).status, 403);

  const s1 = (await apiJson(base, '/api/v1/sprints', {
    method: 'POST', token: smToken, body: { numeroSprint: 1, dataInicio: '2026-11-01', dataFim: '2026-11-14', capacidadeMaxima: 20, estado: 'ATIVO' },
  })).body;
  assert.ok(s1.idSprint);

  const ped = (await apiJson(base, '/api/v1/pedidos', {
    method: 'POST', token: clientToken, body: { titulo: 'Pedido Sprint', descricao: 'Testar fecho de sprint', categoria: 'MELHORIA' },
  })).body;
  const story = (await apiJson(base, '/api/v1/user-stories', {
    method: 'POST', token: smToken, body: { codigoUs: 'US401', titulo: 'US Pendente', descricao: 'Desc', criteriosAceitacao: 'OK', idPedido: ped.idPedido, idSprint: s1.idSprint },
  })).body.item;

  // Dev cannot conclude sprint
  assert.equal((await apiJson(base, `/api/v1/sprints/${s1.idSprint}`, {
    method: 'PATCH', token: devToken, body: { estado: 'CONCLUIDO' },
  })).status, 403);

  // SM concludes sprint -> moves incomplete story back to BACKLOG
  const closed = await apiJson(base, `/api/v1/sprints/${s1.idSprint}`, {
    method: 'PATCH', token: smToken, body: { estado: 'CONCLUIDO', incompletePolicy: 'BACKLOG' },
  });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.estado, 'CONCLUIDO');

  const stories = (await apiJson(base, '/api/v1/user-stories', { token: devToken })).body;
  const refreshedStory = stories.find((s) => s.idTarefa === story.idTarefa);
  assert.equal(refreshedStory.idSprint, null);
  assert.equal(refreshedStory.estadoTecnico, 'BACKLOG');

  // Delete sprint works for SM
  const deleted = await apiJson(base, `/api/v1/sprints/${s1.idSprint}`, { method: 'DELETE', token: smToken });
  assert.equal(deleted.status, 204);
});
