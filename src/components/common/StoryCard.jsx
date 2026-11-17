import { cn } from '../../utils/cn.js'
import { Avatar } from './Avatar.jsx'
import { AlertCircle, Sparkles } from './Icons.jsx'

/**
 * Priority badge color mapping
 */
function getPriorityStyle(priority) {
  if (!priority) return null
  const p = priority.toString().toUpperCase()
  if (p.includes('P1') || p.includes('ALTA') || p.includes('MUST')) {
    return 'bg-[#FFE3DC] text-[#B93826] border-[#F8C1B7]'
  }
  if (p.includes('P2') || p.includes('MÉD') || p.includes('MED') || p.includes('SHOULD')) {
    return 'bg-[#FEF3C7] text-[#7A4D00] border-[#FDE68A]'
  }
  return 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]'
}

/**
 * StoryCard Component
 *
 * @param {string} code - User story code (e.g. "US-01", "RF-04")
 * @param {string} title - User story summary/title
 * @param {number} [storyPoints] - Effort points
 * @param {{ name: string, avatar?: string }} [assignee] - Assigned developer or PO
 * @param {boolean} [blocked=false] - Whether story has an active impediment
 * @param {string} [blockedReason] - Cause of blocker
 * @param {string} [priority] - Priority level ('P1', 'P2', 'P3', 'Must Have', etc.)
 * @param {Function} [onClick] - Click handler
 * @param {string} [className] - Additional CSS classes
 */
export function StoryCard({
  code,
  title,
  storyPoints,
  assignee,
  blocked = false,
  blockedReason,
  priority,
  onClick,
  className,
  ...props
}) {
  const priorityStyle = getPriorityStyle(priority)
  const isInteractive = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.(e)
              }
            }
          : undefined
      }
      className={cn(
        // Base container
        'group bg-bg-surface border rounded-lg p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-150',
        'border-border-subtle hover:border-border-control/70 hover:shadow-xs',
        isInteractive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring',
        // Blocked state border accent
        blocked && 'border-l-4 border-l-[#DC2626]',
        className
      )}
      {...props}
    >
      {/* Header: Code, Priority, Blocked Indicator */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {code && (
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-bg-page border border-border-subtle text-fg-primary uppercase tracking-wider">
              {code}
            </span>
          )}

          {priority && (
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded border leading-none',
                priorityStyle
              )}
            >
              {priority}
            </span>
          )}
        </div>

        {/* Impediment Alert Badge */}
        {blocked && (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[11px] font-semibold"
            title={blockedReason || 'Item com impedimento ativo'}
            aria-label={`Impedimento: ${blockedReason || 'Bloqueado'}`}
          >
            <AlertCircle size={13} className="shrink-0 text-[#DC2626]" />
            <span>Bloqueado</span>
          </div>
        )}
      </div>

      {/* Main Title */}
      <h4 className="font-medium text-sm text-fg-primary leading-snug line-clamp-2 my-0 group-hover:text-brand-action transition-colors">
        {title}
      </h4>

      {/* Blocked Reason Note (if blocked) */}
      {blocked && blockedReason && (
        <div className="text-xs text-[#DC2626] bg-[#FFE3DC]/50 border border-[#F8C1B7] rounded px-2.5 py-1 leading-tight flex items-start gap-1.5">
          <span className="font-semibold shrink-0">Motivo:</span>
          <span className="truncate">{blockedReason}</span>
        </div>
      )}

      {/* Footer: Story Points and Assignee Avatar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/50 mt-1">
        {/* Story Points */}
        {storyPoints !== undefined && storyPoints !== null ? (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-page border border-border-subtle text-fg-secondary text-xs font-semibold"
            title={`${storyPoints} Story Points`}
          >
            <Sparkles size={12} className="text-brand-primary" />
            <span>{storyPoints} SP</span>
          </div>
        ) : (
          <div />
        )}

        {/* Assignee Avatar */}
        {assignee && (
          <div className="flex items-center gap-1.5" title={assignee.name || 'Responsável'}>
            <span className="text-xs text-fg-secondary max-w-[120px] truncate hidden sm:inline">
              {assignee.name}
            </span>
            <Avatar
              name={assignee.name}
              src={assignee.avatar}
              size={28}
              shape="circle"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default StoryCard
