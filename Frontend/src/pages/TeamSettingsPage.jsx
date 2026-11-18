import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Button,
  TextField,
  Toggle,
  User,
} from '../components/common'
import {
  useAuth,
  ROLES,
  ROLE_CODES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  getRoleCode,
  getRoleLabel,
} from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

function useSafeAuth() {
  try {
    return useAuth() || {}
  } catch {
    return {
      currentUser: null,
      role: 'CLIENT',
      roleLabel: 'Cliente Final',
    }
  }
}

const ROLE_BADGE_CLASSES = {
  PRODUCT_OWNER: 'bg-brand-selection text-brand-action border border-brand-primary/30',
  SCRUM_MASTER: 'bg-[#EDE9FE] dark:bg-[#2E1F4D] text-[#5B21B6] dark:text-[#C4B5FD] border border-[#DDD6FE] dark:border-[#8B5CF6]/40',
  DEVELOPER: 'bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 text-[#0369A1] dark:text-[#7DD3FC] border border-[#BAE6FD] dark:border-[#38BDF8]/40',
  CLIENT: 'bg-bg-page text-fg-primary border border-border-subtle',
  ADMIN: 'bg-[#DCFCE7] dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#22C55E]/40',
}

const ROLE_OPTIONS = [
  { code: ROLE_CODES.PRODUCT_OWNER, label: 'Product Owner' },
  { code: ROLE_CODES.SCRUM_MASTER, label: 'Scrum Master' },
  { code: ROLE_CODES.DEVELOPER, label: 'Programador' },
  { code: ROLE_CODES.CLIENT, label: 'Cliente Final' },
  { code: ROLE_CODES.ADMIN, label: 'Administrador do Sistema' },
]

/**
 * TeamSettingsPage Component
 */
export function TeamSettingsPage() {
  const navigate = useNavigate()
  const { currentUser, role, roleLabel } = useSafeAuth()
  const dataContext = useData()

  const workspaceConfig = dataContext.workspaceConfig || {}
  const projectName = workspaceConfig.projectName || 'Plataforma de Produto'
  const configuredTeamName = workspaceConfig.teamName || 'Equipa Principal'

  const [activeTab, setActiveTab] = useState('geral')
  const members = useMemo(() => dataContext.users || [], [dataContext.users])
  const logs = useMemo(() => dataContext.logs || [], [dataContext.logs])
  const sprints = useMemo(() => dataContext.sprints || [], [dataContext.sprints])
  const activeSprintLabel = dataContext.activeSprintLabel || 'Sem sprint ativo'
  const activeSprintDateRange = dataContext.activeSprintDateRange || 'Sem datas definidas'

  const adminMember = useMemo(
    () => members.find((m) => m.role === ROLES.ADMIN || m.role === 'ADMIN' || m.roleCode === 'P05') || null,
    [members]
  )
  const poMember = useMemo(
    () => members.find((m) => m.role === ROLES.PRODUCT_OWNER || m.roleCode === 'P01') || null,
    [members]
  )

  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [logSearch, setLogSearch] = useState('')

  const [teamName, setTeamName] = useState(configuredTeamName)
  const [visibility, setVisibility] = useState(workspaceConfig.visibility || 'Privada · Apenas membros')
  const [timezone, setTimezone] = useState(workspaceConfig.timezone || 'Europa/Lisboa (GMT+0)')
  const [description, setDescription] = useState(
    workspaceConfig.description || 'Equipa responsável pela evolução contínua e entregas do produto.'
  )

  const [notifySprintMilestones, setNotifySprintMilestones] = useState(true)
  const [notifyBlockers, setNotifyBlockers] = useState(true)
  const [notifyDigest, setNotifyDigest] = useState(false)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Programador')

  const isAdmin = role === ROLES?.ADMIN || role === 'ADMIN'
  const isClient = role === ROLES?.CLIENT || role === 'CLIENT'

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase()
    if (!q) return logs
    return logs.filter(
      (entry) =>
        (entry.action || '').toLowerCase().includes(q) ||
        (entry.resource || '').toLowerCase().includes(q) ||
        (entry.userName || '').toLowerCase().includes(q)
    )
  }, [logs, logSearch])

  const showSuccess = (msg) => {
    setErrorMsg('')
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(''), 3500)
  }

  const showError = (msg) => {
    setFeedbackMsg('')
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 4000)
  }

  const handleSaveGeneral = (e) => {
    e?.preventDefault()
    if (dataContext.updateWorkspaceConfig) {
      dataContext.updateWorkspaceConfig({
        teamName: teamName.trim() || 'Equipa Principal',
        visibility: visibility.trim() || 'Privada · Apenas membros',
        timezone: timezone.trim() || 'Europa/Lisboa (GMT+0)',
        description: description.trim(),
      })
    }
    showSuccess('✓ Informações da equipa atualizadas com sucesso!')
  }

  const handleSendInviteRequest = (e) => {
    e?.preventDefault()
    if (!inviteEmail) return

    const adminTarget = adminMember ? ` (${adminMember.name})` : ''
    showSuccess(`✓ Pedido de convite para ${inviteEmail} (${inviteRole}) encaminhado ao Administrador${adminTarget}.`)
    setShowInviteModal(false)
    setInviteEmail('')
  }

  const handleRoleChange = async (member, newRoleCode) => {
    if (!dataContext.updateUserRoleOrStatus) return
    try {
      await dataContext.updateUserRoleOrStatus(member.id, { role: newRoleCode })
      showSuccess(`✓ Papel de ${member.name} atualizado para ${getRoleLabel(newRoleCode)}.`)
    } catch (err) {
      showError(err.message || 'Não foi possível atualizar o papel do utilizador.')
    }
  }

  const handleToggleActive = async (member) => {
    if (!dataContext.updateUserRoleOrStatus) return
    const nextActive = member.active === false
    try {
      await dataContext.updateUserRoleOrStatus(member.id, { active: nextActive })
      showSuccess(`✓ Conta de ${member.name} ${nextActive ? 'reativada' : 'desativada'} com sucesso.`)
    } catch (err) {
      showError(err.message || 'Não foi possível alterar o estado da conta.')
    }
  }

  return (
    <div className="w-full space-y-6 select-none">
      {/* 1. Cabeçalho Estrutural */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-fg-secondary mb-1">
            <span>{projectName}</span>
            <span>/</span>
            <span className="font-medium text-fg-primary">{configuredTeamName}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Definições da Equipa
          </h1>
          <p className="text-sm text-fg-secondary mt-1">
            Gestão de membros, permissões por papel, auditoria, fluxo de trabalho e integrações.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start md:self-auto text-sm font-medium text-brand-action hover:underline cursor-pointer"
        >
          ← Voltar
        </button>
      </div>

      {/* Mensagens de Feedback */}
      {feedbackMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#DCFCE7] dark:bg-[#123823] text-[#166534] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#22C55E]/40 text-sm font-medium animate-in fade-in duration-200"
        >
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-feedback-errorBg text-feedback-errorFg border border-feedback-errorBorder text-sm font-medium"
        >
          {errorMsg}
        </div>
      )}

      {/* 2. Banner de Resumo de Acesso */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <Avatar
            name={currentUser?.name || 'Utilizador'}
            size={40}
            shape="circle"
            className="bg-brand-selection text-brand-action border border-brand-primary/30"
          />

          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-fg-primary">
              Está a consultar como {currentUser?.name || 'Utilizador'} ({roleLabel})
            </h2>
            <p className="text-xs sm:text-sm text-fg-secondary max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Como Administrador do Sistema, dispõe de privilégios totais para gerir utilizadores, atribuir permissões e consultar logs de auditoria.'
                : `Pode consultar as definições da equipa. A gestão de contas e permissões é reservada ao Administrador do Sistema${adminMember ? ` (${adminMember.name})` : ''}.`}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
              isAdmin
                ? 'bg-brand-selection text-brand-action border border-brand-primary/30'
                : 'bg-bg-page text-fg-secondary border border-border-subtle'
            }`}
          >
            {isAdmin ? 'Acesso Total' : 'Só de leitura'}
          </span>
        </div>
      </div>

      {/* 3. Disposição Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Barra Lateral do Menu de Definições */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
          <nav
            aria-label="Menu de definições da equipa"
            className="p-3 bg-bg-surface rounded-2xl border border-border-subtle shadow-xs space-y-1"
          >
            <div className="px-3 py-2 text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
              DEFINIÇÕES DA EQUIPA
            </div>

            {[
              { id: 'geral', label: 'Geral' },
              { id: 'membros', label: 'Membros e funções' },
              { id: 'permissoes', label: 'Permissões' },
              { id: 'auditoria', label: 'Logs de auditoria' },
              { id: 'sprints', label: 'Sprints e fluxo de trabalho' },
              { id: 'notificacoes', label: 'Notificações da equipa' },
              { id: 'integracoes', label: 'Integrações' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-selection text-brand-action font-semibold'
                      : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-page'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={isActive ? 'text-brand-action font-bold' : 'text-fg-disabled'}>
                    ›
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Cartão de Apoio / Administrador */}
          <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-fg-primary">
              Precisa de alterar algo?
            </h3>

            {adminMember ? (
              <div className="flex items-center gap-3">
                <Avatar
                  name={adminMember.name}
                  size={36}
                  shape="circle"
                  className="bg-brand-selection text-brand-action border border-brand-primary/30"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-fg-primary truncate">
                    {adminMember.name}
                  </div>
                  <div className="text-xs text-fg-secondary">
                    Administrador do Sistema
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-fg-secondary">
                A listagem de administradores não está disponível para o seu nível de acesso.
              </p>
            )}

            <p className="text-xs text-fg-secondary leading-relaxed">
              Envie um pedido ao Administrador do Sistema para atualizar a equipa ou alterar permissões.
            </p>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="text-xs font-semibold text-brand-action hover:underline cursor-pointer block"
            >
              Contactar administrador →
            </button>
          </div>
        </aside>

        {/* Painel Central das Definições */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
                  <h2 className="text-xl font-bold text-fg-primary">
                    Informações da equipa
                  </h2>
                  <span className="text-xs text-fg-secondary flex items-center gap-1.5 bg-bg-page px-2.5 py-1 rounded-md">
                    <User size={14} />
                    <span>{isAdmin ? 'Pode editar como Administrador' : 'Apenas o Administrador pode editar'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar
                    name={teamName}
                    size={48}
                    shape="circle"
                    className="bg-brand-selection text-brand-action font-bold text-base border-2 border-brand-primary/30"
                  />
                  <div>
                    <h3 className="text-base font-bold text-fg-primary">
                      {teamName}
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      {members.length} utilizadores registados · {projectName}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <TextField
                      label="Nome da equipa"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? '' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />

                    <TextField
                      label="Visibilidade"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? '' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />

                    <TextField
                      label="Fuso horário"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? '' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />
                  </div>

                  <TextField
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isAdmin}
                    className={isAdmin ? '' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-fg-secondary">
                      {isAdmin
                        ? 'Todas as alterações são aplicadas imediatamente no espaço de trabalho.'
                        : `As alterações a estes dados devem ser solicitadas ao Administrador${adminMember ? ` (${adminMember.name})` : ''}.`}
                    </p>

                    {isAdmin && (
                      <Button type="submit" variant="primary" className="h-10 px-5 text-xs font-semibold">
                        Guardar alterações
                      </Button>
                    )}
                  </div>
                </form>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-fg-primary">
                    Sprints e fluxo de trabalho
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-fg-primary">{activeSprintLabel}</span>
                    <span className="text-fg-secondary text-xs">{activeSprintDateRange}</span>
                  </div>

                  <p className="text-xs text-fg-secondary bg-bg-page p-2.5 rounded-lg border border-border-subtle">
                    Por fazer → Em desenvolvimento → Em revisão → Concluído
                  </p>

                  <div className="h-px bg-border-subtle" />

                  <p className="text-xs text-fg-secondary">
                    Estimativa em story points · {sprints.length} sprint(s) registado(s)
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/sprint')}
                    className="text-xs font-semibold text-brand-action hover:underline cursor-pointer block pt-1"
                  >
                    Consultar quadro do sprint →
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-fg-primary">
                    Permissões e segurança
                  </h3>

                  <p className="text-xs text-fg-secondary leading-relaxed">
                    Acesso segmentado pelos 5 perfis de equipa com controlo de acessos baseado em papéis.
                  </p>

                  <p className="text-xs text-fg-secondary leading-relaxed bg-bg-page p-2.5 rounded-lg border border-border-subtle">
                    {poMember ? `${poMember.name} (Product Owner)` : 'Product Owner'} define prioridades do produto.{' '}
                    {adminMember ? `${adminMember.name} (Administrador)` : 'Administrador do Sistema'} gere contas, permissões e logs de auditoria.
                  </p>

                  <div className="h-px bg-border-subtle" />

                  <p className="text-xs text-fg-secondary">
                    Temporizador de inatividade configurado para 60 minutos.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveTab('permissoes')}
                    className="text-xs font-semibold text-brand-action hover:underline cursor-pointer block pt-1"
                  >
                    Ver matriz completa de permissões →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBROS E FUNÇÕES */}
          {activeTab === 'membros' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-xl font-bold text-fg-primary">
                    Membros e funções
                  </h2>
                  <p className="text-xs text-fg-secondary mt-0.5">
                    {members.length} utilizadores · Papéis geridos pelo Administrador do Sistema
                  </p>
                </div>

                <Button
                  variant="secondary"
                  className="h-10 px-4 text-xs font-semibold"
                  onClick={() => setShowInviteModal(true)}
                >
                  Pedir convite de membro
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-page border-b border-border-subtle text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Membro</th>
                      <th className="py-3 px-4">Função</th>
                      <th className="py-3 px-4">Âmbito de atuação</th>
                      <th className="py-3 px-4">Estado</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Gestão de Acessos</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-xs">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="py-8 px-4 text-center text-fg-secondary">
                          {isClient
                            ? 'A listagem de membros internos está restrita para o perfil Cliente Final.'
                            : 'Nenhum utilizador carregado no momento.'}
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => {
                        const roleCode = member.roleCode || getRoleCode(member.role)
                        const badgeClass = ROLE_BADGE_CLASSES[member.role] || ROLE_BADGE_CLASSES.CLIENT
                        const isActiveAccount = member.active !== false
                        return (
                          <tr key={member.id} className="hover:bg-bg-page/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={member.name}
                                  size={36}
                                  shape="circle"
                                  className="bg-brand-selection text-brand-action border border-brand-primary/30"
                                />
                                <div>
                                  <div className="font-semibold text-fg-primary text-sm">
                                    {member.name}
                                  </div>
                                  <div className="text-xs text-fg-secondary">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${badgeClass}`}>
                                {getRoleLabel(member.role)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-fg-secondary max-w-xs">
                              {member.scope || 'Membro da plataforma'}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs text-fg-secondary font-medium">
                                <span className={`w-2 h-2 rounded-full ${isActiveAccount ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                                {isActiveAccount ? 'Ativo' : 'Desativado'}
                              </span>
                            </td>

                            {isAdmin && (
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <select
                                    aria-label={`Alterar papel de ${member.name}`}
                                    value={roleCode}
                                    onChange={(e) => handleRoleChange(member, e.target.value)}
                                    className="h-8 px-2 rounded-lg border border-border-subtle bg-bg-surface text-xs text-fg-primary cursor-pointer"
                                  >
                                    {ROLE_OPTIONS.map((opt) => (
                                      <option key={opt.code} value={opt.code}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    variant="secondary"
                                    className="h-8 px-2.5 text-[11px]"
                                    onClick={() => handleToggleActive(member)}
                                  >
                                    {isActiveAccount ? 'Desativar' : 'Reativar'}
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-page border border-border-subtle text-xs text-fg-secondary leading-relaxed">
                Apenas o Administrador do Sistema{adminMember ? ` (${adminMember.name})` : ''} pode alterar papéis de acesso ou desativar contas.
              </div>
            </section>
          )}

          {/* TAB 3: MATRIZ DE PERMISSÕES */}
          {activeTab === 'permissoes' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Matriz de Controlo de Acessos
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Direitos de visualização, edição e gestão para os 5 papéis definidos na plataforma.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bg-page border-b border-border-subtle text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Capacidade / Privilégio</th>
                      <th className="py-3 px-3 text-center">Administrador</th>
                      <th className="py-3 px-3 text-center">Product Owner</th>
                      <th className="py-3 px-3 text-center">Scrum Master</th>
                      <th className="py-3 px-3 text-center">Programador</th>
                      <th className="py-3 px-3 text-center">Cliente Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {[
                      { key: 'canCreatePedidos', label: 'Criar pedidos de funcionalidade' },
                      { key: 'canVote', label: 'Votar em pedidos (1 voto por utilizador)' },
                      { key: 'canManageBacklog', label: 'Priorizar e aprovar Backlog' },
                      { key: 'canManageSprintLifecycle', label: 'Criar, editar e concluir Sprints' },
                      { key: 'canManageSprint', label: 'Mover tarefas no Sprint Kanban' },
                      { key: 'canEditSettings', label: 'Alterar definições da equipa' },
                      { key: 'canManageUsers', label: 'Gerir contas e permissões' },
                      { key: 'canViewTraceability', label: 'Consultar Matriz de Rastreabilidade' },
                    ].map((priv) => (
                      <tr key={priv.key} className="hover:bg-bg-page/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-fg-primary">
                          {priv.label}
                        </td>
                        {['ADMIN', 'PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'CLIENT'].map((rKey) => (
                          <td key={rKey} className="py-3 px-3 text-center">
                            {ROLE_PERMISSIONS[rKey][priv.key] ? (
                              <span className="text-[#16A34A] dark:text-[#86EFAC] font-bold">✓</span>
                            ) : (
                              <span className="text-fg-disabled">✕</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: LOGS DE AUDITORIA */}
          {activeTab === 'auditoria' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-xl font-bold text-fg-primary">
                    Registos de Auditoria
                  </h2>
                  <p className="text-xs text-fg-secondary mt-0.5">
                    Histórico cronológico de criações, alterações de estado, priorização assistida, sprints e permissões.
                  </p>
                </div>

                {!isClient && (
                  <div className="w-full sm:w-64">
                    <TextField
                      placeholder="Filtrar por ação, recurso ou utilizador..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {isClient ? (
                <div className="p-6 rounded-xl bg-[#FEE2E2]/40 dark:bg-[#451B1B]/60 border border-[#FECACA] dark:border-[#EF4444]/40 text-xs text-[#DC2626] dark:text-[#FCA5A5] font-medium">
                  Acesso restrito: o perfil <strong>Cliente Final</strong> não tem autorização para consultar logs internos de auditoria.
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 rounded-xl bg-bg-page border border-border-subtle text-center text-xs text-fg-secondary">
                  Nenhum registo de auditoria encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border-subtle">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg-page border-b border-border-subtle text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Ação</th>
                        <th className="py-3 px-4">Recurso</th>
                        <th className="py-3 px-4">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredLogs.map((entry) => (
                        <tr key={entry.id} className="hover:bg-bg-page/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-fg-secondary whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString('pt-PT')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-fg-primary">{entry.userName}</div>
                            {entry.userRole && (
                              <div className="text-[11px] text-fg-secondary">
                                {getRoleLabel(entry.userRole)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-brand-selection text-brand-action font-mono font-semibold text-[11px]">
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-fg-primary">
                            {entry.resource}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-fg-secondary max-w-xs truncate">
                            {entry.details ? JSON.stringify(entry.details) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 5: SPRINTS E FLUXO DE TRABALHO */}
          {activeTab === 'sprints' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Sprints e Fluxo de Trabalho
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Ciclos de desenvolvimento ágil, estados do quadro e convenções de estimativa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="text-xs text-fg-secondary font-medium">Sprint Atual</div>
                  <div className="text-lg font-bold text-fg-primary mt-1">{activeSprintLabel}</div>
                  <div className="text-xs text-fg-secondary mt-0.5">{activeSprintDateRange}</div>
                </div>

                <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="text-xs text-fg-secondary font-medium">Sprints Criados</div>
                  <div className="text-lg font-bold text-fg-primary mt-1">{sprints.length}</div>
                  <div className="text-xs text-fg-secondary mt-0.5">Geridos na timeline do Kanban</div>
                </div>

                <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="text-xs text-fg-secondary font-medium">Métrica de Estimativa</div>
                  <div className="text-lg font-bold text-fg-primary mt-1">Story Points</div>
                  <div className="text-xs text-fg-secondary mt-0.5">Sequência Fibonacci adaptada</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <h3 className="text-sm font-bold text-fg-primary">
                  Etapas do Quadro Kanban do Sprint
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 bg-bg-surface rounded-lg border border-border-subtle font-medium text-fg-primary">
                    1. Por fazer
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#5B21B6] dark:text-[#C4B5FD] bg-[#EDE9FE]/30 dark:bg-[#2E1F4D]">
                    2. Em desenvolvimento
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#7A4D00] dark:text-[#FCD34D] bg-[#FEF3C7]/30 dark:bg-[#453009]">
                    3. Em revisão
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#166534] dark:text-[#86EFAC] bg-[#DCFCE7]/30 dark:bg-[#123823]">
                    4. Concluído
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="h-10 px-5 text-xs font-semibold"
                onClick={() => navigate('/sprint')}
              >
                Abrir Quadro do Sprint no Kanban →
              </Button>
            </section>
          )}

          {/* TAB 6: NOTIFICAÇÕES DA EQUIPA */}
          {activeTab === 'notificacoes' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Notificações da Equipa
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Controlo de envio de alertas e avisos de ciclo de Sprint.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-border-subtle">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Marcos e encerramentos de Sprint
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Avisar toda a equipa antes do encerramento oficial do sprint.
                    </p>
                  </div>
                  <Toggle
                    checked={notifySprintMilestones}
                    onChange={setNotifySprintMilestones}
                    aria-label="Alternar marcos de sprint"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Bloqueios e impedimentos críticos
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Alertar o Scrum Master quando uma tarefa for marcada com impedimento.
                    </p>
                  </div>
                  <Toggle
                    checked={notifyBlockers}
                    onChange={setNotifyBlockers}
                    aria-label="Alternar bloqueios críticos"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Resumo semanal por e-mail
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Enviar todas as sextas-feiras um sumário de pedidos aprovados e velocidade atingida.
                    </p>
                  </div>
                  <Toggle
                    checked={notifyDigest}
                    onChange={setNotifyDigest}
                    aria-label="Alternar resumo semanal"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 7: INTEGRAÇÕES */}
          {activeTab === 'integracoes' && (
            <section className="p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Integrações Externas
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Ligações opcionais de repositórios de código, ferramentas de design e notificações externas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    name: 'GitHub & GitLab',
                    desc: 'Sincronização de commits e pull requests com User Stories.',
                  },
                  {
                    name: 'Figma Design System',
                    desc: 'Referência de ecrãs e componentes de interface.',
                  },
                  {
                    name: 'Jira Software',
                    desc: 'Importação ou exportação pontual de épicos e backlog.',
                  },
                  {
                    name: 'Slack & MS Teams',
                    desc: 'Webhooks configuráveis para alertas de sprint e pedidos.',
                  },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="p-4 rounded-xl bg-bg-page border border-border-subtle flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-fg-primary text-sm">{integration.name}</div>
                      <p className="text-xs text-fg-secondary">{integration.desc}</p>
                      <span className="inline-block text-[11px] font-medium text-fg-secondary bg-bg-surface border border-border-subtle px-2 py-0.5 rounded">
                        Não configurado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal de Pedido de Convite / Contactar Administrador */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-fg-primary">
                Pedir Convite de Membro
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-page cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-fg-secondary leading-relaxed">
              Indique o endereço de e-mail do colaborador e a função pretendida. O pedido será encaminhado para validação pelo Administrador do Sistema{adminMember ? ` (${adminMember.name})` : ''}.
            </p>

            <form onSubmit={handleSendInviteRequest} className="space-y-3.5">
              <TextField
                label="E-mail do colaborador"
                type="email"
                placeholder="nome@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-fg-primary">
                  Função sugerida
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-border-subtle bg-bg-surface text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-brand-action/20"
                >
                  <option value={ROLE_LABELS.DEVELOPER}>Programador (Desenvolvimento)</option>
                  <option value={ROLE_LABELS.SCRUM_MASTER}>Scrum Master (Facilitação)</option>
                  <option value={ROLE_LABELS.PRODUCT_OWNER}>Product Owner (Produto)</option>
                  <option value={ROLE_LABELS.CLIENT}>Cliente Final (Votação e Feedback)</option>
                  <option value={ROLE_LABELS.ADMIN}>Administrador do Sistema</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 px-4 text-xs font-medium"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-10 px-4 text-xs font-semibold"
                >
                  Enviar pedido ao Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamSettingsPage
