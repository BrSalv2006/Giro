import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Variantes de estilo para o botão baseados nos design tokens do Figma GIRO.
 */
const variantStyles = {
  primary:
    'bg-brand-action hover:bg-brand-hover active:bg-brand-pressed text-white shadow-xs focus-visible:ring-border-focusRing',
  secondary:
    'bg-bg-surface border border-border-control text-fg-primary hover:bg-brand-selection active:bg-brand-selection/80 focus-visible:ring-border-focusRing',
  tertiary:
    'bg-transparent text-fg-primary hover:bg-bg-disabled active:bg-bg-disabled-emphasis focus-visible:ring-border-focusRing',
}

/**
 * Componente de Botão reutilizável do GIRO.
 *
 * @param {'primary' | 'secondary' | 'tertiary'} [variant='primary'] - Estilo visual do botão
 * @param {boolean} [loading=false] - Indica estado de carregamento com spinner
 * @param {boolean} [disabled=false] - Desativa o botão
 * @param {React.ReactNode} [icon] - Ícone (Lucide icon ou elemento JSX)
 * @param {'left' | 'right'} [iconPosition='left'] - Posição do ícone
 * @param {React.ReactNode} [children] - Conteúdo textual do botão
 * @param {string} [className] - Classes Tailwind adicionais
 */
export const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    children,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  const renderIcon = (IconOrElement) => {
    if (!IconOrElement) return null
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: cn('w-4 h-4 shrink-0', IconOrElement.props.className),
        'aria-hidden': 'true',
      })
    }
    const IconComp = IconOrElement
    return <IconComp className="w-4 h-4 shrink-0" aria-hidden="true" />
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={cn(
        // Dimensões e alinhamento base (Tokens: h-11 = 44px, radius = 8px, px-6 = 24px)
        'h-11 px-6 rounded-lg font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer select-none',
        // Transições suaves
        'transition-all duration-150 ease-in-out',
        // Acessibilidade e foco
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Estado desativado
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variante selecionada
        variantStyles[variant] || variantStyles.primary,
        className
      )}
      {...props}
    >
      {loading && iconPosition === 'left' && (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      )}
      {!loading && icon && iconPosition === 'left' && renderIcon(icon)}

      {children && <span className="truncate">{children}</span>}
      {!loading && icon && iconPosition === 'right' && renderIcon(icon)}
      {loading && iconPosition === 'right' && (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
