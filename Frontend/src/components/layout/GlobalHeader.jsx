import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../common/BrandLogo.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { Bell, Search, ChevronDown, User, ShieldCheck, Settings, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { cn } from '../../utils/cn.js'

/**
 * GlobalHeader Component
 * Height 76px, matching Figma frame 325:1099.
 * Integrates breadcrumbs, global search trigger, notifications counter,
 * active RBAC role pill, user profile info and dropdown menu.
 */
export function GlobalHeader() {
  const navigate = useNavigate()
  const { currentUser, roleLabel, logout } = useAuth()
  const { unreadNotificationsCount } = useData()
  const {
    isProfileMenuOpen,
    toggleProfileMenu,
    closeProfileMenu,
    openRoleSwitcher,
  } = useModal()

  const dropdownRef = useRef(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeProfileMenu()
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen, closeProfileMenu])

  return (
    <header
      className="h-[76px] w-full bg-white border-b border-border-subtle px-6 flex items-center justify-between select-none sticky top-0 z-30 shadow-xs"
      role="banner"
    >
      {/* 1. Zona Esquerda: BrandLogo + Breadcrumb */}
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing rounded-lg p-1 -m-1 transition-transform active:scale-98"
          title="Ir para o Início"
        >
          <BrandLogo layout="full" size="md" subtitle="Priorização & Backlog" />
        </Link>

        {/* Separador vertical */}
        <div className="hidden md:block h-6 w-px bg-border-subtle" aria-hidden="true" />

        {/* Breadcrumb central / de equipa */}
        <nav aria-label="Navegação estrutural" className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-fg-secondary">Plataforma de Produto</span>
          <span className="text-border-control">/</span>
          <span className="font-semibold text-fg-primary">Giro Dev Team</span>
        </nav>
      </div>

      {/* 2. Zona Direita: Pesquisa, Notificações, RBAC Pill, Utilizador */}
      <div className="flex items-center gap-4">
        {/* Barra / Botão de Pesquisa */}
        <button
          type="button"
          onClick={() => navigate('/pesquisa')}
          className="flex items-center gap-2.5 h-10 px-3.5 bg-bg-page hover:bg-[#E4E5EA] text-fg-secondary hover:text-fg-primary rounded-lg border border-border-subtle transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
          aria-label="Abrir pesquisa global"
        >
          <Search className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
          <span className="hidden sm:inline">Pesquisar pedidos, histórias...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-fg-secondary bg-white border border-border-subtle rounded">
            ⌘K
          </kbd>
        </button>

        {/* Notificações Bell com Badge */}
        <Link
          to="/notificacoes"
          className="relative p-2.5 rounded-lg text-fg-primary hover:bg-bg-page active:bg-bg-disabled transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
          aria-label={`Notificações (${unreadNotificationsCount} por ler)`}
          title="Notificações"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          {unreadNotificationsCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-brand-action text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse"
              aria-label={`${unreadNotificationsCount} notificações por ler`}
            >
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </Link>

        {/* Role Badge Pill (Abre Seletor RBAC ao clicar) */}
        <button
          type="button"
          onClick={openRoleSwitcher}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFE3DC] hover:bg-[#FCD2C9] text-brand-action border border-[#F8C1B7] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing active:scale-95"
          title="Clique para alternar papel e testar permissões (RBAC)"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
          <span>{roleLabel}</span>
        </button>

        {/* Separador vertical */}
        <div className="h-6 w-px bg-border-subtle hidden sm:block" aria-hidden="true" />

        {/* Profile Trigger & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleProfileMenu}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            className={cn(
              'flex items-center gap-3 p-1.5 rounded-xl hover:bg-bg-page transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing',
              isProfileMenuOpen && 'bg-bg-page ring-1 ring-border-subtle'
            )}
          >
            <Avatar
              name={currentUser?.name || 'Sofia Costa'}
              size={36}
              status="online"
            />
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-sm font-semibold text-fg-primary truncate max-w-[130px]">
                {currentUser?.name || 'Sofia Costa'}
              </span>
              <span className="text-xs text-fg-secondary">
                {roleLabel}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-fg-secondary transition-transform duration-200',
                isProfileMenuOpen && 'rotate-180 text-fg-primary'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Menu Dropdown de Perfil */}
          {isProfileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-border-subtle py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
              aria-orientation="vertical"
            >
              {/* Header do Menu */}
              <div className="px-4 py-2.5 border-b border-border-subtle mb-1">
                <p className="text-sm font-bold text-fg-primary truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-fg-secondary truncate">
                  {currentUser?.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFE3DC] text-brand-action">
                  <span>Papel: {roleLabel}</span>
                </div>
              </div>

              {/* Itens do Menu */}
              <Link
                to="/perfil"
                onClick={closeProfileMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-bg-page transition-colors"
                role="menuitem"
              >
                <User className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
                <span>Perfil</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  closeProfileMenu()
                  openRoleSwitcher()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-[#FFE3DC] hover:text-brand-action transition-colors text-left cursor-pointer"
                role="menuitem"
              >
                <ShieldCheck className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <span className="font-medium">Alternar Papel (RBAC Test)</span>
              </button>

              <Link
                to="/definicoes"
                onClick={closeProfileMenu}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-bg-page transition-colors"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
                <span>Definições da Equipa</span>
              </Link>

              <div className="h-px bg-border-subtle my-1" aria-hidden="true" />

              <button
                type="button"
                onClick={() => {
                  closeProfileMenu()
                  logout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEE2E2] transition-colors text-left cursor-pointer"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                <span>Terminar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default GlobalHeader
