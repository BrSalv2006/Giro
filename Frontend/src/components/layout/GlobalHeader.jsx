import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../common/BrandLogo.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { Toggle } from '../common/Toggle.jsx'
import { Bell, Search, ChevronDown, User, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { cn } from '../../utils/cn.js'

/**
 * GlobalHeader Component
 * Integrates brand logo, workspace breadcrumb, global search trigger,
 * notifications counter, user profile info and dropdown menu with Dark Mode toggle.
 */
export function GlobalHeader() {
	const navigate = useNavigate()
	const { currentUser, roleLabel, logout } = useAuth()
	const { unreadNotificationsCount, workspaceConfig } = useData()
	const {
		isProfileMenuOpen,
		toggleProfileMenu,
		closeProfileMenu,
	} = useModal()
	const { isDark, toggleTheme } = useTheme()

	const dropdownRef = useRef(null)
	const projectName = workspaceConfig?.projectName || 'Plataforma de Produto'
	const teamName = workspaceConfig?.teamName || 'Equipa Principal'

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
			className="h-[76px] w-full shrink-0 bg-bg-surface border-b border-border-subtle px-6 flex items-center justify-between gap-4 select-none sticky top-0 z-30 shadow-xs"
			role="banner"
		>
			{/* 1. Zona Esquerda: BrandLogo + Breadcrumb */}
			<div className="flex items-center gap-6 shrink-0">
				<Link
					to="/"
					className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing rounded-lg p-1 -m-1 transition-transform active:scale-98"
					title="Ir para o Início"
				>
					<BrandLogo layout="full" size="md" />
				</Link>

				{/* Separador vertical */}
				<div className="hidden md:block h-6 w-px shrink-0 bg-border-subtle" aria-hidden="true" />

				{/* Breadcrumb central / de equipa */}
				<nav aria-label="Navegação estrutural" className="hidden md:flex items-center gap-2 text-sm shrink-0">
					<span className="text-fg-secondary">{projectName}</span>
					<span className="text-border-control">/</span>
					<span className="font-semibold text-fg-primary">{teamName}</span>
				</nav>
			</div>

			{/* 2. Zona Direita: Pesquisa, Notificações, Utilizador */}
			<div className="flex items-center gap-4 shrink-0">
				<button
					type="button"
					onClick={() => navigate('/pesquisa')}
					className="flex items-center gap-2.5 h-10 px-3.5 bg-bg-page hover:bg-bg-disabled-emphasis text-fg-secondary hover:text-fg-primary rounded-lg border border-border-subtle transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
					aria-label="Abrir pesquisa global"
				>
					<Search className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
					<span className="hidden sm:inline">Pesquisar pedidos, histórias...</span>
					<kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-fg-secondary bg-bg-surface border border-border-subtle rounded">
						⌘K
					</kbd>
				</button>

				<Link
					to="/notificacoes"
					className="relative p-2.5 rounded-lg text-fg-primary hover:bg-bg-page active:bg-bg-disabled transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing"
					aria-label={`Notificações (${unreadNotificationsCount} por ler)`}
					title="Notificações"
				>
					<Bell className="w-5 h-5" aria-hidden="true" />
					{unreadNotificationsCount > 0 && (
						<span
							className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-brand-action text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-bg-surface animate-pulse"
							aria-label={`${unreadNotificationsCount} notificações por ler`}
						>
							{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
						</span>
					)}
				</Link>

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
							name={currentUser?.name || 'Utilizador'}
							size={36}
							status="online"
						/>
						<div className="hidden md:flex flex-col text-left leading-tight">
							<span className="text-sm font-semibold text-fg-primary truncate max-w-[130px]">
								{currentUser?.name || 'Utilizador'}
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
							className="absolute right-0 mt-2 w-64 bg-bg-surface rounded-xl shadow-lg border border-border-subtle py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
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
								<div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-selection text-brand-action">
									<span>{roleLabel}</span>
								</div>
							</div>

							{/* Itens do Menu */}
							<Link
								to="/definicoes"
								onClick={closeProfileMenu}
								className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-bg-page transition-colors"
								role="menuitem"
							>
								<User className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
								<span>Perfil</span>
							</Link>

							<Link
								to="/definicoes"
								onClick={closeProfileMenu}
								className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-bg-page transition-colors"
								role="menuitem"
							>
								<Settings className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
								<span>Definições da Equipa</span>
							</Link>

							{/* Toggle de Modo Escuro */}
							<div
								role="menuitemcheckbox"
								aria-checked={isDark}
								onClick={toggleTheme}
								className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-fg-primary hover:bg-bg-page transition-colors cursor-pointer"
							>
								<div className="flex items-center gap-3">
									{isDark ? (
										<Sun className="w-4 h-4 text-brand-primary" aria-hidden="true" />
									) : (
										<Moon className="w-4 h-4 text-fg-secondary" aria-hidden="true" />
									)}
									<span>Modo escuro</span>
								</div>
								<div onClick={(e) => e.stopPropagation()}>
									<Toggle
										size="sm"
										checked={isDark}
										onChange={toggleTheme}
										aria-label="Alternar modo escuro"
									/>
								</div>
							</div>

							<div className="h-px bg-border-subtle my-1" aria-hidden="true" />

							<button
								type="button"
								onClick={() => {
									closeProfileMenu()
									logout()
								}}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#DC2626] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#451B1B] transition-colors text-left cursor-pointer"
								role="menuitem"
							>
								<LogOut className="w-4 h-4 text-[#DC2626] dark:text-[#FCA5A5]" aria-hidden="true" />
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
