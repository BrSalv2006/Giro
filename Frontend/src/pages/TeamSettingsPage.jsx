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
      currentUser: { name: 'Sofia Costa', role: 'PRODUCT_OWNER', initials: 'SC' },
      role: 'PRODUCT_OWNER',
      roleLabel: 'Product Owner',
    }
  }
}

const ROLE_BADGE_CLASSES = {
  PRODUCT_OWNER: 'bg-[#FFE3DC] text-[#B93826] border border-[#F8C1B7]',
  SCRUM_MASTER: 'bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]',
  DEVELOPER: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
  CLIENT: 'bg-[#F1F2F4] text-[#292D35] border border-[#CDD1D8]',
  ADMIN: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]',
}

const ROLE_OPTIONS = [
  { code: ROLE_CODES.PRODUCT_OWNER, label: 'P01 · Product Owner' },
  { code: ROLE_CODES.SCRUM_MASTER, label: 'P02 · Scrum Master' },
  { code: ROLE_CODES.DEVELOPER, label: 'P03 · Programador' },
  { code: ROLE_CODES.CLIENT, label: 'P04 · Cliente Final' },
  { code: ROLE_CODES.ADMIN, label: 'P05 · Administrador do Sistema' },
]

/**
 * TeamSettingsPage Component
 * Baseado no Figma frame 342:1613 ("Definições da equipa", 1440x900)
 */
export function TeamSettingsPage() {
  const navigate = useNavigate()
  const { currentUser, role, roleLabel } = useSafeAuth()
  const dataContext = useData()

  const [activeTab, setActiveTab] = useState('geral') // 'geral' | 'membros' | 'permissoes' | 'auditoria' | 'sprints' | 'notificacoes' | 'integracoes'
  const members = dataContext.users || []
  const logs = useMemo(() => dataContext.logs || [], [dataContext.logs])
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [logSearch, setLogSearch] = useState('')

  // Estados dos campos da equipa
  const [teamName, setTeamName] = useState('Giro Dev Team')
  const [visibility, setVisibility] = useState('Privada · Apenas membros')
  const [timezone, setTimezone] = useState('Europa/Lisboa (GMT+0)')
  const [description, setDescription] = useState('Equipa de desenvolvimento e evolução contínua da plataforma Giro.')

  // Toggles de notificações da equipa
  const [notifySprintMilestones, setNotifySprintMilestones] = useState(true)
  const [notifyBlockers, setNotifyBlockers] = useState(true)
  const [notifyDigest, setNotifyDigest] = useState(false)

  // Modal de Pedido de Convite / Contacto
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
    showSuccess('✓ Informações da equipa atualizadas com sucesso!')
  }

  const handleSendInviteRequest = (e) => {
    e?.preventDefault()
    if (!inviteEmail) return

    showSuccess(`✓ Pedido de convite para ${inviteEmail} (${inviteRole}) enviado ao Administrador do Sistema (Diogo Ferreira).`)
    setShowInviteModal(false)
    setInviteEmail('')
  }

  const handleRoleChange = async (member, newRoleCode) => {
    if (!dataContext.updateUserRoleOrStatus) return
    try {
      await dataContext.updateUserRoleOrStatus(member.id, { role: newRoleCode })
      showSuccess(`✓ Papel de ${member.name} atualizado para ${getRoleLabel(newRoleCode)} (${newRoleCode}).`)
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
      {/* 1. Cabeçalho de Navegação Estrutural */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-fg-secondary mb-1">
            <span>Plataforma de Produto</span>
            <span>/</span>
            <span className="font-medium text-fg-primary">Giro Dev Team</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
            Definições da Equipa
          </h1>
          <p className="text-sm text-fg-secondary mt-1">
            Gestão de membros, permissões por papel (P01–P05), auditoria, fluxo de trabalho e integrações.
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
          className="p-3.5 rounded-xl bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] text-sm font-medium animate-in fade-in duration-200"
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

      {/* 2. Banner de Resumo de Acesso do Utilizador Atual (Figma 342:1672) */}
      <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <Avatar
            name={currentUser?.name || 'Sofia Costa'}
            size={40}
            shape="circle"
            className="bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]"
          />

          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-fg-primary">
              Está a consultar como {currentUser?.name || 'Sofia Costa'} ({roleLabel || 'Product Owner'})
            </h2>
            <p className="text-xs sm:text-sm text-fg-secondary max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Como Administrador do Sistema (P05), dispõe de privilégios totais para gerir utilizadores, atribuir papéis RBAC e consultar logs de auditoria.'
                : 'Pode consultar as definições da equipa. A gestão de contas e papéis RBAC é reservada a Diogo Ferreira (Administrador do Sistema · P05).'}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
              isAdmin
                ? 'bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]'
                : 'bg-bg-page text-fg-secondary border border-border-subtle'
            }`}
          >
            {isAdmin ? 'Acesso Total (P05)' : 'Só de leitura'}
          </span>
        </div>
      </div>

      {/* 3. Disposição Principal: Barra de Definições Lateral + Painel de Conteúdo (Figma 342:1679) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Barra Lateral do Menu de Definições (Figma 342:1680) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
          <nav
            aria-label="Menu de definições da equipa"
            className="p-3 bg-white rounded-2xl border border-border-subtle shadow-xs space-y-1"
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
                      ? 'bg-[#FFE3DC] text-brand-action font-semibold'
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

          {/* Cartão do Administrador da Equipa (Figma 342:1697) */}
          <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-fg-primary">
              Precisa de alterar algo?
            </h3>

            <div className="flex items-center gap-3">
              <Avatar
                name="Diogo Ferreira"
                size={36}
                shape="circle"
                className="bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg-primary truncate">
                  Diogo Ferreira
                </div>
                <div className="text-xs text-fg-secondary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  <span>P05 · Administrador do Sistema</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-fg-secondary leading-relaxed">
              Envie um pedido ao Administrador do Sistema para atualizar a equipa ou alterar permissões RBAC.
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

        {/* Painel Central das Definições (Figma 342:1707) */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* TAB 1: GERAL (Figma 342:1708) */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
                  <h2 className="text-xl font-bold text-fg-primary">
                    Informações da equipa
                  </h2>
                  <span className="text-xs text-fg-secondary flex items-center gap-1.5 bg-bg-page px-2.5 py-1 rounded-md">
                    <User size={14} />
                    <span>{isAdmin ? 'Pode editar como Administrador (P05)' : 'Apenas o Administrador pode editar'}</span>
                  </span>
                </div>

                {/* Identidade da Equipa (Figma 342:1714) */}
                <div className="flex items-center gap-4">
                  <Avatar
                    name="Giro Dev Team"
                    size={48}
                    shape="circle"
                    className="bg-[#FFE3DC] text-brand-action font-bold text-base border-2 border-[#F8C1B7]"
                  />
                  <div>
                    <h3 className="text-base font-bold text-fg-primary">
                      Giro Dev Team
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      {members.length} utilizadores registados · Plataforma de Produto
                    </p>
                  </div>
                </div>

                {/* Formulário de Dados Gerais (Figma 342:1720) */}
                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <TextField
                      label="Nome da equipa"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? 'bg-white' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />

                    <TextField
                      label="Visibilidade"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? 'bg-white' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />

                    <TextField
                      label="Fuso horário"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      disabled={!isAdmin}
                      className={isAdmin ? 'bg-white' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                    />
                  </div>

                  <TextField
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isAdmin}
                    className={isAdmin ? 'bg-white' : 'bg-bg-page opacity-80 cursor-not-allowed'}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-fg-secondary">
                      {isAdmin
                        ? 'Todas as alterações são sincronizadas imediatamente com a equipa.'
                        : 'As alterações a estes dados devem ser solicitadas a Diogo Ferreira (P05).'}
                    </p>

                    {isAdmin && (
                      <Button type="submit" variant="primary" className="h-10 px-5 text-xs font-semibold">
                        Guardar alterações
                      </Button>
                    )}
                  </div>
                </form>
              </section>

              {/* Configuração de Trabalho (Figma 342:1780) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-fg-primary">
                    Sprints e fluxo de trabalho
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-fg-primary">Sprint 12</span>
                    <span className="text-fg-secondary text-xs">12–23 out. 2026</span>
                  </div>

                  <p className="text-xs text-fg-secondary bg-bg-page p-2.5 rounded-lg border border-border-subtle">
                    Por fazer → Em desenvolvimento → Em revisão → Concluído
                  </p>

                  <div className="h-px bg-border-subtle" />

                  <p className="text-xs text-fg-secondary">
                    Estimativa em story points · Duração do sprint: 2 semanas
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/sprint')}
                    className="text-xs font-semibold text-brand-action hover:underline cursor-pointer block pt-1"
                  >
                    Consultar quadro do sprint →
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-fg-primary">
                    Permissões e segurança
                  </h3>

                  <p className="text-xs text-fg-secondary leading-relaxed">
                    Acesso segmentado pelos 5 papéis oficiais (P01–P05) com controlo estrito RBAC.
                  </p>

                  <p className="text-xs text-fg-secondary leading-relaxed bg-bg-page p-2.5 rounded-lg border border-border-subtle">
                    Sofia Costa (P01) define prioridades do produto. Diogo Ferreira (P05) gere contas, papéis e logs de auditoria.
                  </p>

                  <div className="h-px bg-border-subtle" />

                  <p className="text-xs text-fg-secondary">
                    RNF-SEG-01: Temporizador de inatividade configurado para 60 minutos.
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

          {/* TAB 2: MEMBROS E FUNÇÕES (Figma 342:1726) */}
          {activeTab === 'membros' && (
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-xl font-bold text-fg-primary">
                    Membros e funções
                  </h2>
                  <p className="text-xs text-fg-secondary mt-0.5">
                    {members.length} utilizadores · Papéis atribuídos pelo Administrador do Sistema (CA9.1 / CA9.2)
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

              {/* Tabela de Membros */}
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-page border-b border-border-subtle text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Membro</th>
                      <th className="py-3 px-4">Função (P01–P05)</th>
                      <th className="py-3 px-4">Âmbito de atuação</th>
                      <th className="py-3 px-4">Estado</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Gestão RBAC</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-xs">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="py-8 px-4 text-center text-fg-secondary">
                          {isClient
                            ? 'A listagem de membros internos está restrita para o perfil Cliente Final (P04).'
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
                                  className="bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]"
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
                                {roleCode} · {getRoleLabel(member.role)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-fg-secondary max-w-xs">
                              {member.scope || 'Membro da plataforma GIRO'}
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
                                    className="h-8 px-2 rounded-lg border border-border-subtle bg-white text-xs text-fg-primary cursor-pointer"
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
                Apenas Diogo Ferreira (Administrador do Sistema · P05) pode alterar papéis RBAC ou desativar contas (CA9.1 / CA9.2).
              </div>
            </section>
          )}

          {/* TAB 3: MATRIZ DE PERMISSÕES RBAC */}
          {activeTab === 'permissoes' && (
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Matriz de Controlo de Acessos (RBAC)
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Direitos de visualização, edição e gestão para os 5 papéis definidos na plataforma Giro (P01–P05).
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bg-page border-b border-border-subtle text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Capacidade / Privilégio</th>
                      <th className="py-3 px-3 text-center">Administrador (P05)</th>
                      <th className="py-3 px-3 text-center">Product Owner (P01)</th>
                      <th className="py-3 px-3 text-center">Scrum Master (P02)</th>
                      <th className="py-3 px-3 text-center">Programador (P03)</th>
                      <th className="py-3 px-3 text-center">Cliente Final (P04)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {[
                      { key: 'canCreatePedidos', label: 'Criar pedidos de funcionalidade' },
                      { key: 'canVote', label: 'Votar em pedidos (RNF-SEG-03: 1 voto)' },
                      { key: 'canManageBacklog', label: 'Priorizar e aprovar Backlog' },
                      { key: 'canManageSprint', label: 'Mover tarefas no Sprint Kanban' },
                      { key: 'canEditSettings', label: 'Alterar definições da equipa' },
                      { key: 'canManageUsers', label: 'Gerir contas e papéis RBAC' },
                      { key: 'canViewTraceability', label: 'Consultar Matriz de Rastreabilidade' },
                    ].map((priv) => (
                      <tr key={priv.key} className="hover:bg-bg-page/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-fg-primary">
                          {priv.label}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ROLE_PERMISSIONS.ADMIN[priv.key] ? (
                            <span className="text-[#16A34A] font-bold">✓</span>
                          ) : (
                            <span className="text-fg-disabled">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ROLE_PERMISSIONS.PRODUCT_OWNER[priv.key] ? (
                            <span className="text-[#16A34A] font-bold">✓</span>
                          ) : (
                            <span className="text-fg-disabled">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ROLE_PERMISSIONS.SCRUM_MASTER[priv.key] ? (
                            <span className="text-[#16A34A] font-bold">✓</span>
                          ) : (
                            <span className="text-fg-disabled">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ROLE_PERMISSIONS.DEVELOPER[priv.key] ? (
                            <span className="text-[#16A34A] font-bold">✓</span>
                          ) : (
                            <span className="text-fg-disabled">✕</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ROLE_PERMISSIONS.CLIENT[priv.key] ? (
                            <span className="text-[#16A34A] font-bold">✓</span>
                          ) : (
                            <span className="text-fg-disabled">✕</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: LOGS DE AUDITORIA (CA9.4) */}
          {activeTab === 'auditoria' && (
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-xl font-bold text-fg-primary">
                    Registos de Auditoria (CA9.4)
                  </h2>
                  <p className="text-xs text-fg-secondary mt-0.5">
                    Histórico cronológico de criações, alterações de estado, priorização IA e permissões RBAC.
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
                <div className="p-6 rounded-xl bg-[#FEE2E2]/40 border border-[#FECACA] text-xs text-[#DC2626] font-medium">
                  Acesso restrito (HTTP 403 / CA9.3): o perfil <strong>Cliente Final (P04)</strong> não tem autorização para consultar logs internos de auditoria.
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
                                {entry.userRole} · {getRoleLabel(entry.userRole)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-[#FFE3DC] text-brand-action font-mono font-semibold text-[11px]">
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
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
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
                  <div className="text-lg font-bold text-fg-primary mt-1">Sprint 12</div>
                  <div className="text-xs text-fg-secondary mt-0.5">12 a 23 de outubro de 2026</div>
                </div>

                <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="text-xs text-fg-secondary font-medium">Duração do Ciclo</div>
                  <div className="text-lg font-bold text-fg-primary mt-1">2 Semanas</div>
                  <div className="text-xs text-fg-secondary mt-0.5">Planeamento às segundas-feiras</div>
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
                  <div className="p-3 bg-white rounded-lg border border-border-subtle font-medium text-fg-primary">
                    1. Por fazer
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#5B21B6] bg-[#EDE9FE]/20">
                    2. Em desenvolvimento
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#7A4D00] bg-[#FEF3C7]/20">
                    3. Em revisão
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle font-medium text-[#166534] bg-[#DCFCE7]/20">
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
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Notificações da Equipa
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Controlo de envio de alertas sonoros, e-mails e avisos push de sprint.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-border-subtle">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Marcos e encerramentos de Sprint
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Avisar toda a equipa 2 dias antes do encerramento oficial do sprint.
                    </p>
                  </div>
                  <Toggle
                    checked={notifySprintMilestones}
                    onChange={setNotifySprintMilestones}
                    ariaLabel="Alternar marcos de sprint"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Bloqueios e impedimentos críticos
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Alertar imediatamente o Scrum Master quando uma tarefa for marcada com impedimento.
                    </p>
                  </div>
                  <Toggle
                    checked={notifyBlockers}
                    onChange={setNotifyBlockers}
                    ariaLabel="Alternar bloqueios críticos"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg-primary">
                      Resumo semanal por e-mail (Digest)
                    </h3>
                    <p className="text-xs text-fg-secondary">
                      Enviar todas as sextas-feiras um sumário de pedidos aprovados e velocidade atingida.
                    </p>
                  </div>
                  <Toggle
                    checked={notifyDigest}
                    onChange={setNotifyDigest}
                    ariaLabel="Alternar resumo semanal"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 7: INTEGRAÇÕES */}
          {activeTab === 'integracoes' && (
            <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-5">
              <div>
                <h2 className="text-xl font-bold text-fg-primary">
                  Integrações e Ferramentas Conectadas
                </h2>
                <p className="text-xs text-fg-secondary mt-1">
                  Sincronização bidirecional de repositórios de código, tickets e design tokens.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-border-subtle flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-fg-primary text-sm">GitHub &amp; GitLab</div>
                    <p className="text-xs text-fg-secondary">
                      Sincronização de commits com histórias (US-XX).
                    </p>
                    <span className="inline-block text-[11px] font-medium text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                      Conectado · Repositório Giro
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border-subtle flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-fg-primary text-sm">Figma Desktop Plugin</div>
                    <p className="text-xs text-fg-secondary">
                      Extração direta de variáveis e tokens de design.
                    </p>
                    <span className="inline-block text-[11px] font-medium text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                      Ativo · 264 Variáveis
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border-subtle flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-fg-primary text-sm">Jira Software</div>
                    <p className="text-xs text-fg-secondary">
                      Mapeamento de épicos e exportação de backlog.
                    </p>
                    <span className="inline-block text-[11px] font-medium text-fg-secondary bg-bg-page px-2 py-0.5 rounded">
                      Disponível
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border-subtle flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-fg-primary text-sm">Slack &amp; MS Teams</div>
                    <p className="text-xs text-fg-secondary">
                      Webhooks de alertas para canais #sprint e #pedidos.
                    </p>
                    <span className="inline-block text-[11px] font-medium text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
                      Webhook ativo
                    </span>
                  </div>
                </div>
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
          <div className="max-w-md w-full bg-white rounded-2xl border border-border-subtle p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
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
              Indique o endereço de e-mail do colaborador e a função pretendida. O pedido será encaminhado para validação por <strong>Diogo Ferreira (Administrador do Sistema · P05)</strong>.
            </p>

            <form onSubmit={handleSendInviteRequest} className="space-y-3.5">
              <TextField
                label="E-mail do colaborador"
                type="email"
                placeholder="novo.membro@giro.com"
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
                  className="w-full h-11 px-3 rounded-lg border border-border-subtle bg-white text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-brand-action/20"
                >
                  <option value={ROLE_LABELS.DEVELOPER}>Programador (Desenvolvimento · P03)</option>
                  <option value={ROLE_LABELS.SCRUM_MASTER}>Scrum Master (Facilitação · P02)</option>
                  <option value={ROLE_LABELS.PRODUCT_OWNER}>Product Owner (Produto · P01)</option>
                  <option value={ROLE_LABELS.CLIENT}>Cliente Final (Votação e Feedback · P04)</option>
                  <option value={ROLE_LABELS.ADMIN}>Administrador do Sistema (P05)</option>
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
