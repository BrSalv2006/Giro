import { useEffect } from 'react'
import { X, ShieldCheck, Check, Clock } from 'lucide-react'
import { Button } from '../common/Button.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { useAuth, ROLES, ROLE_LABELS } from '../../context/AuthContext.jsx'
import { useModal } from '../../context/ModalContext.jsx'
import { cn } from '../../utils/cn.js'

const ROLE_DESCRIPTIONS = {
  PRODUCT_OWNER: {
    title: 'Product Owner (Sofia Costa)',
    desc: 'Gestão completa do Backlog, priorização de pedidos, estimativa e planeamento de Sprints.',
    badge: 'P01 · Produto',
  },
  SCRUM_MASTER: {
    title: 'Scrum Master (Inês Martins)',
    desc: 'Facilitação de cerimónias ágeis, remoção de impedimentos e métricas de sprint.',
    badge: 'P02 · Scrum',
  },
  DEVELOPER: {
    title: 'Programador (Rafael Silva)',
    desc: 'Execução de tarefas no Sprint, movimentação no Kanban, registo de esforço e bloqueios.',
    badge: 'P03 · Equipa',
  },
  CLIENT: {
    title: 'Cliente Final / Stakeholder (Miguel Alves)',
    desc: 'Submissão de pedidos e votação (RNF-SEG-03). Acesso restrito a configurações e métricas internas.',
    badge: 'P04 · Externo',
  },
  ADMIN: {
    title: 'Administrador do Sistema (Diogo Ferreira)',
    desc: 'Controlo total de permissões, contas RBAC, configurações globais e auditoria do sistema.',
    badge: 'P05 · Acesso Total',
  },
}

/**
 * RoleSwitcherModal Component
 * Facilitates testing of RBAC roles and Inactivity Timer (RNF-SEG-01).
 */
export function RoleSwitcherModal() {
  const { isRoleSwitcherOpen, closeRoleSwitcher } = useModal()
  const {
    role: currentRole,
    switchRole,
    testSimulateInactivity,
    resetNormalTimeout,
    inactivityTimeoutMs,
  } = useAuth()

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isRoleSwitcherOpen) {
        closeRoleSwitcher()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRoleSwitcherOpen, closeRoleSwitcher])

  if (!isRoleSwitcherOpen) return null

  const handleSelectRole = (roleKey) => {
    switchRole(roleKey)
    closeRoleSwitcher()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-rbac-title"
    >
      <div
        className="w-full max-w-[620px] bg-white rounded-2xl border border-border-subtle shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-bg-surface select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE3DC] text-brand-action flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-rbac-title" className="text-lg font-bold text-fg-primary leading-tight">
                Alternador de Papéis (Teste RBAC)
              </h2>
              <p className="text-xs text-fg-secondary">
                Selecione um perfil para simular diferentes permissões no sistema GIRO.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeRoleSwitcher}
            className="p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-page transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Lista de Papéis */}
        <div className="p-6 overflow-y-auto space-y-3">
          {Object.entries(ROLES).map(([key, roleValue]) => {
            const isSelected = currentRole === roleValue
            const info = ROLE_DESCRIPTIONS[key] || {}

            return (
              <button
                key={roleValue}
                type="button"
                onClick={() => handleSelectRole(key)}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 cursor-pointer',
                  isSelected
                    ? 'border-brand-primary bg-[#FFE3DC]/40 shadow-xs ring-1 ring-brand-primary'
                    : 'border-border-subtle hover:border-border-control bg-white hover:bg-bg-page'
                )}
              >
                <div className="pt-0.5">
                  <Avatar name={info.title || roleValue} size={36} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-fg-primary truncate">
                      {info.title || ROLE_LABELS[roleValue]}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                        isSelected
                          ? 'bg-brand-action text-white'
                          : 'bg-[#E4E5EA] text-[#292D35]'
                      )}
                    >
                      {info.badge || roleValue}
                    </span>
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {info.desc}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Secção de Teste de Inatividade RNF-SEG-01 */}
        <div className="px-6 py-4 bg-bg-page border-t border-border-subtle space-y-3 select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-fg-primary">
                Simulador de Inatividade (RNF-SEG-01)
              </span>
            </div>
            <span className="text-[11px] text-fg-secondary font-mono">
              Atual: {Math.round(inactivityTimeoutMs / 60000)} min
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              className="text-xs h-9 px-3"
              onClick={() => testSimulateInactivity(10)}
            >
              Simular Timeout (10 seg)
            </Button>
            <Button
              variant="secondary"
              className="text-xs h-9 px-3"
              onClick={() => testSimulateInactivity(30)}
            >
              Simular Aviso (30 seg)
            </Button>
            <Button
              variant="tertiary"
              className="text-xs h-9 px-3 text-fg-secondary ml-auto"
              onClick={resetNormalTimeout}
            >
              Restaurar 60 min
            </Button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 border-t border-border-subtle bg-white flex justify-end">
          <Button variant="secondary" onClick={closeRoleSwitcher}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RoleSwitcherModal
