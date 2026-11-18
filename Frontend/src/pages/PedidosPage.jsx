import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { Layers, Tag, ExternalLink, MessageSquare, Send, Trash2 } from 'lucide-react'
import { useAuth, getRoleLabel } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useModal } from '../context/ModalContext.jsx'

function useSafeAuth() {
  try {
    return useAuth() || {}
  } catch {
    return {}
  }
}

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

const STATUS_SELECT_OPTIONS = [
  { value: 'pending', label: 'Por analisar' },
  { value: 'analysis', label: 'Em análise' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'planned', label: 'Planeado' },
  { value: 'development', label: 'Em desenvolvimento' },
  { value: 'complete', label: 'Concluído' },
  { value: 'rejected', label: 'Rejeitado' },
]

/**
 * PedidosPage Component
 * Conforme Figma frame 325:1443 ("Pedidos de funcionalidades", 1600x1200)
 */
export function PedidosPage() {
  const [searchParams] = useSearchParams()
  const authContext = useSafeAuth()
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const currentUser = authContext.currentUser
  const permissions = authContext.permissions || {}
  const livePedidos = useMemo(() => dataContext.pedidos || [], [dataContext.pedidos])
  const toggleVote = dataContext.toggleVote

  // Estados locais para filtros e pesquisa
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('votes')
  const [voteFeedback, setVoteFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [expandedPedidoId, setExpandedPedidoId] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentSubmittingId, setCommentSubmittingId] = useState(null)
  const [pedidoToDelete, setPedidoToDelete] = useState(null)

  const showNotice = (message) => {
    setFeedbackError('')
    setVoteFeedback(message)
    setTimeout(() => setVoteFeedback(''), 3500)
  }

  const showErrorNotice = (message) => {
    setVoteFeedback('')
    setFeedbackError(message)
    setTimeout(() => setFeedbackError(''), 4000)
  }

  const handleVoteAction = async (pedidoId, hasVoted) => {
    try {
      if (toggleVote) {
        await toggleVote(pedidoId)
      }
      showNotice(
        hasVoted
          ? '✓ Voto registado com sucesso! (1 voto por utilizador)'
          : 'Voto removido com sucesso.'
      )
    } catch (voteError) {
      showErrorNotice(voteError.message || 'Não foi possível registar o voto.')
    }
  }

  const handleSubmitComment = async (e, pedidoId) => {
    e.preventDefault()
    const draft = (commentDrafts[pedidoId] || '').trim()
    if (!draft) {
      showErrorNotice('Escreva um comentário antes de submeter.')
      return
    }
    setCommentSubmittingId(pedidoId)
    try {
      await dataContext.addComment?.(pedidoId, draft)
      setCommentDrafts((prev) => ({ ...prev, [pedidoId]: '' }))
      showNotice('✓ Comentário publicado com sucesso.')
    } catch (commentError) {
      showErrorNotice(commentError.message || 'Não foi possível publicar o comentário.')
    } finally {
      setCommentSubmittingId(null)
    }
  }

  const handleStatusChange = async (pedidoId, newStatus) => {
    try {
      await dataContext.updatePedidoStatus?.(pedidoId, newStatus)
      showNotice(`✓ Estado do pedido ${pedidoId} atualizado.`)
    } catch (statusError) {
      showErrorNotice(statusError.message || 'Não foi possível atualizar o estado do pedido.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!pedidoToDelete) return
    try {
      await dataContext.deletePedido?.(pedidoToDelete.id)
      showNotice(`Pedido ${pedidoToDelete.id} eliminado com sucesso.`)
      setPedidoToDelete(null)
    } catch (deleteError) {
      showErrorNotice(deleteError.message || 'Não foi possível eliminar o pedido.')
      setPedidoToDelete(null)
    }
  }

  // Filtragem e ordenação
  const filteredPedidos = useMemo(() => {
    return livePedidos
      .filter((item) => {
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false
        }
        if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
          return false
        }
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

      {/* Alertas de Feedback */}
      {voteFeedback && (
        <div role="status" className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>{voteFeedback}</span>
          <button
            type="button"
            onClick={() => setVoteFeedback('')}
            className="text-[#166534] hover:underline cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {feedbackError && (
        <div role="alert" className="p-3 bg-feedback-errorBg border border-feedback-errorBorder text-feedback-errorFg rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{feedbackError}</span>
          <button
            type="button"
            onClick={() => setFeedbackError('')}
            className="hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Barra de Filtros e Categorias (Figma 325:1443) */}
      <div className="space-y-4">
        {/* Pills de Categoria */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-fg-primary text-white'
                : 'bg-bg-surface text-fg-secondary border border-border-subtle hover:bg-bg-page'
            }`}
          >
            Todas ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('BUG')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'BUG'
                ? 'bg-[#DC2626] text-white'
                : 'bg-bg-surface text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]/50'
            }`}
          >
            Bug ({counts.bugs})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('MELHORIA')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'MELHORIA'
                ? 'bg-[#0369A1] text-white'
                : 'bg-bg-surface text-[#0369A1] border border-[#BAE6FD] hover:bg-[#E0F2FE]/50'
            }`}
          >
            Melhoria ({counts.melhorias})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('NOVA_FUNCIONALIDADE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'NOVA_FUNCIONALIDADE'
                ? 'bg-[#15803D] text-white'
                : 'bg-bg-surface text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7]/50'
            }`}
          >
            Nova Funcionalidade ({counts.novas})
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
                ...STATUS_SELECT_OPTIONS,
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
            Limite de 1 voto por utilizador em cada pedido
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
            const userHasVoted = Boolean(currentUser?.id && pedido.votedBy?.includes(currentUser.id))
            const isExpanded = expandedPedidoId === pedido.id
            const canDelete = pedido.status === 'pending' && (
              permissions.canManageUsers || pedido.author?.name === currentUser?.name
            )

            return (
              <div
                key={pedido.id}
                className="bg-bg-surface border border-border-subtle hover:border-border-control/60 rounded-xl p-5 shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Lado Esquerdo: VoteCounter + Informação Principal */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* VoteCounter RNF-SEG-03 */}
                    <div className="shrink-0 pt-0.5">
                      <VoteCounter
                        votes={pedido.voteCount || 0}
                        initialVoted={userHasVoted}
                        onVote={(voted) => handleVoteAction(pedido.id, voted)}
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
                          {pedido.author?.role && (
                            <span className="text-fg-secondary/80">
                              ({getRoleLabel(pedido.author.role)})
                            </span>
                          )}
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
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant="tertiary"
                      className="h-9 px-3 text-xs border border-border-subtle"
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => setExpandedPedidoId(isExpanded ? null : pedido.id)}
                    >
                      Comentários ({pedido.comments?.length || 0})
                    </Button>

                    {permissions.canManageBacklog && (
                      <Button
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        onClick={() => {
                          if (modalContext.openCreateStoryModal) {
                            modalContext.openCreateStoryModal()
                          }
                        }}
                      >
                        Converter em Story
                      </Button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setPedidoToDelete(pedido)}
                        className="p-2 rounded-lg text-fg-secondary hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                        title="Eliminar pedido pendente"
                        aria-label={`Eliminar pedido ${pedido.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Secção Expandida: Gestão de Estado + Comentários (CA3.2) */}
                {isExpanded && (
                  <div className="pt-4 border-t border-border-subtle space-y-4">
                    {permissions.canManageBacklog && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-bg-page border border-border-subtle">
                        <span className="text-xs font-semibold text-fg-primary">
                          Alterar estado do ciclo de vida (Product Owner / Gestão):
                        </span>
                        <div className="w-full sm:w-56">
                          <Select
                            options={STATUS_SELECT_OPTIONS}
                            value={pedido.status}
                            onChange={(val) => handleStatusChange(pedido.id, val)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-fg-secondary">
                        Comentários ({pedido.comments?.length || 0})
                      </h3>

                      {(!pedido.comments || pedido.comments.length === 0) ? (
                        <p className="text-xs text-fg-secondary italic bg-bg-page/60 p-3 rounded-lg border border-border-subtle">
                          Ainda não existem comentários neste pedido. Seja o primeiro a contribuir.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pedido.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-fg-secondary">
                                <span className="font-semibold text-fg-primary">
                                  {comment.authorName}
                                  {comment.authorRole ? ` · ${getRoleLabel(comment.authorRole)}` : ''}
                                </span>
                                <span>
                                  {new Date(comment.createdAt).toLocaleString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-fg-primary leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleSubmitComment(e, pedido.id)}
                        className="flex flex-col sm:flex-row gap-2 pt-1"
                      >
                        <div className="flex-1">
                          <TextField
                            placeholder="Escreva um comentário construtivo sobre este pedido..."
                            value={commentDrafts[pedido.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [pedido.id]: e.target.value }))
                            }
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="primary"
                          className="h-11 px-4 text-xs"
                          loading={commentSubmittingId === pedido.id}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          Comentar
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal de confirmação explícita para eliminação (RNF-USA-03 / CA2.3) */}
      {pedidoToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-pedido-title"
        >
          <div className="max-w-md w-full bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-xl space-y-4">
            <h3 id="delete-pedido-title" className="text-base font-bold text-fg-primary">
              Confirmar eliminação de pedido
            </h3>
            <p className="text-xs text-fg-secondary leading-relaxed">
              Tem a certeza que pretende eliminar o pedido <strong>{pedidoToDelete.id}</strong> («{pedidoToDelete.title}»)? Esta ação ficará registada em auditoria (RNF-USA-03).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" className="h-9 px-4 text-xs" onClick={() => setPedidoToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="primary" className="h-9 px-4 text-xs" onClick={handleConfirmDelete}>
                Eliminar pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PedidosPage
