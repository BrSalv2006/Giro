/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'
import { ROLES, ROLE_CODES, getRoleCode, getRoleLabel, normalizeRoleKey } from './authConstants.js'
import { apiRequest, getToken } from '../services/api.js'

const DataContext = createContext(null)

const SESSION_MESSAGES_KEY = 'giro_workspace_messages_v1'
const WORKSPACE_CONFIG_KEY = 'giro_workspace_config_v1'

const DEFAULT_WORKSPACE_CONFIG = {
  projectName: 'Plataforma de Produto',
  teamName: 'Equipa Principal',
  visibility: 'Privada · Apenas membros',
  timezone: 'Europa/Lisboa (GMT+0)',
  description: 'Equipa responsável pela evolução contínua, priorização e entregas do produto.',
}

function loadWorkspaceConfig() {
  try {
    const raw = localStorage.getItem(WORKSPACE_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_WORKSPACE_CONFIG, ...parsed }
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_WORKSPACE_CONFIG
}

const PEDIDO_STATUS = {
  SUBMETIDO: 'pending',
  EM_ANALISE: 'analysis',
  APROVADO: 'approved',
  PLANEADO: 'planned',
  EM_DESENVOLVIMENTO: 'development',
  CONCLUIDO: 'complete',
  REJEITADO: 'rejected',
}

const BACKEND_PEDIDO_STATUS = {
  pending: 'SUBMETIDO',
  analysis: 'EM_ANALISE',
  approved: 'APROVADO',
  planned: 'PLANEADO',
  development: 'EM_DESENVOLVIMENTO',
  complete: 'CONCLUIDO',
  rejected: 'REJEITADO',
}

const STORY_STATUS = {
  BACKLOG: 'todo',
  TODO: 'todo',
  EM_PROGRESSO: 'in_progress',
  EM_REVISAO: 'review',
  CONCLUIDO: 'done',
  BLOQUEADO: 'blocked',
}

const BACKEND_STORY_STATUS = {
  todo: 'TODO',
  in_progress: 'EM_PROGRESSO',
  review: 'EM_REVISAO',
  done: 'CONCLUIDO',
  blocked: 'BLOQUEADO',
}

const ROLE_SCOPE_MAP = {
  PRODUCT_OWNER: 'Gestão do Backlog, priorização e aprovação de pedidos',
  SCRUM_MASTER: 'Facilitação ágil, remoção de impedimentos e roadmap',
  DEVELOPER: 'Implementação técnica no Sprint, testes e estimativas',
  CLIENT: 'Submissão de sugestões, votação única e comentários',
  ADMIN: 'Gestão de contas RBAC, segurança e auditoria do sistema',
}

const WORKSPACE_CHANNELS = [
  {
    id: 'geral',
    name: 'geral',
    description: 'Alinhamento diário da equipa, avisos gerais e decisões de produto.',
    unread: 0,
  },
  {
    id: 'sprint-planning',
    name: 'sprint-planning',
    description: 'Planeamento de sprints, estimativas em Story Points e capacidade da equipa.',
    unread: 0,
  },
  {
    id: 'bloqueios',
    name: 'bloqueios',
    description: 'Registo rápido de impedimentos técnicos e acompanhamento pelo Scrum Master.',
    unread: 0,
  },
]

const EMPTY_MESSAGES = {
  geral: [],
  'sprint-planning': [],
  bloqueios: [],
}

function loadInitialMessages() {
  try {
    const raw = sessionStorage.getItem(SESSION_MESSAGES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore storage errors
  }
  return EMPTY_MESSAGES
}

function normalizeSprintRecord(sprint) {
  return {
    idSprint: sprint.idSprint || sprint.id,
    numeroSprint: Number(sprint.numeroSprint),
    dataInicio: sprint.dataInicio,
    dataFim: sprint.dataFim,
    capacidadeMaxima: sprint.capacidadeMaxima != null ? Number(sprint.capacidadeMaxima) : null,
    estado: sprint.estado || 'PLANEADO',
    userStories: Array.isArray(sprint.userStories) ? sprint.userStories : [],
  }
}

export function stripPii(text) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL_REMOVIDO]')
    .replace(/(?:\+?\d{1,3}[\s.-]?)?(?:\d[\s.-]?){9,12}/g, '[CONTACTO_REMOVIDO]')
    .trim()
}

function buildTrigrams(str) {
  const padded = `  ${String(str || '').toLowerCase().trim()}  `
  const set = new Set()
  for (let i = 0; i <= padded.length - 3; i += 1) {
    set.add(padded.slice(i, i + 3))
  }
  return set
}

function computeSimilarityScore(query, target) {
  const q = String(query || '').toLowerCase().trim()
  const t = String(target || '').toLowerCase().trim()
  if (!q || !t) return 0
  if (t.includes(q)) return 0.95
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2)
  const wordMatches = qWords.filter((word) => t.includes(word)).length
  const wordScore = qWords.length ? wordMatches / qWords.length : 0

  const a = buildTrigrams(q)
  const b = buildTrigrams(t)
  let intersection = 0
  for (const trigram of a) {
    if (b.has(trigram)) intersection += 1
  }
  const trigramScore = (2 * intersection) / (a.size + b.size || 1)
  return Math.max(trigramScore, wordScore * 0.85)
}

function computeLocalHeuristicPrioritization(pedido) {
  const sanitizedTitle = stripPii(pedido?.title || '')
  const sanitizedDesc = stripPii(pedido?.description || '')
  const text = `${sanitizedTitle} ${sanitizedDesc}`.toLowerCase()
  const votes = Number(pedido?.voteCount || 0)

  let impact = pedido?.impact ?? (votes >= 20 ? 9 : votes >= 10 ? 8 : 6)
  let effort = pedido?.effort ?? (text.includes('integra') || text.includes('arquitet') ? 5 : 3)

  if (pedido?.category === 'BUG') {
    effort = Math.min(effort, 2)
    impact = Math.max(impact, 7)
  }

  const quadrant =
    impact >= 8 && effort <= 3
      ? 'quick_wins'
      : impact >= 8
      ? 'strategic'
      : impact <= 4
      ? 'reconsider'
      : 'fill_in'

  const recommendationMap = {
    quick_wins: 'Quick Win recomendado (Alto impacto / Baixo esforço)',
    strategic: 'Aposta estratégica — decompor em épico no Roadmap',
    fill_in: 'Melhoria incremental para folga de Sprint',
    reconsider: 'Reavaliar relação custo-benefício com stakeholders',
  }

  return {
    impact,
    effort,
    quadrant,
    recommendation: recommendationMap[quadrant],
    confidence: 'Heurística local (PII sanitizado)',
    piiSanitized: true,
    sanitizedPreview: sanitizedTitle,
  }
}

function normalizeUserRecord(user) {
  const roleKey = normalizeRoleKey(user.papel || user.role)
  const roleCode = getRoleCode(user.papel || user.role)
  return {
    id: user.idUtilizador || user.id,
    name: user.nome || user.name || 'Utilizador',
    email: user.email || '',
    role: roleKey,
    roleCode,
    active: user.ativo !== undefined ? Boolean(user.ativo) : user.active !== false,
    scope: user.scope || ROLE_SCOPE_MAP[roleKey] || 'Membro da plataforma GIRO',
  }
}

function normalizeCommentRecord(comment) {
  const authorName = comment.utilizador?.nome || comment.authorName || 'Utilizador'
  const authorRole = comment.utilizador?.papel || comment.authorRole || ''
  return {
    id: comment.idComentario || comment.id || `cmt-${Date.now()}`,
    content: comment.conteudo || comment.content || '',
    createdAt: comment.dataCriacao || comment.createdAt || new Date().toISOString(),
    authorName,
    authorRole,
  }
}

function normalizePedidoRecord(pedido) {
  const authorName = pedido.autor?.nome || pedido.author?.name || 'Utilizador'
  const authorRole = pedido.autor?.papel || pedido.author?.role || ''
  return {
    id: pedido.idPedido || pedido.id,
    title: pedido.titulo || pedido.title || '',
    description: pedido.descricao || pedido.description || '',
    category: pedido.categoria || pedido.category || 'NOVA_FUNCIONALIDADE',
    status: PEDIDO_STATUS[pedido.estado] || pedido.status || 'pending',
    backendStatus: pedido.estado || pedido.backendStatus || 'SUBMETIDO',
    effort: pedido.esforcoEstimado ?? pedido.effort ?? null,
    impact: pedido.impactoNegocio ?? pedido.impact ?? null,
    voteCount: pedido.votos?.length ?? pedido.voteCount ?? 0,
    votedBy: pedido.votos?.map((voto) => voto.idUtilizador) || pedido.votedBy || [],
    tags: pedido.tags || [],
    createdAt: pedido.dataCriacao || pedido.createdAt || new Date().toISOString(),
    author: {
      name: authorName,
      role: authorRole,
      avatar: pedido.author?.avatar || authorName.slice(0, 2).toUpperCase() || 'US',
    },
    linkedStoryId: pedido.userStories?.[0]?.codigoUs || pedido.linkedStoryId || null,
    aiRecommendation: pedido.aiRecommendation || null,
    aiConfidence: pedido.aiConfidence || null,
    comments: Array.isArray(pedido.comentarios)
      ? pedido.comentarios.map(normalizeCommentRecord)
      : Array.isArray(pedido.comments)
      ? pedido.comments.map(normalizeCommentRecord)
      : [],
    history: pedido.historico || pedido.history || [],
  }
}

function normalizeLogRecord(log, usersList = []) {
  const matchedUser = usersList.find((u) => u.id === log.idUtilizador)
  return {
    id: log.idLog || log.id,
    action: log.acao || log.action || 'ACAO_SISTEMA',
    resource: log.recurso || log.resource || 'Sistema',
    details: log.detalhes || log.details || null,
    timestamp: log.dataHora || log.timestamp || new Date().toISOString(),
    userId: log.idUtilizador || log.userId || null,
    userName: log.utilizador?.nome || matchedUser?.name || log.userName || 'Sistema',
    userRole: log.utilizador?.papel || matchedUser?.roleCode || log.userRole || '',
  }
}

function deriveStoryPriority(story) {
  if (story.prioridade) return story.prioridade
  const impact = Number(story.pedido?.impactoNegocio ?? 0)
  const points = Number(story.storyPoints ?? 0)
  if (impact >= 9 || points >= 8) return 'Alta'
  if (story.pedido?.impactoNegocio != null && impact <= 4 && points <= 2) return 'Baixa'
  return 'Média'
}

function deriveStoryEpic(story) {
  if (story.epico) return story.epico
  const categoria = story.pedido?.categoria
  if (categoria === 'BUG') return 'Qualidade & Segurança'
  if (categoria === 'MELHORIA') return 'Backlog & IA'
  return 'Gestão de Pedidos'
}

function mapNotificationCategoryAndType(tipo) {
  switch (tipo) {
    case 'BLOQUEIO_TAREFA':
      return { category: 'bloqueios', type: 'blocker' }
    case 'NOVO_COMENTARIO':
    case 'MENCAO':
      return { category: 'mencoes', type: 'mention' }
    case 'ALTERACAO_ESTADO':
    default:
      return { category: 'decisoes', type: 'status' }
  }
}

function computeNotificationTimeGroup(dateValue) {
  if (!dateValue) return 'HOJE'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'HOJE'
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((todayStart - dateStart) / 86400000)
  if (diffDays <= 0) return 'HOJE'
  if (diffDays === 1) return 'ONTEM'
  return 'ESTA SEMANA'
}

function formatSprintDateRange(startValue, endValue) {
  if (!startValue || !endValue) return 'Sem datas definidas'
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Sem datas definidas'
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    const monthYear = end.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
    return `${start.getDate()}–${end.getDate()} ${monthYear}`
  }
  const startStr = start.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  const endStr = end.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

const CATEGORY_CODE_REF = {
  BUG: 'Frontend/src/components/common',
  MELHORIA: 'Frontend/src/pages/PedidosPage.jsx',
  NOVA_FUNCIONALIDADE: 'Frontend/src/pages/PriorizacaoPage.jsx',
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth()

  const [pedidos, setPedidos] = useState([])
  const [stories, setStories] = useState([])
  const [sprints, setSprints] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [notifications, setNotifications] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [traceability, setTraceability] = useState([])
  const [workspaceConfig, setWorkspaceConfig] = useState(loadWorkspaceConfig)
  const [channels] = useState(WORKSPACE_CHANNELS)
  const [messages, setMessages] = useState(loadInitialMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateWorkspaceConfig = useCallback((patch) => {
    setWorkspaceConfig((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(WORKSPACE_CONFIG_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [])

  const appendDemoLog = useCallback((action, resource, details = null) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action,
        resource,
        details,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'usr-sys',
        userName: currentUser?.name || 'Sistema',
        userRole: getRoleCode(currentUser?.role),
      },
      ...prev,
    ])
  }, [currentUser])

  const currentUserRole = currentUser?.role

  const reload = useCallback(async () => {
    if (!getToken()) {
      setPedidos([])
      setStories([])
      setSprints([])
      setRoadmap([])
      setNotifications([])
      setUsers([])
      setLogs([])
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const canReadInternal = currentUserRole !== ROLES.CLIENT
      const results = await Promise.allSettled([
        apiRequest('/pedidos'),
        apiRequest('/user-stories'),
        apiRequest('/sprints'),
        apiRequest('/roadmap'),
        apiRequest('/notifications'),
        apiRequest('/users'),
        canReadInternal ? apiRequest('/analytics') : Promise.resolve([]),
      ])
      const valueAt = (index) => (results[index]?.status === 'fulfilled' && Array.isArray(results[index].value) ? results[index].value : [])
      const apiPedidos = valueAt(0)
      const apiStories = valueAt(1)
      const apiSprints = valueAt(2)
      const apiRoadmap = valueAt(3)
      const apiNotifications = valueAt(4)
      const apiUsers = valueAt(5)
      const apiLogs = valueAt(6)

      const normalizedUsers = apiUsers.map(normalizeUserRecord)
      const normalizedSprints = apiSprints
        .map(normalizeSprintRecord)
        .sort((a, b) => a.numeroSprint - b.numeroSprint)

      setPedidos(apiPedidos.map(normalizePedidoRecord))
      setStories(apiStories.map((story) => ({
        id: story.codigoUs,
        backendId: story.idTarefa,
        title: story.titulo,
        description: story.descricao,
        acceptanceCriteria: typeof story.criteriosAceitacao === 'string'
          ? story.criteriosAceitacao.split('\n').map((line) => line.trim()).filter(Boolean)
          : [],
        target: story.sprint?.numeroSprint ? `Sprint ${story.sprint.numeroSprint}` : 'Backlog do produto',
        sprint: story.idSprint ? `sprint-${story.sprint?.numeroSprint || story.idSprint}` : null,
        sprintId: story.idSprint || null,
        status: STORY_STATUS[story.estadoTecnico] || 'todo',
        backendStatus: story.estadoTecnico,
        priority: deriveStoryPriority(story),
        epic: deriveStoryEpic(story),
        points: story.storyPoints || null,
        effort: story.tempoRegistado || null,
        assignee: story.responsavel ? {
          name: story.responsavel.nome,
          initials: story.responsavel.nome.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          role: getRoleLabel(story.responsavel.papel),
        } : null,
        impediment: story.estadoTecnico === 'BLOQUEADO',
        linkedPedidoId: story.idPedido,
        pedidoCode: story.pedido?.idPedido,
        releaseId: story.idRelease,
        createdAt: story.dataCriacao,
      })))
      setSprints(normalizedSprints)
      setRoadmap(apiRoadmap)
      setNotifications(apiNotifications.map((notification) => {
        const { category, type } = mapNotificationCategoryAndType(notification.tipo)
        return {
          id: notification.idNotificacao,
          title: notification.tipo,
          description: notification.mensagem,
          category,
          type,
          read: notification.lida,
          createdAt: notification.dataCriacao,
          timeGroup: computeNotificationTimeGroup(notification.dataCriacao),
          timestamp: notification.dataCriacao
            ? new Date(notification.dataCriacao).toLocaleDateString('pt-PT')
            : 'Agora',
          refCode: notification.idPedido || 'GIRO',
          assignee: notification.utilizador?.nome || 'Equipa',
          author: notification.utilizador ? { name: notification.utilizador.nome, initials: notification.utilizador.nome.slice(0, 2).toUpperCase() } : null,
        }
      }))
      setUsers(normalizedUsers)
      setLogs(canReadInternal ? apiLogs.map((entry) => normalizeLogRecord(entry, normalizedUsers)) : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [currentUserRole])

  useEffect(() => {
    queueMicrotask(() => reload())
  }, [currentUser, reload])

  const findSimilarPedidos = useCallback(async (query) => {
    const q = String(query || '').trim()
    if (q.length < 3) return []

    if (getToken()) {
      try {
        const res = await apiRequest(`/pedidos/semelhantes?q=${encodeURIComponent(q)}`)
        const list = Array.isArray(res) ? res : res?.items || res?.results || res?.pedidos || []
        return list.map((item) => ({
          ...normalizePedidoRecord(item),
          similarity: item.similarity ?? item.score ?? null,
        }))
      } catch {
        // Fallback para pesquisa local por trigramas caso a rota não esteja disponível
      }
    }

    return pedidos
      .map((pedido) => ({
        ...pedido,
        similarity: computeSimilarityScore(q, `${pedido.title} ${pedido.description} ${(pedido.tags || []).join(' ')}`),
      }))
      .filter((item) => item.similarity >= 0.22)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
  }, [pedidos])

  const toggleVote = useCallback(async (pedidoId) => {
    if (getToken()) {
      const result = await apiRequest(`/pedidos/${pedidoId}/votos`, { method: 'POST' })
      await reload()
      return result
    }

    const voterId = currentUser?.id || 'usr-local'
    let votedState = false
    setPedidos((prev) =>
      prev.map((pedido) => {
        if (pedido.id !== pedidoId) return pedido
        const currentVotes = Array.isArray(pedido.votedBy) ? pedido.votedBy : []
        const alreadyVoted = currentVotes.includes(voterId)
        votedState = !alreadyVoted
        const nextVotedBy = alreadyVoted
          ? currentVotes.filter((id) => id !== voterId)
          : [...currentVotes, voterId]
        const nextCount = alreadyVoted
          ? Math.max(0, (pedido.voteCount || 0) - 1)
          : (pedido.voteCount || 0) + 1
        return { ...pedido, votedBy: nextVotedBy, voteCount: nextCount }
      })
    )
    appendDemoLog(votedState ? 'VOTO_REGISTADO' : 'VOTO_REMOVIDO', `Pedido/${pedidoId}`, { voterId })
    return { voted: votedState }
  }, [appendDemoLog, currentUser?.id, reload])

  const addPedido = useCallback(async (data) => {
    if (getToken()) {
      const pedido = await apiRequest('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: data.title,
          descricao: data.description,
          categoria: data.category,
          tags: data.tags,
        }),
      })
      await reload()
      return pedido
    }

    const newId = `PED-${String(pedidos.length + 1).padStart(2, '0')}`
    const created = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category || 'NOVA_FUNCIONALIDADE',
      status: 'pending',
      backendStatus: 'SUBMETIDO',
      effort: null,
      impact: null,
      voteCount: 1,
      votedBy: [currentUser?.id || 'usr-local'],
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: new Date().toISOString(),
      author: {
        name: currentUser?.name || 'Utilizador',
        role: getRoleCode(currentUser?.role),
        avatar: currentUser?.initials || 'US',
      },
      linkedStoryId: null,
      aiRecommendation: null,
      aiConfidence: null,
      comments: [],
      history: [],
    }
    setPedidos((prev) => [created, ...prev])
    appendDemoLog('PEDIDO_CRIADO', `Pedido/${newId}`, { categoria: created.category })
    return created
  }, [appendDemoLog, currentUser, pedidos.length, reload])

  const updatePedidoStatus = useCallback(async (pedidoId, status) => {
    const backendEstado = BACKEND_PEDIDO_STATUS[status] || 'SUBMETIDO'
    if (getToken()) {
      await apiRequest(`/pedidos/${pedidoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: backendEstado }),
      })
      await reload()
      return
    }

    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId
          ? { ...pedido, status, backendStatus: backendEstado }
          : pedido
      )
    )
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Estado atualizado em ${pedidoId}`,
        description: `${currentUser?.name || 'Equipa'} alterou o estado de ${pedidoId} para ${backendEstado}.`,
        category: 'decisoes',
        read: false,
        createdAt: new Date().toISOString(),
        timeGroup: 'HOJE',
        timestamp: 'Agora',
        refCode: pedidoId,
        assignee: currentUser?.name || 'Equipa',
        author: { name: currentUser?.name || 'Equipa', initials: currentUser?.initials || 'EQ' },
      },
      ...prev,
    ])
    appendDemoLog('ALTERACAO_ESTADO', `Pedido/${pedidoId}`, { estado: backendEstado })
  }, [appendDemoLog, currentUser, reload])

  const deletePedido = useCallback(async (pedidoId) => {
    if (getToken()) {
      await apiRequest(`/pedidos/${pedidoId}`, { method: 'DELETE' })
      await reload()
      return
    }

    const target = pedidos.find((p) => p.id === pedidoId)
    if (!target) throw new Error('Pedido não encontrado.')
    if (['approved', 'planned', 'development', 'complete'].includes(target.status)) {
      throw new Error('Pedidos aprovados ou em execução não podem ser eliminados.')
    }
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId))
    appendDemoLog('PEDIDO_ELIMINADO', `Pedido/${pedidoId}`)
  }, [appendDemoLog, pedidos, reload])

  const addComment = useCallback(async (pedidoId, content) => {
    const trimmed = String(content || '').trim()
    if (!trimmed) {
      throw new Error('O comentário não pode estar vazio.')
    }

    if (getToken()) {
      const created = await apiRequest(`/pedidos/${pedidoId}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ conteudo: trimmed }),
      })
      await reload()
      return normalizeCommentRecord(created)
    }

    const newComment = {
      id: `cmt-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      authorName: currentUser?.name || 'Utilizador',
      authorRole: getRoleCode(currentUser?.role),
    }
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId
          ? { ...pedido, comments: [...(pedido.comments || []), newComment] }
          : pedido
      )
    )
    appendDemoLog('COMENTARIO_CRIADO', `Pedido/${pedidoId}`)
    return newComment
  }, [appendDemoLog, currentUser, reload])

  const requestAiPrioritization = useCallback(async (pedidoId) => {
    const targetPedido = pedidos.find((p) => p.id === pedidoId)
    const fallbackHeuristic = computeLocalHeuristicPrioritization(targetPedido)

    if (getToken()) {
      try {
        const result = await apiRequest(`/pedidos/${pedidoId}/ia-priorizacao`, {
          method: 'POST',
        })
        if (result?.available === false) {
          return {
            available: false,
            fallback: true,
            message: result.message || 'Serviço de IA indisponível no momento. Pode continuar a triagem manual.',
            ...fallbackHeuristic,
          }
        }

        const impact = result?.impactoNegocio ?? result?.impact ?? fallbackHeuristic.impact
        const effort = result?.esforcoEstimado ?? result?.effort ?? fallbackHeuristic.effort
        const recommendation = result?.recomendacao || result?.recommendation || fallbackHeuristic.recommendation
        const confidence = result?.confianca || result?.confidence || 'Sugestão Gemini AI (PII sanitizado)'

        setPedidos((prev) =>
          prev.map((pedido) =>
            pedido.id === pedidoId
              ? {
                  ...pedido,
                  impact,
                  effort,
                  aiRecommendation: recommendation,
                  aiConfidence: confidence,
                }
              : pedido
          )
        )
        return {
          available: true,
          piiSanitized: true,
          impact,
          effort,
          recommendation,
          confidence,
          quadrant: result?.quadrante || fallbackHeuristic.quadrant,
        }
      } catch (aiError) {
        return {
          available: false,
          fallback: true,
          message: aiError?.message || 'Serviço de IA temporariamente indisponível. Contingência manual ativa.',
          ...fallbackHeuristic,
        }
      }
    }

    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId
          ? {
              ...pedido,
              impact: fallbackHeuristic.impact,
              effort: fallbackHeuristic.effort,
              aiRecommendation: fallbackHeuristic.recommendation,
              aiConfidence: fallbackHeuristic.confidence,
            }
          : pedido
      )
    )
    appendDemoLog('PRIORIZACAO_IA', `Pedido/${pedidoId}`, {
      piiSanitized: true,
      quadrante: fallbackHeuristic.quadrant,
    })

    return {
      available: true,
      ...fallbackHeuristic,
    }
  }, [appendDemoLog, pedidos])

  const updateUserRoleOrStatus = useCallback(async (userId, payload) => {
    const body = {}
    if (payload.papel !== undefined || payload.role !== undefined) {
      body.papel = getRoleCode(payload.papel ?? payload.role)
    }
    if (payload.ativo !== undefined || payload.active !== undefined) {
      body.ativo = Boolean(payload.ativo ?? payload.active)
    }

    if (getToken()) {
      const updated = await apiRequest(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await reload()
      return normalizeUserRecord(updated)
    }

    if (currentUser?.role !== ROLES.ADMIN && currentUser?.roleCode !== ROLE_CODES.ADMIN) {
      throw new Error('Permissão insuficiente (HTTP 403): apenas o Administrador do Sistema pode alterar papéis ou estado de conta.')
    }

    let updatedUser = null
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user
        const nextRoleCode = body.papel || user.roleCode
        const nextRoleKey = normalizeRoleKey(nextRoleCode)
        updatedUser = {
          ...user,
          role: nextRoleKey,
          roleCode: nextRoleCode,
          active: body.ativo !== undefined ? body.ativo : user.active,
          scope: ROLE_SCOPE_MAP[nextRoleKey] || user.scope,
        }
        return updatedUser
      })
    )
    appendDemoLog('ATUALIZACAO_PERMISSOES', `Utilizador/${userId}`, body)
    return updatedUser
  }, [appendDemoLog, currentUser, reload])

  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.estado === 'ATIVO') || sprints.find((s) => s.estado === 'PLANEADO') || null
  }, [sprints])

  const activeSprintLabel = activeSprint?.numeroSprint ? `Sprint ${activeSprint.numeroSprint}` : 'Sem sprint ativo'
  const activeSprintCode = activeSprint?.numeroSprint ? `sprint-${activeSprint.numeroSprint}` : null
  const activeSprintDateRange = useMemo(
    () => (activeSprint ? formatSprintDateRange(activeSprint.dataInicio, activeSprint.dataFim) : 'Sem datas definidas'),
    [activeSprint]
  )

  const createSprint = useCallback(async (data) => {
    const payload = {
      numeroSprint: Number(data.numeroSprint),
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      ...(data.capacidadeMaxima ? { capacidadeMaxima: Number(data.capacidadeMaxima) } : {}),
      estado: data.estado || 'PLANEADO',
    }

    if (getToken()) {
      const created = await apiRequest('/sprints', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await reload()
      return normalizeSprintRecord(created)
    }

    if (sprints.some((s) => Number(s.numeroSprint) === payload.numeroSprint)) {
      throw new Error(`Já existe um Sprint com o número ${payload.numeroSprint}.`)
    }
    if (payload.estado === 'ATIVO' && sprints.some((s) => s.estado === 'ATIVO')) {
      throw new Error('Já existe um Sprint ativo. Conclua o Sprint atual antes de ativar outro.')
    }
    if (new Date(payload.dataFim) <= new Date(payload.dataInicio)) {
      throw new Error('A data de fim deve ser posterior à data de início.')
    }

    const created = normalizeSprintRecord({
      idSprint: `sprint-${payload.numeroSprint}-${Date.now()}`,
      ...payload,
    })
    setSprints((prev) => [...prev, created].sort((a, b) => a.numeroSprint - b.numeroSprint))
    appendDemoLog('SPRINT_CRIADO', `Sprint/${created.numeroSprint}`, payload)
    return created
  }, [appendDemoLog, reload, sprints])

  const updateSprint = useCallback(async (sprintId, updates) => {
    const payload = {
      ...(updates.numeroSprint !== undefined ? { numeroSprint: Number(updates.numeroSprint) } : {}),
      ...(updates.dataInicio !== undefined ? { dataInicio: updates.dataInicio } : {}),
      ...(updates.dataFim !== undefined ? { dataFim: updates.dataFim } : {}),
      ...(updates.capacidadeMaxima !== undefined
        ? { capacidadeMaxima: updates.capacidadeMaxima ? Number(updates.capacidadeMaxima) : null }
        : {}),
      ...(updates.estado !== undefined ? { estado: updates.estado } : {}),
      ...(updates.incompletePolicy !== undefined ? { incompletePolicy: updates.incompletePolicy } : {}),
      ...(updates.targetSprintId !== undefined ? { targetSprintId: updates.targetSprintId } : {}),
    }

    if (getToken()) {
      const updated = await apiRequest(`/sprints/${sprintId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      await reload()
      return normalizeSprintRecord(updated)
    }

    const existing = sprints.find((s) => s.idSprint === sprintId)
    if (!existing) throw new Error('Sprint não encontrado.')
    if (
      payload.numeroSprint !== undefined &&
      sprints.some((s) => s.idSprint !== sprintId && Number(s.numeroSprint) === payload.numeroSprint)
    ) {
      throw new Error(`Já existe outro Sprint com o número ${payload.numeroSprint}.`)
    }
    const effStart = new Date(payload.dataInicio ?? existing.dataInicio)
    const effEnd = new Date(payload.dataFim ?? existing.dataFim)
    if (effEnd <= effStart) {
      throw new Error('A data de fim deve ser posterior à data de início.')
    }
    if (
      payload.estado === 'ATIVO' &&
      existing.estado !== 'ATIVO' &&
      sprints.some((s) => s.idSprint !== sprintId && s.estado === 'ATIVO')
    ) {
      throw new Error('Já existe outro Sprint ativo. Conclua-o primeiro.')
    }

    const { incompletePolicy = 'BACKLOG', targetSprintId = null, ...sprintFields } = payload
    const updated = normalizeSprintRecord({ ...existing, ...sprintFields })

    setSprints((prev) =>
      prev.map((s) => (s.idSprint === sprintId ? updated : s)).sort((a, b) => a.numeroSprint - b.numeroSprint)
    )

    if (
      ['CONCLUIDO', 'CANCELADO'].includes(payload.estado) &&
      !['CONCLUIDO', 'CANCELADO'].includes(existing.estado)
    ) {
      const targetSp = targetSprintId ? sprints.find((s) => s.idSprint === targetSprintId) : null
      setStories((prev) =>
        prev.map((st) => {
          const belongsToClosed =
            st.sprintId === sprintId ||
            st.sprint === `sprint-${existing.numeroSprint}` ||
            st.target === `Sprint ${existing.numeroSprint}`
          if (!belongsToClosed || st.status === 'done' || st.backendStatus === 'CONCLUIDO') return st
          if (incompletePolicy === 'NEXT_SPRINT' && targetSp) {
            return {
              ...st,
              sprintId: targetSp.idSprint,
              sprint: `sprint-${targetSp.numeroSprint}`,
              target: `Sprint ${targetSp.numeroSprint}`,
              status: 'todo',
              backendStatus: 'TODO',
            }
          }
          return {
            ...st,
            sprintId: null,
            sprint: null,
            target: 'Backlog do produto',
            status: 'todo',
            backendStatus: 'BACKLOG',
          }
        })
      )
    }

    appendDemoLog(payload.estado === 'CONCLUIDO' ? 'SPRINT_CONCLUIDO' : 'SPRINT_ATUALIZADO', `Sprint/${updated.numeroSprint}`, payload)
    return updated
  }, [appendDemoLog, reload, sprints])

  const activateSprint = useCallback(async (sprintId) => {
    return updateSprint(sprintId, { estado: 'ATIVO' })
  }, [updateSprint])

  const completeSprint = useCallback(async (sprintId, options = {}) => {
    return updateSprint(sprintId, {
      estado: 'CONCLUIDO',
      incompletePolicy: options.incompletePolicy || 'BACKLOG',
      targetSprintId: options.targetSprintId || null,
    })
  }, [updateSprint])

  const deleteSprint = useCallback(async (sprintId) => {
    if (getToken()) {
      await apiRequest(`/sprints/${sprintId}`, { method: 'DELETE' })
      await reload()
      return
    }

    const existing = sprints.find((s) => s.idSprint === sprintId)
    if (!existing) throw new Error('Sprint não encontrado.')
    setSprints((prev) => prev.filter((s) => s.idSprint !== sprintId))
    setStories((prev) =>
      prev.map((st) => {
        const belongsToDeleted =
          st.sprintId === sprintId ||
          st.sprint === `sprint-${existing.numeroSprint}` ||
          st.target === `Sprint ${existing.numeroSprint}`
        if (!belongsToDeleted) return st
        return {
          ...st,
          sprintId: null,
          sprint: null,
          target: 'Backlog do produto',
          ...(st.status === 'done' ? {} : { status: 'todo', backendStatus: 'BACKLOG' }),
        }
      })
    )
    appendDemoLog('SPRINT_ELIMINADO', `Sprint/${existing.numeroSprint}`)
  }, [appendDemoLog, reload, sprints])

  const addStory = useCallback(async (data) => {
    if (getToken()) {
      if (!data.linkedPedidoId) throw new Error('Associe a User Story a um pedido aprovado.')
      const matchedSprint = sprints.find(
        (sp) => `Sprint ${sp.numeroSprint}` === data.target || `sprint-${sp.numeroSprint}` === data.sprint || sp.idSprint === data.sprint
      )
      const result = await apiRequest('/user-stories', {
        method: 'POST',
        body: JSON.stringify({
          codigoUs: data.code || `US${String(Date.now()).slice(-4)}`,
          titulo: data.title,
          descricao: data.description,
          criteriosAceitacao: Array.isArray(data.acceptanceCriteria)
            ? data.acceptanceCriteria.join('\n')
            : data.acceptanceCriteria || 'Critérios de aceitação validados pelo Product Owner.',
          storyPoints: data.points || undefined,
          idPedido: data.linkedPedidoId,
          idSprint: matchedSprint?.idSprint || undefined,
        }),
      })
      await reload()
      return result
    }

    const nextCode = data.code || `US-${46 + stories.length}`
    const targetLabel = data.target || 'Backlog do produto'
    const matchedSprint = sprints.find(
      (sp) =>
        `Sprint ${sp.numeroSprint}` === targetLabel ||
        `sprint-${sp.numeroSprint}` === data.sprint ||
        sp.idSprint === data.sprint
    ) || (targetLabel.startsWith('Sprint') ? activeSprint : null)
    const resolvedSprintCode = matchedSprint
      ? `sprint-${matchedSprint.numeroSprint}`
      : (targetLabel.startsWith('Sprint') ? activeSprintCode : null)
    const linkedPedido = pedidos.find((p) => p.id === data.linkedPedidoId)
    const derivedEpic = deriveStoryEpic({ pedido: linkedPedido ? { categoria: linkedPedido.category } : null })
    const newStory = {
      id: nextCode,
      backendId: `demo-${Date.now()}`,
      title: data.title,
      description: data.description,
      acceptanceCriteria: Array.isArray(data.acceptanceCriteria)
        ? data.acceptanceCriteria
        : String(data.acceptanceCriteria || 'Critérios de aceitação definidos pelo PO')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
      target: targetLabel,
      sprint: resolvedSprintCode,
      status: 'todo',
      backendStatus: resolvedSprintCode ? 'TODO' : 'BACKLOG',
      priority: data.priority || 'Média',
      points: data.points || 3,
      effort: 0,
      assignee: data.assignee || null,
      impediment: false,
      linkedPedidoId: data.linkedPedidoId || null,
      pedidoCode: data.linkedPedidoId || null,
      epic: derivedEpic,
    }
    setStories((prev) => [newStory, ...prev])
    if (data.linkedPedidoId) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === data.linkedPedidoId ? { ...p, linkedStoryId: nextCode } : p))
      )
    }
    appendDemoLog('USER_STORY_CRIADA', `UserStory/${nextCode}`, { linkedPedidoId: data.linkedPedidoId })
    return newStory
  }, [activeSprint, activeSprintCode, appendDemoLog, pedidos, reload, sprints, stories.length])

  const moveStory = useCallback(async (storyId, status) => {
    const story = stories.find((item) => item.id === storyId)
    if (!story) throw new Error('User Story não encontrada')

    const backendEstado = BACKEND_STORY_STATUS[status] || 'TODO'
    if (getToken()) {
      if (!story.backendId) throw new Error('User Story não encontrada')
      await apiRequest(`/user-stories/${story.backendId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoTecnico: backendEstado }),
      })
      await reload()
      return
    }

    setStories((prev) =>
      prev.map((item) =>
        item.id === storyId
          ? { ...item, status, backendStatus: backendEstado, impediment: status === 'blocked' ? item.impediment : false }
          : item
      )
    )
    appendDemoLog('TRANSICAO_KANBAN', `UserStory/${storyId}`, { estadoTecnico: backendEstado })
  }, [appendDemoLog, reload, stories])

  const updateStory = useCallback(async (storyId, data) => {
    const story = stories.find((item) => item.id === storyId)
    if (!story) throw new Error('User Story não encontrada')

    if (getToken()) {
      if (!story.backendId) throw new Error('User Story não encontrada')
      const payload = { ...data }
      if ('idSprint' in payload || 'target' in payload || 'sprint' in payload) {
        if ('idSprint' in payload) {
          delete payload.target
          delete payload.sprint
        } else {
          const matchedSprint = sprints.find(
            (sp) =>
              `Sprint ${sp.numeroSprint}` === payload.target ||
              `sprint-${sp.numeroSprint}` === payload.sprint ||
              sp.idSprint === payload.sprint
          )
          payload.idSprint = matchedSprint ? matchedSprint.idSprint : null
          delete payload.target
          delete payload.sprint
        }
      }
      await apiRequest(`/user-stories/${story.backendId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      await reload()
      return
    }

    const nextData = { ...data }
    if ('idSprint' in nextData) {
      const matched = nextData.idSprint ? sprints.find((sp) => sp.idSprint === nextData.idSprint) : null
      nextData.sprintId = matched ? matched.idSprint : null
      nextData.sprint = matched ? `sprint-${matched.numeroSprint}` : null
      nextData.target = matched ? `Sprint ${matched.numeroSprint}` : 'Backlog do produto'
      delete nextData.idSprint
    }

    setStories((prev) =>
      prev.map((item) => (item.id === storyId ? { ...item, ...nextData } : item))
    )
    appendDemoLog('USER_STORY_ATUALIZADA', `UserStory/${storyId}`, nextData)
  }, [appendDemoLog, reload, sprints, stories])

  const addMessage = useCallback((channelId, content) => {
    const trimmed = String(content || '').trim()
    if (!trimmed) {
      throw new Error('Escreva uma mensagem antes de enviar.')
    }
    const targetChannel = channelId || 'geral'
    const roleKey = currentUser?.role || ROLES.PRODUCT_OWNER
    const created = {
      id: `msg-${Date.now()}`,
      channelId: targetChannel,
      author: {
        name: currentUser?.name || 'Utilizador',
        initials: currentUser?.initials || 'US',
        role: roleKey,
        roleLabel: getRoleLabel(roleKey),
      },
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => {
      const next = {
        ...prev,
        [targetChannel]: [...(prev[targetChannel] || []), created],
      }
      try {
        sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })

    return created
  }, [currentUser])

  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (getToken()) {
      await apiRequest(`/notifications/${notificationId}`, { method: 'PATCH', body: JSON.stringify({ lida: true }) })
      await reload()
      return
    }
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    )
  }, [reload])

  const markAllNotificationsAsRead = useCallback(async () => {
    if (getToken()) {
      await Promise.all(
        notifications
          .filter((item) => !item.read)
          .map((item) => apiRequest(`/notifications/${item.id}`, { method: 'PATCH', body: JSON.stringify({ lida: true }) }))
      )
      await reload()
      return
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [notifications, reload])

  const unreadNotificationsCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const sprintStories = useMemo(() => stories.filter((story) => story.sprint), [stories])
  const backlogStories = useMemo(() => stories.filter((story) => !story.sprint), [stories])

  const visibleLogs = useMemo(() => {
    if (currentUser?.role === ROLES.CLIENT) return []
    return logs
  }, [currentUser?.role, logs])

  const derivedTraceability = useMemo(() => {
    if (!pedidos.length) return []
    return pedidos.map((pedido) => {
      const linkedStories = stories.filter(
        (story) => story.linkedPedidoId === pedido.id || story.id === pedido.linkedStoryId
      )
      const firstStory = linkedStories[0] || null
      const tests = linkedStories.flatMap((story) =>
        (story.acceptanceCriteria || []).map((_, idx) => ({
          id: `TC-${story.id}-${idx + 1}`,
          status: story.status === 'done' ? 'pass' : 'pending',
        }))
      )
      const status = linkedStories.length === 0
        ? 'untracked'
        : linkedStories.every((story) => story.status === 'done')
        ? 'tracked'
        : 'partially_tracked'

      return {
        id: pedido.id,
        code: firstStory?.id || 'SEM_USER_STORY',
        title: pedido.title,
        description: pedido.description,
        category: pedido.category,
        originPedido: pedido.id,
        status,
        stories: linkedStories.map((story) => ({ id: story.id, title: story.title })),
        tests,
        gitBranch: firstStory ? `feature/${firstStory.id.toLowerCase()}` : '—',
        commit: firstStory?.status === 'done' ? 'verified' : '—',
        criteria: linkedStories.flatMap((story) => story.acceptanceCriteria || []).join(' · ') || 'Ainda sem critérios de aceitação associados.',
        codeRefs: linkedStories.length
          ? [
              ...linkedStories.map(
                (story) => `${CATEGORY_CODE_REF[pedido.category] || 'Frontend/src/pages/SprintKanbanPage.jsx'} (${story.id})`
              ),
              ...(linkedStories.some((s) => s.status === 'done') ? ['Backend/src/services/domain.service.js'] : []),
            ]
          : [],
        coveragePercentage: status === 'tracked' ? 100 : status === 'partially_tracked' ? 60 : 0,
        notes: firstStory ? 'Ligação persistida entre pedido e User Story.' : 'Pedido ainda sem User Story associada.',
      }
    })
  }, [pedidos, stories])

  const effectiveTraceability = traceability.length ? traceability : derivedTraceability

  const value = {
    pedidos,
    stories,
    sprints,
    activeSprint,
    activeSprintLabel,
    activeSprintCode,
    activeSprintDateRange,
    roadmap,
    users,
    logs: visibleLogs,
    traceability: effectiveTraceability,
    workspaceConfig,
    updateWorkspaceConfig,
    channels,
    messages,
    notifications,
    loading,
    error,
    reload,
    sprintStories,
    backlogStories,
    unreadNotificationsCount,
    findSimilarPedidos,
    toggleVote,
    addPedido,
    updatePedidoStatus,
    deletePedido,
    addComment,
    requestAiPrioritization,
    updateUserRoleOrStatus,
    createSprint,
    updateSprint,
    activateSprint,
    completeSprint,
    deleteSprint,
    addStory,
    moveStory,
    updateStory,
    addMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setTraceability,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData deve ser utilizado dentro de um <DataProvider>')
  return context
}

export default DataContext
