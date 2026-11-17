import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check, X, Search, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Componente Select reutilizável do GIRO com suporte a seleção única,
 * pesquisa e múltipla seleção com tags removíveis.
 *
 * @param {React.ReactNode} [label] - Etiqueta do campo
 * @param {Array<{value: string|number, label: string, disabled?: boolean}>|Array<string>} options - Lista de opções
 * @param {any} [value] - Valor selecionado (único ou array no modo multiple)
 * @param {any} [defaultValue] - Valor padrão não controlado
 * @param {(value: any) => void} [onChange] - Callback disparado na mudança
 * @param {string} [placeholder='Selecione...'] - Texto do placeholder
 * @param {string} [searchPlaceholder='Pesquisar...'] - Placeholder da barra de busca
 * @param {boolean} [searchable=false] - Habilita campo de busca no dropdown
 * @param {boolean} [multiple=false] - Habilita seleção múltipla com tags
 * @param {string | boolean} [error] - Mensagem de erro ou booleano indicando erro
 * @param {React.ReactNode} [helperText] - Texto auxiliar abaixo do campo
 * @param {boolean} [disabled=false] - Desativa o select
 * @param {boolean} [required=false] - Indica campo obrigatório
 * @param {string} [className] - Classes Tailwind para o container do gatilho
 * @param {string} [containerClassName] - Classes Tailwind para o container exterior
 */
export function Select({
  label,
  options = [],
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  searchable = false,
  multiple = false,
  error,
  helperText,
  disabled = false,
  required = false,
  className,
  containerClassName,
  id: idProp,
}) {
  const generatedId = useId()
  const selectId = idProp || generatedId
  const errorId = `${selectId}-error`
  const helperId = `${selectId}-helper`

  const hasError = Boolean(error)
  const errorMessage = typeof error === 'string' ? error : null

  // Normalização das opções
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
  )

  // Estado interno para controle de valor
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = useState(() => {
    if (defaultValue !== undefined) return defaultValue
    return multiple ? [] : ''
  })

  const currentValue = isControlled ? valueProp : internalValue

  // Estado de abertura do dropdown e termo de pesquisa
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Foco no campo de busca ao abrir dropdown
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Filtragem de opções na pesquisa
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Manipulação de seleção
  const handleSelectOption = (optValue, optDisabled) => {
    if (optDisabled) return

    if (multiple) {
      const arr = Array.isArray(currentValue) ? [...currentValue] : []
      const existsIndex = arr.indexOf(optValue)
      let nextValue
      if (existsIndex > -1) {
        nextValue = arr.filter((v) => v !== optValue)
      } else {
        nextValue = [...arr, optValue]
      }

      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    } else {
      if (!isControlled) {
        setInternalValue(optValue)
      }
      onChange?.(optValue)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // Remoção de tag individual no modo múltiplo
  const handleRemoveTag = (e, optValue) => {
    e.stopPropagation()
    if (disabled) return

    const arr = Array.isArray(currentValue) ? currentValue : []
    const nextValue = arr.filter((v) => v !== optValue)

    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
  }

  // Obter rótulo de uma opção pelo valor
  const getOptionLabel = (val) => {
    const found = normalizedOptions.find((opt) => opt.value === val)
    return found ? found.label : String(val)
  }

  // Verificar se uma opção está selecionada
  const isSelected = (optValue) => {
    if (multiple) {
      return Array.isArray(currentValue) && currentValue.includes(optValue)
    }
    return currentValue === optValue
  }

  return (
    <div ref={containerRef} className={cn('relative w-full flex flex-col', containerClassName)}>
      {label && (
        <label
          id={`${selectId}-label`}
          htmlFor={selectId}
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

      {/* Caixa principal do Select (Gatilho) */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-describedby={
          errorMessage ? errorId : helperText ? helperId : undefined
        }
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
          }
        }}
        className={cn(
          // Dimensões e raio base (Tokens: min-h-11 = 44px, radius = 8px)
          'w-full min-h-11 rounded-lg px-3.5 py-1.5 text-left text-sm cursor-pointer select-none',
          'flex items-center justify-between gap-2',
          'transition-colors duration-150 ease-in-out',
          // Estado normal
          !hasError &&
            'bg-white border border-border-subtle hover:border-border-control',
          // Estado de erro (pêssego #FFE3DC com borda vermelha #B42318)
          hasError &&
            'bg-feedback-errorBg border border-feedback-errorBorder text-fg-primary',
          // Foco e anel
          isOpen
            ? hasError
              ? 'ring-2 ring-feedback-errorBorder border-transparent outline-none'
              : 'ring-2 ring-border-focusRing border-transparent outline-none'
            : 'focus:outline-none focus:ring-2 focus:ring-border-focusRing',
          // Desativado
          'disabled:bg-[#0000000A] disabled:border-border-disabled disabled:text-fg-disabled disabled:cursor-not-allowed',
          className
        )}
      >
        {/* Conteúdo selecionado */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden">
          {multiple ? (
            Array.isArray(currentValue) && currentValue.length > 0 ? (
              currentValue.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 bg-[#F1F2F4] border border-border-subtle text-fg-primary rounded-md px-2 py-0.5 text-xs font-medium"
                >
                  <span className="truncate max-w-[140px]">{getOptionLabel(val)}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remover ${getOptionLabel(val)}`}
                    onClick={(e) => handleRemoveTag(e, val)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRemoveTag(e, val)
                      }
                    }}
                    className="p-0.5 rounded-xs hover:bg-[#CDD1D8] text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))
            ) : (
              <span className="text-fg-disabled-muted">{placeholder}</span>
            )
          ) : currentValue !== '' && currentValue !== undefined && currentValue !== null ? (
            <span className="text-fg-primary truncate">{getOptionLabel(currentValue)}</span>
          ) : (
            <span className="text-fg-disabled-muted">{placeholder}</span>
          )}
        </div>

        {/* Ícone de seta Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-fg-secondary shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
            disabled && 'text-fg-disabled'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Menu suspenso flutuante (Dropdown) */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable={multiple}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border-subtle bg-white shadow-lg py-1 focus:outline-none"
        >
          {/* Barra de Pesquisa */}
          {searchable && (
            <div className="sticky top-0 bg-white p-2 border-b border-border-subtle flex items-center gap-2 z-10">
              <Search className="w-4 h-4 text-fg-secondary shrink-0" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-xs text-fg-primary placeholder:text-fg-disabled-muted outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-fg-secondary hover:text-fg-primary p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Lista de Opções */}
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-xs text-fg-secondary">
              Nenhum resultado encontrado
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const selected = isSelected(opt.value)
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt.value, opt.disabled)}
                  className={cn(
                    'px-3.5 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors select-none',
                    selected
                      ? 'bg-brand-selection text-brand-action font-medium'
                      : 'text-fg-primary hover:bg-[#F1F2F4]',
                    opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && (
                    <Check className="w-4 h-4 text-brand-action shrink-0 ml-2" aria-hidden="true" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

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
}

export default Select
