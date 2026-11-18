import { useState, useMemo } from 'react'
import {
  Button,
  Select,
  StatusBadge,
  Avatar,
  PlusIcon,
} from '../components/common'
import {
  Download,
  CheckCircle2,
  Milestone,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useModal } from '../context/ModalContext.jsx'
import { useData } from '../context/DataContext.jsx'

function useSafeModal() {
  try {
    return useModal() || {}
  } catch {
    return {}
  }
}

const ROADMAP_STATUS_MAP = {
  BACKLOG: 'pending',
  TODO: 'planned',
  EM_PROGRESSO: 'development',
  EM_REVISAO: 'analysis',
  CONCLUIDO: 'complete',
  BLOQUEADO: 'rejected',
}

function buildTimelineBuckets(minMs, maxMs, scale) {
  const buckets = []
  const start = new Date(minMs)
  const end = new Date(maxMs)

  if (scale === 'Semanas') {
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    let weekIndex = 1
    while (cur <= end && buckets.length < 12) {
      const label = cur.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
      buckets.push({ key: `w-${weekIndex}`, label: `Sem ${weekIndex} · ${label}` })
      cur.setDate(cur.getDate() + 7)
      weekIndex += 1
    }
    return buckets
  }

  if (scale === 'Meses') {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end && buckets.length < 12) {
      buckets.push({
        key: `${cur.getFullYear()}-${cur.getMonth()}`,
        label: cur.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
      })
      cur.setMonth(cur.getMonth() + 1)
    }
    return buckets
  }

  // Trimestres
  const startQ = Math.floor(start.getMonth() / 3)
  let year = start.getFullYear()
  let q = startQ
  const endQIndex = end.getFullYear() * 4 + Math.floor(end.getMonth() / 3)
  while (year * 4 + q <= endQIndex && buckets.length < 8) {
    buckets.push({
      key: `${year}-Q${q + 1}`,
      label: `Q${q + 1} ${year}`,
    })
    q += 1
    if (q > 3) {
      q = 0
      year += 1
    }
  }
  return buckets
}

function computeBarPlacement(startValue, endValue, minMs, spanMs) {
  const startMs = startValue ? new Date(startValue).getTime() : NaN
  const endMs = endValue ? new Date(endValue).getTime() : NaN
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || spanMs <= 0) {
    return { leftPct: 0, widthPct: 100 }
  }
  const leftPct = Math.max(0, Math.min(94, ((startMs - minMs) / spanMs) * 100))
  const rawWidth = ((endMs - startMs) / spanMs) * 100
  const widthPct = Math.max(6, Math.min(100 - leftPct, rawWidth))
  return { leftPct, widthPct }
}

/**
 * ProductRoadmapPage Component
 */
export function ProductRoadmapPage() {
  const { permissions } = useAuth()
  const modalContext = useSafeModal()
  const dataContext = useData()

  const canManageLifecycle = Boolean(permissions?.canManageSprintLifecycle)
  const sprints = useMemo(() => dataContext.sprints || [], [dataContext.sprints])
  const roadmap = useMemo(() => dataContext.roadmap || [], [dataContext.roadmap])
  const teamName = dataContext.workspaceConfig?.teamName || 'Equipa Principal'

  const [scale, setScale] = useState('Meses')
  const [groupBy, setGroupBy] = useState('Por release')
  const [selectedRelease, setSelectedRelease] = useState('ALL')
  const [notice, setNotice] = useState('')
  const [nowMs] = useState(() => Date.now())

  const releaseOptions = useMemo(() => {
    const nowIso = new Date().toISOString()
    return [
      { value: 'ALL', label: 'Todas as Releases' },
      ...roadmap.map((rel) => {
        const statusTag =
          rel.dataFim && rel.dataFim < nowIso
            ? 'Concluída'
            : rel.dataInicio && rel.dataInicio <= nowIso && rel.dataFim >= nowIso
            ? 'Ativa'
            : 'Planeada'
        return {
          value: rel.tituloRelease,
          label: `${rel.tituloRelease} (${statusTag})`,
        }
      }),
    ]
  }, [roadmap])

  const milestones = roadmap.flatMap((release) =>
    release.marcoCritico
      ? [{
          title: release.tituloRelease,
          status: release.dataFim <= new Date(nowMs).toISOString() ? 'done' : 'active',
          date: release.dataFim ? new Date(release.dataFim).toLocaleDateString('pt-PT') : '—',
          release: release.tituloRelease,
          badge: release.dataFim <= new Date(nowMs).toISOString() ? null : 'Marco',
        }]
      : []
  )

  const handleExportPDF = () => {
    setNotice('Geração do Roadmap em formato PDF iniciada...')
    setTimeout(() => setNotice(''), 3500)
  }

  const { minMs, spanMs, buckets, todayPercent } = useMemo(() => {
    const timestamps = [
      ...sprints.flatMap((sp) => [new Date(sp.dataInicio).getTime(), new Date(sp.dataFim).getTime()]),
      ...roadmap.flatMap((rel) => [new Date(rel.dataInicio).getTime(), new Date(rel.dataFim).getTime()]),
    ].filter((t) => !Number.isNaN(t))

    const defaultStart = nowMs - 30 * 86400000
    const defaultEnd = nowMs + 120 * 86400000
    const min = timestamps.length ? Math.min(...timestamps) : defaultStart
    const max = timestamps.length ? Math.max(...timestamps) : defaultEnd
    const span = Math.max(14 * 86400000, max - min)
    const computedBuckets = buildTimelineBuckets(min, min + span, scale)
    const todayPct = nowMs >= min && nowMs <= min + span ? ((nowMs - min) / span) * 100 : null
    return { minMs: min, spanMs: span, buckets: computedBuckets, todayPercent: todayPct }
  }, [sprints, roadmap, scale, nowMs])

  const filteredEpics = useMemo(() => {
    const allStories = dataContext.stories || []
    const epics = roadmap.flatMap((release) =>
      (release.userStories || []).map((story) => {
        const estado = story.estadoTecnico || 'BACKLOG'
        const statusBadge = ROADMAP_STATUS_MAP[estado] || 'pending'
        const matchedStory = allStories.find((s) => s.id === story.codigoUs)
        const leader = matchedStory?.assignee || { name: 'Por atribuir', initials: '—' }
        const progress =
          estado === 'CONCLUIDO'
            ? 100
            : estado === 'EM_REVISAO'
            ? 80
            : estado === 'EM_PROGRESSO'
            ? 55
            : estado === 'TODO'
            ? 20
            : 10
        return {
          id: story.codigoUs,
          title: story.titulo,
          description: release.descricao || `Entrega planeada para ${release.tituloRelease}`,
          release: release.tituloRelease,
          team: teamName,
          leader,
          status: estado,
          statusBadge,
          progress,
          dataInicio: release.dataInicio,
          dataFim: release.dataFim,
          startMonth: release.dataInicio ? new Date(release.dataInicio).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : '—',
          endMonth: release.dataFim ? new Date(release.dataFim).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : '—',
          dependencies: [],
        }
      })
    )
    if (selectedRelease === 'ALL') return epics
    return epics.filter((epic) => epic.release === selectedRelease)
  }, [selectedRelease, roadmap, dataContext.stories, teamName])

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Roadmap
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Planeie lançamentos, acompanhe a timeline real dos Sprints e visualize dependências entre entregas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
          >
            Exportar PDF
          </Button>

          {canManageLifecycle && (
            <Button
              variant="secondary"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => modalContext.openSprintModal?.(null)}
            >
              Criar sprint
            </Button>
          )}

          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={() => modalContext.openNewFeatureModal?.()}
          >
            Adicionar funcionalidade
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-[#DCFCE7] dark:bg-[#123823] border border-[#22C55E]/50 text-[#166534] dark:text-[#86EFAC] rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="underline hover:font-bold cursor-pointer">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Controlos */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Escala Temporal
            </label>
            <Select
              options={[
                { value: 'Semanas', label: 'Semanas' },
                { value: 'Meses', label: 'Meses' },
                { value: 'Trimestres', label: 'Trimestres' },
              ]}
              value={scale}
              onChange={(val) => setScale(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Agrupamento
            </label>
            <Select
              options={[
                { value: 'Por release', label: 'Por release' },
                { value: 'Por equipa', label: 'Por equipa' },
              ]}
              value={groupBy}
              onChange={(val) => setGroupBy(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Filtro de Release
            </label>
            <Select
              options={releaseOptions}
              value={selectedRelease}
              onChange={(val) => setSelectedRelease(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Marcos Críticos */}
      {milestones.length > 0 && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Milestone className="w-4 h-4 text-brand-action" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-fg-primary">
              Marcos Críticos de Lançamento
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {milestones.map((m) => (
              <div
                key={m.title}
                className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
                  m.status === 'done'
                    ? 'border-[#BBF7D0] dark:border-[#22C55E]/40 bg-[#DCFCE7]/40 dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC]'
                    : 'border-brand-primary/30 bg-brand-selection/50 text-brand-action font-semibold'
                }`}
              >
                <div>
                  <div className="font-bold">{m.title}</div>
                  <div className="text-[11px] text-fg-secondary mt-0.5">{m.date} · {m.release}</div>
                </div>
                {m.badge && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-action text-white">
                    {m.badge}
                  </span>
                )}
                {m.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#86EFAC]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Visualização Gantt Dinâmica: Sprints + Épicos */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="grid grid-cols-12 bg-bg-page/80 border-b border-border-subtle text-xs font-semibold text-fg-secondary">
          <div className="col-span-4 p-3 text-fg-primary border-r border-border-subtle">
            Sprints, Épicos e Objetivos
          </div>
          <div
            className="col-span-8 grid divide-x divide-border-subtle"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, buckets.length)}, minmax(0, 1fr))` }}
          >
            {buckets.map((bucket) => (
              <div key={bucket.key} className="p-3 text-center truncate">
                {bucket.label}
              </div>
            ))}
          </div>
        </div>

        {/* Faixa de Sprints Reais */}
        <div className="divide-y divide-border-subtle/60 border-b border-border-subtle">
          {sprints.length === 0 ? (
            <div className="p-4 text-xs text-fg-secondary flex items-center justify-between">
              <span>Nenhum Sprint definido nesta janela temporal.</span>
              {canManageLifecycle && (
                <button
                  type="button"
                  onClick={() => modalContext.openSprintModal?.(null)}
                  className="font-semibold text-brand-action hover:underline cursor-pointer"
                >
                  Criar primeiro sprint →
                </button>
              )}
            </div>
          ) : (
            sprints.map((sp) => {
              const { leftPct, widthPct } = computeBarPlacement(sp.dataInicio, sp.dataFim, minMs, spanMs)
              const startLabel = sp.dataInicio ? new Date(sp.dataInicio).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '—'
              const endLabel = sp.dataFim ? new Date(sp.dataFim).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '—'

              return (
                <div
                  key={sp.idSprint}
                  className="grid grid-cols-12 items-center hover:bg-bg-page/40 transition-colors p-3.5 gap-2"
                >
                  <div className="col-span-12 md:col-span-4 pr-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-fg-primary">
                        Sprint {sp.numeroSprint}
                      </div>
                      <div className="text-[11px] text-fg-secondary">
                        {startLabel} – {endLabel} {sp.capacidadeMaxima ? `· ${sp.capacidadeMaxima} SP` : ''}
                      </div>
                    </div>
                    {canManageLifecycle && (
                      <button
                        type="button"
                        onClick={() => modalContext.openSprintModal?.(sp)}
                        className="text-[11px] font-semibold text-brand-action hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-8 relative py-1">
                    <div className="w-full bg-bg-disabled-emphasis h-6 rounded-lg overflow-hidden relative">
                      {todayPercent !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-brand-primary z-20"
                          style={{ left: `${todayPercent}%` }}
                          title="Hoje"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => canManageLifecycle && modalContext.openSprintModal?.(sp)}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        className={`absolute top-0 h-full rounded-lg flex items-center justify-between px-2.5 text-[11px] font-bold text-white cursor-pointer ${
                          sp.estado === 'CONCLUIDO'
                            ? 'bg-[#16A34A]'
                            : sp.estado === 'ATIVO'
                            ? 'bg-brand-action'
                            : sp.estado === 'CANCELADO'
                            ? 'bg-[#DC2626]'
                            : 'bg-[#8B5CF6]'
                        }`}
                      >
                        <span className="truncate">S{sp.numeroSprint}</span>
                        <span className="text-[10px] opacity-90">{sp.estado}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Lista de Épicos / Releases */}
        <div className="divide-y divide-border-subtle/60">
          {filteredEpics.length === 0 ? (
            <div className="p-6 text-center text-xs text-fg-secondary">
              Nenhuma release ou épico associado no Roadmap atual.
            </div>
          ) : (
            filteredEpics.map((epic) => {
              const { leftPct, widthPct } = computeBarPlacement(epic.dataInicio, epic.dataFim, minMs, spanMs)
              return (
                <div
                  key={epic.id}
                  className="grid grid-cols-12 items-center hover:bg-bg-page/40 transition-colors p-3.5 gap-2"
                >
                  <div className="col-span-12 md:col-span-4 pr-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-bg-page px-1.5 py-0.5 rounded text-fg-secondary border border-border-subtle">
                        {epic.id}
                      </span>
                      <span className="font-bold text-xs text-fg-primary">
                        {epic.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-secondary line-clamp-1">
                      {epic.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-fg-secondary">
                      <span className="flex items-center gap-1">
                        <Avatar name={epic.leader?.name} initials={epic.leader?.initials} size={18} />
                        {epic.leader?.name || epic.team}
                      </span>
                      <span>•</span>
                      <StatusBadge status={epic.statusBadge} />
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-8 relative py-2">
                    <div className="w-full bg-bg-disabled-emphasis h-7 rounded-lg overflow-hidden relative shadow-2xs">
                      {todayPercent !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-brand-primary z-20"
                          style={{ left: `${todayPercent}%` }}
                          title="Hoje"
                        />
                      )}
                      <div
                        className={`absolute top-0 h-full rounded-lg flex items-center justify-between px-3 text-[11px] font-bold text-white transition-all duration-300 ${
                          epic.statusBadge === 'complete'
                            ? 'bg-[#16A34A]'
                            : epic.statusBadge === 'development' || epic.statusBadge === 'analysis'
                            ? 'bg-brand-action'
                            : epic.statusBadge === 'rejected'
                            ? 'bg-[#DC2626]'
                            : 'bg-[#707987]'
                        }`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <span className="truncate">{epic.release}</span>
                        <span>{epic.progress}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-fg-secondary mt-1 px-1">
                      <span>{epic.startMonth}</span>
                      <span>{epic.endMonth}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductRoadmapPage
