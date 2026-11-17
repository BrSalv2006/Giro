import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  FileText,
  Sparkles,
  Layers,
  CheckSquare,
  Calendar,
  Users,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import { Avatar } from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { cn } from '../../utils/cn.js'

/**
 * Estrutura de Navegação do GIRO com títulos exatos do Figma frame 325:1118
 */
const NAV_SECTIONS = [
  {
    title: 'INÍCIO',
    items: [
      { label: 'Visão Geral', to: '/', icon: Home, end: true },
    ],
  },
  {
    title: 'PEDIDOS',
    items: [
      { label: 'Pedidos', to: '/pedidos', icon: FileText },
      { label: 'Priorização', to: '/priorizacao', icon: Sparkles },
    ],
  },
  {
    title: 'PLANEAMENTO',
    items: [
      { label: 'Product Backlog', to: '/backlog', icon: Layers },
      { label: 'Sprint', to: '/sprint', icon: CheckSquare },
      { label: 'Roadmap', to: '/roadmap', icon: Calendar },
    ],
  },
  {
    title: 'GESTÃO',
    items: [
      { label: 'Team Workspace', to: '/team', icon: Users },
      { label: 'Matriz de Rastreabilidade', to: '/rastreabilidade', icon: ShieldCheck },
    ],
  },
]

/**
 * SidebarNav Component
 * Width 224px, matching Figma frame 325:1118.
 * Provides hierarchical navigation, active link highlights with Giro Brand selection tokens,
 * and a team summary footer.
 */
export function SidebarNav({ className }) {
  const { permissions } = useAuth()

  return (
    <aside
      className={cn(
        'w-[224px] shrink-0 bg-white border-r border-border-subtle flex flex-col justify-between select-none h-full',
        className
      )}
      aria-label="Navegação Principal"
    >
      {/* 1. Lista de Secções e Ligações de Navegação */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Título de Secção */}
            <p className="px-3 text-[11px] font-bold tracking-wider text-fg-secondary uppercase">
              {section.title}
            </p>

            {/* Links da Secção */}
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const IconComponent = item.icon
                // Verificação de permissões do perfil atual (ex: Cliente não tem acesso à rastreabilidade)
                const isRestrictedForClient = item.to === '/rastreabilidade' && !permissions.canViewTraceability

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                        isActive
                          ? 'bg-[#FFE3DC] text-brand-action font-semibold shadow-xs'
                          : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-page active:bg-[#E4E5EA]',
                        isRestrictedForClient && 'opacity-60'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Indicador de barra ativa à esquerda */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-primary rounded-r-full"
                            aria-hidden="true"
                          />
                        )}

                        <IconComponent
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-brand-primary'
                              : 'text-fg-secondary group-hover:text-fg-primary'
                          )}
                          aria-hidden="true"
                        />

                        <span className="truncate">{item.label}</span>

                        {isRestrictedForClient && (
                          <span
                            className="ml-auto text-[9px] px-1 py-0.5 rounded bg-bg-page text-fg-secondary font-mono"
                            title="Acesso restrito para Clientes"
                          >
                            RBAC
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Team Summary Footer (Figma Frame 325:1118) */}
      <div className="p-3 border-t border-border-subtle bg-bg-surface">
        <div className="p-2.5 rounded-xl bg-bg-page border border-border-subtle/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name="Giro Dev"
              size={32}
              shape="square"
              className="bg-[#FFE3DC] text-brand-action border-[#F8C1B7]"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-fg-primary truncate">
                Giro Dev Team
              </span>
              <span className="text-[11px] text-fg-secondary truncate">
                4 membros · Sprint 12
              </span>
            </div>
          </div>

          <Link
            to="/definicoes"
            className="p-1.5 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing shrink-0"
            title="Definições da equipa"
            aria-label="Definições da equipa"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default SidebarNav
