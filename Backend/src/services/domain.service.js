import { z } from 'zod';
import { sanitizeBody, sanitizeText } from '../security/sanitize.js';
import { AIAdapter } from '../ai/adapter.js';

const text = z.string().trim().min(1).max(5000);
const estadoPedidoEnum = z.enum(['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'PLANEADO', 'EM_DESENVOLVIMENTO', 'CONCLUIDO', 'REJEITADO']);
const estadoTecnicoEnum = z.enum(['BACKLOG', 'TODO', 'EM_PROGRESSO', 'EM_REVISAO', 'CONCLUIDO', 'BLOQUEADO']);
const papelEnum = z.enum(['P01', 'P02', 'P03', 'P04', 'P05']);

export const pedidoSchema = z.object({
  titulo: text.max(200), descricao: text, categoria: text.max(100),
  tags: z.array(z.string().trim().max(50)).default([]),
  esforcoEstimado: z.number().int().positive().optional(),
  impactoNegocio: z.number().int().min(0).max(10).optional(),
});

export const pedidoUpdateSchema = z.object({
  titulo: text.max(200).optional(),
  descricao: text.optional(),
  categoria: text.max(100).optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  estado: estadoPedidoEnum.optional(),
  esforcoEstimado: z.number().int().positive().nullable().optional(),
  impactoNegocio: z.number().int().min(0).max(10).nullable().optional(),
}).refine((val) => Object.keys(val).length > 0, { message: 'Nenhum campo válido fornecido para atualização' });

export const comentarioSchema = z.object({
  conteudo: text,
});

export const storySchema = z.object({
  codigoUs: z.string().trim().regex(/^US\d+$/), titulo: text.max(200), descricao: text,
  criteriosAceitacao: text, storyPoints: z.number().int().positive().max(100).optional(),
  tempoRegistado: z.number().int().min(0).optional(), idPedido: z.string().uuid(),
  idSprint: z.string().uuid().optional(), idResponsavel: z.string().uuid().optional(), idRelease: z.string().uuid().optional(),
});

export const storyUpdateSchema = z.object({
  titulo: text.max(200).optional(),
  descricao: text.optional(),
  criteriosAceitacao: text.optional(),
  estadoTecnico: estadoTecnicoEnum.optional(),
  storyPoints: z.number().int().positive().max(100).nullable().optional(),
  tempoRegistado: z.number().int().min(0).nullable().optional(),
  idSprint: z.string().uuid().nullable().optional(),
  idResponsavel: z.string().uuid().nullable().optional(),
  idRelease: z.string().uuid().nullable().optional(),
}).refine((val) => Object.keys(val).length > 0, { message: 'Nenhum campo válido fornecido para atualização' });

const estadoSprintEnum = z.enum(['PLANEADO', 'ATIVO', 'CONCLUIDO', 'CANCELADO']);

export const sprintSchema = z.object({
  numeroSprint: z.number().int().positive(), dataInicio: z.coerce.date(), dataFim: z.coerce.date(),
  capacidadeMaxima: z.number().int().positive().nullable().optional(), estado: estadoSprintEnum.default('PLANEADO'),
}).superRefine((value, ctx) => { if (value.dataFim <= value.dataInicio) ctx.addIssue({ code: 'custom', path: ['dataFim'], message: 'dataFim deve ser posterior a dataInicio' }); });

export const sprintUpdateSchema = z.object({
  numeroSprint: z.number().int().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  capacidadeMaxima: z.number().int().positive().nullable().optional(),
  estado: estadoSprintEnum.optional(),
  incompletePolicy: z.enum(['BACKLOG', 'NEXT_SPRINT']).optional(),
  targetSprintId: z.string().uuid().nullable().optional(),
}).refine(
  (val) => ['numeroSprint', 'dataInicio', 'dataFim', 'capacidadeMaxima', 'estado'].some((key) => val[key] !== undefined),
  { message: 'Nenhum campo válido fornecido para atualização do sprint' }
);

export const releaseSchema = z.object({
  tituloRelease: text.max(200), descricao: text.max(5000).optional(), dataInicio: z.coerce.date(), dataFim: z.coerce.date(), marcoCritico: z.boolean().default(false),
}).superRefine((value, ctx) => { if (value.dataFim <= value.dataInicio) ctx.addIssue({ code: 'custom', path: ['dataFim'], message: 'dataFim deve ser posterior a dataInicio' }); });

export const dependencySchema = z.object({
  tipoDependencia: z.enum(['PRECEDE', 'BLOQUEIA', 'RELACIONADA']), idTarefaOrigem: z.string().uuid(), idTarefaDestino: z.string().uuid(),
}).refine((value) => value.idTarefaOrigem !== value.idTarefaDestino, { path: ['idTarefaDestino'], message: 'Uma tarefa não pode depender de si própria' });

export const userUpdateSchema = z.object({
  papel: papelEnum.optional(),
  ativo: z.boolean().optional(),
}).refine((val) => val.papel !== undefined || val.ativo !== undefined, {
  message: 'Deve fornecer papel ou ativo para atualizar o utilizador',
});

const MANAGER_ROLES = new Set(['P01', 'P02', 'P05']);

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function validationError(error) {
  error.status = 400;
  return error;
}

async function listAll(repo, model) {
  const items = [];
  let skip = 0;
  const take = 50;
  while (true) {
    const batch = await repo.list(model, { skip, take });
    items.push(...batch);
    if (batch.length < take) break;
    skip += take;
  }
  return items;
}

function normalizeForSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildTrigrams(value) {
  const grams = new Set();
  if (value.length < 3) return grams;
  for (let i = 0; i <= value.length - 3; i += 1) {
    grams.add(value.slice(i, i + 3));
  }
  return grams;
}

function trigramDice(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection += 1;
  }
  return (2 * intersection) / (a.size + b.size);
}

function scorePedidoSimilarity(queryNorm, pedido) {
  const titleNorm = normalizeForSearch(pedido.titulo);
  const fullNorm = normalizeForSearch(`${pedido.titulo ?? ''} ${pedido.descricao ?? ''}`);
  if (!fullNorm) return { similarity: 0, isSubstring: false };

  const isSubstring = fullNorm.includes(queryNorm);
  const qTrigrams = buildTrigrams(queryNorm);
  const tTrigrams = buildTrigrams(titleNorm);
  const fTrigrams = buildTrigrams(fullNorm);

  const diceTitle = trigramDice(qTrigrams, tTrigrams);
  const diceFull = trigramDice(qTrigrams, fTrigrams);
  let matches = 0;
  for (const gram of qTrigrams) {
    if (fTrigrams.has(gram)) matches += 1;
  }
  const trigramCoverage = qTrigrams.size ? matches / qTrigrams.size : 0;

  const qTokens = queryNorm.split(' ').filter((t) => t.length >= 2);
  const fTokens = fullNorm.split(' ').filter((t) => t.length >= 2);
  const matchedTokens = qTokens.filter((qt) => fTokens.some((ft) => ft === qt || ft.startsWith(qt) || qt.startsWith(ft))).length;
  const tokenScore = qTokens.length ? matchedTokens / qTokens.length : 0;

  const combined = Math.min(1, Math.max(diceTitle, diceFull, 0.55 * trigramCoverage + 0.45 * tokenScore, isSubstring ? 0.5 : 0));
  return { similarity: combined, isSubstring };
}

function resolveActorId(actor, fallbackId) {
  if (typeof actor === 'string' && actor.trim()) return actor;
  if (actor && typeof actor === 'object' && typeof actor.sub === 'string' && actor.sub.trim()) return actor.sub;
  return fallbackId;
}

async function notifyPedidoStateChange(repo, { pedido, previousState, newState, actorId }) {
  const pedidoId = pedido.idPedido ?? pedido.id;
  const votes = (await listAll(repo, 'Voto')).filter((v) => v.idPedido === pedidoId);
  const recipients = new Set([pedido.idAutor, ...votes.map((v) => v.idUtilizador)].filter(Boolean));
  const mensagem = `O estado do pedido "${pedido.titulo}" foi alterado de ${previousState} para ${newState}.`;

  await Promise.all(
    [...recipients].map((idUtilizador) =>
      repo.create('Notificacao', {
        tipo: 'ALTERACAO_ESTADO',
        idUtilizador,
        idPedido: pedidoId,
        mensagem,
      })
    )
  );

  if (actorId) {
    await repo.create('Log', {
      acao: 'ALTERACAO_ESTADO_PEDIDO',
      recurso: 'Pedido',
      idUtilizador: actorId,
      detalhes: { idPedido: pedidoId, estadoAnterior: previousState, estadoNovo: newState },
    });
  }
}

async function updatePedidoWithAudit(repo, { pedido, data, actorId }) {
  const pedidoId = pedido.idPedido ?? pedido.id;
  const previousState = pedido.estado ?? 'SUBMETIDO';
  const effectiveActorId = resolveActorId(actorId, pedido.idAutor);

  await repo.create('HistoricoPedido', {
    tituloAnterior: pedido.titulo,
    descricaoAnterior: pedido.descricao,
    categoriaAnterior: pedido.categoria,
    estadoAnterior: previousState,
    idPedido: pedidoId,
    idEditor: effectiveActorId,
  });

  const updated = await repo.update('Pedido', pedidoId, data);
  if (data.estado !== undefined && data.estado !== previousState) {
    await notifyPedidoStateChange(repo, {
      pedido: { ...pedido, ...updated, idPedido: pedidoId },
      previousState,
      newState: data.estado,
      actorId: effectiveActorId,
    });
  }
  return updated;
}

async function transitionPedidoState(repo, { pedido, targetState, actorId }) {
  if (!pedido) return null;
  const previousState = pedido.estado ?? 'SUBMETIDO';
  if (previousState === targetState) return pedido;
  return updatePedidoWithAudit(repo, {
    pedido,
    data: { estado: targetState },
    actorId,
  });
}

async function syncParentPedidoAfterStoryUpdate(repo, { story, input, updatedStory, actorId }) {
  if (!story.idPedido) return;
  const pedido = await repo.findById('Pedido', story.idPedido);
  if (!pedido) return;

  const currentState = pedido.estado ?? 'SUBMETIDO';
  const effectiveActorId = resolveActorId(actorId, pedido.idAutor);

  if (updatedStory.estadoTecnico === 'CONCLUIDO') {
    const pedidoStories = (await listAll(repo, 'UserStory')).filter((s) => s.idPedido === story.idPedido);
    if (pedidoStories.length > 0 && pedidoStories.every((s) => s.estadoTecnico === 'CONCLUIDO')) {
      await transitionPedidoState(repo, { pedido, targetState: 'CONCLUIDO', actorId: effectiveActorId });
      return;
    }
  }

  if (['EM_PROGRESSO', 'EM_REVISAO'].includes(input.estadoTecnico) && ['APROVADO', 'PLANEADO'].includes(currentState)) {
    await transitionPedidoState(repo, { pedido, targetState: 'EM_DESENVOLVIMENTO', actorId: effectiveActorId });
    return;
  }

  if (input.idSprint && currentState === 'APROVADO') {
    await transitionPedidoState(repo, { pedido, targetState: 'PLANEADO', actorId: effectiveActorId });
  }
}

export function domainService(repo, aiAdapter = new AIAdapter()) {
  const parse = (schema, input) => {
    try { return schema.parse(sanitizeBody(input)); } catch (error) { throw validationError(error); }
  };
  const create = async (model, schema, body, userId) => repo.create(model, { ...parse(schema, body), idAutor: userId });

  return {
    createPedido: (body, userId) => create('Pedido', pedidoSchema, body, userId),

    pesquisarPedidosSemelhantes: async (rawQuery = '') => {
      const query = sanitizeText(String(rawQuery ?? '')).trim();
      if (query.length < 3) return { matches: [], query };

      const queryNorm = normalizeForSearch(query);
      if (queryNorm.length < 3) return { matches: [], query };

      const pedidos = await listAll(repo, 'Pedido');
      const matches = pedidos
        .map((pedido) => {
          const { similarity, isSubstring } = scorePedidoSimilarity(queryNorm, pedido);
          return { pedido, similarity, isSubstring };
        })
        .filter(({ similarity, isSubstring }) => similarity > 0.15 || isSubstring)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
        .map(({ pedido, similarity }) => ({
          ...pedido,
          similarity: Number(similarity.toFixed(3)),
        }));

      return { matches, query };
    },

    updatePedido: async (pedidoId, body, user) => {
      const pedido = await repo.findById('Pedido', pedidoId);
      if (!pedido) throw httpError(404, 'Pedido não encontrado');

      const input = parse(pedidoUpdateSchema, body);
      const isManager = MANAGER_ROLES.has(user?.papel);
      const isAuthor = pedido.idAutor === user?.sub;

      const touchesTriage = input.estado !== undefined || input.esforcoEstimado !== undefined || input.impactoNegocio !== undefined;
      if (touchesTriage && !isManager) {
        throw httpError(403, 'Permissão insuficiente para alterar estado ou estimativas do pedido');
      }

      const touchesContent = input.titulo !== undefined || input.descricao !== undefined || input.categoria !== undefined || input.tags !== undefined;
      if (touchesContent && !isManager) {
        if (!isAuthor || (pedido.estado ?? 'SUBMETIDO') !== 'SUBMETIDO') {
          throw httpError(403, 'Apenas o autor pode editar este pedido enquanto estiver SUBMETIDO');
        }
      }

      return updatePedidoWithAudit(repo, { pedido, data: input, actorId: user?.sub });
    },

    deletePedido: async (pedidoId, user) => {
      const pedido = await repo.findById('Pedido', pedidoId);
      if (!pedido) throw httpError(404, 'Pedido não encontrado');

      if (pedido.idAutor !== user?.sub && user?.papel !== 'P05') {
        throw httpError(403, 'Apenas o autor ou o administrador pode eliminar este pedido');
      }

      const currentState = pedido.estado ?? 'SUBMETIDO';
      if (currentState !== 'SUBMETIDO') {
        throw httpError(409, 'Não é possível eliminar um pedido após aprovação ou análise');
      }

      await repo.delete('Pedido', pedidoId);
      await repo.create('Log', {
        acao: 'ELIMINACAO_PEDIDO',
        recurso: 'Pedido',
        idUtilizador: user.sub,
        detalhes: { idPedido: pedidoId },
      });
    },

    createComment: async (pedidoId, body, userId) => {
      const pedido = await repo.findById('Pedido', pedidoId);
      if (!pedido) throw httpError(404, 'Pedido não encontrado');

      const input = parse(comentarioSchema, body);
      const comment = await repo.create('Comentario', {
        conteudo: input.conteudo,
        idPedido: pedidoId,
        idUtilizador: userId,
      });

      if (pedido.idAutor && pedido.idAutor !== userId) {
        await repo.create('Notificacao', {
          tipo: 'NOVO_COMENTARIO',
          idUtilizador: pedido.idAutor,
          idPedido: pedidoId,
          mensagem: `Novo comentário no pedido "${pedido.titulo}".`,
        });
      }
      return comment;
    },

    suggestPedidoPrioritization: async (pedidoId, userId) => {
      const pedido = await repo.findById('Pedido', pedidoId);
      if (!pedido) throw httpError(404, 'Pedido não encontrado');

      const suggestion = await aiAdapter.suggestPrioritization({
        titulo: pedido.titulo,
        descricao: pedido.descricao,
        categoria: pedido.categoria,
        impactEstimate: pedido.impactoNegocio,
      });

      await repo.create('Log', {
        acao: 'CONSULTA_IA_PRIORIZACAO',
        recurso: 'Pedido',
        idUtilizador: userId,
        detalhes: {
          idPedido: pedidoId,
          available: suggestion.available,
          fallback: suggestion.fallback,
        },
      });

      return { idPedido: pedidoId, ...suggestion };
    },

    createStory: async (body, actor) => {
      const input = parse(storySchema, body);
      const pedido = await repo.findById('Pedido', input.idPedido);
      if (!pedido) throw httpError(404, 'Pedido não encontrado');
      const warnings = [];
      if (input.idSprint) {
        const sprint = await repo.findById('Sprint', input.idSprint);
        if (!sprint) throw httpError(404, 'Sprint não encontrado');
        const stories = await listAll(repo, 'UserStory');
        const points = stories.filter((s) => s.idSprint === input.idSprint).reduce((sum, s) => sum + (s.storyPoints ?? 0), 0) + (input.storyPoints ?? 0);
        if (sprint.capacidadeMaxima && points > sprint.capacidadeMaxima) warnings.push('A capacidade máxima da sprint será excedida');
      }
      const item = await repo.create('UserStory', input);
      if (input.idSprint && (pedido.estado ?? 'SUBMETIDO') === 'APROVADO') {
        await transitionPedidoState(repo, {
          pedido,
          targetState: 'PLANEADO',
          actorId: resolveActorId(actor, pedido.idAutor),
        });
      }
      return { item, warnings };
    },

    updateStory: async (storyId, body, user) => {
      const story = await repo.findById('UserStory', storyId);
      if (!story) throw httpError(404, 'User story não encontrada');

      const input = parse(storyUpdateSchema, body);
      if (input.idSprint && !(await repo.findById('Sprint', input.idSprint))) {
        throw httpError(404, 'Sprint não encontrado');
      }

      if (input.estadoTecnico === 'CONCLUIDO') {
        const effectiveEffort = input.tempoRegistado ?? story.tempoRegistado ?? 0;
        if (!(effectiveEffort > 0)) {
          throw httpError(400, 'É obrigatório registar esforço positivo antes de concluir a User Story');
        }

        const dependencias = await listAll(repo, 'Dependencia');
        const blockingDeps = dependencias.filter(
          (dep) => dep.idTarefaDestino === storyId && ['PRECEDE', 'BLOQUEIA'].includes(dep.tipoDependencia)
        );
        for (const dep of blockingDeps) {
          const origin = await repo.findById('UserStory', dep.idTarefaOrigem);
          if (origin && origin.estadoTecnico !== 'CONCLUIDO') {
            throw httpError(409, 'Existem dependências bloqueadoras ou precedentes por concluir');
          }
        }
      }

      const updated = await repo.update('UserStory', storyId, input);
      await syncParentPedidoAfterStoryUpdate(repo, {
        story,
        input,
        updatedStory: updated,
        actorId: user,
      });

      return updated;
    },

    createSprint: async (body, actor) => {
      const input = parse(sprintSchema, body);
      const sprints = await listAll(repo, 'Sprint');
      if (sprints.some((s) => Number(s.numeroSprint) === Number(input.numeroSprint))) {
        throw httpError(409, `Já existe um Sprint com o número ${input.numeroSprint}`);
      }
      if (input.estado === 'ATIVO' && sprints.some((s) => s.estado === 'ATIVO')) {
        throw httpError(409, 'Já existe um Sprint ativo. Conclua o Sprint atual antes de ativar outro.');
      }

      const created = await repo.create('Sprint', input);
      const actorId = resolveActorId(actor, null);
      if (actorId) {
        await repo.create('Log', {
          acao: 'SPRINT_CRIADO',
          recurso: 'Sprint',
          idUtilizador: actorId,
          detalhes: {
            idSprint: created.idSprint ?? created.id,
            numeroSprint: created.numeroSprint,
            estado: created.estado,
          },
        });
      }
      return created;
    },

    updateSprint: async (sprintId, body, actor) => {
      const sprint = await repo.findById('Sprint', sprintId);
      if (!sprint) throw httpError(404, 'Sprint não encontrado');

      const input = parse(sprintUpdateSchema, body);
      const { incompletePolicy = 'BACKLOG', targetSprintId = null, ...sprintPatch } = input;

      const sprints = await listAll(repo, 'Sprint');
      if (
        sprintPatch.numeroSprint !== undefined &&
        sprints.some((s) => (s.idSprint ?? s.id) !== sprintId && Number(s.numeroSprint) === Number(sprintPatch.numeroSprint))
      ) {
        throw httpError(409, `Já existe outro Sprint com o número ${sprintPatch.numeroSprint}`);
      }

      const effectiveStart = new Date(sprintPatch.dataInicio ?? sprint.dataInicio);
      const effectiveEnd = new Date(sprintPatch.dataFim ?? sprint.dataFim);
      if (Number.isNaN(effectiveStart.getTime()) || Number.isNaN(effectiveEnd.getTime()) || effectiveEnd <= effectiveStart) {
        throw httpError(400, 'A data de fim do Sprint deve ser posterior à data de início');
      }

      if (
        sprintPatch.estado === 'ATIVO' &&
        sprint.estado !== 'ATIVO' &&
        sprints.some((s) => (s.idSprint ?? s.id) !== sprintId && s.estado === 'ATIVO')
      ) {
        throw httpError(409, 'Já existe outro Sprint ativo. Conclua-o primeiro.');
      }

      const closingSprint =
        ['CONCLUIDO', 'CANCELADO'].includes(sprintPatch.estado) &&
        !['CONCLUIDO', 'CANCELADO'].includes(sprint.estado);

      if (closingSprint && incompletePolicy === 'NEXT_SPRINT') {
        if (!targetSprintId || targetSprintId === sprintId) {
          throw httpError(400, 'Selecione um Sprint de destino válido para transferir histórias pendentes');
        }
        const targetSprint = await repo.findById('Sprint', targetSprintId);
        if (!targetSprint || ['CONCLUIDO', 'CANCELADO'].includes(targetSprint.estado)) {
          throw httpError(409, 'O Sprint de destino não existe ou já foi encerrado');
        }
      }

      const updated = await repo.update('Sprint', sprintId, sprintPatch);

      if (closingSprint) {
        const stories = (await listAll(repo, 'UserStory')).filter((s) => s.idSprint === sprintId);
        const incompleteStories = stories.filter((s) => s.estadoTecnico !== 'CONCLUIDO');
        await Promise.all(
          incompleteStories.map((story) =>
            repo.update('UserStory', story.idTarefa ?? story.id, {
              idSprint: incompletePolicy === 'NEXT_SPRINT' ? targetSprintId : null,
              estadoTecnico: incompletePolicy === 'NEXT_SPRINT' ? 'TODO' : 'BACKLOG',
            })
          )
        );
      }

      const actorId = resolveActorId(actor, null);
      if (actorId) {
        await repo.create('Log', {
          acao: sprintPatch.estado === 'CONCLUIDO' ? 'SPRINT_CONCLUIDO' : 'SPRINT_ATUALIZADO',
          recurso: 'Sprint',
          idUtilizador: actorId,
          detalhes: {
            idSprint: sprintId,
            numeroSprint: updated.numeroSprint ?? sprint.numeroSprint,
            estado: updated.estado ?? sprint.estado,
            ...(closingSprint ? { incompletePolicy, targetSprintId } : {}),
          },
        });
      }

      return updated;
    },

    deleteSprint: async (sprintId, actor) => {
      const sprint = await repo.findById('Sprint', sprintId);
      if (!sprint) throw httpError(404, 'Sprint não encontrado');

      const stories = (await listAll(repo, 'UserStory')).filter((s) => s.idSprint === sprintId);
      await Promise.all(
        stories.map((story) =>
          repo.update('UserStory', story.idTarefa ?? story.id, {
            idSprint: null,
            ...(story.estadoTecnico === 'CONCLUIDO' ? {} : { estadoTecnico: 'BACKLOG' }),
          })
        )
      );

      await repo.delete('Sprint', sprintId);

      const actorId = resolveActorId(actor, null);
      if (actorId) {
        await repo.create('Log', {
          acao: 'SPRINT_ELIMINADO',
          recurso: 'Sprint',
          idUtilizador: actorId,
          detalhes: {
            idSprint: sprintId,
            numeroSprint: sprint.numeroSprint,
          },
        });
      }
    },

    createRelease: async (body) => repo.create('RoadmapRelease', parse(releaseSchema, body)),

    createDependency: async (body) => {
      const input = parse(dependencySchema, body);
      if (!await repo.findById('UserStory', input.idTarefaOrigem) || !await repo.findById('UserStory', input.idTarefaDestino)) {
        throw httpError(404, 'User story não encontrada');
      }
      const existing = await listAll(repo, 'Dependencia');
      const graph = new Map();
      for (const edge of existing) graph.set(edge.idTarefaOrigem, [...(graph.get(edge.idTarefaOrigem) ?? []), edge.idTarefaDestino]);
      const visit = (node, seen = new Set()) => {
        if (node === input.idTarefaOrigem) return true;
        if (seen.has(node)) return false;
        seen.add(node);
        return (graph.get(node) ?? []).some((next) => visit(next, seen));
      };
      if (visit(input.idTarefaDestino)) throw httpError(409, 'Dependência circular não permitida');
      if (existing.some((edge) => edge.idTarefaOrigem === input.idTarefaOrigem && edge.idTarefaDestino === input.idTarefaDestino)) {
        throw httpError(409, 'Dependência já existe');
      }
      return repo.create('Dependencia', input);
    },

    vote: async (pedidoId, userId) => {
      if (!await repo.findById('Pedido', pedidoId)) throw httpError(404, 'Pedido não encontrado');
      const existing = await repo.findVote(pedidoId, userId);
      if (existing) {
        await repo.removeVote(existing.idVoto ?? existing.id);
        return { voted: false };
      }
      await repo.create('Voto', { idPedido: pedidoId, idUtilizador: userId });
      return { voted: true };
    },

    updateUser: async (targetId, body, actor) => {
      if (actor?.papel !== 'P05') {
        throw httpError(403, 'Permissão insuficiente');
      }
      const existing = await repo.findById('Utilizador', targetId);
      if (!existing) throw httpError(404, 'Utilizador não encontrado');

      const input = parse(userUpdateSchema, body);
      const updated = await repo.update('Utilizador', targetId, input);
      const detalhes = {
        targetId,
        ...(input.papel !== undefined ? { papel: input.papel } : {}),
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      };

      await repo.create('Log', {
        acao: input.papel ? 'ALTERACAO_PERFIL' : 'ALTERACAO_ESTADO_CONTA',
        recurso: 'Utilizador',
        idUtilizador: actor.sub,
        detalhes,
      });

      const { passwordHash, ...safeUser } = updated;
      return safeUser;
    },
  };
}
