
export function normalizeForSearch(value) {
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

export function findSimilarPedidos(queryNorm, pedidos) {
  return pedidos
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
}
