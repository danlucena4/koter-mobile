import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  HomeIcon,
  CalculatorIconWrapper,
  CRMIcon,
  TaskIcon,
  MenuIcon,
} from '../src/components/HugeIconsWrapper';
import { Input, Mail01Icon, WhatsAppIcon, IdentityCardIcon, UserCircleIcon, Simcard02Icon } from '../src/components';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GridIcon, BirthdayCakeIcon } from '@hugeicons/core-free-icons';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import { authService } from '../src/services/auth.service';

const stripNonDigits = (value: string) => value.replace(/\D/g, '');

const formatCpf = (value: string) => {
  const digits = stripNonDigits(value);
  if (!digits) return '';

  return digits
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (value: string) => {
  const digits = stripNonDigits(value);
  if (!digits) return '';

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function PersonalDataScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);
  const { setUserName, setUserEmail } = useUser();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getAuthenticatedUser();
      const displayName = userData.fullName || userData.name || '';

      setFullName(displayName);
      setUsername(userData.username || '');
      setEmail(userData.email || '');
      setPhone(formatPhone(userData.phone || ''));
      setCpf(formatCpf(userData.document || ''));
      setBirthDate(formatDate(userData.birthday));

      setUserName(userData.name || displayName);
      setUserEmail(userData.email || '');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Atenção', 'Informe seu nome completo para salvar.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        name: fullName.trim(),
      };

      if (username.trim()) {
        payload.username = username.trim();
      }

      if (email.trim()) {
        payload.email = email.trim();
      }

      if (phone.trim()) {
        payload.phone = stripNonDigits(phone.trim());
      }

      const updatedUser = await authService.updateAuthenticatedUser(payload);
      const displayName = updatedUser.fullName || updatedUser.name || fullName.trim();

      setFullName(displayName);
      setUsername(updatedUser.username || username.trim());
      setEmail(updatedUser.email || email.trim());
      setPhone(formatPhone(updatedUser.phone || ''));
      setUserName(updatedUser.name || displayName);
      setUserEmail(updatedUser.email || email.trim());

      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar seus dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dados Pessoais</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Informações públicas</Text>
                <Text style={styles.cardSubtitle}>Atualize suas informações públicas abaixo.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <Text style={styles.helper}>O nome que vai ficar visível nos materiais</Text>
                  <Input
                    icon={<UserCircleIcon size={18} color={theme.colors.textSecondary} />}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nome completo"
                    style={styles.inputWhite}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Usuário</Text>
                  <Text style={styles.helper}>Seu identificador público na URL</Text>
                  <Input
                    icon={<HugeiconsIcon icon={GridIcon} size={18} color={theme.colors.textSecondary} strokeWidth={1.5} />}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="usuario"
                    style={styles.inputWhite}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-mail</Text>
                  <Text style={styles.helper}>Seu endereço de e-mail vinculado a conta</Text>
                  <Input
                    icon={<Mail01Icon size={18} color={theme.colors.textSecondary} />}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.inputWhite}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Celular</Text>
                  <Text style={styles.helper}>Recomendamos o número do whatsapp.</Text>
                  <Input
                    icon={<WhatsAppIcon size={18} color={theme.colors.textSecondary} />}
                    value={phone}
                    onChangeText={(value) => setPhone(formatPhone(value))}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                    style={styles.inputWhite}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  ) : (
                    <Simcard02Icon size={22} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Informações Privadas</Text>
                <Text style={styles.cardSubtitle}>Atualize os detalhes sobre você.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CPF</Text>
                  <Text style={styles.helper}>O número do seu CPF</Text>
                  <Input
                    icon={<IdentityCardIcon size={18} color={theme.colors.textSecondary} />}
                    value={cpf}
                    onChangeText={setCpf}
                    placeholder="000.000.000-00"
                    keyboardType="number-pad"
                    editable={false}
                    style={styles.inputWhite}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Data de Nascimento</Text>
                  <Text style={styles.helper}>A data do seu aniversário</Text>
                  <Input
                    icon={<HugeiconsIcon icon={BirthdayCakeIcon} size={18} color={theme.colors.textSecondary} strokeWidth={1.5} />}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="dd/mm/aaaa"
                    keyboardType="number-pad"
                    editable={false}
                    style={styles.inputWhite}
                  />
                </View>

                <Text style={styles.supportText}>
                  Precisa de ajuda pra alterar alguma informação? contate o{' '}
                  <Text style={styles.supportLink}>Suporte</Text>
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <BottomNavItem
            icon={<HomeIcon size={24} color={theme.colors.textSecondary} />}
            label="Início"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/home')}
          />
          <BottomNavItem
            icon={<CalculatorIconWrapper size={24} color={theme.colors.textSecondary} />}
            label="Cotações"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/quotes')}
          />
          <BottomNavItem icon={<CRMIcon size={24} color={theme.colors.textSecondary} />} label="CRM" theme={theme} insets={insets} />
          <BottomNavItem icon={<TaskIcon size={24} color={theme.colors.textSecondary} />} label="Tarefas" theme={theme} insets={insets} />
          <BottomNavItem
            icon={<MenuIcon size={24} color={theme.colors.primary} />}
            label="Menu"
            active
            theme={theme}
            insets={insets}
            onPress={() => router.push('/settings')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  theme,
  onPress,
  insets,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  theme: any;
  onPress?: () => void;
  insets: any;
}) {
  const { theme: themeMode } = useTheme();
  const styles = createStyles(theme, themeMode, insets);
  return (
    <TouchableOpacity style={styles.bottomNavItem} onPress={onPress}>
      <View style={[styles.bottomNavIconContainer, active && styles.bottomNavIconActive]}>{icon}</View>
      <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, themeMode: 'light' | 'dark', insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    placeholder: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl * 2,
    },
    card: {
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    cardTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    cardSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    inputWhite: {
      backgroundColor: themeMode === 'dark' ? theme.colors.inputBackground : theme.colors.white,
      borderColor: themeMode === 'dark' ? theme.colors.border : theme.colors.borderLight,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    helper: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    saveButton: {
      marginTop: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    supportText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    supportLink: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    bottomNav: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
      paddingTop: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 70 + insets.bottom,
    },
    bottomNavItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomNavIconContainer: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
    },
    bottomNavIconActive: {
      backgroundColor: themeMode === 'dark' ? '#333' : '#F0F0F0',
    },
    bottomNavLabel: {
      fontSize: 10,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    bottomNavLabelActive: {
      color: theme.colors.text,
      fontFamily: theme.fonts.bold,
    },
  });
