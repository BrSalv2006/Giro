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

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  PRODUCT_OWNER: 'Product Owner',
  SCRUM_MASTER: 'Scrum Master',
  DEVELOPER: 'Desenvolvedor',
  CLIENT: 'Cliente',
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
