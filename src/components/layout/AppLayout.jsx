import { Outlet } from 'react-router-dom'
import { GlobalHeader } from './GlobalHeader.jsx'
import { SidebarNav } from './SidebarNav.jsx'
import { NewFeatureModal } from '../modals/NewFeatureModal.jsx'
import { CreateStoryModal } from '../modals/CreateStoryModal.jsx'
import { RoleSwitcherModal } from '../modals/RoleSwitcherModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../common/Button.jsx'
import { Clock } from 'lucide-react'

/**
 * AppLayout Component
 * Main application shell assembling:
 * - GlobalHeader (76px height)
 * - SidebarNav (224px width)
 * - Scrollable Main viewport
 * - Global Modals (NewFeatureModal, CreateStoryModal, RoleSwitcherModal)
 * - Inactivity Warning Modal (RNF-SEG-01)
 */
export function AppLayout({ children }) {
  const { isWarningActive, remainingSeconds, resetInactivity, logout } = useAuth()

  return (
    <div className="h-screen w-screen bg-bg-page flex flex-col overflow-hidden font-sans text-fg-primary antialiased">
      {/* 1. Cabeçalho Global (76px) */}
      <GlobalHeader />

      {/* 2. Área Central: Barra Lateral (224px) + Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <SidebarNav />

        {/* Zona de Conteúdo Scrollável */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-bg-page focus:outline-none"
        >
          <div className="flex-1 flex flex-col p-6 md:p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* 3. Janelas Modais Globais */}
      <NewFeatureModal />
      <CreateStoryModal />
      <RoleSwitcherModal />

      {/* 4. Alerta de Inatividade Iminente (RNF-SEG-01) */}
      {isWarningActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="alertdialog"
          aria-labelledby="inactivity-warning-title"
          aria-describedby="inactivity-warning-desc"
        >
          <div className="max-w-md w-full bg-white rounded-2xl border border-border-subtle p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#7A4D00] flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F59E0B]" aria-hidden="true" />
              </div>
              <div>
                <h3 id="inactivity-warning-title" className="text-base font-bold text-fg-primary">
                  Aviso de Inatividade (RNF-SEG-01)
                </h3>
                <p className="text-xs text-fg-secondary">
                  A sua sessão está prestes a expirar.
                </p>
              </div>
            </div>

            <p id="inactivity-warning-desc" className="text-sm text-fg-secondary">
              Por razões de segurança, a sua sessão será encerrada automaticamente dentro de{' '}
              <strong className="text-brand-action font-mono text-base">
                {remainingSeconds}s
              </strong>
              . Clique em prosseguir para continuar a trabalhar.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={logout}
              >
                Terminar Sessão
              </Button>
              <Button
                variant="primary"
                onClick={resetInactivity}
                autoFocus
              >
                Continuar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppLayout
