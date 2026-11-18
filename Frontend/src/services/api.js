const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem('giro_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('giro_token', token)
  else localStorage.removeItem('giro_token')
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error || 'Erro ao comunicar com o servidor')
    error.status = response.status
    error.details = body?.details
    throw error
  }
  return body
}
