import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export interface AuthUser {
  id: number
  username: string
  displayName: string
  theme: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, password: string, displayName?: string) => Promise<string | null>
  logout: () => void
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  saveTheme: (theme: 'dark' | 'light') => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stockflow_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Validate token on mount
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUser(data)
            // Apply server-side theme on mount
            if (data.theme) {
              localStorage.setItem('stockflow_theme', data.theme)
              document.documentElement.setAttribute('data-theme', data.theme)
            }
          } else { setToken(null); localStorage.removeItem('stockflow_token') }
        })
        .catch(() => { setToken(null); localStorage.removeItem('stockflow_token') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    const headers = {
      ...(options?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    return fetch(url, { ...options, headers })
  }, [token])

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Login failed'
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('stockflow_token', data.token)
      return null
    } catch { return 'Could not connect to server' }
  }, [])

  const register = useCallback(async (username: string, password: string, displayName?: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName })
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Registration failed'
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('stockflow_token', data.token)
      return null
    } catch { return 'Could not connect to server' }
  }, [])

  const saveTheme = useCallback(async (theme: 'dark' | 'light') => {
    if (!token) return
    try {
      await fetch(`${API}/auth/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme })
      })
    } catch {}
  }, [token])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('stockflow_token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, saveTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
