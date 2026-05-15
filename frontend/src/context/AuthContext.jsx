import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/complaintService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  // Validate token on mount — clears stale/expired tokens automatically
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authService.getMe().catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
    }
  }, [])

  const login = async (credentials) => {
    setLoading(true)
    try {
      const res = await authService.login(credentials)
      const { token, ...userData } = res.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const register = async (data) => {
    setLoading(true)
    try {
      const res = await authService.register(data)
      return res.data
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const googleLogin = async (token) => {
    setLoading(true)
    try {
      const res = await authService.googleLogin(token)
      const { token: jwt, ...userData } = res.data.data
      localStorage.setItem('token', jwt)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isLoggedIn = !!user

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, isAdmin, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
