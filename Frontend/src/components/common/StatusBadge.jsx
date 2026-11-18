import { cn } from '../../utils/cn.js'

/**
 * Mapeamento completo dos 5 estados de funcionalidade do GIRO
 * com cores exatas dos design tokens do Figma.
 */
const STATUS_CONFIG = {
  pending: {
    label: 'Por analisar',
    badgeClass: 'bg-[#E4E5EA] text-[#292D35]',
    dotClass: 'bg-[#707987]',
  },
  analysis: {
    label: 'Em análise',
    badgeClass: 'bg-[#FEF3C7] text-[#7A4D00]',
    dotClass: 'bg-[#F59E0B]',
  },
  approved: {
    label: 'Aprovado',
    badgeClass: 'bg-[#E0F2FE] text-[#0369A1]',
    dotClass: 'bg-[#0284C7]',
  },
  planned: {
    label: 'Planeado',
    badgeClass: 'bg-[#EDE9FE] text-[#5B21B6]',
    dotClass: 'bg-[#7C3AED]',
  },
  development: {
    label: 'Em desenvolvimento',
    badgeClass: 'bg-[#EDE9FE] text-[#5B21B6]',
    dotClass: 'bg-[#8B5CF6]',
  },
  complete: {
    label: 'Concluído',
    badgeClass: 'bg-[#DCFCE7] text-[#166534]',
    dotClass: 'bg-[#22C55E]',
  },
  rejected: {
    label: 'Rejeitado',
    badgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
    dotClass: 'bg-[#EF4444]',
  },
}

/**
 * Normaliza variações de nomes e maiúsculas/minúsculas para a chave oficial.
 */
const STATUS_ALIASES = {
  pending: 'pending',
  submetido: 'pending',
  backlog: 'pending',
  todo: 'pending',
  'por-analisar': 'pending',
  'por_analisar': 'pending',
  analysis: 'analysis',
  'em-analise': 'analysis',
  'em_analise': 'analysis',
  em_revisao: 'analysis',
  review: 'analysis',
  approved: 'approved',
  aprovado: 'approved',
  planned: 'planned',
  planeado: 'planned',
  development: 'development',
  in_progress: 'development',
  em_progresso: 'development',
  'em-desenvolvimento': 'development',
  'em_desenvolvimento': 'development',
  complete: 'complete',
  completed: 'complete',
  done: 'complete',
  concluido: 'complete',
  'concluído': 'complete',
  rejected: 'rejected',
  rejeitado: 'rejected',
  blocked: 'rejected',
  bloqueado: 'rejected',
}

/**
 * Badge de Estado de Funcionalidade para o GIRO.
 *
 * @param {'pending' | 'analysis' | 'development' | 'complete' | 'rejected'} status - Estado do pedido
 * @param {'pill' | 'subtle'} [style='pill'] - Formato do badge ('pill' = rounded-full, 'subtle' = rounded-md)
 * @param {boolean} [showDot=false] - Exibe um ponto indicador colorido ao lado do texto
 * @param {React.ReactNode} [children] - Sobrescreve o texto padrão do estado
 * @param {string} [className] - Classes Tailwind adicionais
 */
export function StatusBadge({
  status = 'pending',
  style = 'pill',
  showDot = false,
  children,
  className,
  ...props
}) {
  const normalizedKey =
    typeof status === 'string'
      ? STATUS_ALIASES[status.toLowerCase().trim()] || 'pending'
      : 'pending'

  const currentConfig = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.pending

  const radiusClass = style === 'subtle' ? 'rounded-md' : 'rounded-full'

  return (
    <span
      className={cn(
        // Base: dimensões compactas, tipografia consistente
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold select-none leading-tight whitespace-nowrap',
        // Formato (Pill ou Subtle)
        radiusClass,
        // Cores do estado correspondente
        currentConfig.badgeClass,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentConfig.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{children || currentConfig.label}</span>
    </span>
  )
}

export default StatusBadge
