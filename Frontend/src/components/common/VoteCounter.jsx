import { useState } from 'react'
import { cn } from '../../utils/cn.js'
import { ArrowUp } from './Icons.jsx'

/**
 * VoteCounter Component
 *
 * Enforces unique voting per user and feature request.
 *
 * @param {number} [votes=0] - Initial total vote count
 * @param {boolean} [initialVoted=false] - Whether current user has already voted
 * @param {Function} [onVote] - Callback (hasVoted: boolean, newCount: number) => void
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {boolean} [allowToggle=true] - If true, clicking an already-voted item retracts the vote (0 or 1 vote per user). If false, it strictly locks after voting.
 * @param {string} [className] - Additional CSS classes
 */
export function VoteCounter({
  votes = 0,
  initialVoted = false,
  onVote,
  disabled = false,
  allowToggle = true,
  className,
  ...props
}) {
  const [hasVoted, setHasVoted] = useState(Boolean(initialVoted))
  const [count, setCount] = useState(Number(votes) || 0)
  const [prevProps, setPrevProps] = useState({ initialVoted, votes })

  // Synchronize internal state when props change (idiomatic React pattern avoiding cascading effects)
  if (prevProps.initialVoted !== initialVoted || prevProps.votes !== votes) {
    setPrevProps({ initialVoted, votes })
    setHasVoted(Boolean(initialVoted))
    setCount(Number(votes) || 0)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (disabled) return

    if (hasVoted) {
      if (!allowToggle) {
        // Enforce strict lock: prevents duplicate votes (RNF-SEG-03)
        return
      }
      // Retract single vote
      const newCount = Math.max(0, count - 1)
      setHasVoted(false)
      setCount(newCount)
      onVote?.(false, newCount)
    } else {
      // Cast single vote (RNF-SEG-03)
      const newCount = count + 1
      setHasVoted(true)
      setCount(newCount)
      onVote?.(true, newCount)
    }
  }

  const tooltipText = hasVoted
    ? 'Voto registado (máx. 1 voto por pedido)'
    : 'Votar nesta funcionalidade'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={hasVoted}
      aria-label={
        hasVoted
          ? `Votado (${count} votos). Voto único por utilizador.`
          : `Votar nesta funcionalidade (${count} votos).`
      }
      title={tooltipText}
      className={cn(
        // Base layout
        'group relative inline-flex flex-col items-center justify-center select-none',
        'min-w-[44px] min-h-[52px] px-2.5 py-1.5 rounded-lg border transition-all duration-150',
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-1',
        // Unvoted state
        !hasVoted && [
          'bg-bg-surface border-border-subtle text-fg-primary',
          'hover:bg-brand-selection hover:border-brand-primary hover:text-brand-action',
          'active:bg-brand-selection',
        ],
        // Voted state
        hasVoted && [
          'bg-brand-action border-brand-action text-white shadow-xs',
          'hover:bg-brand-hover hover:border-brand-hover',
          'active:bg-brand-pressed',
        ],
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Upward Vote Arrow */}
      <ArrowUp
        size={18}
        strokeWidth={hasVoted ? 2.5 : 2}
        className={cn(
          'transition-transform duration-150',
          hasVoted
            ? 'text-white scale-110'
            : 'text-fg-secondary group-hover:text-[#B93826] group-hover:-translate-y-0.5'
        )}
      />

      {/* Vote Count */}
      <span
        className={cn(
          'font-bold text-xs tracking-tight leading-none mt-1',
          hasVoted ? 'text-white' : 'text-fg-primary group-hover:text-[#B93826]'
        )}
      >
        {count}
      </span>
    </button>
  )
}

export default VoteCounter
