import { normalizePagination } from './pagination.js';

const delegates = {
  Utilizador: 'utilizador', Pedido: 'pedido', HistoricoPedido: 'historicoPedido',
  Voto: 'voto', Comentario: 'comentario', Notificacao: 'notificacao', Log: 'log',
  Sprint: 'sprint', RoadmapRelease: 'roadmapRelease', UserStory: 'userStory', Dependencia: 'dependencia'
};
const primaryKeys = {
  Utilizador: 'idUtilizador', Pedido: 'idPedido', HistoricoPedido: 'idHistorico',
  Voto: 'idVoto', Comentario: 'idComentario', Notificacao: 'idNotificacao',
  Log: 'idLog', Sprint: 'idSprint', RoadmapRelease: 'idRelease',
  UserStory: 'idTarefa', Dependencia: 'idDependencia'
};

export class PrismaRepository {
  constructor(prisma) { this.prisma = prisma; }
  delegate(model) {
    const delegate = this.prisma[delegates[model]];
    if (!delegate) throw new Error(`Unknown Prisma model: ${model}`);
    return delegate;
  }
  async list(model, options = {}) {
    const { skip, take } = normalizePagination(options);
    const include = {
      Pedido: { autor: true, votos: true, comentarios: { include: { utilizador: true } }, historico: true, userStories: true },
      Utilizador: { pedidos: true, notificacoes: true, logs: true },
      UserStory: { pedido: true, sprint: true, responsavel: true, release: true, dependenciasOrigem: true, dependenciasDestino: true },
      Sprint: { userStories: true },
      RoadmapRelease: { userStories: true },
      Notificacao: { utilizador: true, pedido: true },
      Comentario: { utilizador: true, pedido: true },
      HistoricoPedido: { editor: true, pedido: true },
      Dependencia: { tarefaOrigem: true, tarefaDestino: true },
    }[model];
    const orderBy = model === 'Pedido' ? { dataCriacao: 'desc' }
      : model === 'HistoricoPedido' ? { dataAlteracao: 'desc' }
      : model === 'Notificacao' ? { dataCriacao: 'desc' }
      : model === 'Comentario' ? { dataCriacao: 'desc' }
      : model === 'Log' ? { dataHora: 'desc' }
      : model === 'Sprint' ? { numeroSprint: 'asc' }
      : undefined;
    return this.delegate(model).findMany({
      ...(include ? { include } : {}),
      ...(orderBy ? { orderBy } : {}),
      skip,
      take,
    });
  }
  async findById(model, id) {
    const key = primaryKeys[model];
    if (!key) throw new Error(`Unknown Prisma model: ${model}`);
    return this.delegate(model).findUnique({ where: { [key]: id } });
  }
  async findOne() { throw new Error('Use typed repository methods for Prisma queries'); }
  async findUserByEmail(email) { return this.delegate('Utilizador').findUnique({ where: { email } }); }
  async findVote(pedidoId, userId) { return this.delegate('Voto').findUnique({ where: { idUtilizador_idPedido: { idUtilizador: userId, idPedido: pedidoId } } }); }
  async create(model, input) { return this.delegate(model).create({ data: input }); }
  async removeVote(id) { return this.prisma.voto.delete({ where: { idVoto: id } }); }
  async update(model, id, input) {
    const key = primaryKeys[model];
    if (!key) throw new Error(`Unknown Prisma model: ${model}`);
    return this.delegate(model).update({ where: { [key]: id }, data: input });
  }
  async delete(model, id) {
    const key = primaryKeys[model];
    if (!key) throw new Error(`Unknown Prisma model: ${model}`);
    return this.delegate(model).delete({ where: { [key]: id } });
  }
}
