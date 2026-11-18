import { useState, useMemo } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * Size mappings for dimensions and font sizes
 */
const SIZE_MAP = {
  24: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
    dot: 'w-2 h-2 ring-1',
    svgIcon: 14,
  },
  28: {
    container: 'w-7 h-7',
    text: 'text-[11px]',
    dot: 'w-2 h-2 ring-[1.5px]',
    svgIcon: 16,
  },
  32: {
    container: 'w-8 h-8',
    text: 'text-xs',
    dot: 'w-2.5 h-2.5 ring-2',
    svgIcon: 18,
  },
  36: {
    container: 'w-9 h-9',
    text: 'text-xs',
    dot: 'w-2.5 h-2.5 ring-2',
    svgIcon: 20,
  },
  40: {
    container: 'w-10 h-10',
    text: 'text-sm',
    dot: 'w-3 h-3 ring-2',
    svgIcon: 22,
  },
  48: {
    container: 'w-12 h-12',
    text: 'text-base',
    dot: 'w-3.5 h-3.5 ring-2',
    svgIcon: 26,
  },
}

/**
 * Palette mapped to GIRO status & brand tokens for initial fallbacks
 */
const COLOR_VARIANTS = [
  { bg: 'bg-[#FFE3DC]', text: 'text-[#B93826]', border: 'border-[#F8C1B7]' }, // Brand Coral
  { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]', border: 'border-[#DDD6FE]' }, // Purple
  { bg: 'bg-[#FEF3C7]', text: 'text-[#7A4D00]', border: 'border-[#FDE68A]' }, // Amber
  { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', border: 'border-[#BBF7D0]' }, // Green
  { bg: 'bg-[#E0F2FE]', text: 'text-[#075985]', border: 'border-[#BAE6FD]' }, // Sky
  { bg: 'bg-[#E4E5EA]', text: 'text-[#292D35]', border: 'border-[#CDD1D8]' }, // Neutral
]

function getInitials(name) {
  if (!name || typeof name !== 'string') return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Avatar Component
 *
 * @param {string} name - User display name
 * @param {string} [initials] - Optional explicit initials override
 * @param {string} src - Image URL
 * @param {24|28|32|36|40|48} size - Pixel size preset (default: 36)
 * @param {'circle'|'square'} shape - Shape style (default: 'circle')
 * @param {'online'|'busy'|'none'} status - Presence indicator dot (default: 'none')
 * @param {string} className - Additional CSS classes
 */
export function Avatar({
  name = '',
  initials: customInitials,
  src,
  size = 36,
  shape = 'circle',
  status = 'none',
  className,
  ...props
}) {
  const [failedSrc, setFailedSrc] = useState(null)

  const sizeStyle = SIZE_MAP[size] || SIZE_MAP[36]
  const initials = useMemo(
    () => (customInitials ? String(customInitials).trim().toUpperCase() : getInitials(name)),
    [customInitials, name]
  )

  const colorScheme = useMemo(() => {
    if (!name) return COLOR_VARIANTS[5]
    const idx = hashString(name) % COLOR_VARIANTS.length
    return COLOR_VARIANTS[idx]
  }, [name])

  const shapeClasses = shape === 'square' ? 'rounded-lg' : 'rounded-full'

  const hasValidImage = Boolean(src) && failedSrc !== src

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-wide',
        shapeClasses,
        sizeStyle.container
      )}
      role="img"
      aria-label={name ? `Avatar de ${name}` : 'Avatar de utilizador'}
      {...props}
    >
      <div
        className={cn(
          'w-full h-full flex items-center justify-center overflow-hidden border',
          shapeClasses,
          hasValidImage
            ? 'border-border-subtle bg-bg-surface'
            : cn(colorScheme.bg, colorScheme.text, colorScheme.border),
          className
        )}
      >
        {hasValidImage ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            onError={() => setFailedSrc(src)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : initials ? (
          <span className={cn('uppercase font-bold', sizeStyle.text)}>
            {initials}
          </span>
        ) : (
          <svg
            width={sizeStyle.svgIcon}
            height={sizeStyle.svgIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      {/* Status Presence Badge */}
      {status !== 'none' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white',
            sizeStyle.dot,
            status === 'online' && 'bg-[#16A34A]',
            status === 'busy' && 'bg-[#DC2626]'
          )}
          title={status === 'online' ? 'Online' : 'Ocupado'}
          aria-label={status === 'online' ? 'Estado: Online' : 'Estado: Ocupado'}
        />
      )}
    </div>
  )
}

export default Avatar
