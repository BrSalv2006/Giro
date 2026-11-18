/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext.jsx'
import { ROLES, ROLE_CODES, getRoleCode, getRoleLabel, normalizeRoleKey } from './authConstants.js'
import { apiRequest, getToken } from '../services/api.js'

const DataContext = createContext(null)

const SESSION_MESSAGES_KEY = 'giro_workspace_messages_v1'

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

const DEMO_USERS = [
  {
    id: 'usr-po-01',
    name: 'Sofia Costa',
    email: 'sofia.costa@giro.com',
    role: ROLES.PRODUCT_OWNER,
    roleCode: ROLE_CODES.PRODUCT_OWNER,
    active: true,
    scope: ROLE_SCOPE_MAP.PRODUCT_OWNER,
  },
  {
    id: 'usr-sm-01',
    name: 'Inês Martins',
    email: 'ines.martins@giro.com',
    role: ROLES.SCRUM_MASTER,
    roleCode: ROLE_CODES.SCRUM_MASTER,
    active: true,
    scope: ROLE_SCOPE_MAP.SCRUM_MASTER,
  },
  {
    id: 'usr-dev-01',
    name: 'Rafael Silva',
    email: 'rafael.silva@giro.com',
    role: ROLES.DEVELOPER,
    roleCode: ROLE_CODES.DEVELOPER,
    active: true,
    scope: ROLE_SCOPE_MAP.DEVELOPER,
  },
  {
    id: 'usr-cli-01',
    name: 'Miguel Alves',
    email: 'miguel.alves@cliente.com',
    role: ROLES.CLIENT,
    roleCode: ROLE_CODES.CLIENT,
    active: true,
    scope: ROLE_SCOPE_MAP.CLIENT,
  },
  {
    id: 'usr-adm-01',
    name: 'Diogo Ferreira',
    email: 'diogo.ferreira@giro.com',
    role: ROLES.ADMIN,
    roleCode: ROLE_CODES.ADMIN,
    active: true,
    scope: ROLE_SCOPE_MAP.ADMIN,
  },
]

const DEMO_PEDIDOS = [
  {
    id: 'PED-01',
    title: 'Filtros avançados por estado e categoria na listagem de pedidos',
    description: 'Permitir combinar filtros de categoria (Bug, Melhoria, Nova Funcionalidade) e estado de ciclo de vida com resposta rápida.',
    category: 'MELHORIA',
    status: 'development',
    backendStatus: 'EM_DESENVOLVIMENTO',
    effort: 3,
    impact: 9,
    voteCount: 24,
    votedBy: ['usr-po-01', 'usr-cli-01'],
    tags: ['ux', 'pesquisa', 'filtros'],
    createdAt: '2026-10-12T09:30:00Z',
    author: { name: 'Miguel Alves', role: 'P04', avatar: 'MA' },
    linkedStoryId: 'US-31',
    aiRecommendation: 'Quick Win recomendado para Sprint 12',
    aiConfidence: '92% confiança (PII sanitizado)',
    comments: [
      {
        id: 'cmt-01',
        content: 'Seria muito útil guardar o último filtro aplicado na sessão.',
        createdAt: '2026-10-13T11:15:00Z',
        authorName: 'Miguel Alves',
        authorRole: 'P04',
      },
      {
        id: 'cmt-02',
        content: 'Critérios validados e incluídos na US-31 para a Sprint 12.',
        createdAt: '2026-10-14T15:00:00Z',
        authorName: 'Sofia Costa',
        authorRole: 'P01',
      },
    ],
    history: [],
  },
  {
    id: 'PED-02',
    title: 'Exportação de relatórios e matriz de rastreabilidade em CSV e PDF',
    description: 'Disponibilizar exportação dos indicadores de Sprint e matriz RF/US/Testes para partilha em reuniões de revisão.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'complete',
    backendStatus: 'CONCLUIDO',
    effort: 2,
    impact: 8,
    voteCount: 19,
    votedBy: ['usr-po-01', 'usr-sm-01'],
    tags: ['relatorios', 'csv', 'pdf'],
    createdAt: '2026-10-08T14:20:00Z',
    author: { name: 'Inês Martins', role: 'P02', avatar: 'IM' },
    linkedStoryId: 'US-24',
    aiRecommendation: 'Alto retorno e baixo esforço (Quick Win)',
    aiConfidence: '95% confiança (PII sanitizado)',
    comments: [],
    history: [],
  },
  {
    id: 'PED-03',
    title: 'Garantir unicidade de voto por utilizador (RNF-SEG-03)',
    description: 'Assegurar que cada utilizador autenticado apenas consegue manter 1 voto ativo por pedido com alternância imediata.',
    category: 'MELHORIA',
    status: 'development',
    backendStatus: 'EM_DESENVOLVIMENTO',
    effort: 3,
    impact: 10,
    voteCount: 31,
    votedBy: ['usr-adm-01', 'usr-cli-01'],
    tags: ['seguranca', 'votacao', 'rnf-seg-03'],
    createdAt: '2026-10-10T10:00:00Z',
    author: { name: 'Diogo Ferreira', role: 'P05', avatar: 'DF' },
    linkedStoryId: 'US-42',
    aiRecommendation: 'Prioridade crítica de segurança',
    aiConfidence: '97% confiança (PII sanitizado)',
    comments: [],
    history: [],
  },
  {
    id: 'PED-04',
    title: 'Integração bidirecional de dependências acíclicas no Roadmap',
    description: 'Detetar automaticamente ciclos A -> B -> A no grafo de dependências entre User Stories antes da gravação.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'approved',
    backendStatus: 'APROVADO',
    effort: 5,
    impact: 9,
    voteCount: 15,
    votedBy: ['usr-sm-01'],
    tags: ['roadmap', 'dependencias'],
    createdAt: '2026-10-14T16:45:00Z',
    author: { name: 'Inês Martins', role: 'P02', avatar: 'IM' },
    linkedStoryId: 'US-45',
    aiRecommendation: 'Aposta estratégica para Q4',
    aiConfidence: '88% confiança (PII sanitizado)',
    comments: [],
    history: [],
  },
  {
    id: 'PED-05',
    title: 'Sugestão automática de pedidos semelhantes ao escrever o título',
    description: 'Pesquisa por trigramas em tempo real após 3 caracteres para evitar duplicados durante a submissão de novos pedidos.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'analysis',
    backendStatus: 'EM_ANALISE',
    effort: 2,
    impact: 8,
    voteCount: 14,
    votedBy: ['usr-cli-01'],
    tags: ['pesquisa', 'duplicados', 'trigramas'],
    createdAt: '2026-10-15T11:10:00Z',
    author: { name: 'Miguel Alves', role: 'P04', avatar: 'MA' },
    linkedStoryId: null,
    aiRecommendation: 'Quick Win sugerido para triagem',
    aiConfidence: '90% confiança (PII sanitizado)',
    comments: [],
    history: [],
  },
  {
    id: 'PED-06',
    title: 'Corrigir alinhamento de badges em ecrãs móveis de 375px',
    description: 'Algumas etiquetas de prioridade quebram linha de forma irregular em ecrãs compactos.',
    category: 'BUG',
    status: 'pending',
    backendStatus: 'SUBMETIDO',
    effort: 1,
    impact: 4,
    voteCount: 6,
    votedBy: [],
    tags: ['ui', 'responsivo'],
    createdAt: '2026-10-16T08:50:00Z',
    author: { name: 'Rafael Silva', role: 'P03', avatar: 'RS' },
    linkedStoryId: null,
    aiRecommendation: 'Tarefa de preenchimento de baixo esforço',
    aiConfidence: '84% confiança (PII sanitizado)',
    comments: [],
    history: [],
  },
]

const DEMO_SPRINTS = [
  {
    idSprint: 'sprint-12',
    numeroSprint: 12,
    dataInicio: '2026-10-12T00:00:00Z',
    dataFim: '2026-10-23T23:59:59Z',
    capacidadeMaxima: 28,
    estado: 'ATIVO',
  },
  {
    idSprint: 'sprint-13',
    numeroSprint: 13,
    dataInicio: '2026-10-26T00:00:00Z',
    dataFim: '2026-11-06T23:59:59Z',
    capacidadeMaxima: 28,
    estado: 'PLANEADO',
  },
]

const DEMO_STORIES = [
  {
    id: 'US-24',
    backendId: 'us-24-uuid',
    title: 'Exportar relatórios de Sprint e Rastreabilidade em CSV/PDF',
    description: 'Como Scrum Master, quero exportar indicadores e matriz de rastreabilidade, para partilhar progresso nas cerimónias.',
    acceptanceCriteria: [
      'Gerar ficheiro CSV com colunas RF, US, Pedido e Estado',
      'Apresentar confirmação visual imediata após exportação',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'done',
    backendStatus: 'CONCLUIDO',
    priority: 'Alta',
    points: 5,
    effort: 4,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Programador' },
    impediment: false,
    linkedPedidoId: 'PED-02',
    pedidoCode: 'PED-02',
    epic: 'EP03: Analítica & Exportação',
  },
  {
    id: 'US-31',
    backendId: 'us-31-uuid',
    title: 'Filtrar pedidos por categoria e estado de ciclo de vida',
    description: 'Como Product Owner, quero filtrar pedidos por categoria e estado, para acelerar a triagem do backlog.',
    acceptanceCriteria: [
      'Suportar seleção combinada de categoria e estado',
      'Atualizar contagem de resultados em menos de 200 ms',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'in_progress',
    backendStatus: 'EM_PROGRESSO',
    priority: 'Alta',
    points: 5,
    effort: 3,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Programador' },
    impediment: 'Aguardar validação final dos filtros de trigramas',
    linkedPedidoId: 'PED-01',
    pedidoCode: 'PED-01',
    epic: 'EP01: Gestão de Pedidos',
  },
  {
    id: 'US-42',
    backendId: 'us-42-uuid',
    title: 'Aplicar restrição de voto único por utilizador e pedido (RNF-SEG-03)',
    description: 'Como Administrador do Sistema, quero garantir unicidade de voto na BD e interface, para assegurar transparência na votação.',
    acceptanceCriteria: [
      'Restrição UNIQUE (id_utilizador, id_pedido) ativa',
      'Permitir alternar (adicionar/retirar) apenas o próprio voto',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'review',
    backendStatus: 'EM_REVISAO',
    priority: 'Urgente',
    points: 8,
    effort: 6,
    assignee: { name: 'Diogo Ferreira', initials: 'DF', role: 'Administrador do Sistema' },
    impediment: 'Revisão final de testes de concorrência pendente',
    linkedPedidoId: 'PED-03',
    pedidoCode: 'PED-03',
    epic: 'EP04: Segurança & RBAC',
  },
  {
    id: 'US-44',
    backendId: 'us-44-uuid',
    title: 'Workspace colaborativo da equipa com canais de Sprint',
    description: 'Como Programador, quero comunicar bloqueios e decisões por canal no workspace, para manter alinhamento com a equipa.',
    acceptanceCriteria: [
      'Canais #geral, #sprint-planning e #bloqueios ativos',
      'Visualizar carga de tarefas por membro da equipa',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'todo',
    backendStatus: 'TODO',
    priority: 'Média',
    points: 6,
    effort: 0,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    impediment: false,
    linkedPedidoId: 'PED-01',
    pedidoCode: 'PED-01',
    epic: 'EP02: Colaboração & Rituais',
  },
  {
    id: 'US-45',
    backendId: 'us-45-uuid',
    title: 'Validação acíclica de dependências entre User Stories no Roadmap',
    description: 'Como Scrum Master, quero impedir dependências circulares no Roadmap, para garantir planeamento consistente.',
    acceptanceCriteria: [
      'Detetar ciclos antes da persistência com erro HTTP 409',
      'Renderizar dependências no painel de release',
    ],
    target: 'Backlog do produto',
    sprint: null,
    status: 'todo',
    backendStatus: 'BACKLOG',
    priority: 'Alta',
    points: 5,
    effort: 0,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: false,
    linkedPedidoId: 'PED-04',
    pedidoCode: 'PED-04',
    epic: 'EP05: Roadmap & Releases',
  },
]

const DEMO_ROADMAP = [
  {
    idRelease: 'rel-2026-q3',
    tituloRelease: 'Release 2026.Q3',
    descricao: 'Fundação de pedidos, votação única e autenticação JWT',
    dataInicio: '2026-07-01T00:00:00Z',
    dataFim: '2026-09-30T23:59:59Z',
    marcoCritico: true,
    userStories: [
      { codigoUs: 'US-24', titulo: 'Exportação CSV/PDF', estadoTecnico: 'CONCLUIDO' },
    ],
  },
  {
    idRelease: 'rel-2026-q4',
    tituloRelease: 'Release 2026.Q4',
    descricao: 'Priorização assistida por IA, Sprint Kanban e Matriz de Rastreabilidade',
    dataInicio: '2026-10-01T00:00:00Z',
    dataFim: '2026-12-20T23:59:59Z',
    marcoCritico: true,
    userStories: [
      { codigoUs: 'US-31', titulo: 'Filtros avançados de pedidos', estadoTecnico: 'EM_PROGRESSO' },
      { codigoUs: 'US-42', titulo: 'Unicidade de voto RNF-SEG-03', estadoTecnico: 'EM_REVISAO' },
      { codigoUs: 'US-44', titulo: 'Team Workspace colaborativo', estadoTecnico: 'TODO' },
    ],
  },
  {
    idRelease: 'rel-2027-q1',
    tituloRelease: 'Release 2027.Q1',
    descricao: 'Automação de dependências no Roadmap e integrações externas',
    dataInicio: '2027-01-05T00:00:00Z',
    dataFim: '2027-03-31T23:59:59Z',
    marcoCritico: false,
    userStories: [
      { codigoUs: 'US-45', titulo: 'Validação acíclica de dependências', estadoTecnico: 'BACKLOG' },
    ],
  },
]

const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-01',
    title: 'Atualização de estado em PED-01',
    description: 'Sofia Costa aprovou PED-01 e associou à User Story US-31 no Sprint 12.',
    category: 'decisoes',
    read: false,
    createdAt: '2026-10-16T10:15:00Z',
    timeGroup: 'HOJE',
    timestamp: 'Há 25 min',
    refCode: 'PED-01 · US-31',
    assignee: 'Rafael Silva',
    storyId: 'US-31',
    author: { name: 'Sofia Costa', initials: 'SC' },
  },
  {
    id: 'notif-02',
    title: 'Bloqueio assinalado em US-42',
    description: 'Diogo Ferreira sinalizou revisão pendente de testes de concorrência para RNF-SEG-03.',
    category: 'bloqueios',
    read: false,
    createdAt: '2026-10-16T09:05:00Z',
    timeGroup: 'HOJE',
    timestamp: 'Há 1h',
    refCode: 'US-42 · RNF-SEG-03',
    assignee: 'Diogo Ferreira',
    storyId: 'US-42',
    author: { name: 'Diogo Ferreira', initials: 'DF' },
  },
  {
    id: 'notif-03',
    title: 'Menção no canal #sprint-planning',
    description: 'Inês Martins mencionou Rafael Silva para confirmar capacidade da Sprint 12.',
    category: 'mencoes',
    read: true,
    createdAt: '2026-10-15T17:30:00Z',
    timeGroup: 'ONTEM',
    timestamp: 'Ontem às 17:30',
    refCode: 'Sprint 12',
    assignee: 'Rafael Silva',
    storyId: 'US-44',
    author: { name: 'Inês Martins', initials: 'IM' },
  },
]

const DEMO_LOGS = [
  {
    id: 'log-01',
    action: 'ATUALIZACAO_PERMISSOES',
    resource: 'Utilizador/usr-dev-01',
    details: { papel: 'P03', label: 'Programador', ativo: true },
    timestamp: '2026-10-16T08:40:00Z',
    userId: 'usr-adm-01',
    userName: 'Diogo Ferreira',
    userRole: 'P05',
  },
  {
    id: 'log-02',
    action: 'ALTERACAO_ESTADO',
    resource: 'Pedido/PED-01',
    details: { de: 'APROVADO', para: 'EM_DESENVOLVIMENTO' },
    timestamp: '2026-10-16T09:20:00Z',
    userId: 'usr-po-01',
    userName: 'Sofia Costa',
    userRole: 'P01',
  },
  {
    id: 'log-03',
    action: 'PRIORIZACAO_IA',
    resource: 'Pedido/PED-05',
    details: { piiSanitized: true, quadrante: 'quick_wins' },
    timestamp: '2026-10-16T10:05:00Z',
    userId: 'usr-po-01',
    userName: 'Sofia Costa',
    userRole: 'P01',
  },
]

const DEMO_CHANNELS = [
  {
    id: 'geral',
    name: 'geral',
    description: 'Alinhamento diário da equipa GIRO, avisos gerais e decisões de produto.',
    unread: 0,
  },
  {
    id: 'sprint-planning',
    name: 'sprint-planning',
    description: 'Planeamento do Sprint 12, estimativas em Story Points e capacidade da equipa.',
    unread: 1,
  },
  {
    id: 'bloqueios',
    name: 'bloqueios',
    description: 'Registo rápido de impedimentos técnicos e acompanhamento pelo Scrum Master.',
    unread: 1,
  },
]

const DEMO_MESSAGES = {
  geral: [
    {
      id: 'msg-01',
      channelId: 'geral',
      author: { name: 'Sofia Costa', initials: 'SC', role: ROLES.PRODUCT_OWNER, roleLabel: 'Product Owner' },
      content: 'Bom dia equipa! Os pedidos mais votados da semana foram triados na Matriz 2x2.',
      createdAt: '2026-10-16T09:00:00Z',
    },
    {
      id: 'msg-02',
      channelId: 'geral',
      author: { name: 'Rafael Silva', initials: 'RS', role: ROLES.DEVELOPER, roleLabel: 'Programador' },
      content: 'Excelente! Já estou a finalizar os filtros avançados da US-31 antes da Daily.',
      createdAt: '2026-10-16T09:12:00Z',
    },
  ],
  'sprint-planning': [
    {
      id: 'msg-03',
      channelId: 'sprint-planning',
      author: { name: 'Inês Martins', initials: 'IM', role: ROLES.SCRUM_MASTER, roleLabel: 'Scrum Master' },
      content: 'Sprint 12 está com 24 de 28 Story Points comprometidos. Mantemos margem de segurança para bugs.',
      createdAt: '2026-10-15T16:40:00Z',
    },
  ],
  bloqueios: [
    {
      id: 'msg-04',
      channelId: 'bloqueios',
      author: { name: 'Diogo Ferreira', initials: 'DF', role: ROLES.ADMIN, roleLabel: 'Administrador do Sistema' },
      content: 'US-42 aguarda revisão final dos testes de concorrência para unicidade de voto (RNF-SEG-03).',
      createdAt: '2026-10-16T08:55:00Z',
    },
  ],
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
  return DEMO_MESSAGES
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

export function DataProvider({ children }) {
  const { currentUser } = useAuth()
  const hasToken = Boolean(getToken())
  const dataSourceRef = useRef(hasToken ? 'api' : 'demo')

  const [pedidos, setPedidos] = useState(() => (hasToken ? [] : DEMO_PEDIDOS))
  const [stories, setStories] = useState(() => (hasToken ? [] : DEMO_STORIES))
  const [sprints, setSprints] = useState(() => (hasToken ? [] : DEMO_SPRINTS))
  const [roadmap, setRoadmap] = useState(() => (hasToken ? [] : DEMO_ROADMAP))
  const [notifications, setNotifications] = useState(() => (hasToken ? [] : DEMO_NOTIFICATIONS))
  const [users, setUsers] = useState(() => (hasToken ? [] : DEMO_USERS))
  const [logs, setLogs] = useState(() => (hasToken ? [] : DEMO_LOGS))
  const [traceability, setTraceability] = useState([])
  const [channels] = useState(DEMO_CHANNELS)
  const [messages, setMessages] = useState(loadInitialMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDemoData = useCallback(() => {
    dataSourceRef.current = 'demo'
    setPedidos(DEMO_PEDIDOS)
    setStories(DEMO_STORIES)
    setSprints(DEMO_SPRINTS)
    setRoadmap(DEMO_ROADMAP)
    setNotifications(DEMO_NOTIFICATIONS)
    setUsers(DEMO_USERS)
    setLogs(DEMO_LOGS)
    setError('')
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
      if (dataSourceRef.current === 'api') {
        loadDemoData()
      }
      return
    }
    dataSourceRef.current = 'api'
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
        priority: 'Média',
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
      setSprints(apiSprints)
      setRoadmap(apiRoadmap)
      setNotifications(apiNotifications.map((notification) => ({
        id: notification.idNotificacao,
        title: notification.tipo,
        description: notification.mensagem,
        category: notification.tipo?.toLowerCase() || 'decisoes',
        read: notification.lida,
        createdAt: notification.dataCriacao,
        timeGroup: 'RECENTES',
        timestamp: notification.dataCriacao
          ? new Date(notification.dataCriacao).toLocaleDateString('pt-PT')
          : 'Agora',
        refCode: notification.idPedido || 'GIRO',
        assignee: notification.utilizador?.nome || 'Equipa',
        author: notification.utilizador ? { name: notification.utilizador.nome, initials: notification.utilizador.nome.slice(0, 2).toUpperCase() } : null,
      })))
      setUsers(normalizedUsers)
      setLogs(canReadInternal ? apiLogs.map((entry) => normalizeLogRecord(entry, normalizedUsers)) : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [currentUserRole, loadDemoData])

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

    const voterId = currentUser?.id || 'usr-demo'
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
      votedBy: [currentUser?.id || 'usr-demo'],
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: new Date().toISOString(),
      author: {
        name: currentUser?.name || 'Utilizador Demo',
        role: getRoleCode(currentUser?.role),
        avatar: currentUser?.initials || 'UD',
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
      throw new Error('Pedidos aprovados ou em execução não podem ser eliminados (CA2.3).')
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

  const addStory = useCallback(async (data) => {
    if (getToken()) {
      if (!data.linkedPedidoId) throw new Error('Associe a User Story a um pedido aprovado.')
      const matchedSprint = sprints.find(
        (sp) => `Sprint ${sp.numeroSprint}` === data.target || sp.idSprint === data.sprint
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
    const isSprint12 = targetLabel === 'Sprint 12' || data.sprint === 'sprint-12'
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
      sprint: isSprint12 ? 'sprint-12' : null,
      status: 'todo',
      backendStatus: isSprint12 ? 'TODO' : 'BACKLOG',
      priority: data.priority || 'Média',
      points: data.points || 3,
      effort: 0,
      assignee: data.assignee || null,
      impediment: false,
      linkedPedidoId: data.linkedPedidoId || null,
      pedidoCode: data.linkedPedidoId || null,
      epic: 'EP02: Backlog & IA',
    }
    setStories((prev) => [newStory, ...prev])
    if (data.linkedPedidoId) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === data.linkedPedidoId ? { ...p, linkedStoryId: nextCode } : p))
      )
    }
    appendDemoLog('USER_STORY_CRIADA', `UserStory/${nextCode}`, { linkedPedidoId: data.linkedPedidoId })
    return newStory
  }, [appendDemoLog, reload, sprints, stories.length])

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
      if ('target' in payload || 'sprint' in payload) {
        const matchedSprint = sprints.find(
          (sp) => `Sprint ${sp.numeroSprint}` === payload.target || `sprint-${sp.numeroSprint}` === payload.sprint
        )
        payload.idSprint = matchedSprint ? matchedSprint.idSprint : null
        delete payload.target
        delete payload.sprint
      }
      await apiRequest(`/user-stories/${story.backendId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      await reload()
      return
    }

    setStories((prev) =>
      prev.map((item) => (item.id === storyId ? { ...item, ...data } : item))
    )
    appendDemoLog('USER_STORY_ATUALIZADA', `UserStory/${storyId}`, data)
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
        name: currentUser?.name || 'Sofia Costa',
        initials: currentUser?.initials || 'SC',
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
        codeRefs: firstStory ? [`src/pages/SprintKanbanPage.jsx (${firstStory.id})`] : [],
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
    roadmap,
    users,
    logs: visibleLogs,
    traceability: effectiveTraceability,
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
