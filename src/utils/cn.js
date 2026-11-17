import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes CSS com segurança, resolvendo conflitos do Tailwind.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
