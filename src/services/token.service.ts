import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = '@koter:access_token'
const REFRESH_TOKEN_KEY = '@koter:refresh_token'

export const tokenService = {
  /**
   * Salva os tokens no AsyncStorage
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken],
      ])
      console.log('✅ Tokens salvos no AsyncStorage')
    } catch (error) {
      console.error('❌ Erro ao salvar tokens:', error)
      throw error
    }
  },

  /**
   * Obtém o access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error('❌ Erro ao obter access token:', error)
      return null
    }
  },

  /**
   * Obtém o refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('❌ Erro ao obter refresh token:', error)
      return null
    }
  },

  /**
   * Remove os tokens do AsyncStorage
   */
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY])
      console.log('✅ Tokens removidos do AsyncStorage')
    } catch (error) {
      console.error('❌ Erro ao remover tokens:', error)
      throw error
    }
  },

  /**
   * Extrai tokens do header Set-Cookie
   */
  extractTokensFromCookies(setCookieHeader: string[] | string | undefined): {
    accessToken: string | null
    refreshToken: string | null
  } {
    if (!setCookieHeader) {
      console.warn('⚠️ Set-Cookie header não encontrado')
      return { accessToken: null, refreshToken: null }
    }

    // O Set-Cookie pode vir como array ou string
    const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    
    // Junta todos os cookies em uma string única
    const allCookiesString = cookiesArray.join(', ')
    
    let accessToken: string | null = null
    let refreshToken: string | null = null

    // Busca access_token na string completa
    // IMPORTANTE: Salvamos o cookie COMPLETO com assinatura (s:TOKEN.SIGNATURE)
    const accessTokenMatch = allCookiesString.match(/access_token=([^;]+)/)
    if (accessTokenMatch && accessTokenMatch[1]) {
      // Decodifica URL encoding
      accessToken = decodeURIComponent(accessTokenMatch[1])
    }

    // Busca refresh_token na string completa
    // IMPORTANTE: Salvamos o cookie COMPLETO com assinatura (s:TOKEN.SIGNATURE)
    const refreshTokenMatch = allCookiesString.match(/refresh_token=([^;]+)/)
    if (refreshTokenMatch && refreshTokenMatch[1]) {
      // Decodifica URL encoding
      refreshToken = decodeURIComponent(refreshTokenMatch[1])
    }

    if (!accessToken || !refreshToken) {
      console.warn('⚠️ Não foi possível extrair os tokens dos cookies')
      console.warn('📋 Cookie string recebida:', allCookiesString.substring(0, 200))
    } else {
      console.log('✅ Tokens extraídos com sucesso!')
      console.log('🔍 Access Token completo (tamanho:', accessToken.length, 'chars)')
      console.log('🔍 Começa com "s:"?', accessToken.startsWith('s:'))
      console.log('🔍 Primeiros 30 chars:', accessToken.substring(0, 30))
    }

    return { accessToken, refreshToken }
  },
}
