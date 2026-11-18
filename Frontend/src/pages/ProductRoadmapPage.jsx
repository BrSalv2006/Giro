import { useState, useMemo } from 'react'
import {
  Button,
  Select,
  StatusBadge,
  Avatar,
  PlusIcon,
} from '../components/common'
import {
  Download,
  CheckCircle2,
  Milestone,
} from 'lucide-react'
import { useModal } from '../context/ModalContext.jsx'
import { useData } from '../context/DataContext.jsx'

function useSafeModal() {
  try {
    return useModal() || {}
  } catch {
    return {}
  }
}

/**
 * ProductRoadmapPage Component
 * Conforme Figma frame 325:2246 ("Roadmap do produto", 1600x1200)
 */
export function ProductRoadmapPage() {
  const modalContext = useSafeModal()
  const dataContext = useData()

  const [scale, setScale] = useState('Trimestres')
  const [groupBy, setGroupBy] = useState('Por release')
  const [selectedRelease, setSelectedRelease] = useState('ALL')
  const [notice, setNotice] = useState('')
  const milestones = (dataContext.roadmap || []).flatMap((release) =>
    release.marcoCritico
      ? [{
          title: release.tituloRelease,
          status: release.dataFim <= new Date().toISOString() ? 'done' : 'active',
          date: release.dataFim ? new Date(release.dataFim).toLocaleDateString('pt-PT') : '—',
          release: release.tituloRelease,
          badge: release.dataFim <= new Date().toISOString() ? null : 'Marco',
        }]
      : []
  )

  const handleExportPDF = () => {
    setNotice('Geração do Roadmap em formato PDF oficial iniciada...')
    setTimeout(() => setNotice(''), 3500)
  }

  const filteredEpics = useMemo(() => {
    const releases = dataContext.roadmap || []
    const epics = releases.flatMap((release) =>
      (release.userStories || []).map((story) => {
        const estado = story.estadoTecnico || 'BACKLOG'
        const progress = estado === 'CONCLUIDO' ? 100 : estado === 'EM_REVISAO' ? 80 : estado === 'EM_PROGRESSO' ? 55 : estado === 'TODO' ? 20 : 10
        return {
          id: story.codigoUs,
          title: story.titulo,
          description: release.descricao || `Entrega planeada para ${release.tituloRelease}`,
          release: release.tituloRelease,
          team: 'Giro Dev Team',
          leader: { name: 'Inês Martins', initials: 'IM' },
          status: estado,
          progress,
          startMonth: release.dataInicio ? new Date(release.dataInicio).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : '—',
          endMonth: release.dataFim ? new Date(release.dataFim).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : '—',
          dependencies: [],
        }
      })
    )
    if (selectedRelease === 'ALL') return epics
    return epics.filter((epic) => epic.release === selectedRelease)
  }, [selectedRelease, dataContext.roadmap])

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Cabeçalho (Figma 325:2246) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Roadmap
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Planeie lançamentos, dependências e entregas por equipa e release.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
          >
            Exportar PDF
          </Button>

          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={() => {
              if (modalContext.openNewFeatureModal) {
                modalContext.openNewFeatureModal()
              }
            }}
          >
            Adicionar funcionalidade
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

      {/* 2. Barra de Controlos e Escala (Figma 325:2246) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Escala Temporal
            </label>
            <Select
              options={[
                { value: 'Semanas', label: 'Semanas' },
                { value: 'Meses', label: 'Meses' },
                { value: 'Trimestres', label: 'Trimestres (Recomendado)' },
              ]}
              value={scale}
              onChange={(val) => setScale(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Agrupamento
            </label>
            <Select
              options={[
                { value: 'Por release', label: 'Por release' },
                { value: 'Por equipa', label: 'Por equipa' },
              ]}
              value={groupBy}
              onChange={(val) => setGroupBy(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Filtro de Release
            </label>
            <Select
              options={[
                { value: 'ALL', label: 'Todas as Releases' },
                { value: 'Release 2026.Q3', label: 'Release 2026.Q3 (Concluída)' },
                { value: 'Release 2026.Q4', label: 'Release 2026.Q4 (Ativa)' },
                { value: 'Release 2027.Q1', label: 'Release 2027.Q1 (Planeada)' },
              ]}
              value={selectedRelease}
              onChange={(val) => setSelectedRelease(val)}
            />
          </div>
        </div>
      </div>

      {/* 3. Linha de Marcos Críticos (Milestones) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Milestone className="w-4 h-4 text-brand-action" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-primary">
            Marcos Críticos de Lançamento
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {milestones.map((m) => (
            <div
              key={m.title}
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
                m.status === 'done'
                  ? 'border-[#BBF7D0] bg-[#DCFCE7]/30 text-[#166534]'
                  : m.status === 'active'
                  ? 'border-[#F8C1B7] bg-[#FFE3DC]/50 text-brand-action font-semibold'
                  : 'border-border-subtle bg-bg-page/50 text-fg-primary'
              }`}
            >
              <div>
                <div className="font-bold">{m.title}</div>
                <div className="text-[11px] text-fg-secondary mt-0.5">{m.date} · {m.release}</div>
              </div>
              {m.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-action text-white">
                  {m.badge}
                </span>
              )}
              {m.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Visualização Gantt / Timeline do Roadmap */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        {/* Cabeçalho da Linha Temporal */}
        <div className="grid grid-cols-12 bg-bg-page/80 border-b border-border-subtle text-xs font-semibold text-fg-secondary divide-x divide-border-subtle">
          <div className="col-span-4 p-3 text-fg-primary">Épicos e Objetivos</div>
          <div className="col-span-2 p-3 text-center">Q3 2026 (Jul–Set)</div>
          <div className="col-span-3 p-3 text-center bg-[#FFE3DC]/20 text-brand-action font-bold">
            Q4 2026 (Out–Dez) · Sprint 12
          </div>
          <div className="col-span-3 p-3 text-center">Q1 2027 (Jan–Mar)</div>
        </div>

        {/* Lista de Barras de Épicos */}
        <div className="divide-y divide-border-subtle/60">
          {filteredEpics.map((epic) => (
            <div
              key={epic.id}
              className="grid grid-cols-12 items-center hover:bg-bg-page/40 transition-colors p-3.5 gap-2"
            >
              {/* Informação do Épico (Col 1-4) */}
              <div className="col-span-12 md:col-span-4 pr-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-bg-page px-1.5 py-0.5 rounded text-fg-secondary border border-border-subtle">
                    {epic.id}
                  </span>
                  <span className="font-bold text-xs text-fg-primary">
                    {epic.title}
                  </span>
                </div>
                <p className="text-[11px] text-fg-secondary line-clamp-1">
                  {epic.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-fg-secondary">
                  <span className="flex items-center gap-1">
                    <Avatar name={epic.leader?.name} initials={epic.leader?.initials} size={18} />
                    {epic.team}
                  </span>
                  <span>•</span>
                  <StatusBadge status={epic.status} />
                </div>
              </div>

              {/* Barra do Cronograma Gantt (Col 5-12) */}
              <div className="col-span-12 md:col-span-8 relative py-2">
                <div className="w-full bg-[#E4E5EA] h-7 rounded-lg overflow-hidden relative shadow-2xs">
                  <div
                    className={`h-full rounded-lg flex items-center justify-between px-3 text-[11px] font-bold text-white transition-all duration-300 ${
                      epic.status === 'complete'
                        ? 'bg-[#16A34A]'
                        : epic.status === 'development'
                        ? 'bg-brand-action'
                        : 'bg-[#707987]'
                    }`}
                    style={{ width: `${epic.progress}%` }}
                  >
                    <span className="truncate">{epic.release}</span>
                    <span>{epic.progress}%</span>
                  </div>
                </div>

                {/* Dependências e Datas */}
                <div className="flex items-center justify-between text-[10px] text-fg-secondary mt-1 px-1">
                  <span>{epic.startMonth}</span>
                  {epic.dependencies.length > 0 && (
                    <span className="text-[#B93826] font-medium flex items-center gap-1">
                      Depende de: {epic.dependencies.join(', ')}
                    </span>
                  )}
                  <span>{epic.endMonth}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductRoadmapPage
