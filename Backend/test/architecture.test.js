import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { signToken } from '../src/security/auth.js';
import { PrismaRepository } from '../src/repositories/prisma.js';

test('JWT expiration is exactly 60 minutes', () => {
  const now = Math.floor(Date.now() / 1000);
  const payload = jwt.decode(signToken({ id: 'u1', papel: 'P01', email: 'a@b.test' }, 'test-secret-with-at-least-32-characters'));
  assert.equal(payload.exp - payload.iat, 60 * 60);
  assert.ok(Math.abs(payload.iat - now) < 3);
});

test('Prisma repository uses each schema primary key', async () => {
  const calls = [];
  const prisma = {};
  const models = {
    Utilizador: 'utilizador', Pedido: 'pedido', HistoricoPedido: 'historicoPedido',
    Voto: 'voto', Comentario: 'comentario', Notificacao: 'notificacao', Log: 'log',
    Sprint: 'sprint', RoadmapRelease: 'roadmapRelease', UserStory: 'userStory', Dependencia: 'dependencia'
  };
  for (const delegate of Object.values(models)) prisma[delegate] = { findUnique: async (args) => { calls.push(args); return args; } };
  const repo = new PrismaRepository(prisma);
  for (const [model, key] of Object.entries({
    Utilizador: 'idUtilizador', Pedido: 'idPedido', HistoricoPedido: 'idHistorico',
    Voto: 'idVoto', Comentario: 'idComentario', Notificacao: 'idNotificacao',
    Log: 'idLog', Sprint: 'idSprint', RoadmapRelease: 'idRelease',
    UserStory: 'idTarefa', Dependencia: 'idDependencia'
  })) await repo.findById(model, 'id');
  assert.deepEqual(calls.map((call) => Object.keys(call.where)[0]), Object.values({
    Utilizador: 'idUtilizador', Pedido: 'idPedido', HistoricoPedido: 'idHistorico',
    Voto: 'idVoto', Comentario: 'idComentario', Notificacao: 'idNotificacao',
    Log: 'idLog', Sprint: 'idSprint', RoadmapRelease: 'idRelease',
    UserStory: 'idTarefa', Dependencia: 'idDependencia'
  }));
});
