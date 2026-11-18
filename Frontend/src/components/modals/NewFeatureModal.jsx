import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Sparkles, AlertCircle, Search, ArrowUp, ExternalLink } from 'lucide-react'
import { Button } from '../common/Button.jsx'
import { TextField } from '../common/TextField.jsx'
import { Select } from '../common/Select.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { StatusBadge } from '../common/StatusBadge.jsx'
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
  const navigate = useNavigate()
  const { isNewFeatureModalOpen, closeNewFeatureModal } = useModal()
  const { currentUser } = useAuth()
  const { addPedido, findSimilarPedidos, toggleVote, pedidos } = useData()

  // Estados locais do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('NOVA_FUNCIONALIDADE')
  const [tags, setTags] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [similarPedidos, setSimilarPedidos] = useState([])
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false)
  const [voteNotice, setVoteNotice] = useState('')

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setCategory('NOVA_FUNCIONALIDADE')
    setTags('')
    setErrors({})
    setIsSubmitting(false)
    setSimilarPedidos([])
    setIsSearchingSimilar(false)
    setVoteNotice('')
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

  // Pesquisa de pedidos semelhantes em tempo real (>= 3 caracteres, CA2.1 / RNF-DES-02)
  useEffect(() => {
    if (!isNewFeatureModalOpen) return
    const query = title.trim()
    if (query.length < 3 || !findSimilarPedidos) return

    let active = true
    const timer = setTimeout(async () => {
      setIsSearchingSimilar(true)
      try {
        const matches = await findSimilarPedidos(query)
        if (active) {
          setSimilarPedidos(Array.isArray(matches) ? matches : [])
        }
      } catch {
        if (active) {
          setSimilarPedidos([])
        }
      } finally {
        if (active) {
          setIsSearchingSimilar(false)
        }
      }
    }, 100)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [isNewFeatureModalOpen, title, findSimilarPedidos])

  if (!isNewFeatureModalOpen) return null

  const visibleSimilar = title.trim().length >= 3 ? similarPedidos : []

  const handleTitleChange = (e) => {
    const val = e.target.value
    if (val.length <= MAX_TITLE_LENGTH) {
      setTitle(val)
      setVoteNotice('')
      if (val.trim().length < 3) {
        setSimilarPedidos([])
      }
      if (errors.title) {
        setErrors((prev) => ({ ...prev, title: null }))
      }
    }
  }

  const handleVoteSimilar = async (item) => {
    if (!toggleVote) return
    try {
      await toggleVote(item.id)
      setVoteNotice(`Voto atualizado no pedido existente "${item.title}".`)
    } catch (voteError) {
      setVoteNotice(voteError.message || 'Não foi possível registar o voto.')
    }
  }

  const handleOpenSimilar = (item) => {
    resetForm()
    closeNewFeatureModal()
    navigate(`/pedidos?q=${encodeURIComponent(item.title)}`)
  }

  const handleSubmit = async (e) => {
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
    setErrors({})

    try {
      await addPedido({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : ['geral'],
      })
      resetForm()
      closeNewFeatureModal()
    } catch (submitError) {
      setErrors({ submit: submitError.message || 'Não foi possível criar o pedido.' })
    } finally {
      setIsSubmitting(false)
    }
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
          {errors.submit && (
            <div role="alert" className="rounded-lg border border-feedback-errorBorder bg-feedback-errorBg px-3 py-2 text-sm text-feedback-errorFg">
              {errors.submit}
            </div>
          )}
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

            {/* Sugestões de pedidos semelhantes (CA2.1) */}
            {title.trim().length >= 3 && (isSearchingSimilar || visibleSimilar.length > 0 || voteNotice) && (
              <div className="mt-3 rounded-xl border border-[#F8C1B7] bg-[#FFE3DC]/35 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-brand-action">
                    <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {isSearchingSimilar
                      ? 'A procurar pedidos semelhantes...'
                      : `${visibleSimilar.length} pedido(s) semelhante(s) encontrado(s) — evite duplicados`}
                  </span>
                  <span className="text-[10px] font-mono text-fg-secondary">CA2.1 · &lt;200ms</span>
                </div>

                {voteNotice && (
                  <p className="text-xs font-medium text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg px-2.5 py-1.5">
                    {voteNotice}
                  </p>
                )}

                {visibleSimilar.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {visibleSimilar.map((item) => {
                      const liveItem = pedidos?.find((p) => p.id === item.id) || item
                      const hasVoted = Boolean(currentUser?.id && liveItem.votedBy?.includes(currentUser.id))
                      return (
                        <div
                          key={liveItem.id}
                          className="rounded-lg bg-white border border-border-subtle p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono font-bold text-fg-secondary">
                                {liveItem.id}
                              </span>
                              <StatusBadge status={liveItem.status} />
                              <span className="text-[11px] font-semibold text-brand-action">
                                ▲ {liveItem.voteCount ?? 0} votos
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-fg-primary truncate">
                              {liveItem.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleVoteSimilar(liveItem)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer',
                                hasVoted
                                  ? 'bg-brand-action text-white border-brand-action'
                                  : 'bg-white text-brand-action border-[#F8C1B7] hover:bg-[#FFE3DC]'
                              )}
                            >
                              <ArrowUp className="w-3 h-3" aria-hidden="true" />
                              <span>{hasVoted ? 'Votado' : 'Votar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSimilar(liveItem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-bg-page text-fg-primary border border-border-subtle hover:bg-[#E4E5EA] transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                              <span>Abrir</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
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
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
          {/* Creator Footer: "Giro Dev Team · Sofia Costa" */}
          <div className="hidden sm:flex items-center gap-2.5 text-xs text-fg-secondary min-w-0">
            <Avatar
              name={currentUser?.name || 'Sofia Costa'}
              size={28}
            />
            <span className="truncate">
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
