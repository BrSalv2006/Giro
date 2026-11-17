import { useState, useMemo } from 'react'
import {
  StoryCard,
  Button,
  StatusBadge,
  Select,
  TextField,
  Avatar,
  PlusIcon,
  SearchIcon,
} from '../components/common'
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar,
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

const DEFAULT_SPRINT_STORIES = [
  {
    id: 'US-55',
    title: 'Sistema de notificações visuais para menções de equipa',
    description: 'Como utilizador, quero receber alerta com indicador vermelho no sino sempre que alguém me mencionar, para responder prontamente.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'todo',
    priority: 'Média',
    points: 8,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: null,
  },
  {
    id: 'US-71',
    title: 'Associação direta de pedidos a novas user stories',
    description: 'Como PO, quero poder converter ou associar um pedido da comunidade a uma história no momento da sua criação.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'todo',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: null,
  },
  {
    id: 'US-31',
    title: 'Filtrar pedidos por categoria e estado de análise',
    description: 'Como Product Owner, quero filtrar os pedidos por categoria e estado, para acelerar a triagem e priorização no backlog do produto.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'in_progress',
    priority: 'Alta',
    points: 5,
    assignee: { name: 'Sofia Costa', initials: 'SC', role: 'Product Owner' },
    impediment: 'Bloqueado por dependência da API de busca facetada.',
  },
  {
    id: 'US-42',
    title: 'Persistir votos únicos de utilizadores por pedido (RNF-SEG-03)',
    description: 'Como developer, quero restringir a votação a no máximo 1 voto por utilizador autenticado, para garantir a integridade da priorização.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'in_progress',
    priority: 'Alta',
    points: 3,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: 'Bloqueado por aprovação técnica da migração de base de dados e índices únicos.',
  },
  {
    id: 'US-48',
    title: 'Visualizar burndown chart e progresso da Sprint 12',
    description: 'Como Scrum Master, quero acompanhar a evolução diária dos story points concluídos, para prever desvios na meta do ciclo.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'review',
    priority: 'Média',
    points: 5,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    impediment: null,
  },
  {
    id: 'US-24',
    title: 'Exportar pedidos e atas de sprint para documento PDF',
    description: 'Como utilizador, quero transferir a lista de pedidos aprovados para PDF formatado, para relatórios com stakeholders externos.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'done',
    priority: 'Baixa',
    points: 3,
    assignee: { name: 'Inês Martins', initials: 'IM', role: 'Scrum Master' },
    impediment: null,
  },
  {
    id: 'US-60',
    title: 'Temporizador de inatividade de 60 minutos (RNF-SEG-01)',
    description: 'Como developer, quero desconectar automaticamente sessões inativas após 60 minutos de ausência, para cumprir os requisitos de segurança.',
    target: 'Sprint 12',
    sprint: 'sprint-12',
    status: 'done',
    priority: 'Alta',
    points: 2,
    assignee: { name: 'Rafael Silva', initials: 'RS', role: 'Developer' },
    impediment: null,
  },
]

const COLUMNS = [
  { id: 'todo', label: 'A Fazer', color: 'border-t-[#707987]', badgeColor: 'bg-[#E4E5EA] text-[#292D35]' },
  { id: 'in_progress', label: 'Em Desenvolvimento', color: 'border-t-[#8B5CF6]', badgeColor: 'bg-[#EDE9FE] text-[#5B21B6]' },
  { id: 'review', label: 'Em Revisão / Testes', color: 'border-t-[#F59E0B]', badgeColor: 'bg-[#FEF3C7] text-[#7A4D00]' },
  { id: 'done', label: 'Concluído', color: 'border-t-[#22C55E]', badgeColor: 'bg-[#DCFCE7] text-[#166534]' },
]

/**
 * SprintKanbanPage Component
 * Conforme Figma frame 325:1972 ("Quadro de Sprint e Backlog", 1600x1200)
 */
export function SprintKanbanPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const liveStories = dataContext.sprintStories?.length > 0
    ? dataContext.sprintStories
    : dataContext.stories?.filter((s) => s.sprint === 'sprint-12')?.length > 0
    ? dataContext.stories.filter((s) => s.sprint === 'sprint-12')
    : DEFAULT_SPRINT_STORIES

  const [localStories, setLocalStories] = useState(liveStories)
  const [selectedAssignee, setSelectedAssignee] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStoryDetail, setSelectedStoryDetail] = useState(null)
  const [alertNotice, setAlertNotice] = useState('')

  // Mover story entre colunas
  const handleMoveStatus = (storyId, direction) => {
    const colOrder = ['todo', 'in_progress', 'review', 'done']
    setLocalStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s
        const currentIndex = colOrder.indexOf(s.status)
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
        if (nextIndex < 0 || nextIndex >= colOrder.length) return s
        const nextStatus = colOrder[nextIndex]

        if (dataContext.moveStory) {
          dataContext.moveStory(storyId, nextStatus)
        }

        setAlertNotice(`✓ ${s.id} movido para "${COLUMNS.find((c) => c.id === nextStatus)?.label}".`)
        setTimeout(() => setAlertNotice(''), 3000)

        return { ...s, status: nextStatus }
      })
    )
  }

  // Cálculos do Sprint
  const totalPoints = localStories.reduce((acc, s) => acc + (s.points || 0), 0)
  const donePoints = localStories
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.points || 0), 0)
  const doneStoriesCount = localStories.filter((s) => s.status === 'done').length

  // Filtros
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

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Cabeçalho (Figma 325:1972) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Sprint
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Organize as user stories, acompanhe o sprint e prepare as próximas entregas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setAlertNotice('Revisão do Sprint 12 iniciada. Todos os critérios foram arquivados.')
              setTimeout(() => setAlertNotice(''), 4000)
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

      {/* Alerta temporário */}
      {alertNotice && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{alertNotice}</span>
          <button onClick={() => setAlertNotice('')} className="underline hover:font-bold">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Sprint Status Card (Figma 325:1972) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-brand-action text-white text-xs font-bold">
              Sprint 12
            </span>
            <StatusBadge status="development" />
            <span className="text-xs text-fg-secondary flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              12–23 out. 2026 (3 dias restantes)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-fg-primary">
              {donePoints} de {totalPoints} pontos concluídos
            </span>
            <span className="text-brand-action font-bold">
              {Math.round((donePoints / (totalPoints || 1)) * 100)}% concluído
            </span>
            <span className="text-fg-secondary">
              ({doneStoriesCount} de {localStories.length} histórias)
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Sprint */}
        <div className="w-full bg-border-subtle/50 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-action h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round((donePoints / (totalPoints || 1)) * 100)}%` }}
          />
        </div>

        {/* Linha de Bloqueios e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Alerta de Impedimentos */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFE3DC] border border-[#F8C1B7] text-xs text-brand-action font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-brand-action" />
            <span>2 bloqueios ativos: US-31 e US-42 requerem atenção do Scrum Master</span>
          </div>

          {/* Filtros de Quadro */}
          <div className="flex items-center gap-2">
            <div className="w-44">
              <Select
                options={[
                  { value: 'ALL', label: 'Todos os responsáveis' },
                  { value: 'Sofia Costa', label: 'Sofia Costa (PO)' },
                  { value: 'Rafael Silva', label: 'Rafael Silva (Dev)' },
                  { value: 'Inês Martins', label: 'Inês Martins (SM)' },
                ]}
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

      {/* 3. Quadro Kanban com 4 Colunas (Figma 325:1972) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column, colIndex) => {
          const columnStories = filteredStories.filter((s) => s.status === column.id)
          const columnPoints = columnStories.reduce((acc, s) => acc + (s.points || 0), 0)

          return (
            <div
              key={column.id}
              className={`bg-bg-page border border-border-subtle rounded-xl flex flex-col max-h-[800px] shadow-2xs border-t-4 ${column.color}`}
            >
              {/* Cabeçalho da Coluna */}
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

              {/* Lista de Cartões da Coluna */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[300px]">
                {columnStories.length === 0 ? (
                  <div className="h-28 border border-dashed border-border-subtle/70 rounded-lg flex items-center justify-center text-xs text-fg-secondary/50">
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

                      {/* Botões Rápidos de Transição de Estado */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] px-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        {colIndex > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveStatus(story.id, 'prev')
                            }}
                            className="inline-flex items-center gap-1 text-fg-secondary hover:text-fg-primary font-medium p-1 hover:bg-bg-surface rounded"
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
                            className="inline-flex items-center gap-1 text-brand-action hover:text-brand-hover font-semibold p-1 hover:bg-[#FFE3DC] rounded ml-auto"
                            title={`Avançar para ${COLUMNS[colIndex + 1]?.label}`}
                          >
                            <span>Avançar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-[11px] ml-auto">
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

      {/* Drawer / Modal Simples de Detalhe da História Selecionada */}
      {selectedStoryDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#FFE3DC] text-brand-action px-2 py-0.5 rounded">
                  {selectedStoryDetail.id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-page text-fg-primary border border-border-subtle">
                  {selectedStoryDetail.points} Story Points
                </span>
              </div>
              <button
                onClick={() => setSelectedStoryDetail(null)}
                className="text-fg-secondary hover:text-fg-primary text-sm font-bold"
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
              <div className="p-3 bg-[#FFE3DC] border border-[#F8C1B7] rounded-lg text-xs text-brand-action font-semibold flex items-start gap-2">
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
                  <Avatar name={selectedStoryDetail.assignee?.name} initials={selectedStoryDetail.assignee?.initials} size={20} />
                  {selectedStoryDetail.assignee?.name}
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
