/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  ROLES,
  ROLE_CODES,
  ROLE_BY_CODE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  getRoleCode,
  getRoleLabel,
  normalizeRoleKey,
} from './authConstants.js'
import { apiRequest, getToken, setToken } from '../services/api.js'

export {
  ROLES,
  ROLE_CODES,
  ROLE_BY_CODE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  getRoleCode,
  getRoleLabel,
  normalizeRoleKey,
}

// 60 minutos de inatividade conforme RNF-SEG-01 (em milissegundos)
const DEFAULT_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000
const WARNING_THRESHOLD_MS = 5 * 60 * 1000 // aviso aos 55 minutos (restam 5 min)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const storedToken = getToken()
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('giro_user') || 'null') } catch { return null }
  })()
  const [currentUser, setCurrentUser] = useState(storedUser)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedToken && storedUser))

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

const mapApiUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.nome,
  email: apiUser.email,
  initials: String(apiUser.nome || 'US')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
  role: ROLE_BY_CODE[apiUser.papel] || ROLES.CLIENT,
  roleCode: apiUser.papel || ROLE_CODES.CLIENT,
})

  // Login
  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const user = mapApiUser(result.user)
    setToken(result.token)
    localStorage.setItem('giro_user', JSON.stringify(user))
    setCurrentUser(user)
    setIsAuthenticated(true)
    setIsLoggedOutDueToInactivity(false)
    resetInactivity()
    return user
  }, [resetInactivity])

  const register = useCallback(async ({ name, email, password, role = ROLE_CODES.CLIENT }) => {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome: name, email, password, papel: role }),
    })
    setToken(result.token)
    const user = mapApiUser(result.user)
    localStorage.setItem('giro_user', JSON.stringify(user))
    setCurrentUser(user)
    setIsAuthenticated(true)
    resetInactivity()
    return user
  }, [resetInactivity])

  // Logout manual
  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('giro_user')
    setCurrentUser(null)
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

  const role = currentUser?.role || ROLES.CLIENT
  const value = {
    currentUser,
    isAuthenticated,
    role,
    roleCode: currentUser?.roleCode || ROLE_CODES[role] || ROLE_CODES.CLIENT,
    roleLabel: getRoleLabel(role),
    permissions,
    isWarningActive,
    isLoggedOutDueToInactivity,
    remainingSeconds,
    inactivityTimeoutMs,
    login,
    register,
    logout,
    resetInactivity,
    testSimulateInactivity,
    resetNormalTimeout,
    allRoles: ROLES,
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
