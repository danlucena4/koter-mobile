import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Input, Button, ArrowLeft02Icon, ArrowRight02Icon, Mail01Icon, IdentityCardIcon, UserIcon, DatePicker } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { authService } from '../src/services/auth.service';
import { RegisterFormData } from '../src/@types/register';
import { validateCPF, validateEmail, validatePhone, formatCPF, formatPhone, calculateAge } from '../src/utils/validators';
import { useRecaptcha } from '../src/hooks/useRecaptcha';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  PasswordValidationIcon, 
  SmartPhone01Icon,
  ViewIcon,
  ViewOffIcon 
} from '@hugeicons/core-free-icons';

export default function RegisterScreen() {
  console.log('🎬 RegisterScreen montado');
  console.log('🔑 EXPO_PUBLIC_RECAPTCHA_SITE_KEY:', process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY);
  
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { recaptchaRef, RecaptchaComponent } = useRecaptcha();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Data máxima: 18 anos atrás (para cadastro)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  
  // Data mínima: 120 anos atrás
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  // Data inicial padrão: 01/01/2000 (mais fácil de navegar)
  const defaultDate = new Date(2000, 0, 1);

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    birthday: defaultDate, // Inicia em 01/01/2000
    phone: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData | 'general', string>>>({});

  // Validação do formulário
  const validateForm = (): boolean => {
    console.log('🔍 Validando formulário...');
    console.log('📝 Dados:', {
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.phone,
      birthday: formData.birthday,
      password: formData.password ? '***' : '(vazio)',
      confirmPassword: formData.confirmPassword ? '***' : '(vazio)',
    });

    const newErrors: Partial<Record<keyof RegisterFormData | 'general', string>> = {};

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      console.log('❌ Nome vazio');
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Digite seu nome completo';
      console.log('❌ Nome incompleto');
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      console.log('❌ Email vazio');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
      console.log('❌ Email inválido');
    }

    // Validação do CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
      console.log('❌ CPF vazio');
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
      console.log('❌ CPF inválido');
    }

    // Validação do telefone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
      console.log('❌ Telefone vazio');
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
      console.log('❌ Telefone inválido');
    }

    // Validação da data de nascimento
    const age = calculateAge(formData.birthday);
    console.log('📅 Idade calculada:', age);
    if (age < 18) {
      newErrors.birthday = 'Você deve ter pelo menos 18 anos';
      console.log('❌ Idade menor que 18');
    } else if (age > 120) {
      newErrors.birthday = 'Data de nascimento inválida';
      console.log('❌ Idade maior que 120');
    }

    // Validação da senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      console.log('❌ Senha vazia');
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
      console.log('❌ Senha muito curta');
    }

    // Confirmação de senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      console.log('❌ Senhas não coincidem');
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(isValid ? '✅ Formulário válido!' : '❌ Erros encontrados:', newErrors);
    return isValid;
  };

  const openRecaptcha = () => {
    try {
      console.log('🔍 Verificando recaptchaRef...');
      console.log('📋 recaptchaRef:', recaptchaRef);
      console.log('📋 recaptchaRef.current:', recaptchaRef.current);
      
      if (recaptchaRef.current) {
        console.log('🔓 Abrindo reCAPTCHA...');
        console.log('📋 Métodos disponíveis:', Object.keys(recaptchaRef.current));
        recaptchaRef.current.open();
        console.log('✅ Comando open() executado');
      } else {
        console.error('❌ reCAPTCHA ref está null');
        console.error('❌ Isso significa que o componente não foi montado corretamente');
        Alert.alert('Erro', 'reCAPTCHA não está pronto. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir reCAPTCHA:', error);
      console.error('❌ Stack:', (error as Error).stack);
      Alert.alert('Erro', 'Erro ao abrir verificação. Tente novamente.');
    }
  };

  const handleRegister = async () => {
    console.log('🔵 handleRegister chamado');

    if (!validateForm()) {
      console.log('❌ Validação falhou');
      return;
    }

    console.log('✅ Validação passou');
    console.log('📱 recaptchaRef.current:', recaptchaRef.current);

    openRecaptcha();
  };

  // Função chamada quando o reCAPTCHA é verificado
  const handleRecaptchaVerify = async (token: string) => {
    console.log('✅ reCAPTCHA verificado! Token:', token.substring(0, 20) + '...');
    setIsLoading(true);
    setErrors({});

    try {
      console.log('📤 Enviando registro para API...');
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        birthday: formData.birthday,
        phone: formData.phone,
        recaptcha: token,
      });

      console.log('✅ Registro bem-sucedido!');
      
      // Fazer login automático após registro
      console.log('🔐 Fazendo login automático...');
      try {
        await authService.loginWithEmail(formData.email, formData.password);
        console.log('✅ Login automático bem-sucedido!');
      } catch (loginError) {
        console.error('❌ Erro no login automático:', loginError);
      }
      
      // Redirecionar para verificação de email
      router.replace(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      setErrors({ general: error.message });
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Função chamada quando o reCAPTCHA expira
  const handleRecaptchaExpire = () => {
    console.log('⏰ reCAPTCHA expirou');
    Alert.alert('Erro', 'A verificação expirou. Tente novamente.');
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
        >
          {/* Header com botão voltar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft02Icon size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha os dados abaixo para começar</Text>

            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <Input
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                autoCapitalize="words"
                error={errors.name}
                icon={<UserIcon size={20} color={theme.colors.textSecondary} />}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                icon={<Mail01Icon size={20} color={theme.colors.textSecondary} />}
              />
            </View>

            {/* CPF */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <Input
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChangeText={(text) => {
                  const formatted = formatCPF(text);
                  setFormData({ ...formData, cpf: formatted });
                  
                  // Validação em tempo real
                  if (formatted.replace(/\D/g, '').length === 11) {
                    if (!validateCPF(formatted)) {
                      setErrors({ ...errors, cpf: 'CPF inválido' });
                    } else {
                      setErrors({ ...errors, cpf: undefined });
                    }
                  } else if (errors.cpf) {
                    setErrors({ ...errors, cpf: undefined });
                  }
                }}
                keyboardType="numeric"
                maxLength={14}
                error={errors.cpf}
                icon={<IdentityCardIcon size={20} color={theme.colors.textSecondary} />}
              />
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <Input
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: formatPhone(text) });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                keyboardType="phone-pad"
                maxLength={15}
                error={errors.phone}
                icon={
                  <HugeiconsIcon 
                    icon={SmartPhone01Icon} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                    strokeWidth={1.5} 
                  />
                }
              />
            </View>

            {/* Data de Nascimento */}
            <DatePicker
              label="Data de Nascimento"
              value={formData.birthday}
              onChange={(date) => {
                setFormData({ ...formData, birthday: date });
                if (errors.birthday) setErrors({ ...errors, birthday: undefined });
              }}
              error={errors.birthday}
              minimumDate={minDate}
              maximumDate={maxDate}
            />

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <Input
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={errors.password}
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
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <Input
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                error={errors.confirmPassword}
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
                    icon={showConfirmPassword ? ViewIcon : ViewOffIcon} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                    strokeWidth={1.5} 
                  />
                }
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </View>

            {/* Erro Geral */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Botão de Registro */}
            <Button
              title="Criar Conta"
              onPress={handleRegister}
              disabled={isLoading}
              icon={
                isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <ArrowRight02Icon size={20} color={theme.colors.textOnPrimary} />
                )
              }
              containerStyle={styles.registerButton}
            />

            {/* Link para Login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* Componente reCAPTCHA (renderizado fora do SafeAreaView) */}
      <RecaptchaComponent
        onVerify={handleRecaptchaVerify}
        onExpire={handleRecaptchaExpire}
      />
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
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: theme.colors.errorLight || '#ffebee',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  loginLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  loginLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
});
