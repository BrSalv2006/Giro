/**
 * Clamps pagination parameters according to RNF-DES-03 (take in [1, 50], skip >= 0).
 */
export function normalizePagination({ skip = 0, take = 50 } = {}) {
  const parsedTake = Number(take);
  const parsedSkip = Number(skip);
  const safeTake = Number.isFinite(parsedTake)
    ? Math.min(Math.max(parsedTake || 50, 1), 50)
    : 50;
  const safeSkip = Number.isFinite(parsedSkip)
    ? Math.max(parsedSkip || 0, 0)
    : 0;
  return {
    skip: Math.trunc(safeSkip),
    take: Math.trunc(safeTake),
  };
}
