import { Router } from 'express';
import { z } from 'zod';
import { sanitizeBody } from '../security/sanitize.js';

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
export function authRoutes(service) {
  const router = Router();
  router.post('/register', async (req, res, next) => { try { const input = { ...sanitizeBody(req.body), password: req.body.password }; res.status(201).json(await service.register(z.object({ nome: z.string().min(1), email: z.string().email(), password: z.string().min(8), papel: z.enum(['P01','P02','P03','P04','P05']).optional() }).parse(input))); } catch (e) { next(e); } });
  router.post('/login', async (req, res, next) => { try { res.json(await service.login(credentials.parse(req.body))); } catch (e) { next(e); } });
  return router;
}
