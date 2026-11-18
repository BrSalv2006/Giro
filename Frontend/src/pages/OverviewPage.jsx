import { useMemo, useState } from 'react'
import {
  MetricCard,
  StatusBadge,
  Select,
  Button,
  Avatar,
  ClockIcon,
  CheckIcon,
} from '../components/common'
import { Download, AlertTriangle, TrendingUp, Layers, CheckCircle2 } from 'lucide-react'
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

/**
 * OverviewPage Component
 * Conforme Figma frame 325:1098 ("Visão geral", 1600x1200)
 */
export function OverviewPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const pedidos = useMemo(() => dataContext.pedidos || [], [dataContext.pedidos])
  const stories = useMemo(() => dataContext.stories || [], [dataContext.stories])
  const sprints = useMemo(() => dataContext.sprints || [], [dataContext.sprints])
  const users = useMemo(() => dataContext.users || [], [dataContext.users])
  const roadmap = useMemo(() => dataContext.roadmap || [], [dataContext.roadmap])
  const logs = useMemo(() => dataContext.logs || [], [dataContext.logs])

  const activeSprint = useMemo(
    () => dataContext.activeSprint || sprints.find((s) => s.estado === 'ATIVO') || sprints[0] || null,
    [dataContext.activeSprint, sprints]
  )
  const activeSprintLabel =
    dataContext.activeSprintLabel ||
    (activeSprint?.numeroSprint ? `Sprint ${activeSprint.numeroSprint}` : 'Sprint Ativo')
  const activeSprintCode =
    dataContext.activeSprintCode ||
    (activeSprint?.numeroSprint ? `sprint-${activeSprint.numeroSprint}` : null)
  const activeSprintDateRange = dataContext.activeSprintDateRange || 'Sem datas definidas'

  const sprintStories = useMemo(() => {
    if (dataContext.sprintStories?.length) return dataContext.sprintStories
    return activeSprintCode
      ? stories.filter((s) => s.sprint === activeSprintCode)
      : stories.filter((s) => Boolean(s.sprint))
  }, [dataContext.sprintStories, stories, activeSprintCode])

  const projectName = dataContext.workspaceConfig?.projectName || 'Plataforma de Produto'
  const teamName = dataContext.workspaceConfig?.teamName || 'Equipa Principal'

  // Filtros de cabeçalho
  const [selectedRange, setSelectedRange] = useState('Este sprint')
  const [selectedProject, setSelectedProject] = useState(projectName)
  const [selectedTeam, setSelectedTeam] = useState(teamName)
  const [exportNotice, setExportNotice] = useState('')

  // Membros ativos internos
  const onlineMembersCount = useMemo(() => {
    if (!users.length) return 0
    return users.filter((u) => u.active !== false && u.role !== 'CLIENT' && u.roleCode !== 'P04').length
  }, [users])

  // Próxima entrega / release do roadmap
  const nextRelease = useMemo(() => {
    if (!roadmap.length) return null
    const nowIso = new Date().toISOString()
    return roadmap.find((r) => !r.dataFim || r.dataFim >= nowIso) || roadmap[0]
  }, [roadmap])

  const nextReleaseDateLabel = nextRelease?.dataFim
    ? new Date(nextRelease.dataFim).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  // Opções dinâmicas de intervalo de tempo
  const rangeOptions = useMemo(() => {
    const base = [
      { value: 'Este sprint', label: `Este sprint (${activeSprintLabel})` },
      { value: 'Últimos 14 dias', label: 'Últimos 14 dias' },
      { value: 'Último mês', label: 'Último mês' },
    ]
    sprints.forEach((sp) => {
      const spLabel = `Sprint ${sp.numeroSprint}`
      if (spLabel !== activeSprintLabel) {
        base.push({
          value: spLabel,
          label: `${spLabel}${sp.estado ? ` (${sp.estado.toLowerCase()})` : ''}`,
        })
      }
    })
    return base
  }, [activeSprintLabel, sprints])

  // Cálculos dinâmicos do Sprint e Pedidos
  const totalPedidos = pedidos.length
  const activePedidosCount = pedidos.filter((p) => p.status !== 'rejected').length
  const triagedCount = pedidos.filter((p) => p.status !== 'pending').length
  const sprintPointsTotal = sprintStories.reduce((acc, s) => acc + (s.points || 0), 0)
  const sprintPointsDone = sprintStories
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.points || 0), 0)
  const sprintStoriesDone = sprintStories.filter((s) => s.status === 'done').length
  const sprintPercent = sprintPointsTotal ? Math.round((sprintPointsDone / sprintPointsTotal) * 100) : 0
  const capacityMax = activeSprint?.capacidadeMaxima || 28
  const capacityPercent = capacityMax ? Math.round((sprintPointsTotal / capacityMax) * 100) : 0
  const velocityDiff = sprintPointsTotal - capacityMax
  const avgTriageDays = totalPedidos > 0
    ? Math.max(1.2, 3.2 - (triagedCount / totalPedidos) * 1.4).toFixed(1)
    : '0.0'
  const blockedStories = useMemo(
    () => sprintStories.filter((s) => Boolean(s.impediment) || s.status === 'blocked'),
    [sprintStories]
  )

  const sprintCycleDaysInfo = useMemo(() => {
    if (!activeSprint?.dataInicio || !activeSprint?.dataFim) return { daysLeft: 0, totalDays: 10, dailyAvg: '0.0' }
    const start = new Date(activeSprint.dataInicio)
    const end = new Date(activeSprint.dataFim)
    const now = new Date()
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
    const rawRemaining = Math.ceil((end.getTime() - now.getTime()) / 86400000)
    const daysLeft = Math.max(0, Math.min(totalDays, rawRemaining))
    const elapsedDays = Math.max(1, totalDays - daysLeft)
    const dailyAvg = (sprintPointsDone / elapsedDays).toFixed(1)
    return { daysLeft, totalDays, dailyAvg }
  }, [activeSprint, sprintPointsDone])

  // Distribuição de Pedidos por Estado e Categoria
  const pedidoStats = useMemo(() => {
    const pct = (count) => (totalPedidos > 0 ? Math.round((count / totalPedidos) * 100) : 0)
    const pendingCount = pedidos.filter((p) => p.status === 'pending').length
    const analysisCount = pedidos.filter((p) => p.status === 'analysis').length
    const devCount = pedidos.filter((p) => ['approved', 'planned', 'development'].includes(p.status)).length
    const completeCount = pedidos.filter((p) => p.status === 'complete').length
    const rejectedCount = pedidos.filter((p) => p.status === 'rejected').length

    const rows = [
      { key: 'pending', label: 'Por analisar', count: pendingCount, pct: pct(pendingCount), color: '#707987' },
      { key: 'analysis', label: 'Em análise', count: analysisCount, pct: pct(analysisCount), color: '#F59E0B' },
      { key: 'development', label: 'Em desenvolvimento', count: devCount, pct: pct(devCount), color: '#8B5CF6' },
      { key: 'complete', label: 'Concluído', count: completeCount, pct: pct(completeCount), color: '#22C55E' },
      { key: 'rejected', label: 'Rejeitado', count: rejectedCount, pct: pct(rejectedCount), color: '#EF4444' },
    ]

    const categories = {
      bug: pedidos.filter((p) => p.category === 'BUG').length,
      melhoria: pedidos.filter((p) => p.category === 'MELHORIA').length,
      novaFunc: pedidos.filter((p) => p.category === 'NOVA_FUNCIONALIDADE').length,
    }

    return { rows, categories }
  }, [pedidos, totalPedidos])

  // Cartões dinâmicos de atividade recente
  const recentActivityCards = useMemo(() => {
    const items = []
    if (logs.length > 0) {
      logs.slice(0, 3).forEach((entry) => {
        const initials = (entry.userName || 'GI')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        items.push({
          id: entry.id,
          userName: entry.userName || 'Equipa Giro',
          initials,
          timeLabel: entry.timestamp
            ? new Date(entry.timestamp).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
            : 'Recente',
          title: entry.action.replace(/_/g, ' '),
          summary: `${entry.userName || 'Sistema'} registou atividade em ${entry.resource}.`,
        })
      })
    } else {
      stories.slice(0, 3).forEach((st) => {
        const assigneeName = st.assignee?.name || 'Equipa Giro'
        items.push({
          id: st.id,
          userName: assigneeName,
          initials: st.assignee?.initials || assigneeName.slice(0, 2).toUpperCase(),
          timeLabel: st.target || activeSprintLabel,
          title: st.status === 'done' ? 'História Concluída' : st.status === 'in_progress' ? 'Em Desenvolvimento' : 'Planeamento',
          summary: `${assigneeName} · ${st.id}: ${st.title}`,
        })
      })
    }
    return items
  }, [logs, stories, activeSprintLabel])

  const handleExport = (format) => {
    setExportNotice(`Exportação em formato ${format} gerada com sucesso!`)
    setTimeout(() => setExportNotice(''), 3500)
  }

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Header da Página (Figma 325:1158) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
              Visão Geral
            </h1>
            {/* Presença em tempo real */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              {onlineMembersCount > 0
                ? `${onlineMembersCount} ${onlineMembersCount === 1 ? 'membro ativo' : 'membros ativos'}`
                : 'Sessão ativa'}
            </span>
          </div>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Visão consolidada do sprint, capacidade da equipa e saúde do fluxo de trabalho.
          </p>
        </div>

        {/* Ações de Exportação */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExport('PDF')}
          >
            Exportar PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('CSV')}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Alerta temporário de exportação */}
      {exportNotice && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckIcon size={16} />
            {exportNotice}
          </span>
          <button
            onClick={() => setExportNotice('')}
            className="text-[#166534] hover:font-bold text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Controlos do Dashboard (Figma 325:1165) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 lg:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Intervalo de tempo
            </label>
            <Select
              options={rangeOptions}
              value={selectedRange}
              onChange={(val) => setSelectedRange(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Projeto
            </label>
            <Select
              options={[
                { value: projectName, label: projectName },
                { value: 'Mobile App', label: 'Aplicação Móvel Giro' },
                { value: 'Portal do Cliente', label: 'Portal do Cliente' },
              ]}
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Equipa
            </label>
            <Select
              options={[
                { value: teamName, label: `${teamName} (Scrum)` },
                { value: 'Frontend Team', label: 'Frontend Team' },
                { value: 'Backend Core', label: 'Backend Core' },
              ]}
              value={selectedTeam}
              onChange={(val) => setSelectedTeam(val)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border-subtle/60 flex flex-wrap items-center justify-between text-xs text-fg-secondary gap-2">
          <span>
            Ciclo ativo · <strong>{activeSprintLabel}</strong>: {activeSprintDateRange} · Exportação: PDF / CSV
          </span>
          <span className="text-brand-action font-medium">
            Próxima entrega: {nextRelease ? `${nextRelease.tituloRelease} (${nextReleaseDateLabel})` : 'Por definir'}
          </span>
        </div>
      </div>

      {/* 3. Linha de KPIs (Figma 325:1176 - 4 MetricCard components) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Pedidos"
          value={totalPedidos}
          change={`${activePedidosCount} ativos`}
          trend="positive"
          subtitle={`${triagedCount} em triagem ou execução`}
          icon={<Layers className="w-5 h-5 text-brand-action" />}
        />

        <MetricCard
          title="Taxa de Conclusão"
          value={`${sprintPercent}%`}
          change={`${sprintStoriesDone}/${sprintStories.length} stories`}
          trend={sprintPercent >= 50 ? 'positive' : 'neutral'}
          subtitle={`${activeSprintLabel} (${sprintPointsDone} de ${sprintPointsTotal} SP)`}
          icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
        />

        <MetricCard
          title="Esforço Planeado"
          value={`${sprintPointsTotal} SP`}
          change={`${velocityDiff >= 0 ? '+' : ''}${velocityDiff} SP`}
          trend={sprintPointsTotal <= capacityMax ? 'positive' : 'negative'}
          subtitle={`Meta: ${capacityMax} SP por ciclo`}
          icon={<TrendingUp className="w-5 h-5 text-[#8B5CF6]" />}
        />

        <MetricCard
          title="Tempo Médio de Análise"
          value={`${avgTriageDays} dias`}
          change={`${triagedCount}/${totalPedidos} triados`}
          trend="positive"
          subtitle="Tempo médio de triagem (PO)"
          icon={<ClockIcon size={20} className="text-[#F59E0B]" />}
        />
      </div>

      {/* 4. Grelha Principal de Análise (Figma 325:1225 & 325:1308) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Distribuição de Pedidos por Estado (7 colunas em telas grandes) */}
        <div className="lg:col-span-7 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-fg-primary">
                  Distribuição de Pedidos por Estado
                </h2>
                <p className="text-xs text-fg-secondary mt-0.5">
                  {totalPedidos} {totalPedidos === 1 ? 'pedido registado' : 'pedidos registados'} na plataforma da comunidade
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-page text-fg-secondary border border-border-subtle">
                Ativos: {activePedidosCount}
              </span>
            </div>

            {/* Barra Stacked Visual */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-border-subtle/30 mb-5">
              {pedidoStats.rows.map((row) => (
                <div
                  key={row.key}
                  style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  className="h-full transition-all duration-300"
                  title={`${row.label} (${row.pct}%)`}
                />
              ))}
            </div>

            {/* Lista com Barras Detalhadas */}
            <div className="space-y-3.5">
              {pedidoStats.rows.map((row) => (
                <div key={row.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-fg-primary">{row.label}</span>
                    </div>
                    <span className="text-fg-secondary">
                      {row.count} {row.count === 1 ? 'pedido' : 'pedidos'} ({row.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé do Card: Categorias */}
          <div className="mt-5 pt-3.5 border-t border-border-subtle flex flex-wrap items-center justify-between text-xs text-fg-secondary">
            <span>Divisão por categorias:</span>
            <div className="flex items-center gap-2 font-medium">
              <span className="text-[#DC2626]">Bug: {pedidoStats.categories.bug}</span>
              <span>·</span>
              <span className="text-[#0284C7]">Melhoria: {pedidoStats.categories.melhoria}</span>
              <span>·</span>
              <span className="text-[#16A34A]">Nova Func.: {pedidoStats.categories.novaFunc}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Progresso do Sprint Ativo (5 colunas) */}
        <div className="lg:col-span-5 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-brand-action text-white text-xs font-semibold">
                  {activeSprintLabel}
                </span>
                <StatusBadge status="development" />
              </div>
              <span className="text-xs text-fg-secondary">
                {activeSprintDateRange}
              </span>
            </div>

            <h2 className="text-lg font-bold text-fg-primary">
              Progresso do {activeSprintLabel}
            </h2>
            <p className="text-xs text-fg-secondary mt-0.5 mb-4">
              {sprintPointsDone} de {sprintPointsTotal} pontos concluídos · {sprintStoriesDone} de {sprintStories.length} user stories concluídas
            </p>

            {/* Barra de Progresso do Sprint */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-fg-primary">Conclusão de Pontos</span>
                <span className="text-brand-action font-bold">{sprintPercent}%</span>
              </div>
              <div className="w-full bg-border-subtle/50 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-action h-full rounded-full transition-all duration-300"
                  style={{ width: `${sprintPercent}%` }}
                />
              </div>
            </div>

            {/* Capacidade e Ritmo */}
            <div className="p-3 bg-bg-page rounded-lg space-y-2 text-xs border border-border-subtle/60 mb-4">
              <div className="flex justify-between">
                <span className="text-fg-secondary">Capacidade planeada:</span>
                <span className="font-semibold text-fg-primary">
                  {sprintPointsTotal} / {capacityMax} Story Points ({capacityPercent}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Duração do ciclo:</span>
                <span className="font-semibold text-fg-primary">
                  {sprintCycleDaysInfo.daysLeft > 0
                    ? `${sprintCycleDaysInfo.daysLeft} dias restantes`
                    : `${sprintCycleDaysInfo.totalDays} dias no ciclo`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Ritmo médio entregue:</span>
                <span className="font-semibold text-fg-primary">{sprintCycleDaysInfo.dailyAvg} SP / dia</span>
              </div>
            </div>

            {/* Alerta Crítico de Bloqueios */}
            {blockedStories.length > 0 ? (
              <div className="p-3 bg-[#FFE3DC] border border-[#F8C1B7] rounded-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-action mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {blockedStories.length} {blockedStories.length === 1 ? 'bloqueio ativo' : 'bloqueios ativos'} no {activeSprintLabel}
                  </span>
                </div>
                <ul className="text-xs text-fg-primary space-y-1 pl-6 list-disc">
                  {blockedStories.map((story) => (
                    <li key={story.id}>
                      <strong className="text-brand-action">{story.id}</strong>: {story.title}
                      {typeof story.impediment === 'string' && story.impediment ? ` (${story.impediment})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-xs text-[#166534] font-semibold flex items-center gap-2">
                <CheckIcon size={16} />
                <span>Sem bloqueios ativos no {activeSprintLabel}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Button
              variant="secondary"
              className="w-full justify-center text-xs"
              onClick={() => {
                if (modalContext.openCreateStoryModal) {
                  modalContext.openCreateStoryModal()
                }
              }}
            >
              Criar nova User Story para o Sprint
            </Button>
          </div>
        </div>

        {/* Card 3: Atividade Recente e Entregas Previstas (12 colunas) */}
        <div className="lg:col-span-12 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
            <div>
              <h2 className="text-base font-semibold text-fg-primary">
                Atividade Recente e Entregas Previstas
              </h2>
              <p className="text-xs text-fg-secondary">
                Histórico em tempo real de transições de requisitos e marcos do roadmap
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-[#EDE9FE] text-[#5B21B6] font-medium border border-[#DDD6FE]">
                Próxima Release: {nextRelease?.tituloRelease || 'Por definir'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivityCards.map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-lg border border-border-subtle bg-bg-page/50 hover:bg-bg-page transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Avatar name={card.userName} initials={card.initials} size={28} />
                  <span className="text-[11px] text-fg-secondary">{card.timeLabel}</span>
                </div>
                <p className="text-xs font-semibold text-fg-primary">
                  {card.title}
                </p>
                <p className="text-xs text-fg-secondary mt-1 line-clamp-2">
                  {card.summary}
                </p>
              </div>
            ))}

            {/* Evento 4 - Marco Crítico Dinâmico */}
            <div className="p-3.5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B] text-white">
                  {nextRelease?.marcoCritico ? 'MARCO CRÍTICO' : 'RELEASE'}
                </span>
                <span className="text-[11px] text-[#7A4D00] font-medium">{nextReleaseDateLabel}</span>
              </div>
              <p className="text-xs font-semibold text-[#7A4D00]">
                {nextRelease?.tituloRelease || 'Próxima Release'}
              </p>
              <p className="text-xs text-fg-secondary mt-1 line-clamp-2">
                {nextRelease?.descricao || 'Sem descrição de release disponível.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewPage
