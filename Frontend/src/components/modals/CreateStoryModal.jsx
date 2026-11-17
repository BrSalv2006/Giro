import { useState, useEffect, useCallback } from 'react'
import { X, Layers, AlertCircle } from 'lucide-react'
import { Button } from '../common/Button.jsx'
import { Select } from '../common/Select.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { cn } from '../../utils/cn.js'

const DESTINATION_OPTIONS = [
  { value: 'Backlog do produto', label: 'Backlog do produto' },
  { value: 'Sprint 12', label: 'Sprint 12 (Em curso)' },
]

const ASSIGNEE_OPTIONS = [
  { value: 'Sofia Costa', label: 'Sofia Costa (Product Owner)' },
  { value: 'Inês Martins', label: 'Inês Martins (Scrum Master)' },
  { value: 'Rafael Silva', label: 'Rafael Silva (Developer)' },
  { value: 'Miguel Alves', label: 'Miguel Alves (Cliente)' },
  { value: 'Por atribuir', label: 'Por atribuir' },
]

const PRIORITY_OPTIONS = [
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Média', label: 'Média' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Urgente', label: 'Urgente' },
]

const STORY_POINTS_OPTIONS = [
  { value: '1', label: '1 pt' },
  { value: '2', label: '2 pts' },
  { value: '3', label: '3 pts' },
  { value: '5', label: '5 pts' },
  { value: '8', label: '8 pts' },
  { value: '13', label: '13 pts' },
  { value: 'Por estimar', label: 'Por estimar' },
]

const DEFAULT_AGILE_DESC =
  'Como [tipo de utilizador], quero [funcionalidade pretendida], para [benefício ou valor de negócio].'

const MAX_TITLE_LENGTH = 120

/**
 * CreateStoryModal Component
 * Matches Figma frame 342:2074 ("Janela Criar user story", 680x852).
 * Formulates user stories with standard agile template, acceptance criteria,
 * sprint destination, team assignees, priority and estimation.
 */
export function CreateStoryModal() {
  const { isCreateStoryModalOpen, closeCreateStoryModal } = useModal()
  const { currentUser } = useAuth()
  const { pedidos, addStory } = useData()

  // Estados locais do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState(DEFAULT_AGILE_DESC)
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [target, setTarget] = useState('Sprint 12')
  const [assignee, setAssignee] = useState(currentUser?.name || 'Sofia Costa')
  const [priority, setPriority] = useState('Média')
  const [points, setPoints] = useState('3')
  const [linkedPedidoId, setLinkedPedidoId] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription(DEFAULT_AGILE_DESC)
    setAcceptanceCriteria('')
    setTarget('Sprint 12')
    setAssignee(currentUser?.name || 'Sofia Costa')
    setPriority('Média')
    setPoints('3')
    setLinkedPedidoId('')
    setErrors({})
    setIsSubmitting(false)
  }, [currentUser])

  const handleClose = useCallback(() => {
    resetForm()
    closeCreateStoryModal()
  }, [resetForm, closeCreateStoryModal])

  // Fecha com a tecla ESC
  useEffect(() => {
    if (!isCreateStoryModalOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreateStoryModalOpen, handleClose])

  if (!isCreateStoryModalOpen) return null

  // Lista dinâmica de pedidos para vínculo
  const pedidoOptions = [
    { value: '', label: 'Nenhum pedido associado' },
    ...pedidos.map((p) => ({
      value: p.id,
      label: `${p.id} · ${p.title.substring(0, 48)}${p.title.length > 48 ? '...' : ''}`,
    })),
  ]

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
      newErrors.title = 'O título da história é obrigatório'
    }
    if (!description.trim() || description.includes('[tipo de utilizador]')) {
      newErrors.description = 'Preencha a descrição seguindo a estrutura Como / Quero / Para'
    }
    if (!acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = 'Defina pelo menos um critério de aceitação'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Determina objeto do responsável
    const assigneeObj =
      assignee === 'Por atribuir'
        ? null
        : {
            name: assignee,
            initials: assignee
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
            role: assignee === 'Rafael Silva' ? 'Developer' : 'Membro de Equipa',
          }

    addStory({
      title: title.trim(),
      description: description.trim(),
      acceptanceCriteria: acceptanceCriteria
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      target,
      assignee: assigneeObj,
      priority,
      points: points === 'Por estimar' ? null : parseInt(points, 10),
      linkedPedidoId: linkedPedidoId || null,
    })

    resetForm()
    closeCreateStoryModal()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-story-title"
    >
      {/* Container Principal da Janela (Figma 680x852 max) */}
      <div
        className="w-full max-w-[680px] bg-white rounded-2xl border border-border-subtle shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header do Modal */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-bg-surface select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#5B21B6] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#8B5CF6]" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="modal-create-story-title"
                className="text-lg font-bold text-fg-primary leading-tight"
              >
                Criar User Story
              </h2>
              <p className="text-xs text-fg-secondary">
                Estruture um requisito ágil com critérios de aceitação e esforço estimado.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Título da User Story */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="story-title"
                className="text-sm font-semibold text-fg-primary"
              >
                Título da user story <span className="text-feedback-errorFg">*</span>
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
              id="story-title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Ex: Filtrar pedidos por categoria e estado de análise"
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

          {/* Descrição em formato Ágil */}
          <div>
            <label
              htmlFor="story-desc"
              className="text-sm font-semibold text-fg-primary mb-1.5 block"
            >
              Descrição ágil <span className="text-feedback-errorFg">*</span>
            </label>
            <textarea
              id="story-desc"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: null }))
                }
              }}
              className={cn(
                'w-full p-3 rounded-lg border text-sm text-fg-primary bg-white transition-all font-sans',
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

          {/* Critérios de Aceitação */}
          <div>
            <label
              htmlFor="story-criteria"
              className="text-sm font-semibold text-fg-primary mb-1.5 block"
            >
              Critérios de aceitação <span className="text-feedback-errorFg">*</span>
            </label>
            <textarea
              id="story-criteria"
              rows={3}
              value={acceptanceCriteria}
              onChange={(e) => {
                setAcceptanceCriteria(e.target.value)
                if (errors.acceptanceCriteria) {
                  setErrors((prev) => ({ ...prev, acceptanceCriteria: null }))
                }
              }}
              placeholder="Um critério por linha. Ex:&#10;- Permitir selecionar múltiplos estados&#10;- Exibir contagem de itens encontrados"
              className={cn(
                'w-full p-3 rounded-lg border text-sm text-fg-primary bg-white transition-all font-mono text-xs',
                'focus:outline-none focus:ring-2 focus:ring-border-focusRing',
                errors.acceptanceCriteria
                  ? 'border-feedback-errorBorder ring-1 ring-feedback-errorBorder'
                  : 'border-border-control hover:border-border-controlHover'
              )}
            />
            {errors.acceptanceCriteria && (
              <p className="mt-1 text-xs text-feedback-errorFg flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.acceptanceCriteria}</span>
              </p>
            )}
          </div>

          {/* Grid de Destino, Responsável, Prioridade e Esforço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Destino *"
              options={DESTINATION_OPTIONS}
              value={target}
              onChange={(v) => setTarget(v)}
            />

            <Select
              label="Responsável"
              options={ASSIGNEE_OPTIONS}
              value={assignee}
              onChange={(v) => setAssignee(v)}
            />

            <Select
              label="Prioridade *"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(v) => setPriority(v)}
            />

            <Select
              label="Esforço (Story Points)"
              options={STORY_POINTS_OPTIONS}
              value={points}
              onChange={(v) => setPoints(v)}
            />
          </div>

          {/* Pedido de Origem (opcional) */}
          <div>
            <Select
              label="Pedido de origem (opcional)"
              options={pedidoOptions}
              value={linkedPedidoId}
              onChange={(v) => setLinkedPedidoId(v)}
              helperText="Associa esta história a um pedido já submetido pela comunidade"
            />
          </div>
        </form>

        {/* 3. Rodapé com Informação do Criador e Ações */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2.5 text-xs text-fg-secondary">
            <Avatar
              name={currentUser?.name || 'Sofia Costa'}
              size={28}
            />
            <span>
              <strong className="text-fg-primary">Autor:</strong> {currentUser?.name || 'Sofia Costa'} ({currentUser?.role || 'Product Owner'})
            </span>
          </div>

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
              Criar user story
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateStoryModal
