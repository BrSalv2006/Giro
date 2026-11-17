import { useId } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * GIRO Brand Mark (Icon / Emblem)
 * Rotation & orbit motif representing agility, continuous backlog refinement and feedback loop.
 */
function GiroMark({ size = 32, className, ...props }) {
  const rawId = useId()
  const gradId = `giro-grad-${rawId.replace(/:/g, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="4" x2="34" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B55" />
          <stop offset="45%" stopColor="#E6533D" />
          <stop offset="100%" stopColor="#B93826" />
        </linearGradient>
      </defs>

      {/* Orbit 1: Sweeping dynamic outer arc */}
      <path
        d="M18 3.5C26.0081 3.5 32.5 9.99187 32.5 18C32.5 21.4392 31.3023 24.5985 29.294 27.0989L25.9686 24.4287C27.2472 22.6517 28 20.4187 28 18C28 12.4772 23.5228 8 18 8C15.352 8 12.9463 9.02797 11.1611 10.7077L7.86337 7.64796C10.4578 4.96698 14.0326 3.5 18 3.5Z"
        fill={`url(#${gradId})`}
      />

      {/* Orbit 2: Complementary inner reverse arc */}
      <path
        d="M18 32.5C9.99187 32.5 3.5 26.0081 3.5 18C3.5 14.6394 4.64654 11.5458 6.58789 9.08332L9.84586 11.8317C8.42398 13.5678 7.57143 15.6888 7.57143 18C7.57143 23.7596 12.2404 28.4286 18 28.4286C20.697 28.4286 23.1417 27.3621 24.9392 25.6267L28.1884 28.7347C25.5412 31.0664 21.9366 32.5 18 32.5Z"
        fill="#B93826"
      />

      {/* Central orbit core (feature focal point) */}
      <circle cx="18" cy="18" r="5" fill={`url(#${gradId})`} />

      {/* Orbiting satellite dot */}
      <circle cx="28.5" cy="10.5" r="2.5" fill="#E6533D" />
    </svg>
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
  subtitle = 'Priorização & Backlog',
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

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline">
          <span className={cn('font-bold tracking-tight text-fg-primary', config.text)}>
            gir
          </span>
          <span className={cn('font-black tracking-tight text-brand-primary', config.text)}>
            o
          </span>
          {layout === 'full' && (
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand-primary self-center" />
          )}
        </div>

        {layout === 'full' && subtitle && (
          <span
            className={cn(
              'font-medium tracking-wide uppercase text-fg-secondary mt-0.5',
              config.subtext
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

export default BrandLogo
