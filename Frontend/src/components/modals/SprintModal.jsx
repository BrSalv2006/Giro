import { useState, useEffect, useMemo } from 'react'
import { X, Calendar, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '../common/Button.jsx'
import { Select } from '../common/Select.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { cn } from '../../utils/cn.js'

const SPRINT_STATUS_OPTIONS = [
  { value: 'PLANEADO', label: 'Planeado' },
  { value: 'ATIVO', label: 'Ativo (Em curso)' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const DURATION_PRESETS = [
  { label: '1 semana', days: 7 },
  { label: '2 semanas', days: 14 },
  { label: '3 semanas', days: 21 },
  { label: '4 semanas', days: 28 },
]

function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function addDaysToInput(startDateStr, days) {
  const base = startDateStr ? new Date(`${startDateStr}T00:00:00`) : new Date()
  if (Number.isNaN(base.getTime())) return ''
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

function countWeekdays(startStr, endStr) {
  if (!startStr || !endStr) return { totalDays: 0, workDays: 0 }
  const start = new Date(`${startStr}T00:00:00`)
  const end = new Date(`${endStr}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { totalDays: 0, workDays: 0 }
  }
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000)
  let workDays = 0
  const cur = new Date(start)
  while (cur < end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) workDays += 1
    cur.setDate(cur.getDate() + 1)
  }
  return { totalDays, workDays }
}

function SprintModalInner({ editingSprint, onClose }) {
  const { sprints = [], createSprint, updateSprint, deleteSprint } = useData()
  const isEditMode = Boolean(editingSprint?.idSprint)

  const suggestedNumber = useMemo(() => {
    if (editingSprint?.numeroSprint) return String(editingSprint.numeroSprint)
    const maxNum = sprints.reduce((max, sp) => Math.max(max, Number(sp.numeroSprint) || 0), 0)
    return String(maxNum + 1)
  }, [editingSprint, sprints])

  const defaultStart = useMemo(() => {
    if (editingSprint?.dataInicio) return toDateInputValue(editingSprint.dataInicio)
    if (sprints.length > 0) {
      const sorted = [...sprints].sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim))
      const latestEnd = sorted[0]?.dataFim
      if (latestEnd) return addDaysToInput(toDateInputValue(latestEnd), 1)
    }
    return toDateInputValue(new Date())
  }, [editingSprint, sprints])

  const defaultEnd = useMemo(() => {
    if (editingSprint?.dataFim) return toDateInputValue(editingSprint.dataFim)
    return addDaysToInput(defaultStart, 14)
  }, [editingSprint, defaultStart])

  const [numeroSprint, setNumeroSprint] = useState(suggestedNumber)
  const [dataInicio, setDataInicio] = useState(defaultStart)
  const [dataFim, setDataFim] = useState(defaultEnd)
  const [capacidadeMaxima, setCapacidadeMaxima] = useState(
    editingSprint?.capacidadeMaxima != null ? String(editingSprint.capacidadeMaxima) : '24'
  )
  const [estado, setEstado] = useState(editingSprint?.estado || 'PLANEADO')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const timelineStats = useMemo(() => countWeekdays(dataInicio, dataFim), [dataInicio, dataFim])

  const overlappingSprints = useMemo(() => {
    if (!dataInicio || !dataFim || timelineStats.totalDays <= 0) return []
    const startMs = new Date(`${dataInicio}T00:00:00Z`).getTime()
    const endMs = new Date(`${dataFim}T23:59:59Z`).getTime()
    return sprints.filter((sp) => {
      if (isEditMode && sp.idSprint === editingSprint.idSprint) return false
      if (sp.estado === 'CANCELADO') return false
      const spStart = new Date(sp.dataInicio).getTime()
      const spEnd = new Date(sp.dataFim).getTime()
      return startMs <= spEnd && endMs >= spStart
    })
  }, [dataInicio, dataFim, timelineStats.totalDays, sprints, isEditMode, editingSprint])

  const otherActiveSprint = useMemo(
    () =>
      sprints.find(
        (sp) => sp.estado === 'ATIVO' && (!isEditMode || sp.idSprint !== editingSprint.idSprint)
      ),
    [sprints, isEditMode, editingSprint]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const parsedNum = Number(numeroSprint)
    if (!Number.isInteger(parsedNum) || parsedNum <= 0) {
      setError('Indique um número de Sprint válido (inteiro positivo).')
      return
    }
    if (!dataInicio || !dataFim) {
      setError('Defina a data de início e a data de fim do Sprint.')
      return
    }
    if (new Date(dataFim) <= new Date(dataInicio)) {
      setError('A data de fim deve ser posterior à data de início.')
      return
    }
    if (estado === 'ATIVO' && otherActiveSprint) {
      setError(
        `Já existe um Sprint ativo (Sprint ${otherActiveSprint.numeroSprint}). Conclua-o antes de ativar outro.`
      )
      return
    }

    const parsedCap = capacidadeMaxima.trim() ? Number(capacidadeMaxima) : null
    if (parsedCap !== null && (!Number.isInteger(parsedCap) || parsedCap <= 0)) {
      setError('A capacidade máxima deve ser um número inteiro positivo de Story Points.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        numeroSprint: parsedNum,
        dataInicio: `${dataInicio}T00:00:00.000Z`,
        dataFim: `${dataFim}T23:59:59.000Z`,
        capacidadeMaxima: parsedCap,
        estado,
      }
      if (isEditMode) {
        await updateSprint(editingSprint.idSprint, payload)
      } else {
        await createSprint(payload)
      }
      onClose()
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível guardar o Sprint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditMode) return
    setIsSubmitting(true)
    setError('')
    try {
      await deleteSprint(editingSprint.idSprint)
      onClose()
    } catch (deleteError) {
      setError(deleteError.message || 'Não foi possível eliminar o Sprint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sprint-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] bg-bg-surface rounded-2xl border border-border-subtle shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-bg-surface select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-selection text-brand-action flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-sprint-title" className="text-lg font-bold text-fg-primary leading-tight">
                {isEditMode ? `Editar Sprint ${editingSprint.numeroSprint}` : 'Criar Novo Sprint'}
              </h2>
              <p className="text-xs text-fg-secondary">
                Defina o período temporal, capacidade em Story Points e estado do ciclo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-page transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-feedback-errorBorder bg-feedback-errorBg px-3.5 py-2.5 text-xs font-medium text-feedback-errorFg"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sprint-number" className="text-sm font-semibold text-fg-primary mb-1.5 block">
                Número do Sprint <span className="text-feedback-errorFg">*</span>
              </label>
              <input
                id="sprint-number"
                type="number"
                min={1}
                value={numeroSprint}
                onChange={(e) => setNumeroSprint(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border-subtle hover:border-border-control bg-bg-surface text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-border-focusRing"
                required
              />
            </div>

            <div>
              <label htmlFor="sprint-capacity" className="text-sm font-semibold text-fg-primary mb-1.5 block">
                Capacidade (Story Points)
              </label>
              <input
                id="sprint-capacity"
                type="number"
                min={1}
                placeholder="Ex: 24"
                value={capacidadeMaxima}
                onChange={(e) => setCapacidadeMaxima(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border-subtle hover:border-border-control bg-bg-surface text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-border-focusRing"
              />
            </div>
          </div>

          {/* Timeline / Datas */}
          <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-secondary">
                Timeline do Sprint
              </span>
              {timelineStats.totalDays > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-selection text-brand-action">
                  {timelineStats.totalDays} dias ({timelineStats.workDays} dias úteis)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="sprint-start" className="text-xs font-semibold text-fg-primary mb-1 block">
                  Data de início <span className="text-feedback-errorFg">*</span>
                </label>
                <input
                  id="sprint-start"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border-subtle hover:border-border-control bg-bg-surface text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-border-focusRing"
                  required
                />
              </div>

              <div>
                <label htmlFor="sprint-end" className="text-xs font-semibold text-fg-primary mb-1 block">
                  Data de fim <span className="text-feedback-errorFg">*</span>
                </label>
                <input
                  id="sprint-end"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border-subtle hover:border-border-control bg-bg-surface text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-border-focusRing"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-fg-secondary font-medium">Duração rápida:</span>
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDataFim(addDaysToInput(dataInicio || toDateInputValue(new Date()), preset.days))}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer',
                    timelineStats.totalDays === preset.days
                      ? 'bg-brand-action text-white border-brand-action'
                      : 'bg-bg-surface text-fg-primary border-border-subtle hover:bg-bg-disabled-emphasis'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {overlappingSprints.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FEF3C7] dark:bg-[#453009] border border-[#F59E0B]/40 text-xs text-[#7A4D00] dark:text-[#FCD34D]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  As datas selecionadas sobrepõem-se a{' '}
                  <strong>{overlappingSprints.map((s) => `Sprint ${s.numeroSprint}`).join(', ')}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Estado */}
          <div>
            <Select
              label="Estado do Sprint"
              options={SPRINT_STATUS_OPTIONS}
              value={estado}
              onChange={(val) => setEstado(val)}
              helperText={
                estado === 'ATIVO' && otherActiveSprint
                  ? `Atenção: o Sprint ${otherActiveSprint.numeroSprint} encontra-se ativo no momento.`
                  : 'Um Sprint planeado pode ser iniciado posteriormente a partir do quadro Kanban.'
              }
            />
          </div>

          {isEditMode && (
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] dark:text-[#FCA5A5] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Eliminar este Sprint
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-fg-secondary font-medium">
                    Confirmar eliminação? Histórias pendentes regressam ao Backlog.
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 rounded bg-[#DC2626] text-white font-semibold hover:bg-[#B91C1C] cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded border border-border-subtle text-fg-primary hover:bg-bg-page cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-end gap-3 select-none">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {isEditMode ? 'Guardar alterações' : 'Criar Sprint'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SprintModal() {
  const { isSprintModalOpen, editingSprint, closeSprintModal } = useModal()
  if (!isSprintModalOpen) return null
  return (
    <SprintModalInner
      key={editingSprint?.idSprint || 'new-sprint'}
      editingSprint={editingSprint}
      onClose={closeSprintModal}
    />
  )
}

export default SprintModal
