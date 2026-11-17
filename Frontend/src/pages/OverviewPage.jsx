import { useState } from 'react'
import {
  MetricCard,
  StatusBadge,
  Select,
  Button,
  Avatar,
  ClockIcon,
  CheckIcon,
} from '../components/common'
import { Download, AlertTriangle, TrendingUp, Layers, CheckCircle2 } from 'lucide-react'
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
 * OverviewPage Component
 * Conforme Figma frame 325:1098 ("Visão geral", 1600x1200)
 */
export function OverviewPage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const pedidos = dataContext.pedidos || []
  const stories = dataContext.stories || []
  const sprintStories = dataContext.sprintStories || stories.filter((s) => s.sprint === 'sprint-12')

  // Filtros de cabeçalho
  const [selectedRange, setSelectedRange] = useState('Este sprint')
  const [selectedProject, setSelectedProject] = useState('Plataforma de Produto')
  const [selectedTeam, setSelectedTeam] = useState('Giro Dev Team')
  const [exportNotice, setExportNotice] = useState('')

  // Cálculos dinâmicos com fallback
  const totalPedidos = pedidos.length > 0 ? pedidos.length + 118 : 128
  const sprintPointsTotal = sprintStories.reduce((acc, s) => acc + (s.points || 0), 0) || 24
  const sprintPointsDone = sprintStories
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.points || 0), 0) || 5
  const sprintPercent = Math.round((sprintPointsDone / (sprintPointsTotal || 1)) * 100) || 21

  const handleExport = (format) => {
    setExportNotice(`Exportação em formato ${format} gerada com sucesso!`)
    setTimeout(() => setExportNotice(''), 3500)
  }

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Header da Página (Figma 325:1158) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
              Visão Geral
            </h1>
            {/* Presença em tempo real */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              3 membros online
            </span>
          </div>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Visão consolidada do sprint, capacidade da equipa e saúde do fluxo de trabalho.
          </p>
        </div>

        {/* Ações de Exportação */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExport('PDF')}
          >
            Exportar PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('CSV')}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Alerta temporário de exportação */}
      {exportNotice && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckIcon size={16} />
            {exportNotice}
          </span>
          <button
            onClick={() => setExportNotice('')}
            className="text-[#166534] hover:font-bold text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Controlos do Dashboard (Figma 325:1165) */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 lg:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Intervalo de tempo
            </label>
            <Select
              options={[
                { value: 'Este sprint', label: 'Este sprint (Sprint 12)' },
                { value: 'Últimos 14 dias', label: 'Últimos 14 dias' },
                { value: 'Último mês', label: 'Último mês' },
                { value: 'Sprint 11', label: 'Sprint 11 (Anterior)' },
              ]}
              value={selectedRange}
              onChange={(val) => setSelectedRange(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Projeto
            </label>
            <Select
              options={[
                { value: 'Plataforma de Produto', label: 'Plataforma de Produto' },
                { value: 'Mobile App', label: 'Aplicação Móvel Giro' },
                { value: 'Portal do Cliente', label: 'Portal do Cliente' },
              ]}
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
              Equipa
            </label>
            <Select
              options={[
                { value: 'Giro Dev Team', label: 'Giro Dev Team (Scrum)' },
                { value: 'Frontend Team', label: 'Frontend Team' },
                { value: 'Backend Core', label: 'Backend Core' },
              ]}
              value={selectedTeam}
              onChange={(val) => setSelectedTeam(val)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border-subtle/60 flex flex-wrap items-center justify-between text-xs text-fg-secondary gap-2">
          <span>
            Dados de demonstração · <strong>Sprint 12</strong>: 12–23 out. 2026 · Exportação: PDF / CSV
          </span>
          <span className="text-brand-action font-medium">
            Próxima entrega: Release 2026.Q4 (15 nov. 2026)
          </span>
        </div>
      </div>

      {/* 3. Linha de KPIs (Figma 325:1176 - 4 MetricCard components) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Pedidos"
          value={totalPedidos}
          change="+12.5%"
          trend="positive"
          subtitle="desde o último mês"
          icon={<Layers className="w-5 h-5 text-brand-action" />}
        />

        <MetricCard
          title="Taxa de Conclusão"
          value="84%"
          change="+4.2%"
          trend="positive"
          subtitle="Sprint 12 em ritmo ideal"
          icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
        />

        <MetricCard
          title="Velocidade Média"
          value="26 SP"
          change="-2.0 SP"
          trend="neutral"
          subtitle="Meta: 28 SP por ciclo"
          icon={<TrendingUp className="w-5 h-5 text-[#8B5CF6]" />}
        />

        <MetricCard
          title="Tempo Médio de Análise"
          value="2.4 dias"
          change="-0.8 dias"
          trend="positive"
          subtitle="Tempo médio de triagem (PO)"
          icon={<ClockIcon size={20} className="text-[#F59E0B]" />}
        />
      </div>

      {/* 4. Grelha Principal de Análise (Figma 325:1225 & 325:1308) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Distribuição de Pedidos por Estado (7 colunas em telas grandes) */}
        <div className="lg:col-span-7 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-fg-primary">
                  Distribuição de Pedidos por Estado
                </h2>
                <p className="text-xs text-fg-secondary mt-0.5">
                  128 pedidos registados na plataforma da comunidade
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-page text-fg-secondary border border-border-subtle">
                Ativos: 102
              </span>
            </div>

            {/* Barra Stacked Visual */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-border-subtle/30 mb-5">
              <div style={{ width: '20%' }} className="bg-[#707987] h-full" title="Por analisar (20%)" />
              <div style={{ width: '27%' }} className="bg-[#F59E0B] h-full" title="Em análise (27%)" />
              <div style={{ width: '33%' }} className="bg-[#8B5CF6] h-full" title="Em desenvolvimento (33%)" />
              <div style={{ width: '16%' }} className="bg-[#22C55E] h-full" title="Concluído (16%)" />
              <div style={{ width: '4%' }} className="bg-[#EF4444] h-full" title="Rejeitado (4%)" />
            </div>

            {/* Lista com Barras Detalhadas */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#707987]" />
                    <span className="font-medium text-fg-primary">Por analisar</span>
                  </div>
                  <span className="text-fg-secondary">26 pedidos (20%)</span>
                </div>
                <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#707987] h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="font-medium text-fg-primary">Em análise</span>
                  </div>
                  <span className="text-fg-secondary">34 pedidos (27%)</span>
                </div>
                <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: '27%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="font-medium text-fg-primary">Em desenvolvimento</span>
                  </div>
                  <span className="text-fg-secondary">42 pedidos (33%)</span>
                </div>
                <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#8B5CF6] h-full rounded-full" style={{ width: '33%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                    <span className="font-medium text-fg-primary">Concluído</span>
                  </div>
                  <span className="text-fg-secondary">21 pedidos (16%)</span>
                </div>
                <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full rounded-full" style={{ width: '16%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="font-medium text-fg-primary">Rejeitado</span>
                  </div>
                  <span className="text-fg-secondary">5 pedidos (4%)</span>
                </div>
                <div className="w-full bg-[#E4E5EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#EF4444] h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Card: Categorias */}
          <div className="mt-5 pt-3.5 border-t border-border-subtle flex flex-wrap items-center justify-between text-xs text-fg-secondary">
            <span>Divisão por categorias:</span>
            <div className="flex items-center gap-2 font-medium">
              <span className="text-[#DC2626]">Bug: 22</span>
              <span>·</span>
              <span className="text-[#0284C7]">Melhoria: 61</span>
              <span>·</span>
              <span className="text-[#16A34A]">Nova Func.: 45</span>
            </div>
          </div>
        </div>

        {/* Card 2: Progresso do Sprint 12 (5 colunas) */}
        <div className="lg:col-span-5 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-brand-action text-white text-xs font-semibold">
                  Sprint 12
                </span>
                <StatusBadge status="development" />
              </div>
              <span className="text-xs text-fg-secondary">
                12–23 out. 2026
              </span>
            </div>

            <h2 className="text-lg font-bold text-fg-primary">
              Progresso do Sprint 12
            </h2>
            <p className="text-xs text-fg-secondary mt-0.5 mb-4">
              5 de 24 pontos concluídos · 2 de 7 user stories concluídas
            </p>

            {/* Barra de Progresso do Sprint */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-fg-primary">Conclusão de Pontos</span>
                <span className="text-brand-action font-bold">{sprintPercent}%</span>
              </div>
              <div className="w-full bg-border-subtle/50 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-action h-full rounded-full transition-all duration-300"
                  style={{ width: `${sprintPercent}%` }}
                />
              </div>
            </div>

            {/* Capacidade e Ritmo */}
            <div className="p-3 bg-bg-page rounded-lg space-y-2 text-xs border border-border-subtle/60 mb-4">
              <div className="flex justify-between">
                <span className="text-fg-secondary">Capacidade planeada:</span>
                <span className="font-semibold text-fg-primary">24 / 28 Story Points (86%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Dias restantes no ciclo:</span>
                <span className="font-semibold text-fg-primary">3 dias úteis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-secondary">Velocidade diária média:</span>
                <span className="font-semibold text-fg-primary">2.8 SP / dia</span>
              </div>
            </div>

            {/* Alerta Crítico de Bloqueios */}
            <div className="p-3 bg-[#FFE3DC] border border-[#F8C1B7] rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-action mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>2 bloqueios ativos no Sprint 12</span>
              </div>
              <ul className="text-xs text-fg-primary space-y-1 pl-6 list-disc">
                <li>
                  <strong className="text-brand-action">US-31</strong>: Filtrar pedidos (Dependência da API externa)
                </li>
                <li>
                  <strong className="text-brand-action">US-42</strong>: Voto único RNF-SEG-03 (Validação DB)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Button
              variant="secondary"
              className="w-full justify-center text-xs"
              onClick={() => {
                if (modalContext.openCreateStoryModal) {
                  modalContext.openCreateStoryModal()
                }
              }}
            >
              Criar nova User Story para o Sprint
            </Button>
          </div>
        </div>

        {/* Card 3: Atividade Recente e Entregas Previstas (12 colunas) */}
        <div className="lg:col-span-12 bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
            <div>
              <h2 className="text-base font-semibold text-fg-primary">
                Atividade Recente e Entregas Previstas
              </h2>
              <p className="text-xs text-fg-secondary">
                Histórico em tempo real de transições de requisitos e marcos do roadmap
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-[#EDE9FE] text-[#5B21B6] font-medium border border-[#DDD6FE]">
                Próxima Release: 2026.Q4
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Evento 1 */}
            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page/50 hover:bg-bg-page transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Avatar name="Sofia Costa" initials="SC" size={28} />
                <span className="text-[11px] text-fg-secondary">Há 25 min</span>
              </div>
              <p className="text-xs font-semibold text-fg-primary">
                Aprovação de Requisito
              </p>
              <p className="text-xs text-fg-secondary mt-1">
                Sofia Costa moveu <strong>US-31</strong> para a Sprint 12 após alinhamento de critérios.
              </p>
            </div>

            {/* Evento 2 */}
            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page/50 hover:bg-bg-page transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Avatar name="Rafael Silva" initials="RS" size={28} />
                <span className="text-[11px] text-fg-secondary">Há 1h</span>
              </div>
              <p className="text-xs font-semibold text-fg-primary">
                Início de Desenvolvimento
              </p>
              <p className="text-xs text-fg-secondary mt-1">
                Rafael Silva iniciou a implementação de <strong>US-42</strong> (RNF-SEG-03).
              </p>
            </div>

            {/* Evento 3 */}
            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page/50 hover:bg-bg-page transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Avatar name="Inês Martins" initials="IM" size={28} />
                <span className="text-[11px] text-fg-secondary">Há 3h</span>
              </div>
              <p className="text-xs font-semibold text-fg-primary">
                História Concluída
              </p>
              <p className="text-xs text-fg-secondary mt-1">
                <strong>US-24</strong> (Exportar PDF com ata) passou nos testes e foi marcada como Done.
              </p>
            </div>

            {/* Evento 4 - Marco */}
            <div className="p-3.5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B] text-white">
                  MARCO CRÍTICO
                </span>
                <span className="text-[11px] text-[#7A4D00] font-medium">15 nov. 2026</span>
              </div>
              <p className="text-xs font-semibold text-[#7A4D00]">
                Release 2026.Q4 (Beta)
              </p>
              <p className="text-xs text-fg-secondary mt-1">
                Integração dos módulos de Votação, Matriz de Rastreabilidade e Gestão de Sprints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewPage
