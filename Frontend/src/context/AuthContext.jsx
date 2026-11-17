/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS, MOCK_USERS } from './authConstants.js'

export { ROLES, ROLE_LABELS, ROLE_PERMISSIONS, MOCK_USERS }

// 60 minutos de inatividade conforme RNF-SEG-01 (em milissegundos)
const DEFAULT_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000
const WARNING_THRESHOLD_MS = 5 * 60 * 1000 // aviso aos 55 minutos (restam 5 min)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Utilizador ativo: Default Sofia Costa (Product Owner)
  const [currentUser, setCurrentUser] = useState(MOCK_USERS.PRODUCT_OWNER)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Estados de gestão de sessão e inatividade (RNF-SEG-01)
  const [inactivityTimeoutMs, setInactivityTimeoutMs] = useState(DEFAULT_INACTIVITY_TIMEOUT_MS)
  const [lastActivity, setLastActivity] = useState(() => Date.now())
  const [isWarningActive, setIsWarningActive] = useState(false)
  const [isLoggedOutDueToInactivity, setIsLoggedOutDueToInactivity] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.floor(DEFAULT_INACTIVITY_TIMEOUT_MS / 1000))

  const throttleRef = useRef(0)

  // Reseta o temporizador de inatividade
  const resetInactivity = useCallback(() => {
    setLastActivity(Date.now())
    setIsWarningActive(false)
    setIsLoggedOutDueToInactivity(false)
  }, [])

  // Listener de eventos de atividade do utilizador (RNF-SEG-01)
  useEffect(() => {
    if (!isAuthenticated) return

    const handleUserActivity = () => {
      const now = Date.now()
      // Throttle a cada 3 segundos para poupar computação
      if (now - throttleRef.current > 3000) {
        throttleRef.current = now
        // Se ainda não estiver em modo de aviso explícito, reseta atividade
        if (!isWarningActive) {
          setLastActivity(now)
        }
      }
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }))

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity))
    }
  }, [isAuthenticated, isWarningActive])

  // Verificação periódica do temporizador de inatividade (a cada 1 segundo)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity
      const remainingMs = Math.max(0, inactivityTimeoutMs - elapsed)
      const remainingSec = Math.ceil(remainingMs / 1000)
      setRemainingSeconds(remainingSec)

      // Se restarem menos de WARNING_THRESHOLD_MS (ou 5% no caso de testes rápidos)
      const warningThreshold = Math.min(WARNING_THRESHOLD_MS, inactivityTimeoutMs * 0.2)
      if (remainingMs <= warningThreshold && remainingMs > 0) {
        setIsWarningActive(true)
      }

      // Sessão expirada
      if (remainingMs <= 0) {
        setIsAuthenticated(false)
        setIsWarningActive(false)
        setIsLoggedOutDueToInactivity(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity, inactivityTimeoutMs])

  // Alterna o papel (RBAC Switcher)
  const switchRole = useCallback((roleKey) => {
    const targetUser = MOCK_USERS[roleKey]
    if (targetUser) {
      setCurrentUser(targetUser)
      setIsAuthenticated(true)
      resetInactivity()
    }
  }, [resetInactivity])

  // Login
  const login = useCallback((email) => {
    // Procura utilizador por e-mail nos mock users ou mantém o atual
    const foundUser = Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === email?.toLowerCase())
    if (foundUser) {
      setCurrentUser(foundUser)
    }
    setIsAuthenticated(true)
    setIsLoggedOutDueToInactivity(false)
    resetInactivity()
  }, [resetInactivity])

  // Logout manual
  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setIsWarningActive(false)
    setIsLoggedOutDueToInactivity(false)
  }, [])

  // Função utilitária para testes/demo: simular inatividade acelerada
  const testSimulateInactivity = useCallback((seconds = 10) => {
    setInactivityTimeoutMs(seconds * 1000)
    resetInactivity()
  }, [resetInactivity])

  // Restaurar tempo normal de 60 minutos
  const resetNormalTimeout = useCallback(() => {
    setInactivityTimeoutMs(DEFAULT_INACTIVITY_TIMEOUT_MS)
    resetInactivity()
  }, [resetInactivity])

  const permissions = ROLE_PERMISSIONS[currentUser?.role] || ROLE_PERMISSIONS.CLIENT

  const value = {
    currentUser,
    isAuthenticated,
    role: currentUser?.role || ROLES.CLIENT,
    roleLabel: ROLE_LABELS[currentUser?.role] || currentUser?.role,
    permissions,
    isWarningActive,
    isLoggedOutDueToInactivity,
    remainingSeconds,
    inactivityTimeoutMs,
    login,
    logout,
    switchRole,
    resetInactivity,
    testSimulateInactivity,
    resetNormalTimeout,
    allRoles: ROLES,
    allUsers: MOCK_USERS,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>')
  }
  return context
}

export default AuthContext
