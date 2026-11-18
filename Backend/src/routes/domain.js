import { Router } from 'express';
import { requireRoles } from '../security/auth.js';

export function domainRoutes({ auth, service }) {
  const router = Router();
  const manager = [auth, requireRoles('P01', 'P02', 'P03', 'P05')];
  const triageManagers = [auth, requireRoles('P01', 'P02', 'P05')];
  const adminOnly = [auth, requireRoles('P05')];
  const allUsers = [auth, requireRoles('P01', 'P02', 'P03', 'P04', 'P05')];

  const endpoint = (method, path, middleware, action, status = 201) =>
    router[method](path, middleware, async (req, res, next) => {
      try {
        const result = await action(req);
        if (status === 204) return res.status(204).end();
        return res.status(status).json(result);
      } catch (error) {
        return next(error);
      }
    });

  endpoint('get', '/pedidos/semelhantes', allUsers, (req) =>
    service.pesquisarPedidosSemelhantes(typeof req.query.q === 'string' ? req.query.q : ''), 200);
  endpoint('post', '/pedidos', allUsers, (req) => service.createPedido(req.body, req.user.sub));
  endpoint('patch', '/pedidos/:id', allUsers, (req) => service.updatePedido(req.params.id, req.body, req.user), 200);
  endpoint('delete', '/pedidos/:id', allUsers, (req) => service.deletePedido(req.params.id, req.user), 204);
  endpoint('post', '/pedidos/:pedidoId/votos', allUsers, (req) => service.vote(req.params.pedidoId, req.user.sub));
  endpoint('post', '/pedidos/:pedidoId/comentarios', allUsers, (req) =>
    service.createComment(req.params.pedidoId, req.body, req.user.sub));
  endpoint('post', '/pedidos/:pedidoId/ia-priorizacao', triageManagers, (req) =>
    service.suggestPedidoPrioritization(req.params.pedidoId, req.user.sub), 200);

  endpoint('post', '/user-stories', manager, (req) => service.createStory(req.body, req.user.sub));
  endpoint('patch', '/user-stories/:id', manager, (req) => service.updateStory(req.params.id, req.body, req.user), 200);
  endpoint('post', '/sprints', triageManagers, (req) => service.createSprint(req.body, req.user));
  endpoint('patch', '/sprints/:id', triageManagers, (req) => service.updateSprint(req.params.id, req.body, req.user), 200);
  endpoint('delete', '/sprints/:id', triageManagers, (req) => service.deleteSprint(req.params.id, req.user), 204);
  endpoint('post', '/roadmap', manager, (req) => service.createRelease(req.body, req.user.sub));
  endpoint('post', '/dependencias', manager, (req) => service.createDependency(req.body));
  endpoint('patch', '/users/:id', adminOnly, (req) => service.updateUser(req.params.id, req.body, req.user), 200);

  return router;
}
