import { cn } from '../../utils/cn.js'
import { Icon } from './Icons.jsx'

/**
 * Trend styling configuration
 */
const TREND_CONFIGS = {
  positive: {
    container: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    arrow: (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  negative: {
    container: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
    arrow: (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2.5V9.5M6 9.5L2.5 6M6 9.5L9.5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  neutral: {
    container: 'bg-[#E4E5EA] text-[#626976] border-[#CDD1D8]',
    arrow: (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 6H9.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

/**
 * MetricCard Component
 *
 * @param {string} title - Label of the metric
 * @param {string|number} value - Primary numeric / formatted value
 * @param {string} [change] - Trend percentage or diff (e.g. "+12.5%", "-3%")
 * @param {'positive'|'neutral'|'negative'} [trend] - Direction of trend
 * @param {'standard'|'compact'} [size='standard'] - Display density
 * @param {React.ReactNode|string} [icon] - Leading icon element or icon name
 * @param {string} [subtitle] - Secondary helper caption
 * @param {string} [className] - Additional CSS classes
 */
export function MetricCard({
  title,
  value,
  change,
  trend,
  size = 'standard',
  icon,
  subtitle,
  className,
  ...props
}) {
  // Infer trend from change string if not explicitly supplied
  const resolvedTrend =
    trend ||
    (change?.toString().startsWith('+')
      ? 'positive'
      : change?.toString().startsWith('-')
      ? 'negative'
      : 'neutral')

  const trendStyle = TREND_CONFIGS[resolvedTrend] || TREND_CONFIGS.neutral
  const isCompact = size === 'compact'

  const renderIcon = () => {
    if (!icon) return null
    if (typeof icon === 'string') {
      return (
        <div className="flex items-center justify-center p-2 rounded-lg bg-bg-page border border-border-subtle text-fg-primary shrink-0">
          <Icon name={icon} size={isCompact ? 16 : 20} />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center p-2 rounded-lg bg-bg-page border border-border-subtle text-fg-primary shrink-0">
        {icon}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-lg transition-all duration-150',
        'hover:border-border-control/60 hover:shadow-xs',
        isCompact ? 'p-3.5 gap-2' : 'p-5 gap-3',
        'flex flex-col justify-between',
        className
      )}
      {...props}
    >
      {/* Header: Title and optional Icon */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'font-medium text-fg-secondary truncate',
            isCompact ? 'text-xs' : 'text-sm'
          )}
          title={title}
        >
          {title}
        </span>
        {renderIcon()}
      </div>

      {/* Main Metric Value and Change Pill */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span
          className={cn(
            'font-bold tracking-tight text-fg-primary',
            isCompact ? 'text-xl' : 'text-3xl'
          )}
        >
          {value}
        </span>

        {change && (
          <div
            className={cn(
              'inline-flex items-center gap-1 font-semibold rounded-full border px-2 py-0.5 leading-none shrink-0',
              isCompact ? 'text-[11px]' : 'text-xs',
              trendStyle.container
            )}
            aria-label={`Variação de ${change} (${resolvedTrend})`}
          >
            {trendStyle.arrow}
            <span>{change}</span>
          </div>
        )}
      </div>

      {/* Optional Subtitle */}
      {subtitle && (
        <p
          className={cn(
            'text-fg-secondary m-0 truncate',
            isCompact ? 'text-[11px] -mt-1' : 'text-xs -mt-1'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default MetricCard
