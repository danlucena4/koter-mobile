import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth.service'

interface User {
  id: string
  name: string
  email: string
  document?: string
}

interface AuthContextData {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (login: string, password: string, type: 'email' | 'document') => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verifica se o usuário está autenticado ao iniciar o app
  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      setIsLoading(true)
      const userData = await authService.getAuthenticatedUser()
      setUser(userData)
    } catch (error) {
      console.log('Usuário não autenticado')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(login: string, password: string, type: 'email' | 'document') {
    await authService.login(login, password, type)
    await loadUser()
  }

  async function logout() {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setUser(null)
    }
  }

  async function refreshUser() {
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }

  return context
}
