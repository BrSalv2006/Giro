import { useMemo, useState } from 'react'
import { Calendar, Edit2, Plus } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const STATUS_META = {
  ATIVO: {
    label: 'Em curso',
    pill: 'bg-brand-action text-white',
    bar: 'bg-brand-action',
    ring: 'border-brand-primary bg-brand-selection/40',
  },
  PLANEADO: {
    label: 'Planeado',
    pill: 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD]',
    bar: 'bg-[#8B5CF6]',
    ring: 'border-border-subtle bg-bg-surface',
  },
  CONCLUIDO: {
    label: 'Concluído',
    pill: 'bg-[#DCFCE7] dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC]',
    bar: 'bg-[#22C55E]',
    ring: 'border-border-subtle bg-bg-surface',
  },
  CANCELADO: {
    label: 'Cancelado',
    pill: 'bg-[#FEE2E2] dark:bg-[#451B1B] text-[#DC2626] dark:text-[#FCA5A5]',
    bar: 'bg-[#EF4444]',
    ring: 'border-border-subtle bg-bg-page opacity-75',
  },
}

function formatShortDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

/**
 * SprintTimelineStrip
 * Visual chronological timeline showing Sprint windows, dates, status, today marker, and point load.
 */
export function SprintTimelineStrip({
  sprints = [],
  stories = [],
  selectedSprintId = null,
  onSelectSprint,
  onEditSprint,
  onCreateSprint,
  canManage = false,
  compact = false,
}) {
  const [nowMs] = useState(() => Date.now())

  const { orderedSprints, minMs, totalSpanMs, todayPercent } = useMemo(() => {
    const ordered = [...sprints].sort((a, b) => {
      const da = new Date(a.dataInicio).getTime()
      const db = new Date(b.dataInicio).getTime()
      if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) return da - db
      return (a.numeroSprint || 0) - (b.numeroSprint || 0)
    })

    const validTimes = ordered.flatMap((sp) => [
      new Date(sp.dataInicio).getTime(),
      new Date(sp.dataFim).getTime(),
    ]).filter((t) => !Number.isNaN(t))

    if (!validTimes.length) {
      return { orderedSprints: ordered, minMs: nowMs, totalSpanMs: 1, todayPercent: null }
    }

    const min = Math.min(...validTimes)
    const max = Math.max(...validTimes)
    const span = Math.max(86400000, max - min)
    const pct = nowMs >= min && nowMs <= max ? ((nowMs - min) / span) * 100 : null

    return { orderedSprints: ordered, minMs: min, totalSpanMs: span, todayPercent: pct }
  }, [sprints, nowMs])

  if (!orderedSprints.length) {
    return (
      <div className="bg-bg-surface border border-dashed border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-fg-secondary">
          <Calendar className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
          <span>Ainda não existem Sprints planeados na timeline do projeto.</span>
        </div>
        {canManage && onCreateSprint && (
          <button
            type="button"
            onClick={onCreateSprint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-action hover:bg-brand-hover text-white text-xs font-semibold cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Criar primeiro Sprint
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-action shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-primary">
            Timeline de Sprints ({orderedSprints.length})
          </h2>
        </div>
        {canManage && onCreateSprint && (
          <button
            type="button"
            onClick={onCreateSprint}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-action hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo Sprint
          </button>
        )}
      </div>

      {/* Relative Timeline Bar */}
      {!compact && (
        <div className="relative h-9 rounded-lg bg-bg-page border border-border-subtle/80 px-2 flex items-center overflow-hidden">
          {todayPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-brand-primary z-20"
              style={{ left: `${todayPercent}%` }}
              title="Hoje"
            />
          )}
          <div className="relative w-full h-5">
            {orderedSprints.map((sp) => {
              const startMs = new Date(sp.dataInicio).getTime()
              const endMs = new Date(sp.dataFim).getTime()
              const leftPct = Math.max(0, Math.min(96, ((startMs - minMs) / totalSpanMs) * 100))
              const rawWidthPct = ((endMs - startMs) / totalSpanMs) * 100
              const widthPct = Math.max(4, Math.min(100 - leftPct, rawWidthPct))
              const meta = STATUS_META[sp.estado] || STATUS_META.PLANEADO
              const isSelected = selectedSprintId === sp.idSprint
              return (
                <button
                  key={sp.idSprint}
                  type="button"
                  onClick={() => onSelectSprint?.(sp.idSprint)}
                  title={`Sprint ${sp.numeroSprint}: ${formatShortDate(sp.dataInicio)} – ${formatShortDate(sp.dataFim)}`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={cn(
                    'absolute top-0 h-5 rounded text-[10px] font-bold text-white px-1.5 truncate cursor-pointer transition-all flex items-center justify-center',
                    meta.bar,
                    isSelected ? 'ring-2 ring-border-focusRing z-10 shadow-sm' : 'opacity-85 hover:opacity-100'
                  )}
                >
                  S{sp.numeroSprint}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sprint Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {orderedSprints.map((sp) => {
          const meta = STATUS_META[sp.estado] || STATUS_META.PLANEADO
          const isSelected = selectedSprintId === sp.idSprint
          const spStories = stories.filter(
            (st) =>
              st.sprintId === sp.idSprint ||
              st.sprint === `sprint-${sp.numeroSprint}` ||
              st.target === `Sprint ${sp.numeroSprint}`
          )
          const spPoints = spStories.reduce((acc, st) => acc + (st.points || 0), 0)
          const durationDays = Math.max(
            1,
            Math.round((new Date(sp.dataFim).getTime() - new Date(sp.dataInicio).getTime()) / 86400000)
          )

          return (
            <div
              key={sp.idSprint}
              onClick={() => onSelectSprint?.(sp.idSprint)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer space-y-1.5',
                meta.ring,
                isSelected && 'ring-2 ring-brand-primary border-brand-primary'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-fg-primary truncate">
                    Sprint {sp.numeroSprint}
                  </span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0', meta.pill)}>
                    {meta.label}
                  </span>
                </div>
                {canManage && onEditSprint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditSprint(sp)
                    }}
                    className="p-1 rounded text-fg-secondary hover:text-fg-primary hover:bg-bg-page cursor-pointer"
                    title={`Editar Sprint ${sp.numeroSprint}`}
                    aria-label={`Editar Sprint ${sp.numeroSprint}`}
                  >
                    <Edit2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="text-[11px] text-fg-secondary flex items-center justify-between gap-1">
                <span>
                  {formatShortDate(sp.dataInicio)} – {formatShortDate(sp.dataFim)}
                </span>
                <span className="font-mono">{durationDays}d</span>
              </div>

              <div className="text-[11px] font-medium text-fg-primary flex items-center justify-between">
                <span>{spStories.length} histórias</span>
                <span className="text-fg-secondary">
                  {spPoints}{sp.capacidadeMaxima ? ` / ${sp.capacidadeMaxima}` : ''} SP
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SprintTimelineStrip
