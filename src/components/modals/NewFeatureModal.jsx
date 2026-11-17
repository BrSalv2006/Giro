import { useState, useEffect, useCallback } from 'react'
import { X, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '../common/Button.jsx'
import { TextField } from '../common/TextField.jsx'
import { Select } from '../common/Select.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { cn } from '../../utils/cn.js'

const CATEGORY_OPTIONS = [
  { value: 'NOVA_FUNCIONALIDADE', label: 'Nova Funcionalidade' },
  { value: 'MELHORIA', label: 'Melhoria' },
  { value: 'BUG', label: 'Bug' },
]

const MAX_TITLE_LENGTH = 120

/**
 * NewFeatureModal Component
 * Matches Figma frame 342:2327 ("Janela Novo pedido", 680x700).
 * Handles creation of new user requests with validation, category tagging,
 * and automatic attribution to the current team and author.
 */
export function NewFeatureModal() {
  const { isNewFeatureModalOpen, closeNewFeatureModal } = useModal()
  const { currentUser } = useAuth()
  const { addPedido } = useData()

  // Estados locais do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('NOVA_FUNCIONALIDADE')
  const [tags, setTags] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setCategory('NOVA_FUNCIONALIDADE')
    setTags('')
    setErrors({})
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    closeNewFeatureModal()
  }, [resetForm, closeNewFeatureModal])

  // Fecha com a tecla ESC
  useEffect(() => {
    if (!isNewFeatureModalOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isNewFeatureModalOpen, handleClose])

  if (!isNewFeatureModalOpen) return null

  const handleTitleChange = (e) => {
    const val = e.target.value
    if (val.length <= MAX_TITLE_LENGTH) {
      setTitle(val)
      if (errors.title) {
        setErrors((prev) => ({ ...prev, title: null }))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!title.trim()) {
      newErrors.title = 'O título do pedido é obrigatório'
    }
    if (!description.trim()) {
      newErrors.description = 'A descrição do pedido é obrigatória'
    }
    if (!category) {
      newErrors.category = 'Selecione uma categoria'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Cria o pedido no DataContext
    addPedido({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : ['geral'],
    })

    resetForm()
    closeNewFeatureModal()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-new-pedido-title"
    >
      {/* Container Principal da Janela (Figma 680x700 max) */}
      <div
        className="w-full max-w-[680px] bg-white rounded-2xl border border-border-subtle shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header do Modal */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-bg-surface select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE3DC] text-brand-action flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="modal-new-pedido-title"
                className="text-lg font-bold text-fg-primary leading-tight"
              >
                Novo Pedido de Funcionalidade
              </h2>
              <p className="text-xs text-fg-secondary">
                Submeta uma ideia, melhoria ou relato de problema para o backlog.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-page transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Formulário / Corpo */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Campo Título com contador de caracteres */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="pedido-title"
                className="text-sm font-semibold text-fg-primary"
              >
                Título do pedido <span className="text-feedback-errorFg">*</span>
              </label>
              <span
                className={cn(
                  'text-xs font-mono',
                  title.length >= MAX_TITLE_LENGTH
                    ? 'text-feedback-errorFg font-bold'
                    : 'text-fg-secondary'
                )}
              >
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
            <input
              id="pedido-title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Ex: Permitir exportação de dados em formato CSV"
              className={cn(
                'w-full h-11 px-3.5 rounded-lg border text-sm text-fg-primary placeholder:text-fg-disabled bg-white transition-all',
                'focus:outline-none focus:ring-2 focus:ring-border-focusRing',
                errors.title
                  ? 'border-feedback-errorBorder ring-1 ring-feedback-errorBorder'
                  : 'border-border-control hover:border-border-controlHover'
              )}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-feedback-errorFg flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Campo Descrição */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="pedido-desc"
                className="text-sm font-semibold text-fg-primary"
              >
                Descrição detalhada <span className="text-feedback-errorFg">*</span>
              </label>
            </div>
            <textarea
              id="pedido-desc"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: null }))
                }
              }}
              placeholder="Descreva o problema que procura resolver, o contexto e o valor gerado para os utilizadores..."
              className={cn(
                'w-full p-3.5 rounded-lg border text-sm text-fg-primary placeholder:text-fg-disabled bg-white transition-all resize-y min-h-[110px]',
                'focus:outline-none focus:ring-2 focus:ring-border-focusRing',
                errors.description
                  ? 'border-feedback-errorBorder ring-1 ring-feedback-errorBorder'
                  : 'border-border-control hover:border-border-controlHover'
              )}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-feedback-errorFg flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Campo Categoria e Tags em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria *"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(val) => setCategory(val)}
              error={errors.category}
            />

            <TextField
              label="Etiquetas / Tags (opcional)"
              placeholder="Ex: ux, sprint, api"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              helperText="Separe várias tags por vírgula"
            />
          </div>
        </form>

        {/* 3. Rodapé com Informação do Criador e Ações */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          {/* Creator Footer: "Giro Dev Team · Sofia Costa" */}
          <div className="flex items-center gap-2.5 text-xs text-fg-secondary">
            <Avatar
              name={currentUser?.name || 'Sofia Costa'}
              size={28}
            />
            <span>
              <strong className="text-fg-primary">Giro Dev Team</strong> · {currentUser?.name || 'Sofia Costa'}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              Criar pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewFeatureModal
