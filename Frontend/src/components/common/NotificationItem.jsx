import { cn } from '../../utils/cn.js'
import {
  Bell,
  ArrowUp,
  Mail,
  AlertCircle,
  Check,
  Close,
  Sparkles,
} from './Icons.jsx'

/**
 * Type-to-icon mapping for GIRO notification categories
 */
function renderTypeIcon(type, density) {
  const iconSize = density === 'compact' ? 14 : 16

  switch (type) {
    case 'vote':
      return (
        <div className="p-1.5 rounded-full bg-[#FFE3DC] text-[#B93826] shrink-0">
          <ArrowUp size={iconSize} strokeWidth={2.5} />
        </div>
      )
    case 'status':
      return (
        <div className="p-1.5 rounded-full bg-[#DCFCE7] text-[#166534] shrink-0">
          <Check size={iconSize} strokeWidth={2.5} />
        </div>
      )
    case 'impediment':
      return (
        <div className="p-1.5 rounded-full bg-[#FEE2E2] text-[#DC2626] shrink-0">
          <AlertCircle size={iconSize} strokeWidth={2.5} />
        </div>
      )
    case 'ai':
      return (
        <div className="p-1.5 rounded-full bg-[#EDE9FE] text-[#5B21B6] shrink-0">
          <Sparkles size={iconSize} strokeWidth={2.5} />
        </div>
      )
    case 'comment':
      return (
        <div className="p-1.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
          <Mail size={iconSize} strokeWidth={2} />
        </div>
      )
    case 'info':
    case 'system':
    default:
      return (
        <div className="p-1.5 rounded-full bg-slate-100 text-fg-secondary shrink-0">
          <Bell size={iconSize} strokeWidth={2} />
        </div>
      )
  }
}

/**
 * NotificationItem Component
 *
 * @param {string|number} id - Unique notification ID
 * @param {string} title - Main notification headline
 * @param {string|React.ReactNode} [description] - Detailed message text
 * @param {string} [timestamp] - Formatted time (e.g. "há 5 min")
 * @param {boolean} [read=false] - Read/unread state
 * @param {'detailed'|'compact'} [density='detailed'] - Display density
 * @param {'vote'|'status'|'impediment'|'comment'|'ai'|'info'|'system'} [type='info'] - Category of notification
 * @param {Function} [onMarkRead] - Callback (id) => void
 * @param {Function} [onDismiss] - Callback (id) => void
 * @param {Function} [onClick] - Click handler on whole item
 * @param {string} [className] - Additional CSS classes
 */
export function NotificationItem({
  id,
  title,
  description,
  timestamp,
  read = false,
  density = 'detailed',
  type = 'info',
  onMarkRead,
  onDismiss,
  onClick,
  className,
  ...props
}) {
  const isCompact = density === 'compact'

  const handleItemClick = (e) => {
    if (!read && onMarkRead) {
      onMarkRead(id)
    }
    onClick?.(id, e)
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    onDismiss?.(id)
  }

  const handleToggleRead = (e) => {
    e.stopPropagation()
    onMarkRead?.(id)
  }

  return (
    <div
      onClick={handleItemClick}
      role="article"
      aria-label={`${read ? 'Notificação lida:' : 'Notificação não lida:'} ${title}`}
      className={cn(
        // Base container
        'group relative flex items-start justify-between gap-3 border rounded-lg transition-all duration-150 select-none',
        'bg-bg-surface border-border-subtle hover:border-border-control/60 hover:shadow-xs',
        isCompact ? 'p-2.5 gap-2' : 'p-3.5 gap-3',
        // Unread visual accent & styling
        !read && 'bg-blue-50/20 border-l-4 border-l-[#005FCC]',
        read && 'opacity-80 hover:opacity-100',
        (onClick || !read) && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {/* Left side: Blue unread dot + Type Icon */}
      <div className="flex items-center gap-2 pt-0.5 shrink-0">
        {/* Visual blue dot indicator for unread */}
        <span
          className={cn(
            'rounded-full transition-opacity',
            isCompact ? 'w-2 h-2' : 'w-2.5 h-2.5',
            !read ? 'bg-[#005FCC]' : 'bg-transparent opacity-0'
          )}
          aria-hidden="true"
          title={!read ? 'Não lida' : 'Lida'}
        />

        {renderTypeIcon(type, density)}
      </div>

      {/* Center: Title, Description, Timestamp */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h5
            className={cn(
              'font-semibold text-fg-primary truncate leading-tight',
              isCompact ? 'text-xs' : 'text-sm',
              !read && 'font-bold'
            )}
          >
            {title}
          </h5>

          {timestamp && (
            <span
              className={cn(
                'text-fg-secondary shrink-0 whitespace-nowrap',
                isCompact ? 'text-[10px]' : 'text-xs'
              )}
            >
              {timestamp}
            </span>
          )}
        </div>

        {description && (
          <p
            className={cn(
              'text-fg-secondary leading-relaxed m-0',
              isCompact ? 'text-[11px] line-clamp-1' : 'text-xs line-clamp-2'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Right: Actions (Mark Read, Dismiss) */}
      <div className="flex items-center gap-1 shrink-0 pt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
        {!read && onMarkRead && (
          <button
            type="button"
            onClick={handleToggleRead}
            className="p-1 rounded text-fg-secondary hover:text-[#005FCC] hover:bg-bg-page focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#005FCC]"
            title="Marcar como lida"
            aria-label="Marcar como lida"
          >
            <Check size={isCompact ? 13 : 15} />
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded text-fg-secondary hover:text-[#DC2626] hover:bg-bg-page focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DC2626]"
            title="Dispensar notificação"
            aria-label="Dispensar notificação"
          >
            <Close size={isCompact ? 13 : 15} />
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationItem
