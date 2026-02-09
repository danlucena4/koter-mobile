import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { Button, ArrowLeft02Icon } from '../src/components';
import api from '../src/lib/api';

export default function VerifyEmailScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const styles = createStyles(theme);

  // Manipular mudança de código
  const handleCodeChange = (text: string, index: number) => {
    // Apenas números
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto avançar para próximo campo
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verificar automaticamente quando completar
    if (index === 5 && text) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  // Manipular backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verificar código
  const handleVerify = async (verificationCode?: string) => {
    const fullCode = verificationCode || code.join('');

    if (fullCode.length !== 6) {
      Alert.alert('Erro', 'Digite o código completo de 6 dígitos');
      return;
    }

    setIsLoading(true);
    console.log('🔄 Verificando código:', fullCode, 'para email:', email);
    try {
      // Usar endpoint público que não requer autenticação
      const response = await api.post('/users/email/verify/public', {
        email,
        code: fullCode,
      });
      console.log('✅ Email verificado com sucesso!');

      Alert.alert(
        'Email Verificado!',
        'Seu email foi verificado com sucesso. Vamos configurar seu perfil!',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/theme'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro na verificação:', error.response?.data?.message || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Código inválido ou expirado');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResend = async () => {
    setIsResending(true);
    console.log('🔄 Tentando reenviar código...');
    try {
      // Usar endpoint público que não requer autenticação
      const response = await api.post('/users/email/verify/resend/public', {
        email,
      });
      console.log('✅ Código reenviado com sucesso!', response.data);
      Alert.alert('Sucesso', 'Um novo código foi enviado para seu email');
    } catch (error: any) {
      console.error('❌ Erro ao reenviar código:', error);
      if (error.response) {
        console.error('📊 Status:', error.response?.status);
        console.error('📊 Data:', error.response?.data);
      }
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível reenviar o código');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft02Icon size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Título */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Verificar Email</Text>
            <Text style={styles.subtitle}>
              Digite o código de 6 dígitos que enviamos para
            </Text>
            <Text style={styles.email}>{email || 'seu email'}</Text>
          </View>

          {/* Campos de código */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Botão Verificar */}
          <Button
            title={isLoading ? 'Verificando...' : 'Verificar Email'}
            onPress={() => handleVerify()}
            disabled={isLoading || code.join('').length !== 6}
            icon={
              isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
              ) : undefined
            }
            containerStyle={styles.verifyButton}
          />

          {/* Reenviar código */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Não recebeu o código? </Text>
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                {isResending ? 'Reenviando...' : 'Reenviar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dica */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              💡 Dica: Verifique também a pasta de spam/lixo eletrônico
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginLeft: -theme.spacing.xs,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
    },
    titleSection: {
      marginBottom: theme.spacing.xxl * 2,
    },
    title: {
      fontSize: theme.fontSize.xxl,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    email: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xl,
    },
    codeInput: {
      width: 48,
      height: 56,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      textAlign: 'center',
      fontSize: theme.fontSize.xl,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
    },
    codeInputFilled: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight || theme.colors.inputBackground,
    },
    verifyButton: {
      marginBottom: theme.spacing.lg,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    resendText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    resendLink: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    resendLinkDisabled: {
      opacity: 0.5,
    },
    hintContainer: {
      backgroundColor: theme.colors.infoLight || theme.colors.inputBackground,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info || theme.colors.primary,
    },
    hintText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });
