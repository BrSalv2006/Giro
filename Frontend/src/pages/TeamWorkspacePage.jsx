import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Hash,
  Send,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle2,
  Activity,
  Clock,
} from 'lucide-react'
import { Avatar, Button, StatusBadge } from '../components/common'
import {
  useAuth,
  ROLES,
  MOCK_USERS,
  getRoleCode,
  getRoleLabel,
} from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { cn } from '../utils/cn.js'

function formatShortDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

function formatMessageTime(dateValue) {
  if (!dateValue) return 'Agora'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Agora'
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const INTERNAL_FALLBACK_MEMBERS = [
  MOCK_USERS.PRODUCT_OWNER,
  MOCK_USERS.SCRUM_MASTER,
  MOCK_USERS.DEVELOPER,
  MOCK_USERS.ADMIN,
]

export function TeamWorkspacePage() {
  const navigate = useNavigate()
  const { currentUser, roleLabel } = useAuth()
  const {
    sprints = [],
    stories = [],
    sprintStories = [],
    pedidos = [],
    notifications = [],
    users = [],
    channels = [],
    messages = {},
    addMessage,
  } = useData()

  const [activeChannelId, setActiveChannelId] = useState('geral')
  const [messageDraft, setMessageDraft] = useState('')
  const [messageError, setMessageError] = useState('')
  const [selectedMemberName, setSelectedMemberName] = useState('ALL')

  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.estado === 'ATIVO') || sprints[0] || null
  }, [sprints])

  const sprintMetrics = useMemo(() => {
    const activeList = sprintStories.length ? sprintStories : stories.filter((s) => s.sprint)
    const totalPoints = activeList.reduce((acc, s) => acc + (s.points || 0), 0)
    const donePoints = activeList
      .filter((s) => s.status === 'done')
      .reduce((acc, s) => acc + (s.points || 0), 0)
    const capacityMax = activeSprint?.capacidadeMaxima || 28
    const progressPercent = totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0
    const blockedCount = activeList.filter((s) => Boolean(s.impediment) || s.status === 'blocked').length
    return {
      sprintLabel: activeSprint?.numeroSprint ? `Sprint ${activeSprint.numeroSprint}` : 'Sprint 12',
      dateRange: activeSprint
        ? `${formatShortDate(activeSprint.dataInicio)} – ${formatShortDate(activeSprint.dataFim)}`
        : '12–23 out. 2026',
      totalStories: activeList.length,
      doneStories: activeList.filter((s) => s.status === 'done').length,
      totalPoints,
      donePoints,
      capacityMax,
      isOverCapacity: totalPoints > capacityMax,
      progressPercent,
      blockedCount,
    }
  }, [activeSprint, sprintStories, stories])

  const teamMembers = useMemo(() => {
    const internalUsers = users.filter((u) => u.role !== ROLES.CLIENT && u.roleCode !== 'P04')
    const baseList = internalUsers.length > 0
      ? internalUsers
      : INTERNAL_FALLBACK_MEMBERS.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          roleCode: getRoleCode(u.role),
          active: true,
        }))

    return baseList.map((member) => {
      const assignedStories = stories.filter((s) => s.assignee?.name === member.name)
      const assignedPoints = assignedStories.reduce((sum, s) => sum + (s.points || 0), 0)
      return {
        ...member,
        code: member.roleCode || getRoleCode(member.role),
        label: getRoleLabel(member.role),
        assignedStories,
        assignedPoints,
      }
    })
  }, [users, stories])

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || channels[0] || {
      id: 'geral',
      name: 'geral',
      description: 'Canal principal de colaboração da equipa GIRO.',
    }
  }, [channels, activeChannelId])

  const channelMessages = useMemo(() => {
    return messages[activeChannel.id] || []
  }, [messages, activeChannel.id])

  const recentActivity = useMemo(() => {
    const storyEvents = stories.slice(0, 3).map((story) => ({
      id: `act-story-${story.id}`,
      badge: story.id,
      title: story.title,
      meta: `${story.assignee?.name || 'Por atribuir'} · ${story.target}`,
      status: story.status,
      route: '/sprint',
    }))
    const pedidoEvents = pedidos.slice(0, 2).map((pedido) => ({
      id: `act-ped-${pedido.id}`,
      badge: pedido.id,
      title: pedido.title,
      meta: `${pedido.author?.name || 'Cliente'} · ${pedido.voteCount || 0} votos`,
      status: pedido.status,
      route: '/pedidos',
    }))
    const notifEvents = notifications.slice(0, 2).map((notif) => ({
      id: `act-notif-${notif.id}`,
      badge: notif.refCode || 'ALERTA',
      title: notif.title,
      meta: notif.description,
      status: notif.read ? 'complete' : 'analysis',
      route: '/notificacoes',
    }))
    return [...storyEvents, ...pedidoEvents, ...notifEvents].slice(0, 6)
  }, [stories, pedidos, notifications])

  const visibleMemberTasks = useMemo(() => {
    if (selectedMemberName === 'ALL') {
      return stories.slice(0, 6)
    }
    return stories.filter((s) => s.assignee?.name === selectedMemberName)
  }, [stories, selectedMemberName])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageDraft.trim()) {
      setMessageError('Escreva uma nota ou atualização antes de publicar.')
      return
    }
    try {
      addMessage?.(activeChannel.id, messageDraft)
      setMessageDraft('')
      setMessageError('')
    } catch (err) {
      setMessageError(err.message || 'Não foi possível publicar a mensagem.')
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Cabeçalho Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-fg-secondary mb-1">
            <span>Plataforma de Produto</span>
            <span>/</span>
            <span className="font-medium text-fg-primary">Giro Dev Team</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
              Team Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{teamMembers.length} membros internos</span>
            </span>
          </div>
          <p className="text-sm text-fg-secondary mt-1 max-w-2xl">
            Colaboração em tempo real, rituais ágeis e acompanhamento da carga de trabalho do {sprintMetrics.sprintLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="h-10 px-4 text-xs"
            onClick={() => navigate('/backlog')}
          >
            Product Backlog
          </Button>
          <Button
            variant="primary"
            className="h-10 px-4 text-xs"
            onClick={() => navigate('/sprint')}
          >
            Abrir Quadro do Sprint
          </Button>
        </div>
      </div>

      {/* 2. Resumo do Sprint Ativo & Próximo Ritual Scrum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card: Contexto do Sprint */}
        <section className="lg:col-span-7 bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md bg-brand-action text-white text-xs font-bold">
                {sprintMetrics.sprintLabel}
              </span>
              <StatusBadge status="development" showDot />
              <span className="text-xs text-fg-secondary inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{sprintMetrics.dateRange}</span>
              </span>
            </div>

            <span className="text-xs font-bold text-brand-action">
              {sprintMetrics.progressPercent}% concluído
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-fg-primary">
                Progresso de Story Points ({sprintMetrics.donePoints} / {sprintMetrics.totalPoints} SP · {sprintMetrics.doneStories} de {sprintMetrics.totalStories} histórias)
              </span>
              <span className={cn(
                'font-semibold',
                sprintMetrics.isOverCapacity ? 'text-[#DC2626]' : 'text-fg-secondary'
              )}>
                Capacidade máx.: {sprintMetrics.capacityMax} SP
              </span>
            </div>
            <div className="w-full bg-bg-page border border-border-subtle/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${sprintMetrics.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              {sprintMetrics.blockedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveChannelId('bloqueios')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFE3DC] border border-[#F8C1B7] text-brand-action font-semibold hover:bg-[#FCD2C9] transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{sprintMetrics.blockedCount} bloqueio(s) ativo(s) — ver #bloqueios</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Fluxo sem bloqueios ativos</span>
                </span>
              )}
            </div>

            <span className="text-fg-secondary">
              Sessão atual: <strong className="text-fg-primary">{currentUser?.name || 'Sofia Costa'}</strong> ({roleLabel})
            </span>
          </div>
        </section>

        {/* Card: Próximo Ritual Scrum */}
        <section className="lg:col-span-5 bg-gradient-to-br from-[#FFE3DC]/65 via-white to-[#EDE9FE]/55 border border-[#F8C1B7] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-action">
                Próximo Ritual Scrum
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#F8C1B7] text-[11px] font-semibold text-fg-primary">
                <Clock className="w-3 h-3 text-brand-primary" aria-hidden="true" />
                Hoje · 09:30
              </span>
            </div>

            <h2 className="text-lg font-bold text-fg-primary">
              Daily Scrum · Sincronização da Equipa
            </h2>
            <p className="text-xs text-fg-secondary leading-relaxed">
              Facilitada por <strong>Inês Martins (P02 · Scrum Master)</strong>. Alinhamento sobre conclusão da US-31, revisão de concorrência da US-42 e carga para o fecho do {sprintMetrics.sprintLabel}.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F8C1B7]/60 text-xs">
            <span className="text-fg-secondary">Duração prevista: 15 min</span>
            <button
              type="button"
              onClick={() => setActiveChannelId('sprint-planning')}
              className="font-semibold text-brand-action hover:underline cursor-pointer"
            >
              Notas em #sprint-planning →
            </button>
          </div>
        </section>
      </div>

      {/* 3. Área Principal: Canais + Feed (8 cols) e Equipa + Carga (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Canais de Colaboração e Atividade Recente */}
        <div className="lg:col-span-8 space-y-6">
          {/* Painel de Canais e Mensagens */}
          <section className="bg-bg-surface border border-border-subtle rounded-2xl shadow-xs overflow-hidden">
            {/* Barra de Canais */}
            <div className="px-5 py-4 border-b border-border-subtle bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <h2 className="text-base font-bold text-fg-primary">
                  Canais da Equipa
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {channels.map((channel) => {
                  const isActive = activeChannel.id === channel.id
                  const count = (messages[channel.id] || []).length
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => {
                        setActiveChannelId(channel.id)
                        setMessageError('')
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        isActive
                          ? 'bg-[#FFE3DC] text-brand-action font-semibold border border-[#F8C1B7]'
                          : 'bg-bg-page text-fg-secondary hover:text-fg-primary border border-transparent'
                      )}
                    >
                      <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{channel.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-fg-primary">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descrição do Canal */}
            <div className="px-5 py-2.5 bg-bg-page/70 border-b border-border-subtle text-xs text-fg-secondary flex items-center justify-between gap-2">
              <span>
                <strong className="text-fg-primary">#{activeChannel.name}</strong> — {activeChannel.description}
              </span>
              <span className="text-[11px] font-mono shrink-0">Sessão local</span>
            </div>

            {/* Lista de Mensagens */}
            <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto bg-white">
              {channelMessages.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border-subtle bg-bg-page/40">
                  <p className="text-sm font-semibold text-fg-primary">
                    Ainda sem notas em #{activeChannel.name}
                  </p>
                  <p className="text-xs text-fg-secondary mt-1">
                    Partilhe uma atualização, decisão técnica ou pedido de apoio com a equipa.
                  </p>
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border border-border-subtle bg-bg-page/45 flex items-start gap-3"
                  >
                    <Avatar
                      name={msg.author?.name || 'Membro'}
                      size={32}
                      status="online"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-fg-primary">
                            {msg.author?.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFE3DC] text-brand-action">
                            {msg.author?.roleLabel || getRoleLabel(msg.author?.role)}
                          </span>
                        </div>
                        <span className="text-[11px] text-fg-secondary">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-fg-primary leading-relaxed break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Caixa de Envio */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-bg-page border-t border-border-subtle space-y-2"
            >
              {messageError && (
                <p role="alert" className="text-xs font-medium text-feedback-errorFg">
                  {messageError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(e) => {
                    setMessageDraft(e.target.value)
                    if (messageError) setMessageError('')
                  }}
                  placeholder={`Enviar nota para #${activeChannel.name}...`}
                  aria-label={`Mensagem para #${activeChannel.name}`}
                  className="flex-1 h-11 rounded-lg border border-border-subtle bg-white px-3.5 text-sm text-fg-primary placeholder:text-fg-disabled-muted focus:outline-none focus:ring-2 focus:ring-border-focusRing"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 px-5 text-xs font-semibold shrink-0"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Publicar
                </Button>
              </div>
            </form>
          </section>

          {/* Feed de Atividade ao Vivo do Sprint */}
          <section className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <h2 className="text-base font-bold text-fg-primary">
                  Atividade Recente do Sprint e Pedidos
                </h2>
              </div>
              <span className="text-xs text-fg-secondary">
                {stories.length} stories · {pedidos.length} pedidos
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-fg-secondary py-4 text-center">
                Nenhuma atividade recente registada.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentActivity.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => navigate(act.route)}
                    className="p-3.5 rounded-xl border border-border-subtle bg-bg-page/50 hover:bg-[#FFE3DC]/25 hover:border-[#F8C1B7] transition-all text-left space-y-1.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-border-subtle text-brand-action">
                        {act.badge}
                      </span>
                      <StatusBadge status={act.status} />
                    </div>
                    <p className="text-xs font-semibold text-fg-primary line-clamp-1">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-fg-secondary line-clamp-1">
                      {act.meta}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna Direita: Membros da Equipa e Carga do Sprint */}
        <aside className="lg:col-span-4 space-y-5">
          <section className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-bold text-fg-primary">
                  Equipa &amp; Carga no Sprint
                </h2>
                <p className="text-xs text-fg-secondary mt-0.5">
                  Selecione um membro para filtrar as suas tarefas
                </p>
              </div>
              {selectedMemberName !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedMemberName('ALL')}
                  className="text-xs font-semibold text-brand-action hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {teamMembers.map((member) => {
                const isSelected = selectedMemberName === member.name
                return (
                  <button
                    key={member.id || member.name}
                    type="button"
                    onClick={() =>
                      setSelectedMemberName(isSelected ? 'ALL' : member.name)
                    }
                    className={cn(
                      'w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer',
                      isSelected
                        ? 'border-brand-primary bg-[#FFE3DC]/45 ring-1 ring-brand-primary'
                        : 'border-border-subtle bg-white hover:bg-bg-page'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={member.name}
                        size={36}
                        status={member.active === false ? 'busy' : 'online'}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-fg-primary truncate">
                            {member.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-bg-page border border-border-subtle text-fg-secondary">
                            {member.code}
                          </span>
                        </div>
                        <p className="text-xs text-fg-secondary truncate">
                          {member.label}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-brand-action">
                        {member.assignedPoints} SP
                      </div>
                      <div className="text-[11px] text-fg-secondary">
                        {member.assignedStories.length} tarefa(s)
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Lista de Tarefas Atribuídas */}
          <section className="bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-fg-primary">
                {selectedMemberName === 'ALL'
                  ? 'Tarefas Ativas do Sprint'
                  : `Tarefas de ${selectedMemberName}`}
              </h3>
              <span className="text-xs text-fg-secondary font-medium">
                {visibleMemberTasks.length} item(ns)
              </span>
            </div>

            {visibleMemberTasks.length === 0 ? (
              <p className="text-xs text-fg-secondary bg-bg-page p-3 rounded-lg border border-border-subtle">
                Nenhuma User Story atribuída neste momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {visibleMemberTasks.map((story) => (
                  <div
                    key={story.id}
                    className="p-3 rounded-xl border border-border-subtle bg-bg-page/55 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-brand-action bg-[#FFE3DC] px-1.5 py-0.5 rounded">
                        {story.id}
                      </span>
                      <StatusBadge status={story.status} />
                    </div>
                    <p className="text-xs font-semibold text-fg-primary leading-snug">
                      {story.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-fg-secondary">
                      <span>{story.assignee?.name || 'Por atribuir'}</span>
                      <span>{story.points ? `${story.points} SP` : 'Por estimar'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default TeamWorkspacePage
