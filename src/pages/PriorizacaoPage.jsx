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
} from 'lucide-react'
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

// Matriz de dados de exemplo com pontuações calculadas
const MATRIX_ITEMS = [
  {
    id: 'PED-01',
    code: 'US-31',
    title: 'Filtro avançado por tags e prioridade',
    quadrant: 'quick_wins', // Alto Impacto, Baixo Esforço
    impact: 'Alto',
    effort: '2 SP',
    effortNum: 2,
    impactNum: 9,
    votes: 42,
    score: 9.4,
    aiRecommendation: 'Prioridade Máxima Sprint 13',
    aiConfidence: '96%',
    status: 'analysis',
    category: 'MELHORIA',
  },
  {
    id: 'PED-05',
    code: 'US-72',
    title: 'Integração bidirecional GitHub e GitLab',
    quadrant: 'strategic', // Alto Impacto, Alto Esforço
    impact: 'Alto',
    effort: '8 SP',
    effortNum: 8,
    impactNum: 10,
    votes: 41,
    score: 8.8,
    aiRecommendation: 'Planear para Release 2027.Q1',
    aiConfidence: '92%',
    status: 'pending',
    category: 'NOVA_FUNCIONALIDADE',
  },
  {
    id: 'PED-03',
    code: 'US-55',
    title: 'Notificações em tempo real para menções',
    quadrant: 'quick_wins', // Alto Impacto, Baixo Esforço
    impact: 'Alto',
    effort: '3 SP',
    effortNum: 3,
    impactNum: 8,
    votes: 35,
    score: 8.6,
    aiRecommendation: 'Incluir no Sprint 12',
    aiConfidence: '94%',
    status: 'pending',
    category: 'NOVA_FUNCIONALIDADE',
  },
  {
    id: 'PED-10',
    code: 'US-48',
    title: 'Métricas de velocity e burndown chart',
    quadrant: 'quick_wins',
    impact: 'Alto',
    effort: '3 SP',
    effortNum: 3,
    impactNum: 8,
    votes: 33,
    score: 8.4,
    aiRecommendation: 'Concluir revisão técnica',
    aiConfidence: '90%',
    status: 'analysis',
    category: 'NOVA_FUNCIONALIDADE',
  },
  {
    id: 'PED-06',
    code: 'US-68',
    title: 'Modo escuro acessível (WCAG 2.1 AA)',
    quadrant: 'fill_in', // Baixo Impacto, Baixo Esforço
    impact: 'Médio',
    effort: '2 SP',
    effortNum: 2,
    impactNum: 6,
    votes: 29,
    score: 7.5,
    aiRecommendation: 'Sprint de aperfeiçoamento UX',
    aiConfidence: '88%',
    status: 'analysis',
    category: 'MELHORIA',
  },
  {
    id: 'PED-02',
    code: 'US-24',
    title: 'Exportação de relatórios PDF/CSV',
    quadrant: 'fill_in',
    impact: 'Médio',
    effort: '3 SP',
    effortNum: 3,
    impactNum: 6,
    votes: 18,
    score: 6.9,
    aiRecommendation: 'Aprovado para Sprint 12',
    aiConfidence: '85%',
    status: 'development',
    category: 'NOVA_FUNCIONALIDADE',
  },
  {
    id: 'PED-08',
    code: 'US-75',
    title: 'Estimativa com Fibonacci no modal',
    quadrant: 'fill_in',
    impact: 'Baixo',
    effort: '1 SP',
    effortNum: 1,
    impactNum: 5,
    votes: 15,
    score: 6.2,
    aiRecommendation: 'Quick fix opcional',
    aiConfidence: '80%',
    status: 'complete',
    category: 'MELHORIA',
  },
  {
    id: 'PED-09',
    code: 'US-80',
    title: 'Módulo de scanner WCAG em tempo real',
    quadrant: 'reconsider', // Baixo Impacto, Alto Esforço
    impact: 'Baixo',
    effort: '13 SP',
    effortNum: 13,
    impactNum: 4,
    votes: 9,
    score: 3.8,
    aiRecommendation: 'Reavaliar viabilidade técnica',
    aiConfidence: '72%',
    status: 'rejected',
    category: 'NOVA_FUNCIONALIDADE',
  },
]

/**
 * PriorizacaoPage Component
 * Conforme Figma frame 325:1640 ("Painel de Priorização e Votação", 1600x1200)
 */
export function PriorizacaoPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const [items, setItems] = useState(MATRIX_ITEMS)
  const [selectedQuadrant, setSelectedQuadrant] = useState('ALL')
  const [searchFilter, setSearchFilter] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const handleVote = (itemId, hasVoted, newCount) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, votes: newCount } : item))
    )
    if (dataContext.toggleVote) {
      dataContext.toggleVote(itemId)
    }
    setToastMessage(
      hasVoted
        ? '✓ Voto registado (RNF-SEG-03: unicidade por utilizador)'
        : 'Voto removido com sucesso.'
    )
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handlePromoteToBacklog = (item) => {
    if (dataContext.addStory) {
      dataContext.addStory({
        title: item.title,
        description: `História gerada a partir da priorização de ${item.id} (${item.title}).`,
        target: 'Backlog do produto',
        priority: item.impact === 'Alto' ? 'Alta' : 'Média',
        points: item.effortNum || 3,
        linkedPedidoId: item.id,
      })
    }
    setToastMessage(`✓ ${item.title} promovido ao Product Backlog com sucesso!`)
    setTimeout(() => setToastMessage(''), 4000)
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
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="underline hover:font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* 2. Linha de KPIs (4 MetricCards conforme Figma) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pedidos da comunidade"
          value="128"
          change="+8 este mês"
          trend="positive"
          subtitle="Total de pedidos submetidos"
          icon={<Award className="w-5 h-5 text-brand-action" />}
        />

        <MetricCard
          title="Votos recebidos"
          value="1 284"
          change="+142 esta semana"
          trend="positive"
          subtitle="RNF-SEG-03: 1 voto por utilizador"
          icon={<TrendingUp className="w-5 h-5 text-[#16A34A]" />}
        />

        <MetricCard
          title="Em análise"
          value="26"
          change="PO triagem ativa"
          trend="neutral"
          subtitle="Aguardam decisão de produto"
          icon={<Clock className="w-5 h-5 text-[#F59E0B]" />}
        />

        <MetricCard
          title="Os meus votos"
          value="12"
          change="Ativos"
          trend="neutral"
          subtitle="Votos atribuídos pelo utilizador"
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-fg-primary">
                  Sugestões de IA para o próximo Sprint
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#8B5CF6] text-white">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-fg-secondary mt-1 max-w-3xl leading-relaxed">
                O modelo analisou 14 novos pedidos com base no impacto de negócio, estimativa de esforço técnico e 1 284 votos da comunidade. Foram identificados <strong>3 Quick Wins</strong> de alto retorno para o Sprint 13 com pontuação média de <strong>8.8 / 10</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              className="text-xs bg-[#5B21B6] hover:bg-[#4C1D95]"
              onClick={() => {
                setSelectedQuadrant('quick_wins')
                setToastMessage('Filtro aplicado: A exibir os 3 Quick Wins recomendados pelo Gemini!')
              }}
            >
              Ver Quick Wins recomendados
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
              onClick={() => setSelectedQuadrant('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedQuadrant === 'ALL'
                  ? 'bg-fg-primary text-white'
                  : 'bg-bg-page text-fg-secondary hover:bg-border-subtle/50'
              }`}
            >
              Todos os Quadrantes
            </button>
            <button
              onClick={() => setSelectedQuadrant('quick_wins')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedQuadrant === 'quick_wins'
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
              }`}
            >
              Quick Wins (Alto Impacto / Baixo Esforço)
            </button>
            <button
              onClick={() => setSelectedQuadrant('strategic')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
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
          {/* Quadrante 1: Quick Wins (Alto Impacto, Baixo Esforço) */}
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
                      className="p-2.5 rounded-lg bg-white border border-[#BBF7D0] shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#15803D]">{item.id}</span>
                          <span className="font-medium text-fg-primary">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="text-[11px] py-1 px-2.5 h-7"
                        onClick={() => handlePromoteToBacklog(item)}
                      >
                        Promover
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 2: Apostas Estratégicas (Alto Impacto, Alto Esforço) */}
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
                      className="p-2.5 rounded-lg bg-white border border-[#FDE68A] shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#B45309]">{item.id}</span>
                          <span className="font-medium text-fg-primary">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="text-[11px] py-1 px-2.5 h-7"
                        onClick={() => handlePromoteToBacklog(item)}
                      >
                        Promover
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 3: Preenchimento / Quick Tasks (Baixo Impacto, Baixo Esforço) */}
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
                      className="p-2.5 rounded-lg bg-white border border-[#DDD6FE] shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#5B21B6]">{item.id}</span>
                          <span className="font-medium text-fg-primary">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="text-[11px] py-1 px-2.5 h-7"
                        onClick={() => handlePromoteToBacklog(item)}
                      >
                        Promover
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quadrante 4: Reconsiderar / Descartar (Baixo Impacto, Alto Esforço) */}
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
                      className="p-2.5 rounded-lg bg-white border border-[#FECACA] shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#DC2626]">{item.id}</span>
                          <span className="font-medium text-fg-primary">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>Impacto: {item.impact}</span>
                          <span>·</span>
                          <span>Esforço: {item.effort}</span>
                          <span>·</span>
                          <span className="font-semibold text-brand-action">Score: {item.score}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#DC2626] font-medium px-2 py-0.5 bg-[#FEE2E2] rounded">
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
              Ordenada pela pontuação ponderada de valor de negócio e suporte da comunidade
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
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-bg-page/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-fg-secondary">
                    #{idx + 1}
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
                      initialVoted={idx < 2}
                      onVote={(voted, count) => handleVote(item.id, voted, count)}
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
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded font-medium">
                      <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                      {item.aiRecommendation}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="primary"
                      className="text-xs py-1 px-3 h-8"
                      onClick={() => handlePromoteToBacklog(item)}
                    >
                      Promover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PriorizacaoPage
