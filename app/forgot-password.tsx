import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Input, Button, Mail01Icon, ArrowLeft02Icon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { authService } from '../src/services/auth.service';

export default function ForgotPasswordScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecover = async () => {
    if (!email.trim()) {
      setError('E-mail é obrigatório');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('E-mail inválido');
      return;
    }

    try {
      setIsSubmitting(true);
      const message = await authService.recoverPassword(email.trim().toLowerCase());
      Alert.alert('Êxito!', message || 'E-mail de recuperação enviado.');
    } catch (err: any) {
      Alert.alert('Oops!', err?.message || 'Não foi possível solicitar a recuperação de senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft02Icon size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Esqueci minha senha</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <Input
                placeholder="Digite seu e-mail"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(undefined);
                }}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                error={error}
                icon={
                  <Mail01Icon
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
              />
            </View>

            <Button
              title="Enviar e-mail de recuperação"
              onPress={handleRecover}
              containerStyle={styles.button}
              textStyle={styles.buttonText}
              loading={isSubmitting}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Lembrou? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Faça login.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.backgroundMuted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    fontSize: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loginText: {
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

