import { cn } from '../../utils/cn.js'
import logoMark from '../../assets/brand/Logo.svg'
import logoBackground from '../../assets/brand/LogoBackground.svg'

const WORDMARK_ASPECT_RATIO = 387.577 / 206.608

/**
 * GIRO Brand Mark (Icon / Emblem)
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

/**
 * GIRO Inline SVG Wordmark
 * Renders with currentColor so it adapts seamlessly between Light and Dark themes
 * and keeps exact viewBox dimensions so header siblings never overlap.
 */
function GiroWordmark({ height }) {
  const width = Math.round(height * WORDMARK_ASPECT_RATIO)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 387.577 206.608"
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="shrink-0 block text-fg-primary"
      aria-label="GIRO"
      role="img"
    >
      <g fill="currentColor">
        <path d="M23.477 57.5 C46.377 41.9 69.677 40.1 93.677 54 C96.877 46.5 96.877 46.5 105.377 46.5 L122.877 46.4 C126.077 46.4 127.777 47.4 127.777 51 L127.377 148 C126.477 178.5 104.077 201.4 73.077 205.7 C54.777 208.3 37.577 205.5 22.077 194.9 C16.577 191.2 12.277 186.4 8.677 180.9 C7.077 178.5 7.077 176.8 9.777 175.3 L25.577 165.7 C28.377 163.8 30.177 164.7 32.477 166.7 C45.877 178.5 67.277 180.9 81.877 172 C89.877 167.1 94.477 159.9 94.377 149.1 C74.277 163.1 53.577 165 31.877 155.6 C19.977 150.4 11.377 141.5 5.577 130 C-6.423 106.3 1.577 73.7 23.477 57.5 Z M60.277 132.1 C66.777 132.6 73.177 131.9 79.177 128.8 C92.077 122.1 97.877 108.1 93.377 94.7 C88.477 80.2 74.077 72.9 58.577 75.3 C43.377 77.6 33.477 89.7 33.677 104.4 C33.777 118.9 43.677 129.5 60.277 132.1 Z" />
        <path d="M147.677 46.4 L171.977 46.4 C174.462 46.4 176.477 48.415 176.477 50.9 L176.477 160.2 C176.477 162.685 174.462 164.7 171.977 164.7 L147.677 164.7 C145.192 164.7 143.177 162.685 143.177 160.2 L143.177 50.9 C143.177 48.415 145.192 46.4 147.677 46.4 Z" />
        <circle cx="159.777" cy="19.6" r="19.6" />
        <path d="M195.677 164.6 C192.077 164.3 192.177 162 192.177 159.8 L192.077 51.9 C192.077 48 193.577 46.4 197.377 46.4 L219.377 46.4 C223.077 46.4 224.477 47.8 223.877 51.5 C223.577 53.7 223.977 55.8 224.977 58.6 C231.477 50.1 240.177 46.6 250.177 45.6 C256.577 45 257.477 45.7 257.477 52.1 L257.477 72.1 C257.477 75.4 256.177 76.7 252.777 76.8 C233.977 77.3 225.677 86 225.677 104.9 L225.677 158.8 C225.777 163.5 224.177 164.9 219.577 164.8 Z" />
        <path d="M322.177 43.2 C359.177 43.2 387.577 70.2 387.577 105.5 C387.577 140.8 359.177 167.8 322.177 167.8 C285.177 167.8 256.777 140.8 256.777 105.5 C256.777 70.2 285.177 43.2 322.177 43.2 Z M322.177 74.6 C304.177 74.6 290.577 87.8 290.577 105.5 C290.577 123.2 304.177 136.4 322.177 136.4 C340.177 136.4 353.777 123.2 353.777 105.5 C353.777 87.8 340.177 74.6 322.177 74.6 Z" />
      </g>
    </svg>
  )
}

const SIZE_CONFIGS = {
  xs: { mark: 20, gap: 'gap-1.5' },
  sm: { mark: 24, gap: 'gap-2' },
  md: { mark: 32, gap: 'gap-2.5' },
  lg: { mark: 40, gap: 'gap-3' },
  xl: { mark: 52, gap: 'gap-3.5' },
}

export function BrandLogo({
  layout = 'full',
  size = 'md',
  className,
  ...props
}) {
  const isCustomSize = typeof size === 'number'
  const config = isCustomSize
    ? { mark: size, gap: 'gap-2.5' }
    : SIZE_CONFIGS[size] || SIZE_CONFIGS.md

  if (layout === 'markOnly') {
    return <GiroMark size={config.mark} className={className} {...props} />
  }

  const wordmarkHeight = Math.max(18, Math.round(config.mark * 0.7))

  return (
    <div
      className={cn('inline-flex items-center shrink-0 select-none', config.gap, className)}
      aria-label="GIRO - Plataforma de Gestão de Backlog"
      {...props}
    >
      <GiroMark size={config.mark} />
      {layout !== 'compact' && <GiroWordmark height={wordmarkHeight} />}
    </div>
  )
}

export default BrandLogo
