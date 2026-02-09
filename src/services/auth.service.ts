import api from '../lib/api'
import { AxiosError } from 'axios'
import { onboardingService } from './onboarding.service'
import { tokenService } from './token.service'
import type { User } from '../@types/user'

interface AuthResponse {
  user?: User
  message?: string
}


const mapUserData = (userData: any): User => {
  const profileImage = userData.avatar || userData.logo || userData.company?.avatar

  return {
    ...userData,
    name: userData.fullName || userData.firstAndSecondName || userData.name,
    avatar: profileImage,
    document: userData.cpf,
  }
}

const buildFileFormData = (field: 'avatar' | 'logo', uri: string) => {
  const fileName = uri.split('/').pop() || `${field}.jpg`
  const extension = fileName.split('.').pop()?.toLowerCase()
  const mimeType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg'

  const formData = new FormData()
  
  // React Native FormData precisa de um objeto com propriedades específicas
  formData.append(field, {
    uri: uri,
    name: fileName,
    type: mimeType,
  } as any)

  console.log('📦 FormData criado:', {
    field,
    fileName,
    mimeType,
    uri: uri.substring(0, 50) + '...',
  })

  return formData
}

export const authService = {
  /**
   * Faz login com CPF ou Email
   * A API usa o mesmo endpoint para ambos, diferenciando pelo tipo
   */
  async login(login: string, password: string, type: 'email' | 'document'): Promise<void> {
    try {
      // Remove máscara do CPF se for documento
      const cleanLogin = type === 'document' ? login.replace(/\D/g, '') : login

      const response = await api.post('/auth', {
        type,
        login: cleanLogin,
        password,
      })

      console.log('✅ Login bem-sucedido!')
      
      // Extrai tokens do header Set-Cookie
      const setCookie = response.headers['set-cookie']
      console.log('🍪 Set-Cookie raw:', JSON.stringify(setCookie))
      
      const { accessToken, refreshToken } = tokenService.extractTokensFromCookies(setCookie)
      
      if (accessToken && refreshToken) {
        await tokenService.saveTokens(accessToken, refreshToken)
      } else {
        console.error('❌ ERRO: Não foi possível extrair os tokens dos cookies!')
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      if (axiosError.message.includes('Network Error') || axiosError.code === 'ECONNABORTED') {
        throw new Error('Erro de conexão. Verifique se a API está rodando e se o IP está correto.')
      }
      
      throw new Error('Não foi possível fazer login. Tente novamente.')
    }
  },

  /**
   * Faz login com CPF
   */
  async loginWithCPF(cpf: string, password: string): Promise<void> {
    return this.login(cpf, password, 'document')
  },

  /**
   * Faz login com Email
   */
  async loginWithEmail(email: string, password: string): Promise<void> {
    return this.login(email, password, 'email')
  },

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    try {
      await api.delete('/auth')
      // Limpa os tokens e o status de onboarding
      await Promise.all([
        tokenService.clearTokens(),
        onboardingService.clear(),
      ])
      console.log('✅ Logout bem-sucedido!')
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      // Mesmo se o logout falhar na API, limpa os dados locais
      await Promise.all([
        tokenService.clearTokens(),
        onboardingService.clear(),
      ])
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível fazer logout. Tente novamente.')
    }
  },

  /**
   * Busca os dados do usuário autenticado
   */
  async getAuthenticatedUser(): Promise<User> {
    try {
      const response = await api.get<{ user: any }>('/users/me')
      return mapUserData(response.data.user)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      console.error('❌ Erro ao buscar usuário:', axiosError.response?.status)

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      if (axiosError.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      throw new Error('Não foi possível buscar os dados do usuário.')
    }
  },

  /**
   * Atualiza os dados do usuário autenticado
   */
  async updateAuthenticatedUser(data: Record<string, unknown>): Promise<User> {
    try {
      const response = await api.put<{ user: any }>('/users/me', data)
      const updatedUser = mapUserData(response.data.user || {})

      if (typeof response.data.user?.useCompanyProfile !== 'boolean') {
        try {
          return await this.getAuthenticatedUser()
        } catch {
          return updatedUser
        }
      }

      return updatedUser
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      if (axiosError.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      throw new Error('Não foi possível atualizar os dados do usuário.')
    }
  },

  /**
   * Atualiza a foto de perfil do usuário
   */
  async updateAvatar(uri: string): Promise<User> {
    try {
      console.log('🔄 Iniciando upload de avatar...')
      console.log('📁 URI:', uri)
      
      const formData = buildFileFormData('avatar', uri)
      
      console.log('📤 Enviando requisição PATCH /users/me/avatar')
      const response = await api.patch<{ user: any }>('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      console.log('✅ Upload concluído com sucesso!')
      return mapUserData(response.data.user)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string; statusCode?: number }>

      console.error('❌ Erro no upload:', {
        status: axiosError.response?.status,
        statusCode: axiosError.response?.data?.statusCode,
        message: axiosError.response?.data?.message,
        data: axiosError.response?.data,
      })

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      if (axiosError.response?.status === 500) {
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.')
      }

      throw new Error('Não foi possível atualizar a foto de perfil.')
    }
  },

  /**
   * Atualiza o logotipo da corretora do usuário
   */
  async updateBrokerLogo(uri: string): Promise<User> {
    try {
      const formData = buildFileFormData('logo', uri)
      const response = await api.patch<{ user: any }>('/users/me/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return mapUserData(response.data.user)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      throw new Error('Não foi possível atualizar o logotipo da corretora.')
    }
  },

  /**
   * Exclui a conta do usuário autenticado
   */
  async deleteAuthenticatedUser(): Promise<void> {
    try {
      await api.delete('/users/me')
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      if (axiosError.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      throw new Error('Não foi possível excluir a conta.')
    }
  },

  /**
   * Recupera a senha do usuário
   */
  async recoverPassword(email: string): Promise<string> {
    try {
      const response = await api.post<{ message: string }>(
        '/users/password/request-recover',
        { email }
      )
      console.log('✅ Email de recuperação enviado!')
      return response.data.message
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }

      throw new Error('Não foi possível solicitar a recuperação de senha, tente novamente.')
    }
  },

  /**
   * Atualiza o token de acesso usando o refresh token
   */
  async refreshToken(): Promise<void> {
    try {
      await api.post('/auth/refresh')
      console.log('✅ Token atualizado!')
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível atualizar o token.')
    }
  },

  /**
   * Registra um novo usuário na plataforma
   */
  async register(data: {
    name: string
    email: string
    password: string
    cpf: string
    birthday: Date
    phone: string
    recaptcha: string
  }): Promise<void> {
    try {
      // Remove máscara do CPF e telefone
      const cleanCPF = data.cpf.replace(/\D/g, '')
      const cleanPhone = data.phone.replace(/\D/g, '')

      await api.post('/users', {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        cpf: cleanCPF,
        birthday: data.birthday,
        phone: cleanPhone,
        recaptcha: data.recaptcha,
        platform: 'mobile',
      })

      console.log('✅ Usuário registrado com sucesso!')
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string; name?: string; field?: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      if (axiosError.message.includes('Network Error') || axiosError.code === 'ECONNABORTED') {
        throw new Error('Erro de conexão. Verifique se a API está rodando e se o IP está correto.')
      }
      
      throw new Error('Não foi possível criar o usuário. Tente novamente.')
    }
  },
}
