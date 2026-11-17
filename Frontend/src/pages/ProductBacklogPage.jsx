import { useState, useMemo } from 'react'
import {
  Button,
  TextField,
  Select,
  Avatar,
  PlusIcon,
  SearchIcon,
} from '../components/common'
import {
  MoveUp,
  MoveDown,
  CheckCircle2,
} from 'lucide-react'
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

const DEFAULT_BACKLOG_STORIES = [
  {
    id: 'US-31',
    code: 'US-31',
    title: 'Filtrar pedidos por categoria e estado de análise',
    epic: 'EP01: Gestão de Pedidos',
    priority: 'Alta',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    targetSprint: 'Sprint 12',
    status: 'in_progress',
  },
  {
    id: 'US-42',
    code: 'US-42',
    title: 'Persistir votos únicos de utilizadores por pedido (RNF-SEG-03)',
    epic: 'EP05: Participação',
    priority: 'Alta',
    points: 3,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    targetSprint: 'Sprint 12',
    status: 'in_progress',
  },
  {
    id: 'US-48',
    code: 'US-48',
    title: 'Visualizar burndown chart e progresso da Sprint 12',
    epic: 'EP04: Gestão de Sprints',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    targetSprint: 'Sprint 12',
    status: 'review',
  },
  {
    id: 'US-51',
    code: 'US-51',
    title: 'Deteção automática de pedidos semelhantes em tempo real (< 200 ms)',
    epic: 'EP01: Gestão de Pedidos',
    priority: 'Alta',
    points: 5,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    targetSprint: 'Sprint 13',
    status: 'todo',
  },
  {
    id: 'US-55',
    code: 'US-55',
    title: 'Sistema de notificações visuais para menções de equipa',
    epic: 'EP05: Participação',
    priority: 'Média',
    points: 8,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    targetSprint: 'Sprint 12',
    status: 'todo',
  },
  {
    id: 'US-60',
    code: 'US-60',
    title: 'Temporizador de inatividade de 60 minutos (RNF-SEG-01)',
    epic: 'EP03: Rastreabilidade',
    priority: 'Alta',
    points: 2,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    targetSprint: 'Sprint 12',
    status: 'done',
  },
  {
    id: 'US-64',
    code: 'US-64',
    title: 'Roadmap visual trimestral com marcos de entrega',
    epic: 'EP06: Lançamentos & Roadmap',
    priority: 'Alta',
    points: 8,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    targetSprint: 'Sprint 13',
    status: 'todo',
  },
  {
    id: 'US-71',
    code: 'US-71',
    title: 'Associação direta de pedidos a novas user stories',
    epic: 'EP02: Backlog & IA',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    targetSprint: 'Sprint 12',
    status: 'todo',
  },
  {
    id: 'US-73',
    code: 'US-73',
    title: 'Matriz bidirecional com ligações Git e testes automatizados',
    epic: 'EP03: Rastreabilidade',
    priority: 'Alta',
    points: 8,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    targetSprint: 'Sprint 13',
    status: 'todo',
  },
  {
    id: 'US-75',
    code: 'US-75',
    title: 'Exportação consolidada de relatórios em formato CSV e PDF',
    epic: 'EP06: Lançamentos & Roadmap',
    priority: 'Baixa',
    points: 3,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    targetSprint: 'Backlog do produto',
    status: 'todo',
  },
  {
    id: 'US-82',
    code: 'US-82',
    title: 'Sugestões de priorização pelo Gemini com cálculo de esforço',
    epic: 'EP02: Backlog & IA',
    priority: 'Alta',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    targetSprint: 'Backlog do produto',
    status: 'todo',
  },
  {
    id: 'US-88',
    code: 'US-88',
    title: 'Diálogo de confirmação para ações destrutivas (RNF-USA-03)',
    epic: 'EP03: Rastreabilidade',
    priority: 'Média',
    points: 2,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    targetSprint: 'Backlog do produto',
    status: 'todo',
  },
]

/**
 * ProductBacklogPage Component
 * Conforme Figma frame 326:4341 ("Product Backlog", 1600x1200)
 */
export function ProductBacklogPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const [stories, setStories] = useState(() => {
    if (dataContext.stories?.length > 0) {
      return dataContext.stories.map((s) => ({
        ...s,
        code: s.id,
        targetSprint: s.target || (s.sprint === 'sprint-12' ? 'Sprint 12' : 'Backlog do produto'),
        epic: s.epic || 'EP02: Backlog & IA',
      }))
    }
    return DEFAULT_BACKLOG_STORIES
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [sprintFilter, setSprintFilter] = useState('ALL')
  const [notice, setNotice] = useState('')

  // Reordenação de histórias no Backlog
  const moveItem = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= stories.length) return
    const updated = [...stories]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    setStories(updated)
    setNotice(`✓ Ordem de ${moved.code} atualizada no Product Backlog.`)
    setTimeout(() => setNotice(''), 3000)
  }

  // Mover story para Sprint 12
  const handleAssignSprint = (storyId, newSprint) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, targetSprint: newSprint } : s))
    )
    if (dataContext.updateStory) {
      dataContext.updateStory(storyId, {
        target: newSprint,
        sprint: newSprint === 'Sprint 12' ? 'sprint-12' : null,
      })
    }
    setNotice(`✓ ${storyId} atribuído a ${newSprint}.`)
    setTimeout(() => setNotice(''), 3000)
  }

  // Filtragem
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
      {/* 1. Introdução / Cabeçalho da Página (Figma 326:4341) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Product Backlog
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Organize histórias, prioridades e dependências antes de planear os sprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setNotice('Sprint 12 concluído com sucesso. Histórias pendentes arquivadas.')
              setTimeout(() => setNotice(''), 3500)
            }}
          >
            Concluir sprint
          </Button>

          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={() => {
              if (modalContext.openCreateStoryModal) {
                modalContext.openCreateStoryModal()
              }
            }}
          >
            Criar user story
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {notice && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="underline hover:font-bold">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Barra de Resumo e Filtros (Figma 326:4341) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-primary">
            <span className="px-2.5 py-1 rounded bg-[#FFE3DC] text-brand-action font-bold">
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
                const sorted = [...stories].sort((a, b) => (b.points || 0) - (a.points || 0))
                setStories(sorted)
                setNotice('Histórias ordenadas por Story Points decrescentes.')
                setTimeout(() => setNotice(''), 3000)
              }}
            >
              Ordenar por Esforço
            </Button>
          </div>
        </div>

        {/* Linha de Controlos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border-subtle/60">
          <div>
            <TextField
              icon={<SearchIcon size={16} />}
              placeholder="Pesquisar por código, título ou épico..."
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
              options={[
                { value: 'ALL', label: 'Todos os destinos' },
                { value: 'Sprint 12', label: 'Sprint 12 (Corrente)' },
                { value: 'Sprint 13', label: 'Sprint 13 (Planeado)' },
                { value: 'Backlog do produto', label: 'Backlog do produto' },
              ]}
              value={sprintFilter}
              onChange={(val) => setSprintFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Tabela Rica e Interativa de Product Backlog */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-bg-page/70 border-b border-border-subtle text-fg-secondary uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-12 text-center">Ordem</th>
                <th className="py-3 px-3">User Story</th>
                <th className="py-3 px-3">Épico</th>
                <th className="py-3 px-3">Prioridade</th>
                <th className="py-3 px-3 text-center">Esforço (SP)</th>
                <th className="py-3 px-3">Responsável</th>
                <th className="py-3 px-3">Sprint Destino</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredStories.map((story, index) => {
                const isSprint12 = story.targetSprint === 'Sprint 12'

                return (
                  <tr
                    key={story.id}
                    className="hover:bg-bg-page/50 transition-colors group"
                  >
                    {/* Botões de Reordenação */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(index, 'up')}
                          className="p-0.5 hover:bg-border-subtle/50 rounded disabled:opacity-20"
                          title="Subir prioridade"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === filteredStories.length - 1}
                          onClick={() => moveItem(index, 'down')}
                          className="p-0.5 hover:bg-border-subtle/50 rounded disabled:opacity-20"
                          title="Descer prioridade"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Código e Título */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-action bg-[#FFE3DC] px-1.5 py-0.5 rounded text-[11px]">
                          {story.code}
                        </span>
                        <span className="font-semibold text-fg-primary max-w-md">
                          {story.title}
                        </span>
                      </div>
                    </td>

                    {/* Épico */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-fg-secondary font-medium">
                        {story.epic}
                      </span>
                    </td>

                    {/* Prioridade */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          story.priority === 'Alta'
                            ? 'bg-[#FFE3DC] text-[#B93826] border border-[#F8C1B7]'
                            : story.priority === 'Média'
                            ? 'bg-[#FEF3C7] text-[#7A4D00] border border-[#FDE68A]'
                            : 'bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]'
                        }`}
                      >
                        {story.priority}
                      </span>
                    </td>

                    {/* Esforço em SP */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-fg-primary bg-bg-page border border-border-subtle px-2 py-0.5 rounded text-xs">
                        {story.points} SP
                      </span>
                    </td>

                    {/* Responsável */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={story.assignee?.name}
                          initials={story.assignee?.initials}
                          size={24}
                        />
                        <span className="font-medium text-fg-primary">
                          {story.assignee?.name}
                        </span>
                      </div>
                    </td>

                    {/* Sprint Destino */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSprint12
                            ? 'bg-brand-action text-white'
                            : story.targetSprint === 'Sprint 13'
                            ? 'bg-[#EDE9FE] text-[#5B21B6]'
                            : 'bg-bg-page text-fg-secondary border border-border-subtle'
                        }`}
                      >
                        {story.targetSprint}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSprint12 ? (
                          <Button
                            variant="secondary"
                            className="text-[11px] py-1 px-2.5 h-7"
                            onClick={() => handleAssignSprint(story.id, 'Sprint 12')}
                          >
                            Mover p/ Sprint 12
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#16A34A] font-semibold flex items-center gap-1 px-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            No Sprint
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProductBacklogPage
