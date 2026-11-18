import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MemoryRepository } from '../src/repositories/memory.js';
import { PrismaRepository } from '../src/repositories/prisma.js';
import { domainService } from '../src/services/domain.service.js';
import { AIAdapter, sanitizePII } from '../src/ai/adapter.js';

const id = randomUUID;

test('rejects invalid sprint dates and toggles votes', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  await assert.rejects(() => service.createSprint({ numeroSprint: 1, dataInicio: '2026-02-02', dataFim: '2026-02-01' }, id()), (error) => error.status === 400);
  const pedido = await service.createPedido({ titulo: 'Pedido', descricao: 'Descrição', categoria: 'Produto' }, id());
  assert.deepEqual(await service.vote(pedido.idPedido, 'user-1'), { voted: true });
  assert.deepEqual(await service.vote(pedido.idPedido, 'user-1'), { voted: false });
});

test('rejects circular user story dependencies', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const pedido = await service.createPedido({ titulo: 'Pedido', descricao: 'Descrição', categoria: 'Produto' }, id());
  const a = await service.createStory({ codigoUs: 'US1', titulo: 'A', descricao: 'A', criteriosAceitacao: 'A', idPedido: pedido.idPedido }, id());
  const b = await service.createStory({ codigoUs: 'US2', titulo: 'B', descricao: 'B', criteriosAceitacao: 'B', idPedido: pedido.idPedido }, id());
  await service.createDependency({ tipoDependencia: 'PRECEDE', idTarefaOrigem: a.item.idTarefa, idTarefaDestino: b.item.idTarefa });
  await assert.rejects(() => service.createDependency({ tipoDependencia: 'PRECEDE', idTarefaOrigem: b.item.idTarefa, idTarefaDestino: a.item.idTarefa }), (error) => error.status === 409);
});

test('does not send non-schema idAutor to UserStory, Sprint, or RoadmapRelease', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const pedido = await service.createPedido({ titulo: 'Pedido', descricao: 'Descrição', categoria: 'Produto' }, id());
  const story = await service.createStory({ codigoUs: 'US3', titulo: 'Story', descricao: 'Descrição', criteriosAceitacao: 'Critérios', idPedido: pedido.idPedido }, id());
  const sprint = await service.createSprint({ numeroSprint: 2, dataInicio: '2026-02-01', dataFim: '2026-02-14' }, id());
  const release = await service.createRelease({ tituloRelease: 'Release', dataInicio: '2026-02-01', dataFim: '2026-02-28' }, id());
  assert.equal(story.item.idAutor, undefined);
  assert.equal(sprint.idAutor, undefined);
  assert.equal(release.idAutor, undefined);
  assert.equal(repo.data.UserStory.at(-1).idAutor, undefined);
  assert.equal(repo.data.Sprint.at(-1).idAutor, undefined);
  assert.equal(repo.data.RoadmapRelease.at(-1).idAutor, undefined);
});

test('sanitizePII strips XSS and PII patterns and AIAdapter falls back cleanly without API key', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const raw = '<script>alert(1)</script>Contactar maria.silva@empresa.pt, Tel: +351 912 345 678, NIF 123456789, Contacto: @maria_dev';
    const cleaned = sanitizePII(raw);
    assert.ok(!cleaned.includes('script'));
    assert.ok(!cleaned.includes('maria.silva@empresa.pt'));
    assert.ok(!cleaned.includes('912 345 678'));
    assert.ok(!cleaned.includes('123456789'));
    assert.ok(!cleaned.includes('@maria_dev'));
    assert.ok(cleaned.includes('[EMAIL]'));
    assert.ok(cleaned.includes('[TELEFONE]'));
    assert.ok(cleaned.includes('[NIF]'));
    assert.ok(cleaned.includes('[CONTACTO]'));

    const adapter = new AIAdapter();
    const suggestion = await adapter.suggestPrioritization({
      titulo: 'Erro crítico no login com maria@giro.pt',
      descricao: 'NIF 234567890 bloqueado após contacto +351 961 234 567',
      categoria: 'BUG',
      impactEstimate: 8,
    });
    assert.equal(suggestion.available, false);
    assert.equal(suggestion.fallback, true);
    assert.equal(suggestion.advisoryOnly, true);
    assert.equal(typeof suggestion.scorePrioridade, 'number');
    assert.equal(typeof suggestion.esforcoSugerido, 'number');
    assert.equal(suggestion.impactoSugerido, 8);
    assert.ok(suggestion.justificacao.length > 0);
    assert.ok(!suggestion.sanitizedText.includes('maria@giro.pt'));
    assert.ok(!suggestion.sanitizedText.includes('234567890'));
    assert.ok(!suggestion.sanitizedText.includes('961 234 567'));
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

test('pesquisarPedidosSemelhantes enforces min query length and ranks trigram/token matches', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();

  await service.createPedido({
    titulo: 'Autenticação OAuth2 com Google',
    descricao: 'Permitir início de sessão federado para utilizadores empresariais',
    categoria: 'NOVA_FUNCIONALIDADE',
  }, authorId);
  await service.createPedido({
    titulo: 'Exportação de relatórios em PDF',
    descricao: 'Gerar ficheiros mensais para a equipa financeira',
    categoria: 'MELHORIA',
  }, authorId);

  const tooShort = await service.pesquisarPedidosSemelhantes('ab');
  assert.deepEqual(tooShort, { matches: [], query: 'ab' });

  const search = await service.pesquisarPedidosSemelhantes('autenticacao oauth');
  assert.equal(search.matches.length, 1);
  assert.equal(search.matches[0].titulo, 'Autenticação OAuth2 com Google');
  assert.ok(search.matches[0].similarity > 0.15);
});

test('updatePedido records HistoricoPedido, enforces permissions, and deduplicates state notifications', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();
  const voterId = id();
  const poId = id();

  const pedido = await service.createPedido({
    titulo: 'Modo escuro',
    descricao: 'Tema noturno para a interface',
    categoria: 'MELHORIA',
  }, authorId);

  // Author and another voter both vote (author should only get 1 notification)
  await service.vote(pedido.idPedido, authorId);
  await service.vote(pedido.idPedido, voterId);

  // Author cannot change estado
  await assert.rejects(
    () => service.updatePedido(pedido.idPedido, { estado: 'APROVADO' }, { sub: authorId, papel: 'P04' }),
    (err) => err.status === 403
  );

  // Author can edit content while SUBMETIDO
  const edited = await service.updatePedido(
    pedido.idPedido,
    { titulo: 'Modo escuro no portal' },
    { sub: authorId, papel: 'P04' }
  );
  assert.equal(edited.titulo, 'Modo escuro no portal');
  assert.equal(repo.data.HistoricoPedido.length, 1);
  assert.equal(repo.data.HistoricoPedido[0].tituloAnterior, 'Modo escuro');
  assert.equal(repo.data.HistoricoPedido[0].estadoAnterior, 'SUBMETIDO');
  assert.equal(repo.data.HistoricoPedido[0].idEditor, authorId);

  // PO transitions state -> records history, notifications (deduped), and log
  const transitioned = await service.updatePedido(
    pedido.idPedido,
    { estado: 'EM_ANALISE', impactoNegocio: 7 },
    { sub: poId, papel: 'P01' }
  );
  assert.equal(transitioned.estado, 'EM_ANALISE');
  assert.equal(repo.data.HistoricoPedido.length, 2);
  assert.equal(repo.data.HistoricoPedido[1].tituloAnterior, 'Modo escuro no portal');
  assert.equal(repo.data.Notificacao.length, 2);
  const notifiedUsers = new Set(repo.data.Notificacao.map((n) => n.idUtilizador));
  assert.deepEqual(notifiedUsers, new Set([authorId, voterId]));
  assert.ok(repo.data.Notificacao.every((n) => n.tipo === 'ALTERACAO_ESTADO' && n.idPedido === pedido.idPedido));
  assert.ok(repo.data.Log.some((l) => l.acao === 'ALTERACAO_ESTADO_PEDIDO' && l.idUtilizador === poId));

  // Author can no longer edit content once estado !== SUBMETIDO
  await assert.rejects(
    () => service.updatePedido(pedido.idPedido, { titulo: 'Alteração tardia' }, { sub: authorId, papel: 'P04' }),
    (err) => err.status === 403
  );
});

test('deletePedido rejects non-SUBMETIDO with 409, blocks unauthorized users, and logs deletions', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();
  const otherId = id();
  const adminId = id();

  const pedido = await service.createPedido({
    titulo: 'Filtro avançado',
    descricao: 'Filtrar por etiquetas',
    categoria: 'MELHORIA',
  }, authorId);

  await assert.rejects(
    () => service.deletePedido(pedido.idPedido, { sub: otherId, papel: 'P04' }),
    (err) => err.status === 403
  );

  await service.updatePedido(pedido.idPedido, { estado: 'APROVADO' }, { sub: adminId, papel: 'P05' });
  await assert.rejects(
    () => service.deletePedido(pedido.idPedido, { sub: authorId, papel: 'P04' }),
    (err) => err.status === 409
  );

  const deletable = await service.createPedido({
    titulo: 'Pedido rascunho',
    descricao: 'Ainda submetido',
    categoria: 'MELHORIA',
  }, authorId);
  await service.deletePedido(deletable.idPedido, { sub: authorId, papel: 'P04' });
  assert.equal(await repo.findById('Pedido', deletable.idPedido), null);
  assert.ok(repo.data.Log.some((l) => l.acao === 'ELIMINACAO_PEDIDO' && l.detalhes?.idPedido === deletable.idPedido));
});

test('createComment notifies author and suggestPedidoPrioritization logs without mutating Pedido', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();
  const commenterId = id();
  const poId = id();

  const pedido = await service.createPedido({
    titulo: 'Notificações push',
    descricao: 'Alertar sobre votos e comentários',
    categoria: 'NOVA_FUNCIONALIDADE',
  }, authorId);

  await assert.rejects(() => service.createComment(pedido.idPedido, { conteudo: '<script>x</script>' }, commenterId), (err) => err.status === 400);

  await service.createComment(pedido.idPedido, { conteudo: 'Excelente sugestão!' }, commenterId);
  await service.createComment(pedido.idPedido, { conteudo: 'Obrigado pelo feedback' }, authorId);
  assert.equal(repo.data.Comentario.length, 2);
  assert.equal(repo.data.Notificacao.length, 1);
  assert.equal(repo.data.Notificacao[0].tipo, 'NOVO_COMENTARIO');
  assert.equal(repo.data.Notificacao[0].idUtilizador, authorId);

  const suggestion = await service.suggestPedidoPrioritization(pedido.idPedido, poId);
  assert.equal(suggestion.advisoryOnly, true);
  assert.equal((await repo.findById('Pedido', pedido.idPedido)).estado, 'SUBMETIDO');
  assert.ok(repo.data.Log.some((l) => l.acao === 'CONSULTA_IA_PRIORIZACAO' && l.idUtilizador === poId));
});

test('updateStory enforces effort and blocking dependencies and auto-completes parent Pedido', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();
  const devId = id();

  const pedido = await service.createPedido({
    titulo: 'Checkout rápido',
    descricao: 'Fluxo de pagamento em um passo',
    categoria: 'NOVA_FUNCIONALIDADE',
  }, authorId);

  const us1 = (await service.createStory({
    codigoUs: 'US10',
    titulo: 'API de pagamento',
    descricao: 'Endpoint',
    criteriosAceitacao: 'Retorna 200',
    idPedido: pedido.idPedido,
  })).item;

  const us2 = (await service.createStory({
    codigoUs: 'US11',
    titulo: 'UI de pagamento',
    descricao: 'Formulário',
    criteriosAceitacao: 'Submete pagamento',
    idPedido: pedido.idPedido,
  })).item;

  await service.createDependency({
    tipoDependencia: 'BLOQUEIA',
    idTarefaOrigem: us1.idTarefa,
    idTarefaDestino: us2.idTarefa,
  });

  // Missing positive effort -> 400
  await assert.rejects(
    () => service.updateStory(us2.idTarefa, { estadoTecnico: 'CONCLUIDO', tempoRegistado: 0 }, { sub: devId, papel: 'P03' }),
    (err) => err.status === 400
  );

  // Open blocker dependency -> 409
  await assert.rejects(
    () => service.updateStory(us2.idTarefa, { estadoTecnico: 'CONCLUIDO', tempoRegistado: 4 }, { sub: devId, papel: 'P03' }),
    (err) => err.status === 409
  );

  // Complete blocker first (parent Pedido stays SUBMETIDO while us2 is open)
  await service.updateStory(us1.idTarefa, { estadoTecnico: 'CONCLUIDO', tempoRegistado: 6 }, { sub: devId, papel: 'P03' });
  assert.equal((await repo.findById('Pedido', pedido.idPedido)).estado, 'SUBMETIDO');

  // Now us2 can complete -> all stories done -> parent Pedido transitions to CONCLUIDO
  await service.updateStory(us2.idTarefa, { estadoTecnico: 'CONCLUIDO', tempoRegistado: 4 }, { sub: devId, papel: 'P03' });
  assert.equal((await repo.findById('Pedido', pedido.idPedido)).estado, 'CONCLUIDO');
  assert.ok(repo.data.Notificacao.some((n) => n.tipo === 'ALTERACAO_ESTADO' && n.idUtilizador === authorId && n.idPedido === pedido.idPedido));
});

test('pagination clamps take <= 50 and skip >= 0 in MemoryRepository and PrismaRepository', async () => {
  const repo = new MemoryRepository();
  const service = domainService(repo);
  const authorId = id();

  for (let i = 0; i < 65; i += 1) {
    await service.createPedido({ titulo: `Pedido ${i}`, descricao: `Desc ${i}`, categoria: 'MELHORIA' }, authorId);
  }

  assert.equal((await repo.list('Pedido')).length, 50);
  assert.equal((await repo.list('Pedido', { take: 200, skip: -10 })).length, 50);
  assert.equal((await repo.list('Pedido', { take: -5 })).length, 1);

  const page2 = await repo.list('Pedido', { skip: 50, take: 50 });
  assert.equal(page2.length, 15);
  assert.equal(page2[0].titulo, 'Pedido 50');

  let capturedArgs = null;
  const prismaRepo = new PrismaRepository({
    pedido: {
      findMany: async (args) => { capturedArgs = args; return []; },
    },
  });
  await prismaRepo.list('Pedido', { skip: -4, take: 120 });
  assert.equal(capturedArgs.skip, 0);
  assert.equal(capturedArgs.take, 50);
});
