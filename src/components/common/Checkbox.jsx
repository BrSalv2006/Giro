import React, { useRef, useEffect, useId } from 'react'
import { Check, Minus, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Componente Checkbox acessível e customizado do GIRO.
 * Suporta estados: desmarcado, marcado, indeterminado, com erro e desativado.
 *
 * @param {boolean} [checked] - Estado marcado (controlado)
 * @param {boolean} [defaultChecked] - Estado marcado inicial (não controlado)
 * @param {boolean} [indeterminate=false] - Estado indeterminado (marca intermediária)
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Callback disparado na alteração
 * @param {React.ReactNode} [label] - Etiqueta ao lado do checkbox
 * @param {React.ReactNode} [helperText] - Texto explicativo adicional
 * @param {string | boolean} [error] - Mensagem ou indicador de erro
 * @param {boolean} [disabled=false] - Desativa a interação
 * @param {string} [id] - ID do elemento de entrada
 * @param {string} [className] - Classes Tailwind adicionais para a caixa visual
 * @param {string} [containerClassName] - Classes Tailwind para o container
 */
export const Checkbox = React.forwardRef(function Checkbox(
  {
    checked,
    defaultChecked,
    indeterminate = false,
    onChange,
    label,
    helperText,
    error,
    disabled = false,
    id: idProp,
    className,
    containerClassName,
    ...props
  },
  forwardedRef
) {
  const generatedId = useId()
  const checkboxId = idProp || generatedId
  const errorId = `${checkboxId}-error`
  const helperId = `${checkboxId}-helper`

  const internalRef = useRef(null)
  const inputRef = forwardedRef || internalRef

  const hasError = Boolean(error)
  const errorMessage = typeof error === 'string' ? error : null

  // Sincronizar propriedade DOM indeterminate
  useEffect(() => {
    if (typeof inputRef === 'object' && inputRef?.current) {
      inputRef.current.indeterminate = Boolean(indeterminate)
    }
  }, [indeterminate, inputRef])

  const isCheckedOrIndeterminate = Boolean(checked || indeterminate)

  return (
    <div className={cn('flex flex-col', containerClassName)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-start gap-2.5 select-none cursor-pointer group',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          {/* Input nativo oculto para acessibilidade e navegação por teclado */}
          <input
            ref={inputRef}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={onChange}
            aria-checked={indeterminate ? 'mixed' : checked}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={
              errorMessage ? errorId : helperText ? helperId : undefined
            }
            className="peer sr-only"
            {...props}
          />

          {/* Caixa visual do Checkbox */}
          <div
            className={cn(
              // Dimensões e formato base (Tokens: 20x20px, rounded: ~5px)
              'w-5 h-5 rounded-[5px] flex items-center justify-center',
              'transition-all duration-150 ease-in-out',
              // Estado padrão (não marcado)
              !isCheckedOrIndeterminate &&
                !hasError &&
                'bg-white border border-border-control group-hover:border-border-control-hover',
              // Estado marcado ou indeterminado (#B93826)
              isCheckedOrIndeterminate &&
                !hasError &&
                'bg-brand-action border border-brand-action text-white',
              // Estado de erro
              hasError &&
                !isCheckedOrIndeterminate &&
                'bg-feedback-errorBg border border-feedback-errorBorder',
              hasError &&
                isCheckedOrIndeterminate &&
                'bg-brand-action border border-feedback-errorBorder text-white',
              // Anel de foco acessível
              'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focusRing peer-focus-visible:ring-offset-2',
              // Estado desativado
              disabled && 'bg-bg-disabled border-border-disabled text-fg-disabled pointer-events-none',
              className
            )}
          >
            {indeterminate ? (
              <Minus className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
            ) : checked ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
            ) : null}
          </div>
        </div>

        {/* Textos: Label e HelperText */}
        {(label || helperText) && (
          <div className="flex flex-col">
            {label && (
              <span
                className={cn(
                  'text-sm font-medium text-fg-primary leading-tight',
                  disabled && 'text-fg-disabled'
                )}
              >
                {label}
              </span>
            )}
            {helperText && !errorMessage && (
              <span id={helperId} className="text-xs text-fg-secondary mt-0.5 leading-normal">
                {helperText}
              </span>
            )}
          </div>
        )}
      </label>

      {/* Mensagem de Erro */}
      {errorMessage && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 mt-1 ml-7.5 text-xs text-feedback-errorFg font-normal"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
