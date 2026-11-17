/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext.jsx'

const DataContext = createContext(null)

// 1. Seed Inicial de Pedidos (10 itens com estados, categorias e votos alinhados ao Figma)
const INITIAL_PEDIDOS = [
  {
    id: 'PED-01',
    title: 'Filtro avançado por tags e prioridade na listagem de pedidos',
    description: 'Permitir aos Product Owners e stakeholders filtrar pedidos combinando múltiplas etiquetas e faixas de votação para agilizar a triagem do backlog.',
    category: 'MELHORIA',
    status: 'analysis', // Em análise
    voteCount: 24,
    votedBy: ['usr-po-01', 'usr-dev-01', 'usr-cli-01'], // Sofia Costa já votou
    tags: ['filtros', 'ux', 'backlog'],
    createdAt: '2026-11-04T10:30:00Z',
    author: { name: 'Sofia Costa', role: 'Product Owner', avatar: 'SC' },
    linkedStoryId: 'US-31',
  },
  {
    id: 'PED-02',
    title: 'Exportação de relatórios de sprint em PDF e CSV com cabeçalho oficial',
    description: 'Possibilidade de gerar relatórios consolidados no fim de cada ciclo de sprint para partilhar com os clientes e diretores executivos.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'development', // Em desenvolvimento
    voteCount: 18,
    votedBy: ['usr-adm-01', 'usr-sm-01'],
    tags: ['relatorios', 'sprint', 'pdf'],
    createdAt: '2026-11-02T14:15:00Z',
    author: { name: 'Inês Martins', role: 'Scrum Master', avatar: 'IM' },
    linkedStoryId: 'US-24',
  },
  {
    id: 'PED-03',
    title: 'Notificações em tempo real para menções e decisões em comentários',
    description: 'Disparar alertas visuais imediatos quando um membro da equipa for mencionado via @nome numa discussão de requisito ou história.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'pending', // Por analisar
    voteCount: 35,
    votedBy: ['usr-po-01', 'usr-dev-01', 'usr-cli-01'], // Sofia Costa já votou
    tags: ['notificacoes', 'tempo-real', 'colaboracao'],
    createdAt: '2026-11-06T09:00:00Z',
    author: { name: 'Miguel Alves', role: 'Cliente', avatar: 'MA' },
    linkedStoryId: 'US-55',
  },
  {
    id: 'PED-04',
    title: 'Erro ao reordenar colunas e cards no quadro Kanban do Sprint',
    description: 'Quando dois cartões são arrastados em simultâneo ou em conexões lentas, a ordem do DOM entrava em conflito com o estado local.',
    category: 'BUG',
    status: 'complete', // Concluído
    voteCount: 12,
    votedBy: ['usr-dev-01'],
    tags: ['kanban', 'sprint', 'bug-corrigido'],
    createdAt: '2026-10-28T16:20:00Z',
    author: { name: 'Rafael Silva', role: 'Developer', avatar: 'RS' },
    linkedStoryId: null,
  },
  {
    id: 'PED-05',
    title: 'Integração bidirecional com repositórios GitHub e GitLab',
    description: 'Sincronizar commits e pull requests diretamente com as User Stories associadas para rastreabilidade de código automatizada.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'pending', // Por analisar
    voteCount: 41,
    votedBy: ['usr-cli-01', 'usr-dev-01', 'usr-adm-01'],
    tags: ['integracao', 'github', 'devops'],
    createdAt: '2026-11-07T11:45:00Z',
    author: { name: 'Diogo Ferreira', role: 'Administrador', avatar: 'DF' },
    linkedStoryId: null,
  },
  {
    id: 'PED-06',
    title: 'Modo escuro (Dark Mode) acessível em toda a plataforma Giro',
    description: 'Adicionar alternador de tema claro/escuro com contraste adequado conforme as diretrizes WCAG 2.1 AA.',
    category: 'MELHORIA',
    status: 'analysis', // Em análise
    voteCount: 29,
    votedBy: ['usr-po-01', 'usr-sm-01'], // Sofia Costa já votou
    tags: ['tema', 'acessibilidade', 'ui'],
    createdAt: '2026-11-05T08:15:00Z',
    author: { name: 'Sofia Costa', role: 'Product Owner', avatar: 'SC' },
    linkedStoryId: null,
  },
  {
    id: 'PED-07',
    title: 'Falha de validação de caracteres especiais no título da história',
    description: 'Símbolos como aspas duplas, cedilhas ou acentos estavam a ser codificados incorretamente no resumo do card.',
    category: 'BUG',
    status: 'development', // Em desenvolvimento
    voteCount: 7,
    votedBy: ['usr-dev-01'],
    tags: ['validacao', 'caracteres', 'bug'],
    createdAt: '2026-11-08T15:00:00Z',
    author: { name: 'Rafael Silva', role: 'Developer', avatar: 'RS' },
    linkedStoryId: null,
  },
  {
    id: 'PED-08',
    title: 'Adicionar estimativa de esforço com Story Points no modal de criação',
    description: 'Permitir selecionar a sequência de Fibonacci (1, 2, 3, 5, 8, 13) ao registar rapidamente novas histórias de utilizador.',
    category: 'MELHORIA',
    status: 'complete', // Concluído
    voteCount: 15,
    votedBy: ['usr-po-01', 'usr-sm-01', 'usr-dev-01'], // Sofia Costa já votou
    tags: ['backlog', 'story-points', 'agilidade'],
    createdAt: '2026-10-25T11:00:00Z',
    author: { name: 'Inês Martins', role: 'Scrum Master', avatar: 'IM' },
    linkedStoryId: null,
  },
  {
    id: 'PED-09',
    title: 'Módulo de auditoria de acessibilidade WCAG 2.1 AA automatizado',
    description: 'Executar scanner contínuo de contraste e tags aria-label em todas as vistas do produto.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'rejected', // Rejeitado
    voteCount: 9,
    votedBy: ['usr-cli-01'],
    tags: ['acessibilidade', 'auditoria'],
    createdAt: '2026-10-20T17:30:00Z',
    author: { name: 'Miguel Alves', role: 'Cliente', avatar: 'MA' },
    linkedStoryId: null,
  },
  {
    id: 'PED-10',
    title: 'Visualização de métricas de velocity e burndown chart por sprint',
    description: 'Gráfico interativo de queima de pontos de esforço e média de velocidade histórica da equipa de desenvolvimento.',
    category: 'NOVA_FUNCIONALIDADE',
    status: 'analysis', // Em análise
    voteCount: 33,
    votedBy: ['usr-po-01', 'usr-sm-01', 'usr-dev-01'], // Sofia Costa já votou
    tags: ['metricas', 'sprint', 'scrum', 'burndown'],
    createdAt: '2026-11-03T13:20:00Z',
    author: { name: 'Inês Martins', role: 'Scrum Master', avatar: 'IM' },
    linkedStoryId: 'US-48',
  },
]

// 2. Seed Inicial de User Stories (Sprint 12 + Backlog)
const INITIAL_STORIES = [
  {
    id: 'US-31',
    title: 'Filtrar pedidos por categoria e estado de análise',
    description: 'Como Product Owner, quero filtrar os pedidos por categoria e estado, para acelerar a triagem e priorização no backlog do produto.',
    acceptanceCriteria: [
      'Permitir selecionar múltiplos estados (Por analisar, Em análise, etc.)',
      'Filtrar instantaneamente sem recarregar a página',
      'Exibir contador de resultados ativos',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'in_progress', // todo | in_progress | review | done
    priority: 'Alta',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: null,
    linkedPedidoId: 'PED-01',
    createdAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 'US-42',
    title: 'Persistir votos únicos de utilizadores por pedido (RNF-SEG-03)',
    description: 'Como developer, quero restringir a votação a no máximo 1 voto por utilizador autenticado, para garantir a integridade da priorização.',
    acceptanceCriteria: [
      'Utilizador não pode votar duas vezes no mesmo pedido',
      'Clicar novamente no botão de voto remove o voto anterior (toggle)',
      'Contador reflete a contagem exata de utilizadores únicos',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'in_progress',
    priority: 'Urgente',
    points: 3,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: 'Bloqueado por aprovação técnica da migração de base de dados e índices únicos.',
    linkedPedidoId: null,
    createdAt: '2026-11-06T10:15:00Z',
  },
  {
    id: 'US-48',
    title: 'Visualizar burndown chart e progresso da Sprint 12',
    description: 'Como Scrum Master, quero acompanhar a evolução diária dos story points concluídos, para prever desvios na meta do ciclo.',
    acceptanceCriteria: [
      'Linha ideal vs. linha real de pontos restantes',
      'Indicação de dias restantes da sprint (3 dias)',
      'Cálculo da velocity projetada',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'review',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    impediment: null,
    linkedPedidoId: 'PED-10',
    createdAt: '2026-11-04T11:30:00Z',
  },
  {
    id: 'US-55',
    title: 'Sistema de notificações visuais para menções de equipa',
    description: 'Como utilizador, quero receber alerta com indicador vermelho no sino sempre que alguém me mencionar, para responder prontamente.',
    acceptanceCriteria: [
      'Badge vermelho no cabeçalho indicando total não lido',
      'Listagem com filtro por menções, decisões e bloqueios',
      'Ação de marcar todas como lidas com um clique',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'todo',
    priority: 'Média',
    points: 8,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: null,
    linkedPedidoId: 'PED-03',
    createdAt: '2026-11-07T14:00:00Z',
  },
  {
    id: 'US-24',
    title: 'Exportar pedidos e atas de sprint para documento PDF',
    description: 'Como utilizador, quero transferir a lista de pedidos aprovados para PDF formatado, para relatórios com stakeholders externos.',
    acceptanceCriteria: [
      'Geração direta no navegador',
      'Cabeçalho com logo do Giro e data de emissão',
      'Tabela com ID, título, autor e votos',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'done',
    priority: 'Baixa',
    points: 3,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    impediment: null,
    linkedPedidoId: 'PED-02',
    createdAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'US-60',
    title: 'Temporizador de inatividade de 60 minutos (RNF-SEG-01)',
    description: 'Como developer, quero desconectar automaticamente sessões inativas após 60 minutos de ausência, para cumprir os requisitos de segurança.',
    acceptanceCriteria: [
      'Reset do temporizador a cada movimento do rato ou tecla',
      'Aviso aos 55 minutos com opção de estender',
      'Redirecionamento para ecrã de sessão expirada aos 60m',
    ],
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'done',
    priority: 'Alta',
    points: 2,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: null,
    linkedPedidoId: null,
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'US-64',
    title: 'Roadmap visual trimestral com marcos de entrega',
    description: 'Como cliente, quero consultar a linha temporal com as fases planeadas, para saber quando as funcionalidades estarão em produção.',
    acceptanceCriteria: [
      'Visualização agrupada por trimestres (Q1, Q2, Q3, Q4)',
      'Indicadores de estado (Em curso, Planeado, Concluído)',
    ],
    target: 'Backlog do produto',
    sprint: null,
    status: 'todo',
    priority: 'Alta',
    points: 8,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: null,
    linkedPedidoId: null,
    createdAt: '2026-11-08T08:30:00Z',
  },
  {
    id: 'US-71',
    title: 'Associação direta de pedidos a novas user stories',
    description: 'Como PO, quero poder converter ou associar um pedido da comunidade a uma história no momento da sua criação.',
    acceptanceCriteria: [
      'Dropdown com pedidos elegíveis no modal de criação',
      'Link bidirecional exibido no detalhe da história',
    ],
    target: 'Backlog do produto',
    sprint: null,
    status: 'todo',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: null,
    linkedPedidoId: null,
    createdAt: '2026-11-09T11:00:00Z',
  },
]

// 3. Seed Inicial de Matriz de Rastreabilidade (5 requisitos: 2 tracked, 2 partially tracked, 1 untracked)
const INITIAL_TRACEABILITY = [
  {
    id: 'REQ-01',
    code: 'RNF-SEG-01',
    title: 'Autenticação e Expiração Automática de Sessão por Inatividade (60m)',
    category: 'Segurança',
    status: 'tracked', // tracked | partially_tracked | untracked
    stories: ['US-60'],
    tests: ['TC-01: Verificação de timeout de 60 minutos', 'TC-02: Reset em clique ou movimento'],
    codeRefs: ['src/context/AuthContext.jsx', 'src/components/layout/ProtectedRoute.jsx'],
    coveragePercentage: 100,
    notes: 'Totalmente implementado no AuthContext e protegido por listeners no AppLayout.',
  },
  {
    id: 'REQ-02',
    code: 'RNF-SEG-03',
    title: 'Garantia de Votação Única por Utilizador Autenticado em Pedidos',
    category: 'Integridade de Dados',
    status: 'tracked',
    stories: ['US-42'],
    tests: ['TC-03: Tentativa de voto duplo no mesmo pedido', 'TC-04: Remoção de voto existente'],
    codeRefs: ['src/context/DataContext.jsx', 'src/components/common/VoteCounter.jsx'],
    coveragePercentage: 100,
    notes: 'Validação de utilizador único com conjunto de IDs (votedBy) no DataContext.',
  },
  {
    id: 'REQ-03',
    code: 'RF-04',
    title: 'Filtragem Dinâmica e Priorização Multicritério do Backlog',
    category: 'Funcional',
    status: 'partially_tracked',
    stories: ['US-31'],
    tests: ['TC-05: Filtro por estado e categoria'],
    codeRefs: ['src/components/modals/NewFeatureModal.jsx'],
    coveragePercentage: 65,
    notes: 'Falta teste de carga automatizado com ordenação combinada por votos e pontuação.',
  },
  {
    id: 'REQ-04',
    code: 'RF-08',
    title: 'Notificações Imediatas de Menções, Decisões e Bloqueios Críticos',
    category: 'Comunicação',
    status: 'partially_tracked',
    stories: ['US-55'],
    tests: ['TC-06: Incremento de contagem não lida'],
    codeRefs: ['src/components/layout/GlobalHeader.jsx', 'src/components/common/NotificationItem.jsx'],
    coveragePercentage: 50,
    notes: 'Aguardar serviço de WebSockets para push notifications em tempo real no servidor.',
  },
  {
    id: 'REQ-05',
    code: 'RF-12',
    title: 'Exportação Consolidada de Relatórios e Sprints em Formato PDF e CSV',
    category: 'Relatórios',
    status: 'untracked',
    stories: [],
    tests: [],
    codeRefs: [],
    coveragePercentage: 0,
    notes: 'Requisito aprovado na ata de produto mas ainda sem histórias associadas na Sprint corrente.',
  },
]

// 4. Seed Inicial de Canais e Mensagens da Equipa
const INITIAL_CHANNELS = [
  { id: 'geral', name: 'geral', label: '#geral', description: 'Canal de anúncios e comunicação geral da equipa Giro' },
  { id: 'sprint-12', name: 'sprint-12', label: '#sprint-12', description: 'Acompanhamento do sprint corrente e alinhamento diário' },
  { id: 'bugs-alertas', name: 'bugs-alertas', label: '#bugs-alertas', description: 'Relato urgente de impedimentos e bugs em produção' },
  { id: 'decisoes-produto', name: 'decisoes-produto', label: '#decisoes-produto', description: 'Registo de decisões do PO e aprovação de requisitos' },
]

const INITIAL_MESSAGES = {
  'geral': [
    {
      id: 'msg-g-01',
      sender: { name: 'Diogo Ferreira', role: 'Administrador', initials: 'DF' },
      content: 'Bem-vindos à nova versão da plataforma Giro! O ambiente de testes com RBAC está ativo.',
      timestamp: 'Hoje às 09:15',
    },
    {
      id: 'msg-g-02',
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: 'Lembrem-se que a priorização dos pedidos para a Sprint 13 encerra esta sexta-feira.',
      timestamp: 'Hoje às 10:00',
    },
  ],
  'sprint-12': [
    {
      id: 'msg-s-01',
      sender: { name: 'Inês Martins', role: 'Scrum Master', initials: 'IM' },
      content: 'Daily standup concluído. Restam 3 dias de Sprint 12 e já temos 60% dos story points concluídos.',
      timestamp: 'Hoje às 10:45',
    },
    {
      id: 'msg-s-02',
      sender: { name: 'Rafael Silva', role: 'Developer', initials: 'RS' },
      content: 'A US-42 (Voto único RNF-SEG-03) está praticamente concluída, apenas aguardo validação final.',
      timestamp: 'Hoje às 11:20',
    },
  ],
  'bugs-alertas': [
    {
      id: 'msg-b-01',
      sender: { name: 'Rafael Silva', role: 'Developer', initials: 'RS' },
      content: 'Aviso: Identificado bloqueio externo temporário na API de testes. A US-42 tem dependência registada.',
      timestamp: 'Hoje às 11:05',
    },
  ],
  'decisoes-produto': [
    {
      id: 'msg-d-01',
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: 'Decisão oficial: O módulo de PDF e relatórios (RF-12) foi agendado para arranque na Sprint 13.',
      timestamp: 'Hoje às 09:40',
    },
  ],
}

// 5. Seed Inicial de Notificações (~8 realistas com estados lido/não-lido e categorias)
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-01',
    title: 'Sofia Costa mencionou-o na US-42',
    description: 'Por favor rever a regra de validação do RNF-SEG-03 para garantir que o utilizador não possa votar 2 vezes.',
    category: 'mencoes', // mencoes | decisoes | bloqueios
    read: false,
    timestamp: 'Há 12 minutos',
    createdAt: '2026-11-10T10:00:00Z',
    author: { name: 'Sofia Costa', initials: 'SC' },
  },
  {
    id: 'notif-02',
    title: 'Decisão de Produto aprovada para a Sprint 13',
    description: 'O pedido de exportação em PDF (PED-02) foi selecionado para ser convertido em história de utilizador.',
    category: 'decisoes',
    read: false,
    timestamp: 'Há 45 minutos',
    createdAt: '2026-11-10T09:30:00Z',
    author: { name: 'Sofia Costa', initials: 'SC' },
  },
  {
    id: 'notif-03',
    title: 'Bloqueio reportado na US-42 (Voto único)',
    description: 'Rafael Silva sinalizou um impedimento técnico: dependência da migração de índices de utilizadores.',
    category: 'bloqueios',
    read: false,
    timestamp: 'Há 1 hora',
    createdAt: '2026-11-10T09:15:00Z',
    author: { name: 'Rafael Silva', initials: 'RS' },
  },
  {
    id: 'notif-04',
    title: 'Novo pedido criado por Miguel Alves',
    description: '"Integração bidirecional com repositórios GitHub e GitLab" recebeu 41 votos da comunidade.',
    category: 'decisoes',
    read: true,
    timestamp: 'Há 3 horas',
    createdAt: '2026-11-10T07:15:00Z',
    author: { name: 'Miguel Alves', initials: 'MA' },
  },
  {
    id: 'notif-05',
    title: 'Rafael Silva respondeu ao seu alerta em #bugs-alertas',
    description: 'A correção para o conflito de arrastar e largar no Kanban da Sprint 12 já foi incorporada em produção.',
    category: 'mencoes',
    read: false,
    timestamp: 'Há 4 horas',
    createdAt: '2026-11-10T06:15:00Z',
    author: { name: 'Rafael Silva', initials: 'RS' },
  },
  {
    id: 'notif-06',
    title: 'Meta da Sprint 12: 65% concluída',
    description: 'Faltam 3 dias para o encerramento do ciclo. 18 de 26 Story Points já se encontram no estado Concluído.',
    category: 'decisoes',
    read: true,
    timestamp: 'Ontem',
    createdAt: '2026-11-09T17:00:00Z',
    author: { name: 'Inês Martins', initials: 'IM' },
  },
  {
    id: 'notif-07',
    title: 'Bloqueio resolvido na US-60',
    description: 'Acesso à infraestrutura de auditoria concedido. O temporizador de inatividade de 60m foi aprovado.',
    category: 'bloqueios',
    read: true,
    timestamp: 'Ontem',
    createdAt: '2026-11-09T14:20:00Z',
    author: { name: 'Diogo Ferreira', initials: 'DF' },
  },
  {
    id: 'notif-08',
    title: 'Inês Martins atualizou o estado da US-48',
    description: 'A história "Visualizar burndown chart e progresso" avançou para a coluna de Revisão Técnica.',
    category: 'decisoes',
    read: true,
    timestamp: 'Há 2 dias',
    createdAt: '2026-11-08T16:00:00Z',
    author: { name: 'Inês Martins', initials: 'IM' },
  },
]

export function DataProvider({ children }) {
  const { currentUser } = useAuth()

  const [pedidos, setPedidos] = useState(INITIAL_PEDIDOS)
  const [stories, setStories] = useState(INITIAL_STORIES)
  const [traceability, setTraceability] = useState(INITIAL_TRACEABILITY)
  const [channels] = useState(INITIAL_CHANNELS)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  // 1. Pedidos (Funcionalidades) e Regra RNF-SEG-03 de Votação Única
  const toggleVote = useCallback((pedidoId, explicitUserId = null) => {
    const userId = explicitUserId || currentUser?.id || 'usr-po-01'

    setPedidos((prevPedidos) =>
      prevPedidos.map((item) => {
        if (item.id !== pedidoId) return item

        const alreadyVoted = item.votedBy?.includes(userId)
        let nextVotedBy
        let nextVoteCount

        if (alreadyVoted) {
          // Remover voto (RNF-SEG-03: toggle unvote)
          nextVotedBy = item.votedBy.filter((uid) => uid !== userId)
          nextVoteCount = Math.max(0, item.voteCount - 1)
        } else {
          // Adicionar voto (RNF-SEG-03: no máximo 1 voto por utilizador)
          nextVotedBy = [...(item.votedBy || []), userId]
          nextVoteCount = item.voteCount + 1
        }

        return {
          ...item,
          voteCount: nextVoteCount,
          votedBy: nextVotedBy,
        }
      })
    )
  }, [currentUser])

  const addPedido = useCallback((newPedidoData) => {
    const creatorUser = currentUser || {
      name: 'Sofia Costa',
      role: 'Product Owner',
      initials: 'SC',
      id: 'usr-po-01',
    }

    setPedidos((prev) => {
      const nextNum = prev.length + 1
      const nextId = `PED-${String(nextNum).padStart(2, '0')}`

      const createdItem = {
        id: nextId,
        title: newPedidoData.title || 'Novo Pedido',
        description: newPedidoData.description || '',
        category: newPedidoData.category || 'NOVA_FUNCIONALIDADE',
        status: newPedidoData.status || 'pending', // padrão: Por analisar
        voteCount: 1, // criador já inicia com voto
        votedBy: [creatorUser.id],
        tags: Array.isArray(newPedidoData.tags)
          ? newPedidoData.tags
          : typeof newPedidoData.tags === 'string' && newPedidoData.tags.trim()
          ? newPedidoData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : ['geral'],
        createdAt: new Date().toISOString(),
        author: {
          name: creatorUser.name,
          role: creatorUser.role,
          avatar: creatorUser.initials || 'SC',
        },
        linkedStoryId: null,
      }

      return [createdItem, ...prev]
    })
  }, [currentUser])

  const updatePedidoStatus = useCallback((pedidoId, newStatus) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, status: newStatus } : p))
    )
  }, [])

  // 2. User Stories / Backlog / Sprint
  const addStory = useCallback((newStoryData) => {
    setStories((prev) => {
      const nextNum = prev.length + 1
      const nextId = `US-${String(nextNum + 30).padStart(2, '0')}`

      const createdStory = {
        id: nextId,
        title: newStoryData.title || 'Nova User Story',
        description: newStoryData.description || '',
        acceptanceCriteria: Array.isArray(newStoryData.acceptanceCriteria)
          ? newStoryData.acceptanceCriteria
          : typeof newStoryData.acceptanceCriteria === 'string'
          ? newStoryData.acceptanceCriteria.split('\n').map((l) => l.trim()).filter(Boolean)
          : [],
        target: newStoryData.target || 'Backlog do produto',
        sprint: newStoryData.target === 'Sprint 12' ? 'sprint-12' : null,
        status: newStoryData.status || 'todo',
        priority: newStoryData.priority || 'Média',
        points: typeof newStoryData.points === 'number'
          ? newStoryData.points
          : !isNaN(parseInt(newStoryData.points, 10))
          ? parseInt(newStoryData.points, 10)
          : 3,
        assignee: newStoryData.assignee || {
          name: currentUser?.name || 'Sofia Costa',
          initials: currentUser?.initials || 'SC',
          role: currentUser?.role || 'Product Owner',
        },
        impediment: newStoryData.impediment || null,
        linkedPedidoId: newStoryData.linkedPedidoId || null,
        createdAt: new Date().toISOString(),
      }

      return [createdStory, ...prev]
    })
  }, [currentUser])

  const moveStory = useCallback((storyId, newStatus) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, status: newStatus } : s))
    )
  }, [])

  const updateStory = useCallback((storyId, partialData) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, ...partialData } : s))
    )
  }, [])

  // 3. Canais e Mensagens de Equipa
  const addMessage = useCallback((channelId, messageContent) => {
    const sender = {
      name: currentUser?.name || 'Sofia Costa',
      role: currentUser?.role || 'Product Owner',
      initials: currentUser?.initials || 'SC',
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender,
      content: typeof messageContent === 'string' ? messageContent : messageContent.content,
      timestamp: 'Agora mesmo',
    }

    setMessages((prev) => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), newMessage],
    }))
  }, [currentUser])

  // 4. Notificações
  const markNotificationAsRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Contagem de notificações não lidas
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const value = {
    // Pedidos
    pedidos,
    addPedido,
    toggleVote,
    updatePedidoStatus,

    // Stories
    stories,
    sprintStories: stories.filter((s) => s.sprint === 'sprint-12'),
    backlogStories: stories.filter((s) => !s.sprint),
    addStory,
    moveStory,
    updateStory,

    // Rastreabilidade
    traceability,
    setTraceability,

    // Canais e Mensagens
    channels,
    messages,
    addMessage,

    // Notificações
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData deve ser utilizado dentro de um <DataProvider>')
  }
  return context
}

export default DataContext
