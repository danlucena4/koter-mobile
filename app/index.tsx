import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Input, Button, TabSwitch, IdentityCardIcon, Mail01Icon, ArrowRight02Icon, ArrowLeft02Icon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import LogoIcon from '../src/assets/images/Signo 2.svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PasswordValidationIcon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { authService } from '../src/services/auth.service';
import { onboardingService } from '../src/services/onboarding.service';
import { useUser } from '../src/contexts/UserContext';

export default function LoginScreen() {
  console.log('🎯 LoginScreen montado!')
  const { theme: themeMode } = useTheme();
  console.log('✅ Theme carregado:', themeMode)
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { setUserName, setUserEmail, setProfileImage } = useUser();
  
  const [loginType, setLoginType] = useState<'cpf' | 'email'>('cpf');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  const [errors, setErrors] = useState<{ cpf?: string; email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const identifierValue = useMemo(() => {
    return loginType === 'cpf' ? cpf.trim() : email.trim();
  }, [loginType, cpf, email]);

  const handleLogin = () => {
    const newErrors: { cpf?: string; email?: string; password?: string; general?: string } = {};

    // Bypass de validação para o usuário admin (testes)
    if (identifierValue.toLowerCase() === 'admin') {
      setErrors({});
      setStep('password');
      return;
    }

    if (loginType === 'cpf') {
      if (!cpf.trim()) {
        newErrors.cpf = 'CPF é obrigatório';
      } else if (cpf.replace(/\D/g, '').length !== 11) {
        newErrors.cpf = 'CPF inválido';
      }
    } else {
      if (!email.trim()) {
        newErrors.email = 'E-mail é obrigatório';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'E-mail inválido';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep('password');
    }
  };

  const handleBackStep = () => {
    setStep('identifier');
    setErrors({});
  };

  const handleSubmitPassword = async () => {
    const newErrors: { password?: string; general?: string } = {};
    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    // Login fake para testes (admin/admin) - mantido para desenvolvimento
    if (identifierValue.toLowerCase() === 'admin' && password === 'admin') {
      setErrors({});
      router.replace('/home');
      return;
    }

    // Login real com a API
    setIsLoading(true);
    try {
      if (loginType === 'cpf') {
        await authService.loginWithCPF(cpf, password);
      } else {
        await authService.loginWithEmail(email, password);
      }

      // Login bem-sucedido, busca dados do usuário
      console.log('✅ Login bem-sucedido! Buscando dados do usuário...');
      
      try {
        const userData = await authService.getAuthenticatedUser();
        console.log('📦 Estrutura completa do userData:', JSON.stringify(userData, null, 2));
        console.log('📋 userData.name:', userData.name);
        console.log('📋 userData.email:', userData.email);
        console.log('📋 userData.avatar:', userData.avatar);
        
        setUserName(userData.name);
        setUserEmail(userData.email);
        if (userData.avatar) {
          setProfileImage(userData.avatar);
        }
        console.log('✅ Dados do usuário salvos no contexto');
        console.log('📋 isSignUpCompleted no banco:', userData.isSignUpCompleted);

        setErrors({});
        
        // Verifica se o usuário tem tema definido (onboarding completo)
        const hasCompletedOnboarding = !!userData.theme;
        console.log('🎨 Tema do usuário:', userData.theme);
        console.log('✅ Onboarding completo?', hasCompletedOnboarding);
        
        if (hasCompletedOnboarding) {
          console.log('➡️ Usuário já completou onboarding, indo para home...');
          await onboardingService.markAsCompleted();
          router.replace('/home');
        } else {
          console.log('➡️ Primeiro acesso ou onboarding incompleto, redirecionando para tema...');
          router.replace('/theme');
        }
      } catch (userError) {
        console.error('⚠️ Erro ao buscar dados do usuário:', userError);
        // Se falhar ao buscar dados, usa o localStorage como fallback
        const onboardingCompleted = await onboardingService.isCompleted();
        setErrors({});
        if (!onboardingCompleted) {
          router.replace('/theme');
        } else {
          router.replace('/home');
        }
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error.message);
      setErrors({ general: error.message || 'Erro ao fazer login. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf;
  };

  const handleCPFChange = (text: string) => {
    setCpf(formatCPF(text));
    if (errors.cpf) {
      setErrors({ ...errors, cpf: undefined });
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
          extraHeight={120}
          keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
          enableResetScrollToCoords={false}
        >
              {/* Main Content - Centralized */}
              <View style={styles.mainContent}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                  <LogoIcon width={60} height={60} />
                </View>

                {/* Welcome Text */}
                <Text style={styles.welcomeText}>Bem-vindo(a).</Text>

                {/* Tab Switch */}
                {step === 'identifier' && (
                  <View style={styles.tabContainer}>
                  <TabSwitch
                    options={[
                      {
                        label: 'CPF',
                        value: 'cpf',
                        icon: <IdentityCardIcon size={18} color={loginType === 'cpf' ? theme.colors.text : theme.colors.textSecondary} />,
                      },
                      {
                        label: 'Email',
                        value: 'email',
                        icon: <Mail01Icon size={18} color={loginType === 'email' ? theme.colors.text : theme.colors.textSecondary} />,
                      },
                    ]}
                    selectedValue={loginType}
                    onSelect={(value) => setLoginType(value as 'cpf' | 'email')}
                  />
                  </View>
                )}

                {/* Input Section */}
                <View style={styles.inputSection}>
                  {step === 'identifier' ? (
                    <>
                      <View style={styles.inputHeader}>
                        <Text style={styles.inputLabel}>
                          {loginType === 'cpf' ? 'CPF' : 'Email'}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                          <Text style={styles.forgotText}>Esqueci minha senha</Text>
                        </TouchableOpacity>
                      </View>

                      {loginType === 'cpf' ? (
                        <Input
                          key="login-cpf"
                          placeholder="Digite seu CPF"
                          value={cpf}
                          onChangeText={handleCPFChange}
                          keyboardType="numeric"
                          maxLength={14}
                          error={errors.cpf}
                          icon={
                            <IdentityCardIcon
                              size={20}
                              color={theme.colors.textSecondary}
                            />
                          }
                        />
                      ) : (
                        <Input
                          key="login-email"
                          placeholder="Digite seu e-mail"
                          value={email}
                          autoFocus
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) {
                              setErrors({ ...errors, email: undefined });
                            }
                          }}
                          keyboardType="email-address"
                          autoComplete="email"
                          textContentType="emailAddress"
                          autoCapitalize="none"
                          error={errors.email}
                          icon={
                            <Mail01Icon
                              size={20}
                              color={theme.colors.textSecondary}
                            />
                          }
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.passwordHeader}>
                        <TouchableOpacity onPress={handleBackStep} style={styles.backButton}>
                          <ArrowLeft02Icon size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.inputLabel}>Senha</Text>
                      </View>

                      <Input
                        placeholder="••••••••"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password || errors.general) {
                            setErrors({ ...errors, password: undefined, general: undefined });
                          }
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        textContentType="password"
                        error={errors.password || errors.general}
                        icon={
                          <HugeiconsIcon
                            icon={PasswordValidationIcon}
                            size={20}
                            color={theme.colors.textSecondary}
                            strokeWidth={1.5}
                          />
                        }
                        rightIcon={
                          <HugeiconsIcon
                            icon={showPassword ? ViewIcon : ViewOffIcon}
                            size={20}
                            color={theme.colors.textSecondary}
                            strokeWidth={1.5}
                          />
                        }
                        onRightIconPress={() => setShowPassword(!showPassword)}
                      />
                    </>
                  )}
                </View>

            {/* Login Button */}
            <Button
              title={step === 'identifier' ? 'Continuar' : 'Entrar'}
              onPress={step === 'identifier' ? handleLogin : handleSubmitPassword}
              disabled={isLoading}
              icon={
                isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <ArrowRight02Icon
                    size={20}
                    color={theme.colors.textOnPrimary}
                  />
                )
              }
              containerStyle={styles.loginButton}
            />
            <TouchableOpacity style={styles.devHomeButton} onPress={() => router.push('/home')}>
              <Text style={styles.devHomeText}>Ir para Home</Text>
            </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Não tem conta? </Text>
                  <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.signupLink}>Cadastre-se</Text>
                  </TouchableOpacity>
                </View>
              </View>

          </KeyboardAwareScrollView>

          {/* Footer - Fora do scroll para ficar fixo */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Koter®</Text>
            <TouchableOpacity>
              <Text style={styles.helpText}>?</Text>
            </TouchableOpacity>
          </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  tabContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  forgotText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  devHomeButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  devHomeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.medium,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signupText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  signupLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  helpText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
});
