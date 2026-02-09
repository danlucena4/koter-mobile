import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenService } from '../services/token.service'

// Pega a URL da API do .env
// Com Expo, variáveis EXPO_PUBLIC_* ficam disponíveis em process.env
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4444'
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000')

// Cria a instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    // Header necessário para ngrok funcionar sem warning
    'ngrok-skip-browser-warning': 'true',
  },
  // Importante: permite enviar e receber cookies
  withCredentials: true,
})

// Interceptor para adicionar cookies em requisições autenticadas
api.interceptors.request.use(async (config) => {
  // Em React Native, precisamos enviar os cookies manualmente no header
  const accessToken = await tokenService.getAccessToken()
  const refreshToken = await tokenService.getRefreshToken()
  
  // Não adiciona cookie nas rotas de auth (exceto refresh)
  if (!config.url?.includes('/auth') || config.url?.includes('/refresh')) {
    const cookies: string[] = []
    
    if (accessToken) {
      // O token JÁ vem no formato completo: s:JWT.SIGNATURE
      cookies.push(`access_token=${accessToken}`)
      console.log('🍪 Cookie access_token adicionado (tamanho:', accessToken.length, ')')
    }
    
    if (refreshToken && config.url?.includes('/refresh')) {
      // O token JÁ vem no formato completo: s:JWT.SIGNATURE
      cookies.push(`refresh_token=${refreshToken}`)
      console.log('🍪 Cookie refresh_token adicionado (tamanho:', refreshToken.length, ')')
    }
    
    if (cookies.length > 0) {
      config.headers.Cookie = cookies.join('; ')
      console.log('📤 Enviando cookies')
    }
  }
  
  return config
})

let isRefreshing = false

// Interceptor para tratar erros e refresh token
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Se for erro 401 e não for a rota de login/refresh, tenta refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Se for rota de auth (incluindo refresh), não tenta refresh
      if (originalRequest.url?.includes('/auth')) {
        return Promise.reject(error)
      }

      try {
        if (isRefreshing) {
          return Promise.reject(error)
        }

        isRefreshing = true

        // Tenta fazer refresh do token
        const refreshToken = await tokenService.getRefreshToken()
        
        if (!refreshToken) {
          // Não tem refresh token, precisa fazer login
          await tokenService.clearTokens()
          return Promise.reject(error)
        }

        console.log('🔄 Tentando refresh do token...')
        
        // Faz a requisição de refresh (o interceptor de request já adiciona o cookie)
        const refreshResponse = await api.post('/auth/refresh', {})

        // Extrai e salva os novos tokens
        const setCookie = refreshResponse.headers['set-cookie']
        const { accessToken: newAccessToken, refreshToken: newRefreshToken} = 
          tokenService.extractTokensFromCookies(setCookie)

        if (newAccessToken && newRefreshToken) {
          await tokenService.saveTokens(newAccessToken, newRefreshToken)
          console.log('✅ Tokens atualizados! Retentando requisição original...')
          
          // Atualiza o cookie na requisição original (token já vem completo: s:JWT.SIGNATURE)
          originalRequest.headers.Cookie = `access_token=${newAccessToken}`
          
          // Tenta novamente a requisição original
          return api(originalRequest)
        }
        
        // Não conseguiu obter novos tokens
        console.warn('⚠️ Não foi possível extrair novos tokens')
        await tokenService.clearTokens()
        return Promise.reject(error)
      } catch (refreshError) {
        // Se o refresh falhou, limpa os tokens e o usuário precisa fazer login novamente
        console.error('❌ Refresh falhou:', refreshError)
        await tokenService.clearTokens()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api