import { cn } from '../../utils/cn.js'
import logoMark from '../../assets/brand/Logo.svg'
import logoBackground from '../../assets/brand/LogoBackground.svg'
import logoText from '../../assets/brand/Text.svg'

/**
 * GIRO Brand Mark (Icon / Emblem)
 * Rotation & orbit motif representing agility, continuous backlog refinement and feedback loop.
 */
function GiroMark({ size = 32, className, withBackground = false, ...props }) {
  return (
    <img
      src={withBackground ? logoBackground : logoMark}
      width={size}
      height={size}
      className={cn('shrink-0 select-none object-contain', className)}
      alt=""
      draggable="false"
      {...props}
    />
  )
}

const SIZE_CONFIGS = {
  xs: { mark: 20, text: 'text-base', subtext: 'text-[9px]', gap: 'gap-1.5' },
  sm: { mark: 24, text: 'text-lg', subtext: 'text-[10px]', gap: 'gap-2' },
  md: { mark: 32, text: 'text-2xl', subtext: 'text-xs', gap: 'gap-2.5' },
  lg: { mark: 40, text: 'text-3xl', subtext: 'text-xs', gap: 'gap-3' },
  xl: { mark: 52, text: 'text-4xl', subtext: 'text-sm', gap: 'gap-3.5' },
}

/**
 * BrandLogo Component
 *
 * @param {'full'|'compact'|'markOnly'} layout - Layout mode
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|number} size - Size preset or numeric px
 * @param {string} subtitle - Optional custom subtitle for 'full' layout
 * @param {string} className - Additional CSS classes
 */
export function BrandLogo({
  layout = 'full',
  size = 'md',
  className,
  ...props
}) {
  const isCustomSize = typeof size === 'number'
  const config = isCustomSize
    ? {
        mark: size,
        text: size < 28 ? 'text-lg' : size < 44 ? 'text-2xl' : 'text-3xl',
        subtext: 'text-xs',
        gap: 'gap-2.5',
      }
    : SIZE_CONFIGS[size] || SIZE_CONFIGS.md

  if (layout === 'markOnly') {
    return <GiroMark size={config.mark} className={className} {...props} />
  }

  return (
    <div
      className={cn('inline-flex items-center select-none', config.gap, className)}
      role="banner"
      aria-label="GIRO - Plataforma de Gestão de Backlog"
      {...props}
    >
      <GiroMark size={config.mark} />
      {layout !== 'compact' && (
        <img
          src={logoText}
          alt="GIRO"
          height={Math.max(18, config.mark * 0.7)}
          className="h-auto w-auto max-h-[44px] object-contain"
        />
      )}
    </div>
  )
}

export default BrandLogo
