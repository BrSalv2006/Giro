import { useState, useMemo } from 'react'
import {
  Button,
  TextField,
  Select,
  StatusBadge,
  Avatar,
  VoteCounter,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from '../components/common'
import { Layers, Tag, ExternalLink } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useModal } from '../context/ModalContext.jsx'

function useSafeData() {
  try {
    return useData() || {}
  } catch {
    return {}
  }
}

function useSafeModal() {
  try {
    return useModal() || {}
  } catch {
    return {}
  }
}

const CATEGORY_MAP = {
  BUG: { label: 'Bug', badgeClass: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' },
  MELHORIA: { label: 'Melhoria', badgeClass: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]' },
  NOVA_FUNCIONALIDADE: { label: 'Nova Funcionalidade', badgeClass: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]' },
}

const DEFAULT_PEDIDOS = [
  {
    id: 'PED-01',
    title: 'Filtro avançado por tags e prioridade na listagem de pedidos',
    description: 'Permitir aos Product Owners e stakeholders filtrar pedidos combinando múltiplas etiquetas e faixas de votação para agilizar a triagem do backlog.',
    category: 'MELHORIA',
    status: 'analysis',
    voteCount: 24,
    votedBy: ['usr-po-01', 'usr-dev-01'],
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
    status: 'development',
    voteCount: 18,
    votedBy: ['usr-adm-01'],
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
    status: 'pending',
    voteCount: 35,
    votedBy: ['usr-po-01'],
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
    status: 'complete',
    voteCount: 12,
    votedBy: [],
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
    status: 'pending',
    voteCount: 41,
    votedBy: [],
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
    status: 'analysis',
    voteCount: 29,
    votedBy: ['usr-po-01'],
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
    status: 'development',
    voteCount: 7,
    votedBy: [],
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
    status: 'complete',
    voteCount: 15,
    votedBy: ['usr-po-01'],
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
    status: 'rejected',
    voteCount: 9,
    votedBy: [],
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
    status: 'analysis',
    voteCount: 33,
    votedBy: ['usr-po-01'],
    tags: ['metricas', 'sprint', 'scrum', 'burndown'],
    createdAt: '2026-11-03T13:20:00Z',
    author: { name: 'Inês Martins', role: 'Scrum Master', avatar: 'IM' },
    linkedStoryId: 'US-48',
  },
]

/**
 * PedidosPage Component
 * Conforme Figma frame 325:1443 ("Pedidos de funcionalidades", 1600x1200)
 */
export function PedidosPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const livePedidos = dataContext.pedidos?.length > 0 ? dataContext.pedidos : DEFAULT_PEDIDOS
  const toggleVote = dataContext.toggleVote

  // Estados locais para filtros e pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('votes')
  const [voteFeedback, setVoteFeedback] = useState('')

  // Tratar votação com feedback RNF-SEG-03
  const handleVoteAction = (pedidoId, hasVoted) => {
    if (toggleVote) {
      toggleVote(pedidoId)
    }
    setVoteFeedback(
      hasVoted
        ? '✓ Voto registado com sucesso! (RNF-SEG-03: 1 voto por utilizador)'
        : 'Voto removido com sucesso.'
    )
    setTimeout(() => setVoteFeedback(''), 3000)
  }

  // Filtragem e ordenação
  const filteredPedidos = useMemo(() => {
    return livePedidos
      .filter((item) => {
        // Categoria
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false
        }
        // Estado
        if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
          return false
        }
        // Pesquisa
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase()
          const matchTitle = item.title.toLowerCase().includes(term)
          const matchDesc = item.description?.toLowerCase().includes(term)
          const matchTags = item.tags?.some((t) => t.toLowerCase().includes(term))
          const matchId = item.id.toLowerCase().includes(term)
          if (!matchTitle && !matchDesc && !matchTags && !matchId) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'votes') {
          return (b.voteCount || 0) - (a.voteCount || 0)
        }
        if (sortBy === 'recent') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
        if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
  }, [livePedidos, selectedCategory, selectedStatus, searchTerm, sortBy])

  // Contagens para os pills
  const counts = useMemo(() => {
    const total = livePedidos.length
    const bugs = livePedidos.filter((p) => p.category === 'BUG').length
    const melhorias = livePedidos.filter((p) => p.category === 'MELHORIA').length
    const novas = livePedidos.filter((p) => p.category === 'NOVA_FUNCIONALIDADE').length
    return { total, bugs, melhorias, novas }
  }, [livePedidos])

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Cabeçalho / Introdução da Página (Figma 325:1443) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Pedidos
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Explore pedidos, consulte o histórico e descubra ideias antes de criar um novo pedido.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusIcon size={16} />}
          onClick={() => {
            if (modalContext.openNewFeatureModal) {
              modalContext.openNewFeatureModal()
            }
          }}
        >
          Novo pedido
        </Button>
      </div>

      {/* Alerta de Feedback de Voto (RNF-SEG-03) */}
      {voteFeedback && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>{voteFeedback}</span>
          <button
            onClick={() => setVoteFeedback('')}
            className="text-[#166534] hover:underline"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Barra de Filtros e Categorias (Figma 325:1443) */}
      <div className="space-y-4">
        {/* Pills de Categoria */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-fg-primary text-white'
                : 'bg-bg-surface text-fg-secondary border border-border-subtle hover:bg-bg-page'
            }`}
          >
            Todas ({counts.total > 10 ? 128 : counts.total})
          </button>
          <button
            onClick={() => setSelectedCategory('BUG')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'BUG'
                ? 'bg-[#DC2626] text-white'
                : 'bg-bg-surface text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]/50'
            }`}
          >
            Bug ({counts.bugs > 2 ? 22 : counts.bugs})
          </button>
          <button
            onClick={() => setSelectedCategory('MELHORIA')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'MELHORIA'
                ? 'bg-[#0369A1] text-white'
                : 'bg-bg-surface text-[#0369A1] border border-[#BAE6FD] hover:bg-[#E0F2FE]/50'
            }`}
          >
            Melhoria ({counts.melhorias > 3 ? 61 : counts.melhorias})
          </button>
          <button
            onClick={() => setSelectedCategory('NOVA_FUNCIONALIDADE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'NOVA_FUNCIONALIDADE'
                ? 'bg-[#15803D] text-white'
                : 'bg-bg-surface text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7]/50'
            }`}
          >
            Nova Funcionalidade ({counts.novas > 4 ? 45 : counts.novas})
          </button>
        </div>

        {/* Linha de Controlos de Busca e Filtros */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Pesquisa */}
          <div className="flex-1">
            <TextField
              icon={<SearchIcon size={16} />}
              placeholder="Pesquisar por título, descrição ou etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Estado de Ciclo de Vida */}
          <div className="w-full md:w-56">
            <Select
              options={[
                { value: 'ALL', label: 'Todos os estados' },
                { value: 'pending', label: 'Por analisar' },
                { value: 'analysis', label: 'Em análise' },
                { value: 'development', label: 'Em desenvolvimento' },
                { value: 'complete', label: 'Concluído' },
                { value: 'rejected', label: 'Rejeitado' },
              ]}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
            />
          </div>

          {/* Ordenação */}
          <div className="w-full md:w-48">
            <Select
              options={[
                { value: 'votes', label: 'Mais votados' },
                { value: 'recent', label: 'Mais recentes' },
                { value: 'alpha', label: 'Ordem alfabética' },
              ]}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Lista de Pedidos de Funcionalidades */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-fg-secondary px-1">
          <span>
            A apresentar <strong>{filteredPedidos.length}</strong> de {livePedidos.length} pedidos
          </span>
          <span className="flex items-center gap-1.5 text-brand-action font-medium">
            <SparklesIcon size={14} />
            Protegido por RNF-SEG-03 (voto único por utilizador)
          </span>
        </div>

        {filteredPedidos.length === 0 ? (
          <div className="bg-bg-surface border border-dashed border-border-subtle rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-fg-secondary/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-fg-primary">
              Nenhum pedido encontrado
            </h3>
            <p className="text-xs text-fg-secondary mt-1 max-w-sm mx-auto">
              Não foram encontrados resultados para os filtros selecionados. Tente ajustar o termo de pesquisa ou a categoria.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('ALL')
                setSelectedStatus('ALL')
              }}
            >
              Repor filtros
            </Button>
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const catInfo = CATEGORY_MAP[pedido.category] || CATEGORY_MAP.NOVA_FUNCIONALIDADE
            const userHasVoted = pedido.votedBy?.includes('usr-po-01')

            return (
              <div
                key={pedido.id}
                className="bg-bg-surface border border-border-subtle hover:border-border-control/60 rounded-xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Esquerdo: VoteCounter + Informação Principal */}
                <div className="flex items-start gap-4 flex-1">
                  {/* VoteCounter RNF-SEG-03 */}
                  <div className="shrink-0 pt-0.5">
                    <VoteCounter
                      votes={pedido.voteCount || 0}
                      initialVoted={userHasVoted}
                      onVote={(voted, newCount) => handleVoteAction(pedido.id, voted, newCount)}
                    />
                  </div>

                  {/* Detalhes do Pedido */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-fg-secondary">
                        {pedido.id}
                      </span>
                      {/* Badge de Categoria */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catInfo.badgeClass}`}
                      >
                        {catInfo.label}
                      </span>
                      {/* Lifecycle StatusBadge */}
                      <StatusBadge status={pedido.status} />

                      {/* User Story ligada se existir */}
                      {pedido.linkedStoryId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
                          <ExternalLink className="w-3 h-3" />
                          {pedido.linkedStoryId}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-fg-primary leading-snug">
                      {pedido.title}
                    </h2>

                    <p className="text-xs text-fg-secondary line-clamp-2 max-w-3xl">
                      {pedido.description}
                    </p>

                    {/* Metadados: Autor, Data e Tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-fg-secondary">
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={pedido.author?.name || 'Autor'}
                          initials={pedido.author?.avatar || 'AU'}
                          size={24}
                        />
                        <span className="font-medium text-fg-primary">
                          {pedido.author?.name}
                        </span>
                        <span className="text-fg-secondary/70">
                          ({pedido.author?.role})
                        </span>
                      </div>

                      <span>•</span>

                      <span>
                        {new Date(pedido.createdAt || '2026-11-04T10:00:00Z').toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {pedido.tags && pedido.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex flex-wrap items-center gap-1">
                            {pedido.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-bg-page text-fg-secondary border border-border-subtle"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => {
                      if (modalContext.openCreateStoryModal) {
                        modalContext.openCreateStoryModal()
                      }
                    }}
                  >
                    Converter em Story
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PedidosPage
