/**
 * Sistema de Design Tokens do GIRO extraído do Figma
 * Plataforma de Pedidos de Funcionalidades (264 variáveis)
 */

export const colors = {
  brand: {
    primary: '#E6533D',      // Principal / Ícone
    action: '#B93826',       // Botões principais
    hover: '#9A2C1E',        // Botões hover
    pressed: '#7B2118',      // Botões pressed
    selection: '#FFE3DC',    // Opções selecionadas / tint
  },
  bg: {
    page: '#F1F2F4',         // Fundo da aplicação
    surface: '#FFFFFF',      // Cartões e campos
    disabled: '#0000000A',
    disabledEmphasis: '#E4E5EA',
  },
  fg: {
    primary: '#292D35',      // Texto e ícones
    secondary: '#626976',    // Texto secundário
    onAccent: '#FFFFFF',     // Texto sobre botões
    disabled: '#999999CC',
    disabledMuted: '#9BA2AD',
    icon: '#20252B',
  },
  border: {
    subtle: '#CDD1D8',       // Contornos e divisórias
    control: '#707987',
    controlHover: '#465162',
    disabled: '#BCC2CB',
    focusRing: '#005FCC',    // Focus Ring acessível
  },
  feedback: {
    errorBorder: '#B42318',
    errorFg: '#B42318',
    errorBg: '#FFE3DC',
  },
  status: {
    pending: {
      label: 'Por analisar',
      bg: '#E4E5EA',
      text: '#292D35',
      border: '#CDD1D8',
    },
    analysis: {
      label: 'Em análise',
      bg: '#FEF3C7',
      text: '#7A4D00',
      border: '#F59E0B',
    },
    development: {
      label: 'Em desenvolvimento',
      bg: '#EDE9FE',
      text: '#5B21B6',
      border: '#8B5CF6',
    },
    complete: {
      label: 'Concluído',
      bg: '#DCFCE7',
      text: '#166534',
      border: '#22C55E',
    },
    rejected: {
      label: 'Rejeitado',
      bg: '#FEE2E2',
      text: '#DC2626',
      border: '#EF4444',
    },
    presence: {
      online: '#16A34A',
      busy: '#DC2626',
    },
  },
}

export const dimensions = {
  button: {
    height: '44px',
    radius: '8px',
    paddingX: '24px',
    paddingY: '10px',
    gap: '8px',
  },
  input: {
    height: '44px',
    radius: '8px',
    paddingX: '12px',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    screenTitle: { size: '28px', weight: '700', lineHeight: '36px' },
    sectionTitle: { size: '20px', weight: '600', lineHeight: '28px' },
    cardTitle: { size: '16px', weight: '600', lineHeight: '24px' },
    bodyRegular: { size: '16px', weight: '400', lineHeight: '24px' },
    menuButton: { size: '14px', weight: '500', lineHeight: '20px' },
    tableText: { size: '14px', weight: '400', lineHeight: '20px' },
    caption: { size: '12px', weight: '400', lineHeight: '16px' },
  },
}
