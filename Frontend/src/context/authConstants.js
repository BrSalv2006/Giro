/**
 * Constantes e perfis pré-definidos para teste rápido de papéis RBAC na plataforma GIRO
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  PRODUCT_OWNER: 'PRODUCT_OWNER',
  SCRUM_MASTER: 'SCRUM_MASTER',
  DEVELOPER: 'DEVELOPER',
  CLIENT: 'CLIENT',
}

export const ROLE_CODES = {
  PRODUCT_OWNER: 'P01',
  SCRUM_MASTER: 'P02',
  DEVELOPER: 'P03',
  CLIENT: 'P04',
  ADMIN: 'P05',
}

export const ROLE_BY_CODE = {
  P01: ROLES.PRODUCT_OWNER,
  P02: ROLES.SCRUM_MASTER,
  P03: ROLES.DEVELOPER,
  P04: ROLES.CLIENT,
  P05: ROLES.ADMIN,
}

export const ROLE_LABELS = {
  ADMIN: 'Administrador do Sistema',
  PRODUCT_OWNER: 'Product Owner',
  SCRUM_MASTER: 'Scrum Master',
  DEVELOPER: 'Programador',
  CLIENT: 'Cliente Final',
  P01: 'Product Owner',
  P02: 'Scrum Master',
  P03: 'Programador',
  P04: 'Cliente Final',
  P05: 'Administrador do Sistema',
}

export function normalizeRoleKey(roleOrCode) {
  if (!roleOrCode) return ROLES.CLIENT
  return ROLE_BY_CODE[roleOrCode] || (ROLES[roleOrCode] ? roleOrCode : ROLES.CLIENT)
}

export function getRoleCode(roleOrCode) {
  if (!roleOrCode) return ROLE_CODES.CLIENT
  if (ROLE_BY_CODE[roleOrCode]) return roleOrCode
  return ROLE_CODES[roleOrCode] || ROLE_CODES.CLIENT
}

export function getRoleLabel(roleOrCode) {
  if (!roleOrCode) return ROLE_LABELS.CLIENT
  return ROLE_LABELS[roleOrCode] || ROLE_LABELS[normalizeRoleKey(roleOrCode)] || String(roleOrCode)
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canManageUsers: true,
    canCreatePedidos: true,
    canVote: true,
    canManageBacklog: true,
    canManageSprint: true,
    canEditSettings: true,
    canViewTraceability: true,
  },
  PRODUCT_OWNER: {
    canManageUsers: false,
    canCreatePedidos: true,
    canVote: true,
    canManageBacklog: true,
    canManageSprint: true,
    canEditSettings: true,
    canViewTraceability: true,
  },
  SCRUM_MASTER: {
    canManageUsers: false,
    canCreatePedidos: true,
    canVote: true,
    canManageBacklog: true,
    canManageSprint: true,
    canEditSettings: false,
    canViewTraceability: true,
  },
  DEVELOPER: {
    canManageUsers: false,
    canCreatePedidos: true,
    canVote: true,
    canManageBacklog: false,
    canManageSprint: true,
    canEditSettings: false,
    canViewTraceability: true,
  },
  CLIENT: {
    canManageUsers: false,
    canCreatePedidos: true,
    canVote: true,
    canManageBacklog: false,
    canManageSprint: false,
    canEditSettings: false,
    canViewTraceability: false,
  },
}

export const MOCK_USERS = {
  PRODUCT_OWNER: {
    id: 'usr-po-01',
    name: 'Sofia Costa',
    email: 'sofia.costa@giro.com',
    initials: 'SC',
    role: ROLES.PRODUCT_OWNER,
    team: 'Giro Dev Team',
    avatar: null,
  },
  ADMIN: {
    id: 'usr-adm-01',
    name: 'Diogo Ferreira',
    email: 'diogo.ferreira@giro.com',
    initials: 'DF',
    role: ROLES.ADMIN,
    team: 'Giro Admin Team',
    avatar: null,
  },
  SCRUM_MASTER: {
    id: 'usr-sm-01',
    name: 'Inês Martins',
    email: 'ines.martins@giro.com',
    initials: 'IM',
    role: ROLES.SCRUM_MASTER,
    team: 'Giro Dev Team',
    avatar: null,
  },
  DEVELOPER: {
    id: 'usr-dev-01',
    name: 'Rafael Silva',
    email: 'rafael.silva@giro.com',
    initials: 'RS',
    role: ROLES.DEVELOPER,
    team: 'Giro Dev Team',
    avatar: null,
  },
  CLIENT: {
    id: 'usr-cli-01',
    name: 'Miguel Alves',
    email: 'miguel.alves@cliente.com',
    initials: 'MA',
    role: ROLES.CLIENT,
    team: 'Cliente Externo / Stakeholder',
    avatar: null,
  },
}
