import { Router } from 'express';
import { sanitizeBody } from '../security/sanitize.js';

export function resourceRouter({ repo, model, auth, writeAuth = [], transform }) {
  const router = Router();
  if (auth) router.use(auth);
  const format = (data) => {
    if (!transform) return data;
    return Array.isArray(data) ? data.map(transform) : transform(data);
  };
  router.get('/', async (req, res, next) => {
    try {
      const { skip, take } = req.query;
      res.json(format(await repo.list(model, { skip, take })));
    } catch (e) { next(e); }
  });
  router.post('/', ...writeAuth, async (req, res, next) => {
    try { res.status(201).json(format(await repo.create(model, sanitizeBody(req.body)))); } catch (e) { next(e); }
  });
  router.patch('/:id', ...writeAuth, async (req, res, next) => {
    try { res.json(format(await repo.update(model, req.params.id, sanitizeBody(req.body)))); } catch (e) { next(e); }
  });
  router.delete('/:id', ...writeAuth, async (req, res, next) => {
    try { await repo.delete(model, req.params.id); res.status(204).end(); } catch (e) { next(e); }
  });
  return router;
}
