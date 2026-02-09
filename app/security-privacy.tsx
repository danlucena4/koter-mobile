import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  ExternalLinkIcon,
  PasswordIcon,
  Simcard02Icon,
  CancelCircleIcon,
} from '../src/components/HugeIconsWrapper';
import { Input } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { authService } from '../src/services/auth.service';
import { tokenService } from '../src/services/token.service';
import { onboardingService } from '../src/services/onboarding.service';

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
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


const privacyLinks = [
  {
    title: 'Políticas de privacidade',
    description: 'Conheça as políticas de privacidade do Koter.',
    href: 'https://lp.koter.app/privacidade/',
  },
  {
    title: 'Termos e serviços',
    description: 'Leia nossos termos e condições.',
    href: 'https://lp.koter.app/termos-de-uso/',
  },
  {
    title: 'Políticas anti-spam',
    description: 'Conheça nossa política antispam atualizada.',
    href: 'https://lp.koter.app/politica-anti-spam/',
  },
  {
    title: 'Políticas de Reembolso',
    description: 'Entenda como funcionam pagamentos e reembolsos na Koter.',
    href: 'https://lp.koter.app/politicas-de-pagamento-e-reembolso/',
  },
];

export default function SecurityPrivacyScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const deletePhrase = 'EXCLUIR CONTA';
  const canConfirmDelete =
    deleteConfirmationText.trim().toUpperCase() === deletePhrase && !isDeleting;

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await authService.getAuthenticatedUser();
      setEmail(userData.email || '');
      setPhone(formatPhone(userData.phone || ''));
      setEmailVerified(!!userData.emailVerified);
      setPhoneVerified(!!userData.phoneVerified);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar as informações de segurança.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleOpenLink = async (href: string) => {
    try {
      const supported = await Linking.canOpenURL(href);
      if (!supported) {
        Alert.alert('Erro', 'Não foi possível abrir o link.');
        return;
      }
      await Linking.openURL(href);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o link.');
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Atenção', 'Informe a nova senha para continuar.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      setIsSavingPassword(true);
      await authService.updateAuthenticatedUser({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar a senha.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await authService.deleteAuthenticatedUser();
      await tokenService.clearTokens();
      await onboardingService.clear();
      setIsDeleteModalOpen(false);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível excluir a conta.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    if (isDeleting) return;
    setDeleteConfirmationText('');
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  };


  const renderPrivacyItem = (link: { title: string; description: string; href?: string }) => (
    <TouchableOpacity
      style={styles.privacyItem}
      onPress={() => link.href && handleOpenLink(link.href)}
      disabled={!link.href}
    >
      <View style={styles.privacyTextContainer}>
        <Text style={styles.privacyLabel}>{link.title}</Text>
        <Text style={styles.privacySubtitle}>{link.description}</Text>
      </View>
      <View style={styles.externalLinkButton}>
        <ExternalLinkIcon size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Segurança & Privacidade</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoadingUser ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando segurança...</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verificações</Text>
              <Text style={styles.cardSubtitle}>Status das informações de contato da sua conta.</Text>

              <View style={styles.statusRow}>
                <View style={styles.statusTextGroup}>
                  <Text style={styles.statusLabel}>Email</Text>
                  <Text style={styles.statusValue}>{email || 'Não informado'}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    emailVerified ? styles.statusBadgeSuccess : styles.statusBadgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      emailVerified ? styles.statusBadgeTextSuccess : styles.statusBadgeTextWarning,
                    ]}
                  >
                    {emailVerified ? 'Verificado' : 'Pendente'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusRow}>
                <View style={styles.statusTextGroup}>
                  <Text style={styles.statusLabel}>Telefone</Text>
                  <Text style={styles.statusValue}>{phone || 'Não informado'}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    phoneVerified ? styles.statusBadgeSuccess : styles.statusBadgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      phoneVerified ? styles.statusBadgeTextSuccess : styles.statusBadgeTextWarning,
                    ]}
                  >
                    {phoneVerified ? 'Verificado' : 'Pendente'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Privacidade</Text>
            <Text style={styles.cardSubtitle}>Conheça nossos termos de uso e políticas de privacidade.</Text>

            {privacyLinks.map((link, index) => (
              <View key={link.title}>
                {renderPrivacyItem(link)}
                {index < privacyLinks.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Senhas</Text>
            <Text style={styles.cardSubtitle}>Preencha os campos abaixo para alterar sua senha.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova senha</Text>
              <Text style={styles.helper}>Digite a nova senha</Text>
              <Input
                icon={<PasswordIcon size={18} color={theme.colors.textSecondary} />}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="*****"
                secureTextEntry
                style={styles.inputWhite}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar nova senha</Text>
              <Text style={styles.helper}>Confirme a nova senha</Text>
              <Input
                icon={<PasswordIcon size={18} color={theme.colors.textSecondary} />}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="*****"
                secureTextEntry
                style={styles.inputWhite}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSavingPassword && styles.saveButtonDisabled]}
              onPress={handleSavePassword}
              disabled={isSavingPassword}
            >
              <Text style={styles.saveButtonText}>{isSavingPassword ? 'Salvando...' : 'Salvar'}</Text>
              {isSavingPassword ? (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              ) : (
                <Simcard02Icon size={22} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zona de Perigo</Text>
            <Text style={styles.cardSubtitle}>Cuidado, qualquer ação nessa zona é irrevesível.</Text>

            <View style={styles.dangerItem}>
              <Text style={styles.dangerLabel}>Excluir Conta</Text>
              <Text style={styles.dangerSubtitle}>
                Excluindo a conta todos os seus dados é deletado do banco de dados do Koter, essa é uma ação irrevesível
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={openDeleteModal}
              disabled={isDeleting}
            >
              <Text style={styles.deleteButtonText}>Excluir Conta</Text>
              <CancelCircleIcon size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </ScrollView>


        <Modal
          visible={isDeleteModalOpen}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable style={styles.modalBackdrop} onPress={closeDeleteModal} />
            <View style={styles.modalCard}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <TouchableOpacity style={styles.modalCloseButton} onPress={closeDeleteModal}>
                    <Text style={styles.modalCloseText}>×</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>Confirmar exclusão da conta</Text>

                <View style={styles.modalWarningIcon}>
                  <Text style={styles.modalWarningIconText}>!</Text>
                </View>

                <Text style={styles.modalAlertTitle}>Atenção: Esta ação é irreversível</Text>
                <Text style={styles.modalAlertText}>
                  Todos os seus dados serão permanentemente removidos e não poderão ser recuperados.
                </Text>

                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoTitle}>O que será excluído:</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoBullet}>•</Text>
                    <Text style={styles.modalInfoText}>
                      <Text style={styles.modalInfoTextBold}>Corretoras:</Text> Todas as corretoras em que você é dono serão excluídas permanentemente e todos os dados vinculados a elas serão excluídos respectivamente.
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoBullet}>•</Text>
                    <Text style={styles.modalInfoText}>
                      <Text style={styles.modalInfoTextBold}>Assinaturas:</Text> Todas as assinaturas ativas das corretoras serão canceladas automaticamente.
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoBullet}>•</Text>
                    <Text style={styles.modalInfoText}>
                      <Text style={styles.modalInfoTextBold}>Dados pessoais:</Text> Informações de perfil, histórico e configurações serão removidos.
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalInputLabel}>
                  Para confirmar, digite "{deletePhrase}" no campo abaixo:
                </Text>
                <TextInput
                  value={deleteConfirmationText}
                  onChangeText={setDeleteConfirmationText}
                  placeholder="Digite aqui..."
                  placeholderTextColor="#7C7C7C"
                  style={styles.modalInput}
                  autoCapitalize="characters"
                  editable={!isDeleting}
                />

                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    !canConfirmDelete && styles.modalDeleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={!canConfirmDelete}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Excluir conta permanentemente</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    statusTextGroup: {
      flex: 1,
    },
    statusLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    statusValue: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statusBadge: {
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    statusBadgeSuccess: {
      backgroundColor: theme.colors.success + '1A',
    },
    statusBadgeWarning: {
      backgroundColor: theme.colors.warning + '1A',
    },
    statusBadgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
    },
    statusBadgeTextSuccess: {
      color: theme.colors.success,
    },
    statusBadgeTextWarning: {
      color: theme.colors.warning,
    },
    privacyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    privacyTextContainer: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    privacyLabel: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    privacySubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    externalLinkButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    divider: {
      height: 1,
      backgroundColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
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
    inputWhite: {
      backgroundColor: themeMode === 'dark' ? theme.colors.inputBackground : theme.colors.white,
      borderColor: themeMode === 'dark' ? theme.colors.border : theme.colors.borderLight,
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
    dangerItem: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    dangerLabel: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    dangerSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    deleteButton: {
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: theme.borderRadius.full,
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      backgroundColor: 'transparent',
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.xl,
    },
    deleteButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.error,
    },
    deleteButtonDisabled: {
      opacity: 0.6,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      borderRadius: 20,
      backgroundColor: '#121212',
      borderWidth: 1,
      borderColor: '#242424',
      overflow: 'hidden',
    },
    modalContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#2B2B2B',
    },
    modalCloseButton: {
      position: 'absolute',
      right: 0,
      top: -6,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 22,
      color: '#B0B0B0',
    },
    modalTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: '#FFFFFF',
      marginBottom: theme.spacing.md,
      textAlign: 'left',
    },
    modalWarningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: '#FF3B57',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    modalWarningIconText: {
      fontSize: 24,
      color: '#FF3B57',
      fontFamily: theme.fonts.bold,
    },
    modalAlertTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: '#FF3B57',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    modalAlertText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: '#D0D0D0',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    modalInfoBox: {
      borderRadius: 16,
      padding: theme.spacing.md,
      backgroundColor: '#1D0B0F',
      borderWidth: 1,
      borderColor: '#3A1118',
      marginBottom: theme.spacing.lg,
    },
    modalInfoTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: '#FF4D6D',
      marginBottom: theme.spacing.sm,
    },
    modalInfoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    modalInfoBullet: {
      color: '#FF4D6D',
      marginRight: theme.spacing.xs,
      fontSize: theme.fontSize.sm,
      lineHeight: 18,
    },
    modalInfoText: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: '#D6D6D6',
      lineHeight: 18,
    },
    modalInfoTextBold: {
      fontFamily: theme.fonts.semiBold,
      color: '#FFFFFF',
    },
    modalInputLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: '#C9C9C9',
      marginBottom: theme.spacing.sm,
    },
    modalInput: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#2A2A2A',
      backgroundColor: '#1E1E1E',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: '#FFFFFF',
      marginBottom: theme.spacing.lg,
    },
    modalDeleteButton: {
      borderRadius: 14,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8E2B38',
    },
    modalDeleteButtonDisabled: {
      backgroundColor: '#4A1F27',
      opacity: 0.7,
    },
    modalDeleteButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: '#FFFFFF',
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
