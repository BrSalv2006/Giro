import React, { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Campo de texto reutilizável do GIRO com suporte a estados de erro, foco, ícones e desativado.
 *
 * @param {React.ReactNode} [label] - Etiqueta do campo
 * @param {string | boolean} [error] - Mensagem de erro ou booleano indicando erro
 * @param {React.ReactNode} [helperText] - Texto auxiliar exibido quando não há erro
 * @param {React.ReactNode} [icon] - Ícone (Lucide icon ou componente)
 * @param {'left' | 'right'} [iconPosition='left'] - Posição do ícone
 * @param {boolean} [disabled=false] - Desativa o campo
 * @param {boolean} [required=false] - Indica campo obrigatório
 * @param {string} [className] - Classes Tailwind para o input
 * @param {string} [containerClassName] - Classes Tailwind para o container exterior
 */
export const TextField = React.forwardRef(function TextField(
  {
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    disabled = false,
    required = false,
    className,
    containerClassName,
    id: idProp,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const inputId = idProp || generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const hasError = Boolean(error)
  const errorMessage = typeof error === 'string' ? error : null

  const renderIcon = () => {
    if (!icon) return null

    const iconNode = React.isValidElement(icon) ? (
      React.cloneElement(icon, {
        className: cn('w-4 h-4', icon.props.className),
        'aria-hidden': 'true',
      })
    ) : (
      (() => {
        const IconComp = icon
        return <IconComp className="w-4 h-4" aria-hidden="true" />
      })()
    )

    return (
      <div
        className={cn(
          'absolute inset-y-0 flex items-center pointer-events-none text-fg-secondary',
          iconPosition === 'left' ? 'left-3.5' : 'right-3.5',
          hasError && 'text-feedback-errorFg',
          disabled && 'text-fg-disabled'
        )}
      >
        {iconNode}
      </div>
    )
  }

  return (
    <div className={cn('w-full flex flex-col', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-fg-primary mb-1.5 inline-flex items-center gap-1 select-none',
            disabled && 'text-fg-disabled cursor-not-allowed'
          )}
        >
          {label}
          {required && (
            <span className="text-feedback-errorFg" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative w-full">
        {iconPosition === 'left' && renderIcon()}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={
            errorMessage ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            // Dimensões e raio padrão (Tokens: h-11 = 44px, radius = 8px)
            'w-full h-11 rounded-lg px-3.5 text-sm text-fg-primary font-normal',
            'transition-colors duration-150 ease-in-out',
            'placeholder:text-fg-disabled-muted',
            // Estado padrão e foco
            !hasError &&
              'bg-white border border-border-subtle hover:border-border-control focus:border-transparent focus:ring-2 focus:ring-border-focusRing focus:outline-none',
            // Estado de erro (pêssego #FFE3DC com borda vermelha #B42318)
            hasError &&
              'bg-feedback-errorBg border border-feedback-errorBorder text-fg-primary focus:border-feedback-errorBorder focus:ring-2 focus:ring-feedback-errorBorder focus:outline-none',
            // Estado desativado
            'disabled:bg-[#0000000A] disabled:border-border-disabled disabled:text-fg-disabled disabled:cursor-not-allowed disabled:placeholder:text-fg-disabled',
            // Espaçamento para ícones
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            className
          )}
          {...props}
        />

        {iconPosition === 'right' && renderIcon()}
      </div>

      {/* Mensagem de Erro ou Texto Auxiliar */}
      {errorMessage ? (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 mt-1.5 text-xs text-feedback-errorFg font-normal"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : helperText ? (
        <div id={helperId} className="mt-1.5 text-xs text-fg-secondary font-normal">
          {helperText}
        </div>
      ) : null}
    </div>
  )
})

TextField.displayName = 'TextField'

export default TextField
