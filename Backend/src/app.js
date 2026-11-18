import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getEnv } from './config/env.js';
import { createRepository } from './repositories/index.js';
import { authenticate, requireRoles } from './security/auth.js';
import { authRoutes } from './routes/auth.js';
import { resourceRouter } from './routes/factory.js';
import { authService } from './services/auth.service.js';
import { domainService } from './services/domain.service.js';
import { domainRoutes } from './routes/domain.js';
import { AIAdapter } from './ai/adapter.js';

export async function createApp() {
  const env = getEnv();
  const repo = await createRepository(env);
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
  app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', service: 'giro-backend' }));
  app.use('/api/v1/auth', authRoutes(authService(repo, env)));

  const auth = authenticate(env.JWT_SECRET);
  app.use('/api/v1', domainRoutes({ auth, repo, service: domainService(repo, new AIAdapter()) }));

  const routes = {
    pedidos: ['Pedido', ['P01', 'P02', 'P03', 'P04', 'P05']],
    'user-stories': ['UserStory', ['P01', 'P02', 'P03', 'P05']],
    sprints: ['Sprint', ['P01', 'P02', 'P03', 'P05']],
    roadmap: ['RoadmapRelease', ['P01', 'P02', 'P03', 'P05']],
    notifications: ['Notificacao', ['P01', 'P02', 'P03', 'P04', 'P05']],
    analytics: ['Log', ['P01', 'P02', 'P03', 'P05'], { writeAuth: [requireRoles('P05')] }],
    users: ['Utilizador', ['P01', 'P02', 'P05'], {
      writeAuth: [requireRoles('P05')],
      transform: ({ passwordHash, ...safeUser }) => safeUser,
    }],
  };

  for (const [path, [model, roles, options = {}]] of Object.entries(routes)) {
    app.use(`/api/v1/${path}`, resourceRouter({
      repo,
      model,
      auth: [auth, requireRoles(...roles)],
      ...options,
    }));
  }

  app.use((err, req, res, next) => {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Dados inválidos', details: err.issues });
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    return res.status(status).json({ error: status >= 500 ? 'Erro interno do servidor' : err.message });
  });
  return app;
}
