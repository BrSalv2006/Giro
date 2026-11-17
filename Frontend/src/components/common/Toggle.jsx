import { useState, useId } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * Componente Toggle / Switch reutilizável e acessível do GIRO.
 * Estilo visual refinado Figma/iOS com transições fluidas e estados completos.
 *
 * @param {boolean} [checked] - Estado do switch (modo controlado)
 * @param {boolean} [defaultChecked=false] - Estado inicial (modo não controlado)
 * @param {(checked: boolean, event: React.MouseEvent | React.KeyboardEvent) => void} [onChange] - Disparado na alteração
 * @param {React.ReactNode} [label] - Rótulo do toggle
 * @param {React.ReactNode} [description] - Descrição ou texto de suporte
 * @param {React.ReactNode} [helperText] - Alias para description
 * @param {'sm' | 'md' | 'lg'} [size='md'] - Dimensão do toggle
 * @param {boolean} [disabled=false] - Desativa a alternância
 * @param {string} [id] - Identificador único
 * @param {string} [className] - Classes Tailwind adicionais para o track
 * @param {string} [containerClassName] - Classes Tailwind para o container
 */
export function Toggle({
  checked: checkedProp,
  defaultChecked = false,
  onChange,
  label,
  description,
  helperText,
  size = 'md',
  disabled = false,
  id: idProp,
  className,
  containerClassName,
  ...props
}) {
  const generatedId = useId()
  const toggleId = idProp || generatedId
  const descId = `${toggleId}-desc`

  const isControlled = checkedProp !== undefined
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const isChecked = isControlled ? checkedProp : internalChecked

  const handleToggle = (event) => {
    if (disabled) return

    const nextChecked = !isChecked
    if (!isControlled) {
      setInternalChecked(nextChecked)
    }
    onChange?.(nextChecked, event)
  }

  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleToggle(event)
    }
  }

  const subText = description || helperText

  // Configurações de dimensão por tamanho
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4.5 p-0.5',
      thumb: 'w-3.5 h-3.5',
      translate: 'translate-x-3.5',
    },
    md: {
      track: 'w-11 h-6 p-0.5',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7.5 p-0.5',
      thumb: 'w-6.5 h-6.5',
      translate: 'translate-x-6.5',
    },
  }[size] || {
    track: 'w-11 h-6 p-0.5',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  }

  return (
    <div className={cn('inline-flex items-start gap-3 select-none', containerClassName)}>
      {/* Botão de Alternância com Role Switch */}
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={isChecked}
        aria-disabled={disabled}
        aria-describedby={subText ? descId : undefined}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          // Pistas do switch
          'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
          sizeConfig.track,
          // Cores de fundo
          isChecked ? 'bg-brand-action' : 'bg-border-subtle',
          // Foco e anel de foco acessível
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing focus-visible:ring-offset-2',
          // Hover
          !disabled && 'hover:opacity-90',
          // Desativado
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {/* Manípulo (Thumb) */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
            sizeConfig.thumb,
            isChecked ? sizeConfig.translate : 'translate-x-0'
          )}
        />
      </button>

      {/* Rótulo e Descrição */}
      {(label || subText) && (
        <div
          onClick={handleToggle}
          className={cn('flex flex-col cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}
        >
          {label && (
            <span className="text-sm font-medium text-fg-primary leading-tight">
              {label}
            </span>
          )}
          {subText && (
            <span id={descId} className="text-xs text-fg-secondary mt-0.5 leading-normal">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Toggle
