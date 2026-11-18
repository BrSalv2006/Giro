import { useState, useMemo } from 'react'
import {
  MetricCard,
  Button,
  StatusBadge,
  VoteCounter,
  PlusIcon,
  TextField,
  SearchIcon,
} from '../components/common'
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
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

/**
 * PriorizacaoPage Component
 * Conforme Figma frame 325:1640 ("Painel de Priorização e Votação", 1600x1200)
 */
export function PriorizacaoPage() {
  const authContext = useSafeAuth()
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const currentUser = authContext.currentUser
  const permissions = authContext.permissions || {}

  const [selectedQuadrant, setSelectedQuadrant] = useState('ALL')
  const [searchFilter, setSearchFilter] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [aiNotice, setAiNotice] = useState(null)
  const [aiLoadingId, setAiLoadingId] = useState(null)
  const [isBatchAiLoading, setIsBatchAiLoading] = useState(false)
  const [aiOverrides, setAiOverrides] = useState({})
  const [manualOrderIds, setManualOrderIds] = useState([])

  const rawPedidos = useMemo(() => dataContext.pedidos || [], [dataContext.pedidos])

  const items = useMemo(() => {
    const mapped = rawPedidos.map((pedido) => {
      const override = aiOverrides[pedido.id]
      const impactNum = override?.impact ?? pedido.impact ?? 5
      const effortNum = override?.effort ?? pedido.effort ?? 3
      const quadrant = override?.quadrant || (
        impactNum >= 8 && effortNum <= 3
          ? 'quick_wins'
          : impactNum >= 8
          ? 'strategic'
          : impactNum <= 4
          ? 'reconsider'
          : 'fill_in'
      )
      const voteScore = Math.min(5, (pedido.voteCount || 0) / 5)
      const valueRatio = Math.min(5, (impactNum / Math.max(1, effortNum)) * 1.5)
      const score = Number((voteScore + valueRatio).toFixed(1))

      return {
        id: pedido.id,
        code: pedido.linkedStoryId || pedido.id,
        title: pedido.title,
        quadrant,
        impact: impactNum >= 8 ? 'Alto' : impactNum >= 5 ? 'Médio' : 'Baixo',
        effort: `${effortNum} SP`,
        effortNum,
        impactNum,
        votes: pedido.voteCount || 0,
        votedBy: pedido.votedBy || [],
        score,
        aiRecommendation: override?.recommendation || pedido.aiRecommendation || 'Pendente de análise IA',
        aiConfidence: override?.confidence || pedido.aiConfidence || '—',
        status: pedido.status,
        category: pedido.category,
      }
    })

    if (!manualOrderIds.length) {
      return [...mapped].sort((a, b) => b.score - a.score)
    }

    const rankMap = new Map(manualOrderIds.map((id, idx) => [id, idx]))
    return [...mapped].sort((a, b) => {
      const rankA = rankMap.has(a.id) ? rankMap.get(a.id) : Number.MAX_SAFE_INTEGER
      const rankB = rankMap.has(b.id) ? rankMap.get(b.id) : Number.MAX_SAFE_INTEGER
      if (rankA !== rankB) return rankA - rankB
      return b.score - a.score
    })
  }, [rawPedidos, aiOverrides, manualOrderIds])

  const currentUserId = currentUser?.id

  const kpis = useMemo(() => {
    const totalPedidos = rawPedidos.length
    const totalVotes = rawPedidos.reduce((sum, p) => sum + (p.voteCount || 0), 0)
    const pendingAnalysis = rawPedidos.filter((p) => p.status === 'pending' || p.status === 'analysis').length
    const myVotes = currentUserId
      ? rawPedidos.filter((p) => p.votedBy?.includes(currentUserId)).length
      : 0
    const quickWinsCount = items.filter((i) => i.quadrant === 'quick_wins').length
    return { totalPedidos, totalVotes, pendingAnalysis, myVotes, quickWinsCount }
  }, [rawPedidos, currentUserId, items])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleVote = async (itemId, hasVoted) => {
    try {
      if (dataContext.toggleVote) {
        await dataContext.toggleVote(itemId)
      }
      showToast(
        hasVoted
          ? '✓ Voto registado (RNF-SEG-03: unicidade por utilizador)'
          : 'Voto removido com sucesso.'
      )
    } catch (voteError) {
      showToast(voteError.message || 'Erro ao atualizar voto.')
    }
  }

  const handlePromoteToBacklog = async (item) => {
    if (!dataContext.addStory) return
    try {
      await dataContext.addStory({
        title: item.title,
        description: `Como utilizador, quero "${item.title}", para gerar valor de negócio classificado como ${item.impact}.`,
        acceptanceCriteria: [
          `Validar implementação do pedido ${item.id}`,
          'Confirmar critérios de aceitação com o Product Owner',
        ],
        target: 'Backlog do produto',
        priority: item.impact === 'Alto' ? 'Alta' : 'Média',
        points: item.effortNum || 3,
        linkedPedidoId: item.id,
      })
      showToast(`✓ ${item.title} promovido ao Product Backlog com sucesso!`)
    } catch (promoteError) {
      showToast(promoteError.message || 'Não foi possível promover o pedido para o Backlog.')
    }
  }

  const handleAiAnalyzeItem = async (item) => {
    if (!dataContext.requestAiPrioritization) return
    setAiLoadingId(item.id)
    try {
      const result = await dataContext.requestAiPrioritization(item.id)
      if (result?.available === false) {
        setAiOverrides((prev) => ({
          ...prev,
          [item.id]: {
            impact: result.impact,
            effort: result.effort,
            quadrant: result.quadrant,
            recommendation: result.recommendation,
            confidence: 'Contingência local (sem PII)',
          },
        }))
        setAiNotice({
          type: 'warning',
          text: `${result.message || 'Serviço Gemini IA indisponível.'} Contingência local aplicada para ${item.id} sem bloquear a triagem manual (CA4.3).`,
        })
      } else {
        setAiOverrides((prev) => ({
          ...prev,
          [item.id]: {
            impact: result.impact,
            effort: result.effort,
            quadrant: result.quadrant,
            recommendation: result.recommendation,
            confidence: result.confidence,
          },
        }))
        setAiNotice({
          type: 'success',
          text: `Priorização assistida por IA concluída para ${item.id} com remoção automática de dados pessoais (RNF-SEG-05 / CA4.1).`,
        })
      }
    } finally {
      setAiLoadingId(null)
    }
  }

  const handleBatchAiPrioritize = async () => {
    if (!dataContext.requestAiPrioritization || items.length === 0) return
    setIsBatchAiLoading(true)
    let hadFallback = false
    try {
      const targets = items.slice(0, 4)
      for (const target of targets) {
        const res = await dataContext.requestAiPrioritization(target.id)
        if (res?.available === false) hadFallback = true
        setAiOverrides((prev) => ({
          ...prev,
          [target.id]: {
            impact: res.impact,
            effort: res.effort,
            quadrant: res.quadrant,
            recommendation: res.recommendation,
            confidence: res.available === false ? 'Contingência local (sem PII)' : res.confidence,
          },
        }))
      }
      setAiNotice(
        hadFallback
          ? {
              type: 'warning',
              text: 'API externa de IA indisponível (CA4.3). Estimativa heurística local aplicada com proteção PII; a reordenação manual continua disponível.',
            }
          : {
              type: 'success',
              text: `Análise concluída para ${targets.length} pedidos (CA4.1 · PII sanitizado antes do envio).`,
            }
      )
    } finally {
      setIsBatchAiLoading(false)
    }
  }

  const handleManualMove = (itemId, direction) => {
    const baseOrder = items.map((i) => i.id)
    const idx = baseOrder.indexOf(itemId)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || targetIdx < 0 || targetIdx >= baseOrder.length) return
    const nextOrder = [...baseOrder]
    const [moved] = nextOrder.splice(idx, 1)
    nextOrder.splice(targetIdx, 0, moved)
    setManualOrderIds(nextOrder)
    showToast(`✓ Ordem manual atualizada para ${itemId} (CA4.2: decisão do PO soberana).`)
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedQuadrant !== 'ALL' && item.quadrant !== selectedQuadrant) {
        return false
      }
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase()
        return (
          item.title.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.code?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [items, selectedQuadrant, searchFilter])

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Cabeçalho da Página (Figma 325:1640) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Priorização e Votação
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Dê voz à equipa e transforme os pedidos com maior impacto em prioridades de produto.
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

      {/* Toast de Ação */}
      {toastMessage && (
        <div role="status" className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')} className="underline hover:font-bold cursor-pointer">
            Fechar
          </button>
        </div>
      )}

      {/* Aviso de IA / Contingência CA4.1 - CA4.3 */}
      {aiNotice && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            aiNotice.type === 'warning'
              ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#7A4D00]'
              : 'bg-[#EDE9FE] border-[#C4B5FD] text-[#5B21B6]'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{aiNotice.text}</span>
          </span>
          <button type="button" onClick={() => setAiNotice(null)} className="underline shrink-0 cursor-pointer">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Linha de KPIs (4 MetricCards conforme Figma) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pedidos da comunidade"
          value={kpis.totalPedidos}
          change={`${kpis.quickWinsCount} Quick Wins`}
          trend="positive"
          subtitle="Total de pedidos registados"
          icon={<Award className="w-5 h-5 text-brand-action" />}
        />

        <MetricCard
          title="Votos recebidos"
          value={kpis.totalVotes}
          change="Ativos no catálogo"
          trend="positive"
          subtitle="RNF-SEG-03: 1 voto por utilizador"
          icon={<TrendingUp className="w-5 h-5 text-[#16A34A]" />}
        />

        <MetricCard
          title="Em análise"
          value={kpis.pendingAnalysis}
          change="PO triagem ativa"
          trend="neutral"
          subtitle="Aguardam decisão de produto"
          icon={<Clock className="w-5 h-5 text-[#F59E0B]" />}
        />

        <MetricCard
          title="Os meus votos"
          value={kpis.myVotes}
          change="RNF-SEG-03"
          trend="neutral"
          subtitle="Votos atribuídos por si"
          icon={<Zap className="w-5 h-5 text-[#8B5CF6]" />}
        />
      </div>

      {/* 3. Banner de Recomendações de IA (Gemini Prioritization) */}
      <div className="bg-gradient-to-r from-[#EDE9FE] via-[#F3E8FF] to-[#FFE3DC] border border-[#DDD6FE] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-action text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-fg-primary">
                  Sugestões de IA para o próximo Sprint
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#8B5CF6] text-white">
                  Gemini AI · Sem PII
                </span>
              </div>
              <p className="text-xs text-fg-secondary mt-1 max-w-3xl leading-relaxed">
                O adaptador de IA remove dados pessoais (RNF-SEG-05) antes da análise de impacto vs. esforço. Foram identificados <strong>{kpis.quickWinsCount} Quick Wins</strong>; a ordenação manual do Product Owner mantém prioridade soberana (CA4.2).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {permissions.canManageBacklog && (
              <Button
                variant="secondary"
                className="text-xs h-10 px-3.5"
                loading={isBatchAiLoading}
                onClick={handleBatchAiPrioritize}
              >
                Analisar pedidos com IA
              </Button>
            )}
            <Button
              variant="primary"
              className="text-xs h-10 px-4 bg-[#5B21B6] hover:bg-[#4C1D95]"
              onClick={() => {
                setSelectedQuadrant('quick_wins')
                showToast(`Filtro aplicado: A exibir ${kpis.quickWinsCount} Quick Wins recomendados!`)
              }}
            >
              Ver Quick Wins ({kpis.quickWinsCount})
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Matriz 2x2: Valor vs Esforço (Visual Interativo) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-base font-bold text-fg-primary">
              Matriz Valor vs. Esforço (Priorização Estratégica)
            </h2>
            <p className="text-xs text-fg-secondary">
              Mapeamento visual dos pedidos em função do impacto de negócio e esforço estimado
            </p>
          </div>

          {/* Filtro de Quadrantes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedQuadrant('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedQuadrant === 'ALL'
                  ? 'bg-fg-primary text-white'
                  : 'bg-bg-page text-fg-secondary hover:bg-border-subtle/50'
              }`}
            >
              Todos os Quadrantes
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('quick_wins')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedQuadrant === 'quick_wins'
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
              }`}
            >
              Quick Wins (Alto Impacto / Baixo Esforço)
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuadrant('strategic')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedQuadrant === 'strategic'
                  ? 'bg-[#B45309] text-white'
                  : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
              }`}
            >
              Apostas Estratégicas
            </button>
          </div>
        </div>

        {/* Grelha 2x2 dos 4 Quadrantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrante 1: Quick Wins */}
          <div className="p-4 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                  <Zap className="w-3.5 h-3.5" />
                  Quick Wins (Alto Impacto · Baixo Esforço)
                </span>
                <span className="text-xs font-semibold text-[#15803D]">Recomendado: Priorizar</span>
              </div>
              <p className="text-[11px] text-fg-secondary mb-3">
                Maior retorno imediato com baixo custo de desenvolvimento. Prioridade máxima para sprints.
              </p>

              <div className="space-y-2">
                {items
                  .filter((i) => i.quadrant === 'quick_wins')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-[#BBF7D0] shadow-2xs flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#15803D] shrink-0">{item.id}</span>
                          <span className="font-medium text-fg-primary truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      {permissions.canManageBacklog && (
                        <Button
                          variant="secondary"
                          className="text-[11px] py-1 px-2.5 h-7 shrink-0"
                          onClick={() => handlePromoteToBacklog(item)}
                        >
                          Promover
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 2: Apostas Estratégicas */}
          <div className="p-4 rounded-xl border border-[#FDE68A] bg-[#FEF3C7]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                  <Target className="w-3.5 h-3.5" />
                  Apostas Estratégicas (Alto Impacto · Alto Esforço)
                </span>
                <span className="text-xs font-semibold text-[#B45309]">Planear no Roadmap</span>
              </div>
              <p className="text-[11px] text-fg-secondary mb-3">
                Funcionalidades transformadoras que requerem decomposição em épicos e múltiplos sprints.
              </p>

              <div className="space-y-2">
                {items
                  .filter((i) => i.quadrant === 'strategic')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-[#FDE68A] shadow-2xs flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#B45309] shrink-0">{item.id}</span>
                          <span className="font-medium text-fg-primary truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      {permissions.canManageBacklog && (
                        <Button
                          variant="secondary"
                          className="text-[11px] py-1 px-2.5 h-7 shrink-0"
                          onClick={() => handlePromoteToBacklog(item)}
                        >
                          Promover
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 3: Preenchimento */}
          <div className="p-4 rounded-xl border border-[#DDD6FE] bg-[#EDE9FE]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
                  <Clock className="w-3.5 h-3.5" />
                  Preenchimento (Baixo Impacto · Baixo Esforço)
                </span>
                <span className="text-xs font-semibold text-[#5B21B6]">Tarefas de Folga</span>
              </div>
              <p className="text-[11px] text-fg-secondary mb-3">
                Pequenas melhorias e tarefas de preenchimento quando sobra capacidade na sprint.
              </p>

              <div className="space-y-2">
                {items
                  .filter((i) => i.quadrant === 'fill_in')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-[#DDD6FE] shadow-2xs flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#5B21B6] shrink-0">{item.id}</span>
                          <span className="font-medium text-fg-primary truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      {permissions.canManageBacklog && (
                        <Button
                          variant="secondary"
                          className="text-[11px] py-1 px-2.5 h-7 shrink-0"
                          onClick={() => handlePromoteToBacklog(item)}
                        >
                          Promover
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 4: Reconsiderar */}
          <div className="p-4 rounded-xl border border-[#FECACA] bg-[#FEE2E2]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Reconsiderar (Baixo Impacto · Alto Esforço)
                </span>
                <span className="text-xs font-semibold text-[#DC2626]">Descartar / Congelar</span>
              </div>
              <p className="text-[11px] text-fg-secondary mb-3">
                Itens com relação custo-benefício desfavorável. Devem ser descartados ou repensados.
              </p>

              <div className="space-y-2">
                {items
                  .filter((i) => i.quadrant === 'reconsider')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-[#FECACA] shadow-2xs flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#DC2626] shrink-0">{item.id}</span>
                          <span className="font-medium text-fg-primary truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#DC2626] font-medium px-2 py-0.5 bg-[#FEE2E2] rounded shrink-0">
                        Congelado
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tabela de Classificação e Priorização com Votação */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-base font-bold text-fg-primary">
              Tabela de Priorização e Votação
            </h2>
            <p className="text-xs text-fg-secondary">
              Ordenada pela pontuação ponderada de valor de negócio e suporte da comunidade (com controlo manual CA4.2)
            </p>
          </div>

          <div className="w-full sm:w-64">
            <TextField
              icon={<SearchIcon size={16} />}
              placeholder="Pesquisar pedido..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela Interativa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-fg-secondary uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Pedido</th>
                <th className="py-2.5 px-3">Votos (RNF-SEG-03)</th>
                <th className="py-2.5 px-3">Impacto</th>
                <th className="py-2.5 px-3">Esforço</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Recomendação IA</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredItems.map((item, idx) => {
                const userHasVoted = Boolean(currentUser?.id && item.votedBy?.includes(currentUser.id))
                return (
                  <tr key={item.id} className="hover:bg-bg-page/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-fg-secondary">
                      <div className="flex items-center gap-1.5">
                        <span>#{idx + 1}</span>
                        {permissions.canManageBacklog && selectedQuadrant === 'ALL' && !searchFilter.trim() && (
                          <span className="inline-flex flex-col">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleManualMove(item.id, 'up')}
                              className="p-0.5 text-fg-secondary hover:text-fg-primary disabled:opacity-25 cursor-pointer"
                              title="Subir prioridade manualmente (CA4.2)"
                              aria-label={`Subir ${item.id}`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredItems.length - 1}
                              onClick={() => handleManualMove(item.id, 'down')}
                              className="p-0.5 text-fg-secondary hover:text-fg-primary disabled:opacity-25 cursor-pointer"
                              title="Descer prioridade manualmente (CA4.2)"
                              aria-label={`Descer ${item.id}`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-fg-primary">{item.title}</div>
                      <div className="text-[11px] text-fg-secondary flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{item.id}</span>
                        <span>•</span>
                        <StatusBadge status={item.status} />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <VoteCounter
                        votes={item.votes}
                        initialVoted={userHasVoted}
                        onVote={(voted) => handleVote(item.id, voted)}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.impact === 'Alto'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : item.impact === 'Médio'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : 'bg-[#FEE2E2] text-[#DC2626]'
                        }`}
                      >
                        {item.impact}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-fg-primary">
                      {item.effort}
                    </td>
                    <td className="py-3 px-3 font-bold text-brand-action">
                      {item.score} / 10
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded font-medium">
                          <Sparkles className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                          <span>{item.aiRecommendation}</span>
                        </span>
                        {item.aiConfidence !== '—' && (
                          <div className="text-[10px] text-fg-secondary">{item.aiConfidence}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {permissions.canManageBacklog && (
                          <>
                            <Button
                              variant="secondary"
                              className="text-xs py-1 px-2.5 h-8"
                              loading={aiLoadingId === item.id}
                              onClick={() => handleAiAnalyzeItem(item)}
                            >
                              Sugerir IA
                            </Button>
                            <Button
                              variant="primary"
                              className="text-xs py-1 px-3 h-8"
                              onClick={() => handlePromoteToBacklog(item)}
                            >
                              Promover
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PriorizacaoPage
