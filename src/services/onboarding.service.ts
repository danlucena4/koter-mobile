import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_COMPLETED_KEY = '@koter:onboarding_completed'

export const onboardingService = {
  /**
   * Marca o onboarding como completo
   */
  async markAsCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
      console.log('✅ Onboarding marcado como completo')
    } catch (error) {
      console.error('❌ Erro ao marcar onboarding como completo:', error)
      throw error
    }
  },

  /**
   * Verifica se o onboarding já foi completado
   */
  async isCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)
      return value === 'true'
    } catch (error) {
      console.error('❌ Erro ao verificar onboarding:', error)
      return false
    }
  },

  /**
   * Limpa o status de onboarding (útil para testes/logout)
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY)
      console.log('✅ Status de onboarding limpo')
    } catch (error) {
      console.error('❌ Erro ao limpar onboarding:', error)
      throw error
    }
  },
}
