import { useState, useMemo } from 'react'
import {
  StoryCard,
  Button,
  Select,
  TextField,
  Avatar,
  SprintTimelineStrip,
  PlusIcon,
  SearchIcon,
} from '../components/common'
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Play,
  SlidersHorizontal,
} from 'lucide-react'
import { useAuth, getRoleLabel } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useModal } from '../context/ModalContext.jsx'

function useSafeData() {
  try {
    return useData() || {}
  } catch {
    return {}
  }
}

function useSafeModal() {
  try {
    return useModal() || {}
  } catch {
    return {}
  }
}

const COLUMNS = [
  { id: 'todo', label: 'A Fazer', color: 'border-t-[#707987]', badgeColor: 'bg-[#E4E5EA] dark:bg-[#272B36] text-[#292D35] dark:text-[#E5E7EB]' },
  { id: 'in_progress', label: 'Em Desenvolvimento', color: 'border-t-[#8B5CF6]', badgeColor: 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD]' },
  { id: 'review', label: 'Em Revisão / Testes', color: 'border-t-[#F59E0B]', badgeColor: 'bg-[#FEF3C7] dark:bg-[#453009] text-[#7A4D00] dark:text-[#FCD34D]' },
  { id: 'done', label: 'Concluído', color: 'border-t-[#22C55E]', badgeColor: 'bg-[#DCFCE7] dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC]' },
]

const SPRINT_STATE_BADGE = {
  ATIVO: { label: 'Em curso', cls: 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD]' },
  PLANEADO: { label: 'Planeado', cls: 'bg-[#FEF3C7] dark:bg-[#453009] text-[#7A4D00] dark:text-[#FCD34D]' },
  CONCLUIDO: { label: 'Concluído', cls: 'bg-[#DCFCE7] dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC]' },
  CANCELADO: { label: 'Cancelado', cls: 'bg-[#FEE2E2] dark:bg-[#451B1B] text-[#DC2626] dark:text-[#FCA5A5]' },
}

function formatDateRange(startValue, endValue) {
  if (!startValue || !endValue) return 'Sem datas definidas'
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Sem datas definidas'
  const startStr = start.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  const endStr = end.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

/**
 * SprintKanbanPage Component
 */
export function SprintKanbanPage() {
  const { permissions } = useAuth()
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const canManageLifecycle = Boolean(permissions?.canManageSprintLifecycle)
  const sprints = useMemo(() => dataContext.sprints || [], [dataContext.sprints])
  const allStories = useMemo(() => dataContext.stories || [], [dataContext.stories])
  const activeSprint = dataContext.activeSprint || null

  const [selectedSprintIdState, setSelectedSprintIdState] = useState(null)
  const selectedSprint = useMemo(() => {
    if (selectedSprintIdState) {
      const matched = sprints.find((s) => s.idSprint === selectedSprintIdState)
      if (matched) return matched
    }
    return activeSprint || sprints[0] || null
  }, [selectedSprintIdState, sprints, activeSprint])

  const selectedSprintLabel = selectedSprint?.numeroSprint ? `Sprint ${selectedSprint.numeroSprint}` : 'Sem sprint selecionado'
  const selectedSprintCode = selectedSprint?.numeroSprint ? `sprint-${selectedSprint.numeroSprint}` : null

  const localStories = useMemo(() => {
    if (!selectedSprint) return []
    return allStories.filter(
      (s) =>
        s.sprintId === selectedSprint.idSprint ||
        (selectedSprintCode && s.sprint === selectedSprintCode) ||
        s.target === selectedSprintLabel
    )
  }, [allStories, selectedSprint, selectedSprintCode, selectedSprintLabel])

  const assigneeOptions = useMemo(() => {
    const internalUsers = (dataContext.users || []).filter(
      (u) => u.active !== false && u.role !== 'CLIENT' && u.roleCode !== 'P04'
    )
    const map = new Map()
    internalUsers.forEach((u) => {
      if (u.name && !map.has(u.name)) {
        map.set(u.name, `${u.name} (${getRoleLabel(u.role)})`)
      }
    })
    localStories.forEach((s) => {
      const name = s.assignee?.name
      if (name && !map.has(name)) {
        map.set(name, s.assignee?.role ? `${name} (${s.assignee.role})` : name)
      }
    })
    return [
      { value: 'ALL', label: 'Todos os responsáveis' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [dataContext.users, localStories])

  const sprintSelectOptions = useMemo(
    () =>
      sprints.map((sp) => {
        const badge = SPRINT_STATE_BADGE[sp.estado]?.label || sp.estado
        return {
          value: sp.idSprint,
          label: `Sprint ${sp.numeroSprint} (${badge})`,
        }
      }),
    [sprints]
  )

  const [nowMs] = useState(() => Date.now())
  const daysRemaining = useMemo(() => {
    if (!selectedSprint?.dataFim) return null
    const diff = Math.ceil((new Date(selectedSprint.dataFim).getTime() - nowMs) / 86400000)
    return Math.max(0, diff)
  }, [selectedSprint, nowMs])

  const [selectedAssignee, setSelectedAssignee] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStoryDetail, setSelectedStoryDetail] = useState(null)
  const [showTimeline, setShowTimeline] = useState(true)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [incompletePolicy, setIncompletePolicy] = useState('BACKLOG')
  const [targetSprintId, setTargetSprintId] = useState('')
  const [isMutatingSprint, setIsMutatingSprint] = useState(false)
  const [alertNotice, setAlertNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')

  const showFeedback = (msg) => {
    setErrorNotice('')
    setAlertNotice(msg)
    setTimeout(() => setAlertNotice(''), 3500)
  }

  const showError = (msg) => {
    setAlertNotice('')
    setErrorNotice(msg)
    setTimeout(() => setErrorNotice(''), 4500)
  }

  const handleMoveStatus = async (storyId, direction) => {
    const colOrder = ['todo', 'in_progress', 'review', 'done']
    const story = localStories.find((s) => s.id === storyId)
    if (!story) return
    const currentIndex = colOrder.indexOf(story.status)
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= colOrder.length) return
    const nextStatus = colOrder[nextIndex]

    try {
      if (dataContext.moveStory) {
        await dataContext.moveStory(storyId, nextStatus)
      }
      showFeedback(`✓ ${story.id} movido para "${COLUMNS.find((c) => c.id === nextStatus)?.label}".`)
    } catch (moveError) {
      showError(moveError.message || 'Não foi possível mover a User Story.')
    }
  }

  const handleActivateSprint = async () => {
    if (!selectedSprint || !dataContext.activateSprint) return
    setIsMutatingSprint(true)
    try {
      await dataContext.activateSprint(selectedSprint.idSprint)
      showFeedback(`✓ Sprint ${selectedSprint.numeroSprint} iniciado e definido como Sprint ativo.`)
    } catch (err) {
      showError(err.message || 'Não foi possível iniciar o Sprint.')
    } finally {
      setIsMutatingSprint(false)
    }
  }

  const plannedTargetSprints = useMemo(
    () => sprints.filter((sp) => sp.idSprint !== selectedSprint?.idSprint && sp.estado === 'PLANEADO'),
    [sprints, selectedSprint]
  )

  const handleConfirmCompleteSprint = async (e) => {
    e.preventDefault()
    if (!selectedSprint || !dataContext.completeSprint) return
    if (incompletePolicy === 'NEXT_SPRINT' && !targetSprintId) {
      showError('Selecione um Sprint planeado de destino para transferir as histórias pendentes.')
      return
    }
    setIsMutatingSprint(true)
    try {
      await dataContext.completeSprint(selectedSprint.idSprint, {
        incompletePolicy,
        targetSprintId: incompletePolicy === 'NEXT_SPRINT' ? targetSprintId : null,
      })
      setCompleteModalOpen(false)
      showFeedback(`✓ Sprint ${selectedSprint.numeroSprint} concluído com sucesso.`)
    } catch (err) {
      showError(err.message || 'Não foi possível concluir o Sprint.')
    } finally {
      setIsMutatingSprint(false)
    }
  }

  const blockedStories = useMemo(
    () => localStories.filter((s) => Boolean(s.impediment) || s.status === 'blocked'),
    [localStories]
  )
  const incompleteStoriesCount = useMemo(
    () => localStories.filter((s) => s.status !== 'done').length,
    [localStories]
  )

  const totalPoints = localStories.reduce((acc, s) => acc + (s.points || 0), 0)
  const donePoints = localStories
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.points || 0), 0)
  const doneStoriesCount = localStories.filter((s) => s.status === 'done').length

  const filteredStories = useMemo(() => {
    return localStories.filter((s) => {
      if (selectedAssignee !== 'ALL' && s.assignee?.name !== selectedAssignee) {
        return false
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchTitle = s.title.toLowerCase().includes(query)
        const matchId = s.id.toLowerCase().includes(query)
        if (!matchTitle && !matchId) return false
      }
      return true
    })
  }, [localStories, selectedAssignee, searchTerm])

  const stateMeta = selectedSprint ? (SPRINT_STATE_BADGE[selectedSprint.estado] || SPRINT_STATE_BADGE.PLANEADO) : null

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Cabeçalho e Controlos de Sprint */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Sprint
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Crie e gira Sprints, defina timelines e acompanhe o progresso das User Stories no quadro Kanban.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sprints.length > 0 && (
            <div className="w-52">
              <Select
                options={sprintSelectOptions}
                value={selectedSprint?.idSprint || ''}
                onChange={(val) => setSelectedSprintIdState(val)}
              />
            </div>
          )}

          <Button
            variant="secondary"
            icon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setShowTimeline((prev) => !prev)}
          >
            {showTimeline ? 'Ocultar timeline' : 'Ver timeline'}
          </Button>

          {canManageLifecycle && (
            <>
              <Button
                variant="secondary"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => modalContext.openSprintModal?.(null)}
              >
                Criar sprint
              </Button>

              {selectedSprint && (
                <Button
                  variant="secondary"
                  onClick={() => modalContext.openSprintModal?.(selectedSprint)}
                >
                  Editar datas
                </Button>
              )}

              {selectedSprint?.estado === 'PLANEADO' && (
                <Button
                  variant="primary"
                  icon={<Play className="w-4 h-4" />}
                  loading={isMutatingSprint}
                  onClick={handleActivateSprint}
                >
                  Iniciar sprint
                </Button>
              )}

              {selectedSprint?.estado === 'ATIVO' && (
                <Button
                  variant="secondary"
                  loading={isMutatingSprint}
                  onClick={() => {
                    setIncompletePolicy('BACKLOG')
                    setTargetSprintId(plannedTargetSprints[0]?.idSprint || '')
                    setCompleteModalOpen(true)
                  }}
                >
                  Concluir sprint
                </Button>
              )}
            </>
          )}

          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={() => modalContext.openCreateStoryModal?.()}
          >
            Criar user story
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alertNotice && (
        <div className="p-3 bg-[#DCFCE7] dark:bg-[#123823] border border-[#22C55E]/50 text-[#166534] dark:text-[#86EFAC] rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{alertNotice}</span>
          <button onClick={() => setAlertNotice('')} className="underline hover:font-bold cursor-pointer">
            Dispensar
          </button>
        </div>
      )}

      {errorNotice && (
        <div role="alert" className="p-3 bg-feedback-errorBg border border-feedback-errorBorder text-feedback-errorFg rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice('')} className="underline hover:font-bold cursor-pointer">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Timeline dos Sprints */}
      {showTimeline && (
        <SprintTimelineStrip
          sprints={sprints}
          stories={allStories}
          selectedSprintId={selectedSprint?.idSprint || null}
          onSelectSprint={(id) => setSelectedSprintIdState(id)}
          onEditSprint={(sp) => modalContext.openSprintModal?.(sp)}
          onCreateSprint={() => modalContext.openSprintModal?.(null)}
          canManage={canManageLifecycle}
        />
      )}

      {/* 3. Cartão de Estado do Sprint Selecionado */}
      {!selectedSprint ? (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 text-center space-y-3 shadow-xs">
          <Calendar className="w-8 h-8 text-brand-primary mx-auto" aria-hidden="true" />
          <h2 className="text-base font-bold text-fg-primary">Nenhum Sprint criado</h2>
          <p className="text-xs text-fg-secondary max-w-md mx-auto">
            Crie o primeiro Sprint com datas de início e fim para começar a planear e acompanhar as entregas no Kanban.
          </p>
          {canManageLifecycle && (
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={() => modalContext.openSprintModal?.(null)}
            >
              Criar primeiro sprint
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded bg-brand-action text-white text-xs font-bold">
                  {selectedSprintLabel}
                </span>
                {stateMeta && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stateMeta.cls}`}>
                    {stateMeta.label}
                  </span>
                )}
                <span className="text-xs text-fg-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDateRange(selectedSprint.dataInicio, selectedSprint.dataFim)}
                  {selectedSprint.estado === 'ATIVO' && daysRemaining !== null && ` (${daysRemaining} dias restantes)`}
                </span>
                {selectedSprint.capacidadeMaxima && (
                  <span className="text-xs text-fg-secondary">
                    · Capacidade: {totalPoints}/{selectedSprint.capacidadeMaxima} SP
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-fg-primary">
                  {donePoints} de {totalPoints} pontos concluídos
                </span>
                <span className="text-brand-action font-bold">
                  {totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0}% concluído
                </span>
                <span className="text-fg-secondary">
                  ({doneStoriesCount} de {localStories.length} histórias)
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-border-subtle/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-action h-full rounded-full transition-all duration-300"
                style={{ width: `${totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0}%` }}
              />
            </div>

            {/* Bloqueios & Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-selection border border-brand-primary/30 text-xs text-brand-action font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-brand-action" />
                <span>
                  {blockedStories.length > 0
                    ? `${blockedStories.length} bloqueio(s) ativo(s): ${blockedStories.map((b) => b.id).join(' e ')} requerem atenção do Scrum Master`
                    : 'Sem bloqueios ativos neste Sprint'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-48">
                  <Select
                    options={assigneeOptions}
                    value={selectedAssignee}
                    onChange={(val) => setSelectedAssignee(val)}
                  />
                </div>
                <div className="w-48">
                  <TextField
                    icon={<SearchIcon size={14} />}
                    placeholder="Pesquisar story..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Quadro Kanban com 4 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((column, colIndex) => {
              const columnStories = filteredStories.filter((s) => s.status === column.id)
              const columnPoints = columnStories.reduce((acc, s) => acc + (s.points || 0), 0)

              return (
                <div
                  key={column.id}
                  className={`bg-bg-page border border-border-subtle rounded-xl flex flex-col max-h-[800px] shadow-2xs border-t-4 ${column.color}`}
                >
                  <div className="p-3.5 border-b border-border-subtle/80 flex items-center justify-between bg-bg-surface rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-fg-primary uppercase tracking-wider">
                        {column.label}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${column.badgeColor}`}>
                        {columnStories.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-fg-secondary">
                      {columnPoints} SP
                    </span>
                  </div>

                  <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[300px]">
                    {columnStories.length === 0 ? (
                      <div className="h-28 border border-dashed border-border-subtle/70 rounded-lg flex items-center justify-center text-xs text-fg-secondary/60">
                        Nenhuma história
                      </div>
                    ) : (
                      columnStories.map((story) => (
                        <div key={story.id} className="relative group">
                          <StoryCard
                            code={story.id}
                            title={story.title}
                            storyPoints={story.points}
                            assignee={story.assignee}
                            blocked={Boolean(story.impediment)}
                            blockedReason={story.impediment}
                            priority={story.priority}
                            onClick={() => setSelectedStoryDetail(story)}
                          />

                          <div className="mt-1.5 flex items-center justify-between text-[11px] px-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            {colIndex > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveStatus(story.id, 'prev')
                                }}
                                className="inline-flex items-center gap-1 text-fg-secondary hover:text-fg-primary font-medium p-1 hover:bg-bg-surface rounded cursor-pointer"
                                title={`Mover para ${COLUMNS[colIndex - 1]?.label}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Anterior</span>
                              </button>
                            ) : <span />}

                            {colIndex < COLUMNS.length - 1 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveStatus(story.id, 'next')
                                }}
                                className="inline-flex items-center gap-1 text-brand-action hover:text-brand-hover font-semibold p-1 hover:bg-brand-selection rounded ml-auto cursor-pointer"
                                title={`Avançar para ${COLUMNS[colIndex + 1]?.label}`}
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#16A34A] dark:text-[#86EFAC] font-semibold text-[11px] ml-auto">
                                <CheckCircle2 className="w-3 h-3" />
                                Entregue
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal de Encerramento Real de Sprint */}
      {completeModalOpen && selectedSprint && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setCompleteModalOpen(false)}
        >
          <form
            onSubmit={handleConfirmCompleteSprint}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-surface border border-border-subtle rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-fg-primary">
                Concluir {selectedSprintLabel}
              </h3>
              <p className="text-xs text-fg-secondary">
                {doneStoriesCount} história(s) concluída(s) · {incompleteStoriesCount} história(s) por concluir.
              </p>
            </div>

            {incompleteStoriesCount > 0 && (
              <div className="space-y-3 p-3.5 rounded-xl bg-bg-page border border-border-subtle text-xs">
                <p className="font-semibold text-fg-primary">
                  O que pretende fazer com as {incompleteStoriesCount} história(s) não concluída(s)?
                </p>

                <label className="flex items-center gap-2 cursor-pointer text-fg-primary">
                  <input
                    type="radio"
                    name="incompletePolicy"
                    checked={incompletePolicy === 'BACKLOG'}
                    onChange={() => setIncompletePolicy('BACKLOG')}
                  />
                  <span>Devolver ao Product Backlog</span>
                </label>

                <label
                  className={`flex items-center gap-2 ${
                    plannedTargetSprints.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-fg-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="incompletePolicy"
                    disabled={plannedTargetSprints.length === 0}
                    checked={incompletePolicy === 'NEXT_SPRINT'}
                    onChange={() => setIncompletePolicy('NEXT_SPRINT')}
                  />
                  <span>Mover para Sprint planeado</span>
                </label>

                {incompletePolicy === 'NEXT_SPRINT' && plannedTargetSprints.length > 0 && (
                  <Select
                    options={plannedTargetSprints.map((sp) => ({
                      value: sp.idSprint,
                      label: `Sprint ${sp.numeroSprint} (${formatDateRange(sp.dataInicio, sp.dataFim)})`,
                    }))}
                    value={targetSprintId}
                    onChange={(val) => setTargetSprintId(val)}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCompleteModalOpen(false)} disabled={isMutatingSprint}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isMutatingSprint}>
                Confirmar conclusão
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Detalhe da User Story */}
      {selectedStoryDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={() => setSelectedStoryDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-surface border border-border-subtle rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-brand-selection text-brand-action px-2 py-0.5 rounded">
                  {selectedStoryDetail.id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-page text-fg-primary border border-border-subtle">
                  {selectedStoryDetail.points || 0} Story Points
                </span>
              </div>
              <button
                onClick={() => setSelectedStoryDetail(null)}
                className="text-fg-secondary hover:text-fg-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-fg-primary">
                {selectedStoryDetail.title}
              </h3>
              <p className="text-xs text-fg-secondary mt-1.5 leading-relaxed">
                {selectedStoryDetail.description}
              </p>
            </div>

            {selectedStoryDetail.impediment && (
              <div className="p-3 bg-brand-selection border border-brand-primary/30 rounded-lg text-xs text-brand-action font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Bloqueio Ativo</div>
                  <div className="font-normal text-fg-primary mt-0.5">{selectedStoryDetail.impediment}</div>
                </div>
              </div>
            )}

            <div className="p-3 bg-bg-page rounded-lg space-y-2 text-xs border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-fg-secondary">Responsável:</span>
                <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                  <Avatar name={selectedStoryDetail.assignee?.name || 'Por atribuir'} initials={selectedStoryDetail.assignee?.initials} size={20} />
                  {selectedStoryDetail.assignee?.name || 'Por atribuir'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Prioridade:</span>
                <span className="font-semibold text-fg-primary">{selectedStoryDetail.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Estado Técnico:</span>
                <span className="font-semibold text-brand-action">
                  {COLUMNS.find((c) => c.id === selectedStoryDetail.status)?.label}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setSelectedStoryDetail(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SprintKanbanPage
