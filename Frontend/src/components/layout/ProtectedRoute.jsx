import { Outlet, useNavigate } from 'react-router-dom'
import { ShieldAlert, LogIn, ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { Button } from '../common/Button.jsx'

/**
 * ProtectedRoute Component
 * Validates active session and role-based permissions (RBAC).
 * Handles:
 * 1. Unauthenticated sessions / Inactivity expiration (RNF-SEG-01)
 * 2. Unauthorized role access (403 Forbidden with Giro design system)
 *
 * @param {Array<string>} [allowedRoles] - List of authorized roles (e.g. ['ADMIN', 'PRODUCT_OWNER'])
 * @param {React.ReactNode} [children] - Optional child elements (or renders <Outlet />)
 */
export function ProtectedRoute({ allowedRoles = [], children }) {
  const {
    isAuthenticated,
    currentUser,
    role,
    roleLabel,
    login,
    isLoggedOutDueToInactivity,
    allUsers,
  } = useAuth()
  const { openRoleSwitcher } = useModal()
  const navigate = useNavigate()

  // 1. Caso de Sessão Expirada por Inatividade (RNF-SEG-01) ou Não Autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border-subtle p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE3DC] text-brand-action mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-brand-primary" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-fg-primary">
              {isLoggedOutDueToInactivity
                ? 'Sessão Expirada por Inatividade'
                : 'Sessão Não Iniciada'}
            </h1>
            <p className="text-sm text-fg-secondary">
              {isLoggedOutDueToInactivity
                ? 'Por motivos de segurança (RNF-SEG-01), a sua sessão foi terminada automaticamente após 60 minutos de ausência.'
                : 'É necessário ter sessão iniciada para aceder a esta funcionalidade do Giro.'}
            </p>
          </div>

          <div className="p-3 bg-bg-page rounded-xl text-left text-xs space-y-1">
            <p className="font-semibold text-fg-primary">Restaurar sessão de teste:</p>
            <p className="text-fg-secondary">
              Clique abaixo para retomar sessão imediatamente como <strong>{currentUser?.name || 'Sofia Costa'}</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              className="w-full"
              icon={LogIn}
              onClick={() => login(currentUser?.email, 'password')}
            >
              Iniciar Sessão Novamente
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              icon={RefreshCw}
              onClick={() => {
                login(allUsers.PRODUCT_OWNER.email, 'password')
                navigate('/')
              }}
            >
              Entrar como Sofia Costa (PO)
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Verificação de Papel / RBAC (403 Forbidden)
  const hasRequiredRole =
    allowedRoles.length === 0 || allowedRoles.includes(role)

  if (!hasRequiredRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-border-subtle p-8 shadow-sm text-center space-y-6">
          {/* Ícone de Acesso Negado */}
          <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] text-[#DC2626] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          {/* Mensagem Explicativa */}
          <div className="space-y-2">
            <div className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]">
              403 · Acesso Restrito
            </div>
            <h2 className="text-2xl font-bold text-fg-primary">
              Permissão Insuficiente
            </h2>
            <p className="text-sm text-fg-secondary">
              O seu perfil atual (<strong>{roleLabel}</strong>) não tem permissões para aceder a esta secção.
            </p>
          </div>

          {/* Detalhes de Requisitos */}
          <div className="p-4 bg-bg-page rounded-xl text-left text-xs space-y-2 border border-border-subtle/80">
            <div className="flex justify-between items-center">
              <span className="text-fg-secondary">Papel Atual:</span>
              <span className="font-semibold text-fg-primary">{roleLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-fg-secondary">Papéis Permitidos:</span>
              <span className="font-semibold text-brand-action">
                {allowedRoles.join(', ')}
              </span>
            </div>
          </div>

          {/* Ações: Voltar ao Início ou Alternar Papel */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="secondary"
              className="w-full sm:w-1/2"
              icon={ArrowLeft}
              onClick={() => navigate('/')}
            >
              Voltar ao Início
            </Button>
            <Button
              variant="primary"
              className="w-full sm:w-1/2"
              onClick={openRoleSwitcher}
            >
              Alternar Papel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Autorizado: Renders children or Router Outlet
  return children ? children : <Outlet />
}

export default ProtectedRoute
