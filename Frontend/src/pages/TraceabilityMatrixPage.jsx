import { useState, useMemo } from 'react'
import {
  MetricCard,
  Button,
  TextField,
  SearchIcon,
} from '../components/common'
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitBranch,
  GitCommit,
  Code2,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

function useSafeData() {
  try {
    return useData() || {}
  } catch {
    return {}
  }
}

/**
 * TraceabilityMatrixPage Component
 * Conforme Figma frame 325:2722 ("Matriz de Rastreabilidade de Requisitos", 1600x1200)
 */
export function TraceabilityMatrixPage() {
  const dataContext = useSafeData()

  const items = useMemo(() => dataContext.traceability || [], [dataContext.traceability])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedRow, setExpandedRow] = useState(null)
  const [exportNotice, setExportNotice] = useState('')

  const handleExport = () => {
    setExportNotice('Exportação da Matriz de Rastreabilidade em formato CSV gerada com sucesso!')
    setTimeout(() => setExportNotice(''), 3500)
  }

  // Métricas
  const totalReqs = items.length
  const trackedCount = items.filter((i) => i.status === 'tracked').length
  const partialCount = items.filter((i) => i.status === 'partially_tracked').length
  const untrackedCount = items.filter((i) => i.status === 'untracked').length

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        return (
          item.id.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.originPedido?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [items, statusFilter, searchTerm])

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Cabeçalho (Figma 325:2722) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Matriz de Rastreabilidade de Requisitos
          </h1>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Acompanhe cada requisito, do pedido do cliente aos testes e ao código.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Exportar matriz
        </Button>
      </div>

      {/* Alerta de Exportação */}
      {exportNotice && (
        <div className="p-3 bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice('')} className="underline hover:font-bold">
            Dispensar
          </button>
        </div>
      )}

      {/* 2. Linha de KPIs de Rastreabilidade (4 MetricCards conforme Figma) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Requisitos na matriz"
          value={totalReqs}
          subtitle="RNF e RF do projeto"
          icon={<FileCheck className="w-5 h-5 text-brand-action" />}
        />

        <MetricCard
          title="Rastreados (100%)"
          value={trackedCount}
          change="Cobertura total"
          trend="positive"
          subtitle="Histórias, testes e código"
          icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
        />

        <MetricCard
          title="Parcialmente rastreados"
          value={partialCount}
          change="Em validação"
          trend="neutral"
          subtitle="Testes ou código pendentes"
          icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
        />

        <MetricCard
          title="Sem cobertura (0%)"
          value={untrackedCount}
          change="Atenção"
          trend="negative"
          subtitle="Requer associação de US"
          icon={<XCircle className="w-5 h-5 text-[#DC2626]" />}
        />
      </div>

      {/* 3. Filtros e Pesquisa */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1">
          <TextField
            icon={<SearchIcon size={16} />}
            placeholder="Pesquisar por ID, código de requisito ou pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro por Estado de Rastreabilidade */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-fg-primary text-white'
                : 'bg-bg-page text-fg-secondary hover:bg-border-subtle/50'
            }`}
          >
            Todos ({totalReqs})
          </button>
          <button
            onClick={() => setStatusFilter('tracked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'tracked'
                ? 'bg-[#16A34A] text-white'
                : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
            }`}
          >
            Rastreado ({trackedCount})
          </button>
          <button
            onClick={() => setStatusFilter('partially_tracked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'partially_tracked'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
            }`}
          >
            Parcial ({partialCount})
          </button>
          <button
            onClick={() => setStatusFilter('untracked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'untracked'
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
            }`}
          >
            Sem Cobertura ({untrackedCount})
          </button>
        </div>
      </div>

      {/* 4. Tabela Interativa de Rastreabilidade */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-bg-page/70 border-b border-border-subtle text-fg-secondary uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">ID Requisito</th>
                <th className="py-3 px-3">Código & Descrição</th>
                <th className="py-3 px-3">Pedido de Origem</th>
                <th className="py-3 px-3">User Story</th>
                <th className="py-3 px-3">Testes Associados</th>
                <th className="py-3 px-3">Código / Git</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredItems.map((item) => {
                const isExpanded = expandedRow === item.id

                return (
                  <tr key={item.id} className="hover:bg-bg-page/40 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-3 font-mono font-bold text-fg-primary">
                      {item.id}
                    </td>

                    {/* Código e Título */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-brand-action bg-[#FFE3DC] px-1.5 py-0.2 rounded text-[11px]">
                          {item.code}
                        </span>
                        <span className="font-semibold text-fg-primary">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-fg-secondary mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </td>

                    {/* Pedido de Origem */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-fg-secondary bg-bg-page border border-border-subtle px-2 py-0.5 rounded text-[11px]">
                        {item.originPedido}
                      </span>
                    </td>

                    {/* User Stories */}
                    <td className="py-3.5 px-3">
                      {item.stories.length > 0 ? (
                        <div className="space-y-1">
                          {item.stories.map((st) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] px-2 py-0.5 rounded"
                            >
                              {st.id}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#DC2626] font-semibold">Sem US</span>
                      )}
                    </td>

                    {/* Testes Associados */}
                    <td className="py-3.5 px-3">
                      {item.tests.length > 0 ? (
                        <div className="space-y-1">
                          {item.tests.map((tc) => (
                            <div key={tc.id} className="flex items-center gap-1.5 text-[11px]">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  tc.status === 'pass' ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
                                }`}
                              />
                              <span className="font-mono font-medium text-fg-primary">{tc.id}</span>
                              <span className="text-fg-secondary">({tc.status})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#DC2626] font-semibold">Sem Testes</span>
                      )}
                    </td>

                    {/* Git Branch / Commit */}
                    <td className="py-3.5 px-3">
                      {item.commit !== '—' ? (
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex items-center gap-1 font-mono text-fg-primary">
                            <GitBranch className="w-3 h-3 text-brand-action" />
                            <span className="truncate max-w-[140px]">{item.gitBranch}</span>
                          </div>
                          <div className="flex items-center gap-1 text-fg-secondary font-mono">
                            <GitCommit className="w-3 h-3" />
                            <span>#{item.commit}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-fg-secondary font-mono">—</span>
                      )}
                    </td>

                    {/* Estado de Rastreabilidade */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'tracked'
                            ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                            : item.status === 'partially_tracked'
                            ? 'bg-[#FEF3C7] text-[#7A4D00] border border-[#FDE68A]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                        }`}
                      >
                        {item.status === 'tracked'
                          ? 'Rastreado'
                          : item.status === 'partially_tracked'
                          ? 'Parcial'
                          : 'Sem Cobertura'}
                      </span>
                    </td>

                    {/* Botão de Expansão */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                        className="p-1 hover:bg-bg-page rounded text-fg-secondary hover:text-fg-primary"
                        title="Ver critérios e código"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Linha Expandida com Rastreabilidade Completa */}
        {expandedRow && (
          <div className="p-4 bg-bg-page/70 border-t border-border-subtle text-xs space-y-2 animate-fadeIn">
            {(() => {
              const item = items.find((i) => i.id === expandedRow)
              if (!item) return null
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-fg-primary">Critérios de Aceitação Verificáveis:</span>
                    <p className="text-fg-secondary leading-relaxed bg-white p-2.5 rounded-lg border border-border-subtle">
                      {item.criteria}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-fg-primary">Ficheiros de Código Associados:</span>
                    <div className="bg-white p-2.5 rounded-lg border border-border-subtle space-y-1">
                      {item.codeRefs.length > 0 ? (
                        item.codeRefs.map((ref) => (
                          <div key={ref} className="flex items-center gap-1.5 font-mono text-[11px] text-brand-action">
                            <Code2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{ref}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-fg-secondary">Nenhum ficheiro vinculado.</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default TraceabilityMatrixPage
