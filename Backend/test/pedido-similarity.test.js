
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeForSearch, findSimilarPedidos } from '../src/services/pedido-similarity.js';

test('normaliza acentos, maiúsculas e pontuação', () => {
  assert.equal(normalizeForSearch('Autenticação: OAuth2!'), 'autenticacao oauth2');
  assert.equal(normalizeForSearch(null), '');
});

test('ordena pedidos semelhantes e mantém o formato de saída', () => {
  const pedidos = [
    { idPedido: '1', titulo: 'Exportação de relatórios', descricao: 'Criar ficheiros PDF' },
    { idPedido: '2', titulo: 'Autenticação OAuth2', descricao: 'Login com Google' },
    { idPedido: '3', titulo: 'Autenticação de utilizadores', descricao: 'Entrar com credenciais' },
  ];

  const original = structuredClone(pedidos);
  const matches = findSimilarPedidos(normalizeForSearch('autenticacao oauth2'), pedidos);

  assert.equal(matches[0].idPedido, '2');
  assert.ok(matches[0].similarity > 0.15);
  assert.ok(matches.every((p) => p.similarity >= 0 && p.similarity <= 1));
  assert.ok(matches.every((p) => Number.isInteger(p.similarity * 1000)));
  assert.deepEqual(pedidos, original);
});

test('devolve lista vazia sem correspondências e respeita o limite de 10', () => {
  assert.deepEqual(findSimilarPedidos('xyzzynotfound', [
    { titulo: 'Relatórios', descricao: 'Exportação de PDF' },
  ]), []);

  const pedidos = Array.from({ length: 15 }, (_, i) => ({
    idPedido: String(i),
    titulo: 'Modo escuro',
    descricao: 'Tema noturno',
  }));

  const matches = findSimilarPedidos('modo escuro', pedidos);

  assert.equal(matches.length, 10);
  assert.deepEqual(
    matches.map((p) => p.idPedido),
    pedidos.slice(0, 10).map((p) => p.idPedido)
  );
});
