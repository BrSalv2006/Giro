import { randomUUID } from 'node:crypto';
import { normalizePagination } from './pagination.js';

const models = ['Utilizador', 'Pedido', 'HistoricoPedido', 'Voto', 'Comentario', 'Notificacao', 'Log', 'Sprint', 'RoadmapRelease', 'UserStory', 'Dependencia'];
const keys = { Utilizador: 'idUtilizador', Pedido: 'idPedido', HistoricoPedido: 'idHistorico', Voto: 'idVoto', Comentario: 'idComentario', Notificacao: 'idNotificacao', Log: 'idLog', Sprint: 'idSprint', RoadmapRelease: 'idRelease', UserStory: 'idTarefa', Dependencia: 'idDependencia' };
const defaults = {
  Utilizador: { ativo: true },
  Pedido: { tags: [], estado: 'SUBMETIDO' },
  Notificacao: { lida: false },
  Sprint: { estado: 'PLANEADO' },
  RoadmapRelease: { marcoCritico: false },
  UserStory: { estadoTecnico: 'BACKLOG' },
};

const safeUser = (user) => {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
};

export class MemoryRepository {
  constructor() {
    this.data = Object.fromEntries(models.map((model) => [model, []]));
    const adminId = randomUUID();
    this.data.Utilizador.push({ idUtilizador: adminId, id: adminId, nome: 'Administrador', email: 'admin@giro.local', passwordHash: null, papel: 'P05', ativo: true });
  }
  hydrate(model, item) {
    switch (model) {
      case 'Pedido':
        return {
          ...item,
          autor: safeUser(this.data.Utilizador.find((u) => u.idUtilizador === item.idAutor)),
          votos: this.data.Voto.filter((v) => v.idPedido === item.idPedido),
          comentarios: this.data.Comentario
            .filter((c) => c.idPedido === item.idPedido)
            .map((c) => ({ ...c, utilizador: safeUser(this.data.Utilizador.find((u) => u.idUtilizador === c.idUtilizador)) })),
          historico: this.data.HistoricoPedido.filter((h) => h.idPedido === item.idPedido),
          userStories: this.data.UserStory.filter((s) => s.idPedido === item.idPedido),
        };
      case 'UserStory':
        return {
          ...item,
          pedido: this.data.Pedido.find((p) => p.idPedido === item.idPedido) ?? null,
          sprint: item.idSprint ? (this.data.Sprint.find((s) => s.idSprint === item.idSprint) ?? null) : null,
          responsavel: item.idResponsavel ? safeUser(this.data.Utilizador.find((u) => u.idUtilizador === item.idResponsavel)) : null,
          release: item.idRelease ? (this.data.RoadmapRelease.find((r) => r.idRelease === item.idRelease) ?? null) : null,
          dependenciasOrigem: this.data.Dependencia.filter((d) => d.idTarefaOrigem === item.idTarefa),
          dependenciasDestino: this.data.Dependencia.filter((d) => d.idTarefaDestino === item.idTarefa),
        };
      case 'Sprint':
        return { ...item, userStories: this.data.UserStory.filter((s) => s.idSprint === item.idSprint) };
      case 'RoadmapRelease':
        return { ...item, userStories: this.data.UserStory.filter((s) => s.idRelease === item.idRelease) };
      case 'Notificacao':
        return {
          ...item,
          utilizador: safeUser(this.data.Utilizador.find((u) => u.idUtilizador === item.idUtilizador)),
          pedido: item.idPedido ? (this.data.Pedido.find((p) => p.idPedido === item.idPedido) ?? null) : null,
        };
      case 'Comentario':
        return {
          ...item,
          utilizador: safeUser(this.data.Utilizador.find((u) => u.idUtilizador === item.idUtilizador)),
          pedido: this.data.Pedido.find((p) => p.idPedido === item.idPedido) ?? null,
        };
      case 'HistoricoPedido':
        return {
          ...item,
          editor: safeUser(this.data.Utilizador.find((u) => u.idUtilizador === item.idEditor)),
          pedido: this.data.Pedido.find((p) => p.idPedido === item.idPedido) ?? null,
        };
      case 'Dependencia':
        return {
          ...item,
          tarefaOrigem: this.data.UserStory.find((s) => s.idTarefa === item.idTarefaOrigem) ?? null,
          tarefaDestino: this.data.UserStory.find((s) => s.idTarefa === item.idTarefaDestino) ?? null,
        };
      case 'Utilizador':
        return {
          ...item,
          pedidos: this.data.Pedido.filter((p) => p.idAutor === item.idUtilizador),
          notificacoes: this.data.Notificacao.filter((n) => n.idUtilizador === item.idUtilizador),
          logs: this.data.Log.filter((l) => l.idUtilizador === item.idUtilizador),
        };
      default:
        return item;
    }
  }
  async list(model, options = {}) {
    const { skip, take } = normalizePagination(options);
    return (this.data[model] ?? []).slice(skip, skip + take).map((item) => this.hydrate(model, item));
  }
  async findById(model, id) { return this.data[model]?.find((item) => item[keys[model]] === id || item.id === id) ?? null; }
  async findOne(model, predicate) { return this.data[model]?.find(predicate) ?? null; }
  async findUserByEmail(email) { return this.findOne('Utilizador', (u) => u.email === email); }
  async findVote(pedidoId, userId) { return this.findOne('Voto', (v) => v.idPedido === pedidoId && v.idUtilizador === userId); }
  async create(model, input) { const id = randomUUID(); const item = { ...(defaults[model] ?? {}), ...input, [keys[model]]: id, id, dataCriacao: new Date().toISOString() }; this.data[model].push(item); return item; }
  async removeVote(id) { this.data.Voto = this.data.Voto.filter((voto) => (voto.idVoto ?? voto.id) !== id); }
  async update(model, id, input) {
    const key = keys[model];
    const index = this.data[model].findIndex((item) => item[key] === id || item.id === id);
    if (index < 0) throw Object.assign(new Error('Recurso não encontrado'), { status: 404 });
    this.data[model][index] = { ...this.data[model][index], ...input };
    return this.data[model][index];
  }
  async delete(model, id) {
    const key = keys[model];
    const index = this.data[model].findIndex((item) => item[key] === id || item.id === id);
    if (index < 0) throw Object.assign(new Error('Recurso não encontrado'), { status: 404 });
    return this.data[model].splice(index, 1)[0];
  }
}
