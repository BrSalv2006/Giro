import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  NotificationItem,
  Button,
  Toggle,
  CheckIcon,
  BellIcon,
} from '../components/common'
import { useData } from '../context/DataContext.jsx'

function useSafeData() {
  try {
    return useData() || {}
  } catch {
    return {}
  }
}

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-01',
    title: 'Revisão pendente',
    description: 'Rafael Silva pediu a sua validação da US-42: Filtragem multidimensional de pedidos.',
    refCode: 'US-42 · T42',
    timestamp: 'Hoje, 10:31',
    category: 'mencoes',
    type: 'comment',
    read: false,
    timeGroup: 'HOJE',
    storyId: 'US-42',
    assignee: 'Sofia Costa',
    fullDetail: 'Rafael Silva aguarda a sua validação dos critérios de aceitação da US-42 (Filtragem multidimensional). Os testes unitários estão com 100% de aprovação.',
  },
  {
    id: 'notif-02',
    title: 'Bloqueio no sprint',
    description: 'A exportação CSV está bloqueada por falta de acesso à API de relatórios.',
    refCode: 'US-31 · T31',
    timestamp: 'Hoje, 09:20',
    category: 'bloqueios',
    type: 'impediment',
    read: false,
    timeGroup: 'HOJE',
    storyId: 'US-31',
    assignee: 'Inês Martins',
    fullDetail: 'A equipa não consegue avançar na US-31 devido a restrições de rede no ambiente de staging. Notificação encaminhada ao Scrum Master.',
  },
  {
    id: 'notif-03',
    title: 'Foi mencionada numa discussão',
    description: 'Inês Martins mencionou-a na conversa sobre os critérios de aceitação.',
    refCode: 'Team Workspace',
    timestamp: 'Hoje, 09:05',
    category: 'mencoes',
    type: 'comment',
    read: false,
    timeGroup: 'HOJE',
    storyId: 'US-24',
    assignee: 'Sofia Costa',
    fullDetail: 'Inês Martins comentou: «@Sofia Costa poderias confirmar se o limite de exportação de 10.000 linhas cumpre os requisitos do cliente?»',
  },
  {
    id: 'notif-04',
    title: 'Decisão de Produto aprovada',
    description: 'O pedido de exportação em PDF (PED-02) foi selecionado para ser convertido em história de utilizador.',
    refCode: 'Sprint 13',
    timestamp: 'Ontem às 17:40',
    category: 'decisoes',
    type: 'status',
    read: true,
    timeGroup: 'ONTEM',
    storyId: 'PED-02',
    assignee: 'Sofia Costa',
    fullDetail: 'Decisão formalizada na reunião de refinamento. A estimativa inicial aponta para 5 Story Points.',
  },
  {
    id: 'notif-05',
    title: 'Sugestão de priorização por IA',
    description: 'O Gemini analisou 14 novos pedidos com pontuação média de impacto 8.5/10.',
    refCode: 'Backlog Refinement',
    timestamp: 'Ontem às 14:15',
    category: 'decisoes',
    type: 'ai',
    read: true,
    timeGroup: 'ONTEM',
    storyId: 'US-42',
    assignee: 'Giro AI Copilot',
    fullDetail: 'A recomendação baseia-se nos votos ponderados de utilizadores frequentes e correlação com épicos do Q4.',
  },
  {
    id: 'notif-06',
    title: 'Novo voto no pedido PED-05',
    description: 'Miguel Alves votou na «Integração bidirecional com repositórios GitHub e GitLab».',
    refCode: 'PED-05',
    timestamp: 'Esta semana',
    category: 'decisoes',
    type: 'vote',
    read: true,
    timeGroup: 'ESTA SEMANA',
    storyId: 'PED-05',
    assignee: 'Comunidade',
    fullDetail: 'O pedido PED-05 ultrapassou o limiar de 40 votos da comunidade e foi sinalizado para triagem prioritária.',
  },
  {
    id: 'notif-07',
    title: 'Bloqueio resolvido na US-60',
    description: 'Acesso à infraestrutura de auditoria concedido. O temporizador de inatividade de 60m foi aprovado.',
    refCode: 'US-60 · Auditoria',
    timestamp: 'Esta semana',
    category: 'bloqueios',
    type: 'status',
    read: true,
    timeGroup: 'ESTA SEMANA',
    storyId: 'US-60',
    assignee: 'Rafael Silva',
    fullDetail: 'Conformidade com o RNF-SEG-01 verificada e validada em ambiente de testes de integração.',
  },
  {
    id: 'notif-08',
    title: 'Sprint 12 iniciado com sucesso',
    description: 'O Sprint Backlog foi aprovado pelo Product Owner com 26 Story Points.',
    refCode: 'Sprint 12',
    timestamp: 'Esta semana',
    category: 'decisoes',
    type: 'status',
    read: true,
    timeGroup: 'ESTA SEMANA',
    storyId: 'US-12',
    assignee: 'Inês Martins',
    fullDetail: 'Sprint 12 em curso até 23 de outubro de 2026. Acompanhamento diário no quadro Kanban.',
  },
]

/**
 * NotificationsPage Component
 * Baseado no Figma frame 336:1156 ("Histórico de Notificações", 1600x1200)
 */
export function NotificationsPage() {
  const navigate = useNavigate()
  const dataContext = useSafeData()

  // Estado local com sincronização para contexto se presente
  const [items, setItems] = useState(DEFAULT_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState('todas') // 'todas' | 'nao-lidas' | 'mencoes' | 'decisoes' | 'bloqueios'
  const [selectedId, setSelectedId] = useState('notif-01')

  // Preferências interativas de notificação
  const [prefMentions, setPrefMentions] = useState(true)
  const [prefStatus, setPrefStatus] = useState(true)
  const [prefBlockers, setPrefBlockers] = useState(true)

  // Notificação selecionada para o painel lateral contextual
  const selectedNotif = useMemo(() => {
    return items.find((n) => n.id === selectedId) || items[0]
  }, [items, selectedId])

  // Contagens dinâmicas
  const counts = useMemo(() => {
    const unread = items.filter((n) => !n.read).length
    const mentions = items.filter((n) => n.category === 'mencoes').length
    const decisions = items.filter((n) => n.category === 'decisoes').length
    const blockers = items.filter((n) => n.category === 'bloqueios').length
    return {
      all: items.length,
      unread,
      mentions,
      decisions,
      blockers,
    }
  }, [items])

  // Filtragem conforme separador ativo
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'nao-lidas':
        return items.filter((n) => !n.read)
      case 'mencoes':
        return items.filter((n) => n.category === 'mencoes')
      case 'decisoes':
        return items.filter((n) => n.category === 'decisoes')
      case 'bloqueios':
        return items.filter((n) => n.category === 'bloqueios')
      case 'todas':
      default:
        return items
    }
  }, [items, activeTab])

  // Agrupamento temporal (HOJE, ONTEM, ESTA SEMANA)
  const groupedItems = useMemo(() => {
    const groups = {}
    filteredItems.forEach((item) => {
      const g = item.timeGroup || 'HOJE'
      if (!groups[g]) groups[g] = []
      groups[g].push(item)
    })
    return groups
  }, [filteredItems])

  // Ações
  const handleMarkAsRead = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )
    if (dataContext.markNotificationAsRead) {
      dataContext.markNotificationAsRead(id)
    }
  }

  const handleToggleRead = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    )
  }

  const handleDismiss = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedId === id) {
      const remaining = items.filter((item) => item.id !== id)
      if (remaining.length > 0) setSelectedId(remaining[0].id)
    }
  }

  const handleMarkAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    if (dataContext.markAllNotificationsAsRead) {
      dataContext.markAllNotificationsAsRead()
    }
  }

  return (
    <div className="w-full space-y-6 select-none">
      {/* 1. Cabeçalho da Página e Ações Globais (Figma 336:1424) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-fg-secondary mb-1">
            <span>Plataforma de Produto</span>
            <span>/</span>
            <span className="font-medium text-fg-primary">Giro Dev Team</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Histórico de Notificações
          </h1>
          <p className="text-sm text-fg-secondary mt-1">
            Acompanhe menções, decisões, bloqueios e alterações aos pedidos da equipa.
          </p>
        </div>

        {/* Ações Globais (Figma 336:1428) */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="secondary"
            className="h-10 px-4 text-xs font-semibold"
            icon={CheckIcon}
            onClick={handleMarkAllAsRead}
          >
            Marcar todas como lidas
          </Button>

          <Button
            variant="tertiary"
            className="h-10 px-4 text-xs font-medium border border-border-subtle bg-white"
            onClick={() => navigate('/definicoes')}
          >
            Definições
          </Button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-brand-action hover:underline px-2 py-1.5 cursor-pointer"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* 2. Resumo de Notificações (Figma 336:1433) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Não Lidas */}
        <div
          onClick={() => setActiveTab('nao-lidas')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-sm ${
            activeTab === 'nao-lidas'
              ? 'border-brand-action ring-1 ring-brand-action bg-[#FFE3DC]/20'
              : 'border-border-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg-secondary">
              Não lidas
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFE3DC] text-brand-action">
              {counts.unread} novas
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-fg-primary">
            {counts.unread}
          </div>
          <p className="text-[11px] text-fg-secondary mt-1">
            Aguardam a sua revisão ou resposta
          </p>
        </div>

        {/* Card Menções */}
        <div
          onClick={() => setActiveTab('mencoes')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-sm ${
            activeTab === 'mencoes'
              ? 'border-[#8B5CF6] ring-1 ring-[#8B5CF6] bg-[#EDE9FE]/20'
              : 'border-border-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg-secondary">
              Menções diretas
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#5B21B6]">
              {counts.mentions} menções
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-fg-primary">
            {counts.mentions}
          </div>
          <p className="text-[11px] text-fg-secondary mt-1">
            Comentários que o mencionam explicitamente
          </p>
        </div>

        {/* Card Todas */}
        <div
          onClick={() => setActiveTab('todas')}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-sm ${
            activeTab === 'todas'
              ? 'border-border-control ring-1 ring-border-control bg-bg-page'
              : 'border-border-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg-secondary">
              Total de notificações
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E4E5EA] text-fg-primary">
              {counts.all} no histórico
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-fg-primary">
            {counts.all}
          </div>
          <p className="text-[11px] text-fg-secondary mt-1">
            Últimos 14 dias de atividade na equipa
          </p>
        </div>
      </div>

      {/* 3. Conteúdo Principal: Lista (8 cols) + Painel Contextual (4 cols) (Figma 336:1449) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado Esquerdo: Lista de Notificações com Separadores (Figma 336:1450) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-border-subtle p-5 shadow-xs space-y-4">
          {/* Separadores e Filtros (Figma 336:1451) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'todas'
                  ? 'bg-[#FFE3DC] text-brand-action font-semibold'
                  : 'bg-bg-page text-fg-secondary hover:text-fg-primary hover:bg-[#E4E5EA]'
              }`}
            >
              <span>Todas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70">
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nao-lidas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'nao-lidas'
                  ? 'bg-[#FFE3DC] text-brand-action font-semibold'
                  : 'bg-bg-page text-fg-secondary hover:text-fg-primary hover:bg-[#E4E5EA]'
              }`}
            >
              <span>Não lidas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70">
                {counts.unread}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mencoes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'mencoes'
                  ? 'bg-[#FFE3DC] text-brand-action font-semibold'
                  : 'bg-bg-page text-fg-secondary hover:text-fg-primary hover:bg-[#E4E5EA]'
              }`}
            >
              <span>Menções</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70">
                {counts.mentions}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('decisoes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'decisoes'
                  ? 'bg-[#FFE3DC] text-brand-action font-semibold'
                  : 'bg-bg-page text-fg-secondary hover:text-fg-primary hover:bg-[#E4E5EA]'
              }`}
            >
              <span>Decisões</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70">
                {counts.decisions}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bloqueios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'bloqueios'
                  ? 'bg-[#FFE3DC] text-brand-action font-semibold'
                  : 'bg-bg-page text-fg-secondary hover:text-fg-primary hover:bg-[#E4E5EA]'
              }`}
            >
              <span>Bloqueios</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70">
                {counts.blockers}
              </span>
            </button>
          </div>

          {/* Lista Agrupada por Data */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-bg-page mx-auto flex items-center justify-center text-fg-secondary">
                <BellIcon size={24} />
              </div>
              <p className="text-sm font-medium text-fg-primary">
                Sem notificações para o filtro selecionado.
              </p>
              <p className="text-xs text-fg-secondary max-w-sm mx-auto">
                Tudo em dia! Pode consultar os restantes separadores ou alterar as preferências de notificações.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedItems).map(([groupTitle, notifs]) => (
                <div key={groupTitle} className="space-y-2.5">
                  {/* Cabeçalho do Grupo Temporal (Figma 336:1465) */}
                  <div className="px-3 py-1.5 rounded bg-bg-page text-[11px] font-bold text-fg-secondary tracking-wider uppercase flex items-center justify-between">
                    <span>{groupTitle}</span>
                    <span className="text-[10px] font-normal text-fg-secondary">
                      {notifs.length} {notifs.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {/* Itens de Notificação */}
                  <div className="space-y-2">
                    {notifs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer rounded-xl transition-all ${
                          selectedId === item.id
                            ? 'ring-2 ring-brand-action'
                            : ''
                        }`}
                      >
                        <NotificationItem
                          id={item.id}
                          title={item.title}
                          description={
                            <div className="space-y-1">
                              <p className="text-fg-secondary text-xs sm:text-sm">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="inline-block text-[11px] font-semibold text-brand-action bg-[#FFE3DC] px-2 py-0.5 rounded">
                                  {item.refCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleRead(item.id)
                                  }}
                                  className="text-[11px] text-fg-secondary hover:text-brand-action underline"
                                >
                                  {item.read ? 'Marcar como não lida' : 'Marcar como lida'}
                                </button>
                              </div>
                            </div>
                          }
                          timestamp={item.timestamp}
                          read={item.read}
                          type={item.type}
                          density="detailed"
                          onMarkRead={handleMarkAsRead}
                          onDismiss={handleDismiss}
                          onClick={() => setSelectedId(item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Painel Contextual (Figma 336:1535) */}
        <div className="lg:col-span-4 space-y-5 sticky top-24">
          {/* Card 1: Detalhe da Notificação Selecionada (Figma 336:1536) */}
          {selectedNotif && (
            <div className="p-5 rounded-xl bg-white border border-border-subtle shadow-xs space-y-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-brand-action uppercase">
                  NOTIFICAÇÃO SELECIONADA
                </p>
                <h3 className="text-lg font-bold text-fg-primary mt-1">
                  {selectedNotif.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed">
                {selectedNotif.fullDetail || selectedNotif.description}
              </p>

              {/* Ligação de Contexto (Figma 336:1540) */}
              <div className="p-3 rounded-lg bg-[#FFE3DC] border border-[#F8C1B7]/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-action">
                  {selectedNotif.refCode}
                </span>
                <span className="text-[11px] text-brand-hover">
                  Sprint 12
                </span>
              </div>

              <div className="text-xs text-fg-secondary">
                Responsável: <strong className="text-fg-primary">{selectedNotif.assignee}</strong> · {selectedNotif.timestamp}
              </div>

              <Button
                variant="secondary"
                className="w-full h-10 text-xs font-semibold"
                onClick={() => {
                  if (selectedNotif.storyId?.startsWith('US')) {
                    navigate('/sprint')
                  } else {
                    navigate('/pedidos')
                  }
                }}
              >
                Abrir elemento associado →
              </Button>
            </div>
          )}

          {/* Card 2: Preferências de Notificações (Figma 336:1545) */}
          <div className="p-5 rounded-xl bg-white border border-border-subtle shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-fg-primary">
                Preferências de Alertas
              </h3>
              <p className="text-xs text-fg-secondary mt-0.5">
                Escolha os eventos que pretende acompanhar em tempo real.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-xs font-semibold text-fg-primary">
                    Menções e respostas
                  </div>
                  <div className="text-[11px] text-fg-secondary">
                    Alertas visuais imediatos ao ser mencionado
                  </div>
                </div>
                <Toggle
                  checked={prefMentions}
                  onChange={setPrefMentions}
                  ariaLabel="Alternar menções e respostas"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-xs font-semibold text-fg-primary">
                    Mudanças de estado
                  </div>
                  <div className="text-[11px] text-fg-secondary">
                    Transições para análise, sprint ou concluído
                  </div>
                </div>
                <Toggle
                  checked={prefStatus}
                  onChange={setPrefStatus}
                  ariaLabel="Alternar mudanças de estado"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-xs font-semibold text-fg-primary">
                    Bloqueios e impedimentos
                  </div>
                  <div className="text-[11px] text-fg-secondary">
                    Tarefas travadas no quadro do sprint
                  </div>
                </div>
                <Toggle
                  checked={prefBlockers}
                  onChange={setPrefBlockers}
                  ariaLabel="Alternar bloqueios e impedimentos"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Nota de Demonstração (Figma 336:1557) */}
      <footer className="text-center py-2 border-t border-border-subtle/60 text-xs text-fg-secondary">
        <p>
          Dados de demonstração · As ações, leituras e filtros sincronizam dinamicamente com o estado da aplicação GIRO.
        </p>
      </footer>
    </div>
  )
}

export default NotificationsPage
