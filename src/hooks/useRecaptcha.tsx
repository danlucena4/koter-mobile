import { useCallback, useRef } from 'react';
import Recaptcha, { RecaptchaHandles } from 'react-native-recaptcha-that-works';

// Pega a chave do .env
const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Chave de teste do Google

console.log('🔑 reCAPTCHA Site Key:', RECAPTCHA_SITE_KEY);

export interface RecaptchaRef {
  open: () => void;
}

export function useRecaptcha() {
  const recaptchaRef = useRef<RecaptchaHandles>(null);

  console.log('🔧 useRecaptcha inicializado');
  console.log('📋 recaptchaRef.current:', recaptchaRef.current);

  const RecaptchaComponent = useCallback(
    ({
      onVerify,
      onExpire,
    }: {
      onVerify: (token: string) => void
      onExpire?: () => void
    }) => {
      console.log('🎨 Renderizando RecaptchaComponent');
      console.log('🔑 Site Key:', RECAPTCHA_SITE_KEY);
      console.log('🌐 Base URL: https://koter.app');

      return (
        <Recaptcha
          ref={recaptchaRef}
          siteKey={RECAPTCHA_SITE_KEY}
          baseUrl="https://koter.app"
          onVerify={(token) => {
            console.log('✅ onVerify chamado! Token:', token.substring(0, 30) + '...')
            console.log('📏 Tamanho do token:', token.length)
            onVerify(token)
          }}
          onExpire={() => {
            console.log('⏰ onExpire chamado')
            onExpire?.()
          }}
          onError={(error) => {
            console.error('❌ onError chamado:', error)
            console.error('❌ Tipo do erro:', typeof error)
            console.error('❌ Detalhes:', JSON.stringify(error, null, 2))
            console.error('❌ Site Key usada:', RECAPTCHA_SITE_KEY)
            console.error('❌ Base URL:', 'https://koter.app')
          }}
          onClose={() => {
            console.log('🚪 onClose chamado (usuário fechou)')
          }}
          onLoad={() => {
            console.log('📦 reCAPTCHA carregado com sucesso!')
          }}
          size="normal"
          theme="light"
          lang="pt-BR"
          loadingComponent={null}
          hideBadge={false}
        />
      )
    },
    [],
  )

  return {
    recaptchaRef,
    RecaptchaComponent,
  };
}
