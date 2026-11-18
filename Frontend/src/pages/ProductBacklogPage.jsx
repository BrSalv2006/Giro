import { useState, useMemo } from 'react'
import {
  Button,
  TextField,
  Select,
  Avatar,
  SprintTimelineStrip,
  PlusIcon,
  SearchIcon,
} from '../components/common'
import {
  MoveUp,
  MoveDown,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
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

/**
 * ProductBacklogPage Component
 */
export function ProductBacklogPage() {
  const { permissions } = useAuth()
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const canManageLifecycle = Boolean(permissions?.canManageSprintLifecycle)
  const activeSprint = dataContext.activeSprint || null
  const activeSprintLabel = dataContext.activeSprintLabel || 'Sem sprint ativo'
  const activeSprintCode = dataContext.activeSprintCode || null
  const sprints = useMemo(() => dataContext.sprints || [], [dataContext.sprints])

  const [customOrderIds, setCustomOrderIds] = useState([])
  const [sortByEffort, setSortByEffort] = useState(false)

  const stories = useMemo(() => {
    const base = (dataContext.stories || []).map((s) => ({
      ...s,
      code: s.id,
      targetSprint:
        s.target && s.target !== 'Backlog do produto'
          ? s.target
          : activeSprintCode && s.sprint === activeSprintCode
          ? activeSprintLabel
          : 'Backlog do produto',
      epic: s.epic || 'Backlog & Priorização',
    }))
    if (sortByEffort) {
      return [...base].sort((a, b) => (b.points || 0) - (a.points || 0))
    }
    if (customOrderIds.length > 0) {
      const rank = new Map(customOrderIds.map((id, idx) => [id, idx]))
      return [...base].sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER
        const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER
        return ra - rb
      })
    }
    return base
  }, [dataContext.stories, customOrderIds, sortByEffort, activeSprintCode, activeSprintLabel])

  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [sprintFilter, setSprintFilter] = useState('ALL')
  const [notice, setNotice] = useState('')

  const sprintFilterOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'Todos os destinos' }]
    const seen = new Set()
    sprints.forEach((sp) => {
      const lbl = `Sprint ${sp.numeroSprint}`
      if (!seen.has(lbl)) {
        seen.add(lbl)
        const suffix = sp.estado === 'ATIVO' ? 'Em curso' : sp.estado === 'PLANEADO' ? 'Planeado' : sp.estado === 'CONCLUIDO' ? 'Concluído' : 'Cancelado'
        opts.push({ value: lbl, label: `${lbl} (${suffix})` })
      }
    })
    opts.push({ value: 'Backlog do produto', label: 'Backlog do produto' })
    return opts
  }, [sprints])

  const assignTargetOptions = useMemo(() => {
    const openSprints = sprints.filter((sp) => !['CONCLUIDO', 'CANCELADO'].includes(sp.estado))
    return [
      { value: 'BACKLOG', label: 'Backlog do produto' },
      ...openSprints.map((sp) => ({
        value: sp.idSprint,
        label: `Sprint ${sp.numeroSprint} (${sp.estado === 'ATIVO' ? 'Em curso' : 'Planeado'})`,
      })),
    ]
  }, [sprints])

  const moveItem = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= stories.length) return
    const updated = [...stories]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    setSortByEffort(false)
    setCustomOrderIds(updated.map((s) => s.id))
    setNotice(`✓ Ordem de ${moved.code} atualizada no Product Backlog.`)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleAssignSprint = async (storyId, selectedValue) => {
    try {
      if (!dataContext.updateStory) return
      if (selectedValue === 'BACKLOG') {
        await dataContext.updateStory(storyId, { idSprint: null })
        setNotice(`✓ ${storyId} movido para o Backlog do produto.`)
      } else {
        const sp = sprints.find((s) => s.idSprint === selectedValue)
        await dataContext.updateStory(storyId, { idSprint: selectedValue })
        setNotice(`✓ ${storyId} atribuído ao ${sp ? `Sprint ${sp.numeroSprint}` : 'Sprint'}.`)
      }
      setTimeout(() => setNotice(''), 3000)
    } catch (assignError) {
      setNotice(assignError.message || 'Não foi possível atribuir a história ao sprint.')
      setTimeout(() => setNotice(''), 3500)
    }
  }

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      if (priorityFilter !== 'ALL' && s.priority !== priorityFilter) {
        return false
      }
      if (sprintFilter !== 'ALL' && s.targetSprint !== sprintFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        return (
          s.title.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.epic?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [stories, priorityFilter, sprintFilter, searchTerm])

  const totalPoints = filteredStories.reduce((acc, s) => acc + (s.points || 0), 0)

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Product Backlog
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Organize histórias, prioridades e atribua entregas diretamente aos Sprints planeados ou ativos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageLifecycle && (
            <Button
              variant="secondary"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => modalContext.openSprintModal?.(null)}
            >
              Criar sprint
            </Button>
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

      {/* Alerta de Feedback */}
      {notice && (
        <div className="p-3 bg-[#DCFCE7] dark:bg-[#123823] border border-[#22C55E]/50 text-[#166534] dark:text-[#86EFAC] rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="underline hover:font-bold cursor-pointer">
            Dispensar
          </button>
        </div>
      )}

      {/* Timeline Compacta de Sprints */}
      <SprintTimelineStrip
        compact
        sprints={sprints}
        stories={dataContext.stories || []}
        selectedSprintId={sprints.find((sp) => `Sprint ${sp.numeroSprint}` === sprintFilter)?.idSprint || null}
        onSelectSprint={(id) => {
          const sp = sprints.find((s) => s.idSprint === id)
          if (!sp) return
          const label = `Sprint ${sp.numeroSprint}`
          setSprintFilter((prev) => (prev === label ? 'ALL' : label))
        }}
        onEditSprint={(sp) => modalContext.openSprintModal?.(sp)}
        onCreateSprint={() => modalContext.openSprintModal?.(null)}
        canManage={canManageLifecycle}
      />

      {/* 2. Barra de Resumo e Filtros */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-fg-primary">
            <span className="px-2.5 py-1 rounded bg-brand-selection text-brand-action font-bold">
              {stories.length} user stories disponíveis
            </span>
            <span className="text-fg-secondary">·</span>
            <span className="text-fg-secondary">Total: {totalPoints} Story Points</span>
            <span className="text-fg-secondary">·</span>
            <span className="text-fg-secondary">Ordenadas por prioridade estratégica</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setSortByEffort((prev) => !prev)
                setNotice(!sortByEffort ? 'Histórias ordenadas por Story Points decrescentes.' : 'Ordem estratégica restaurada.')
                setTimeout(() => setNotice(''), 3000)
              }}
            >
              Ordenar por Esforço
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border-subtle/60">
          <div>
            <TextField
              icon={<SearchIcon size={16} />}
              placeholder="Pesquisar por código, título ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[
                { value: 'ALL', label: 'Todas as prioridades' },
                { value: 'Alta', label: 'Alta prioridade' },
                { value: 'Média', label: 'Média prioridade' },
                { value: 'Baixa', label: 'Baixa prioridade' },
              ]}
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val)}
            />
          </div>

          <div>
            <Select
              options={sprintFilterOptions}
              value={sprintFilter}
              onChange={(val) => setSprintFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Tabela de Product Backlog */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-bg-page/70 border-b border-border-subtle text-fg-secondary uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-12 text-center">Ordem</th>
                <th className="py-3 px-3">User Story</th>
                <th className="py-3 px-3">Área</th>
                <th className="py-3 px-3">Prioridade</th>
                <th className="py-3 px-3 text-center">Esforço (SP)</th>
                <th className="py-3 px-3">Responsável</th>
                <th className="py-3 px-3">Sprint Destino</th>
                <th className="py-3 px-3 text-right">Atribuir Sprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredStories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-fg-secondary">
                    Nenhuma User Story encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredStories.map((story, index) => {
                  const isActiveSprint = story.targetSprint === activeSprintLabel && activeSprint
                  const currentSprintObj = sprints.find(
                    (sp) => sp.idSprint === story.sprintId || `Sprint ${sp.numeroSprint}` === story.targetSprint
                  )

                  return (
                    <tr
                      key={story.id}
                      className="hover:bg-bg-page/50 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveItem(index, 'up')}
                            className="p-0.5 hover:bg-border-subtle/50 rounded disabled:opacity-20 cursor-pointer"
                            title="Subir prioridade"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === filteredStories.length - 1}
                            onClick={() => moveItem(index, 'down')}
                            className="p-0.5 hover:bg-border-subtle/50 rounded disabled:opacity-20 cursor-pointer"
                            title="Descer prioridade"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-action bg-brand-selection px-1.5 py-0.5 rounded text-[11px]">
                            {story.code}
                          </span>
                          <span className="font-semibold text-fg-primary max-w-md">
                            {story.title}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] text-fg-secondary font-medium">
                          {story.epic}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            story.priority === 'Alta'
                              ? 'bg-brand-selection text-brand-action border border-brand-primary/30'
                              : story.priority === 'Média'
                              ? 'bg-[#FEF3C7] dark:bg-[#453009] text-[#7A4D00] dark:text-[#FCD34D] border border-[#FDE68A] dark:border-[#F59E0B]/40'
                              : 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD] border border-[#DDD6FE] dark:border-[#8B5CF6]/40'
                          }`}
                        >
                          {story.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-fg-primary bg-bg-page border border-border-subtle px-2 py-0.5 rounded text-xs">
                          {story.points || 0} SP
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={story.assignee?.name || 'Por atribuir'}
                            initials={story.assignee?.initials}
                            size={24}
                          />
                          <span className="font-medium text-fg-primary">
                            {story.assignee?.name || 'Por atribuir'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActiveSprint
                              ? 'bg-brand-action text-white'
                              : story.targetSprint !== 'Backlog do produto'
                              ? 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD]'
                              : 'bg-bg-page text-fg-secondary border border-border-subtle'
                          }`}
                        >
                          {story.targetSprint}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-block w-44 text-left">
                          <Select
                            options={assignTargetOptions}
                            value={currentSprintObj?.idSprint || 'BACKLOG'}
                            onChange={(val) => handleAssignSprint(story.id, val)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProductBacklogPage
