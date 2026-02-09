import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  Crown02Icon,
  CheckListIcon,
  IdentityCardIcon,
  AnalyticsUpIcon,
  CalculateIcon,
  File01Icon,
  ArtificialIntelligence08Icon,
  Target02Icon,
  ShareIcon,
  TaskIcon,
  SettingsIcon,
  ContactIcon,
  TableIcon,
  MegaphoneIcon,
  Logout02Icon,
} from '../src/components/HugeIconsWrapper';
import LogoIcon from '../src/assets/images/Signo 2.svg';

const indiqueKoterIcon = require('../src/assets/images/indique-koter.png');

// Função auxiliar para obter iniciais do nome
const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return 'U';
  
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  // Pega a primeira letra do primeiro e do último nome
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
};

export default function SettingsScreen() {
  const { theme: themeMode } = useTheme();
  const { userName, userEmail, profileImage } = useUser();
  
  // Em desenvolvimento, ignora URLs de localhost (não funcionam no mobile)
  const hasValidImage = profileImage && 
                        profileImage.trim() !== '' && 
                        !profileImage.includes('localhost');
  
  console.log('⚙️ SettingsScreen - userName:', userName);
  console.log('⚙️ SettingsScreen - profileImage:', profileImage);
  console.log('⚙️ SettingsScreen - hasValidImage:', hasValidImage);
  
  const displayName = userName || 'Usuário';
  const displayEmail = userEmail || (userName ? userName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com' : 'usuario@email.com');
  const theme = getTheme(themeMode);
  const router = useRouter();
  const styles = createStyles(theme, themeMode || 'dark');
  const goComingSoon = (title: string) =>
    router.push({ pathname: '/coming-soon', params: { title } });

  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onPress?: () => void,
    showArrow: boolean = true,
    isLast: boolean = false,
    badgeText?: string
  ) => (
    <View key={label}>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemIcon}>{icon}</View>
        <Text style={styles.menuItemLabel}>{label}</Text>
        {badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
        {showArrow && <ArrowRightIcon size={20} color={theme.colors.textSecondary} />}
      </TouchableOpacity>
      {!isLast && <View style={styles.menuDivider} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LogoIcon width={48} height={48} />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTitle}>Koter Soluções</Text>
              <Text style={styles.logoSubtitle}>KoterPRO</Text>
            </View>
            <TouchableOpacity style={styles.syncButton}>
              <ShareIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <TouchableOpacity style={styles.userCard} onPress={() => router.push('/profile-menu')}>
            <View style={styles.userAvatarContainer}>
              {hasValidImage ? (
                <Image source={{ uri: profileImage }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>{getInitials(displayName)}</Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Account Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes da Conta</Text>
            <View style={styles.menuCard}>
              {renderMenuItem(
                <UserCircleIcon size={20} color={theme.colors.textSecondary} />,
                'Perfil',
                () => router.push('/profile-menu')
              )}
              {renderMenuItem(
                <Crown02Icon size={20} color="#FF8C42" />,
                'Assinatura',
                () => goComingSoon('Assinatura'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <Image source={indiqueKoterIcon} style={styles.indiqueIcon} />,
                'Indique o Koter',
                () => goComingSoon('Indique o Koter'),
                true,
                true,
                'Em breve'
              )}
            </View>
          </View>

          {/* News Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Novidades</Text>
            <View style={styles.menuCard}>
              {renderMenuItem(
                <CheckListIcon size={20} color={theme.colors.textSecondary} />,
                'Tarefas',
                () => goComingSoon('Tarefas'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <SettingsIcon size={20} color={theme.colors.textSecondary} />,
                'KoterADM',
                () => goComingSoon('KoterADM'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <IdentityCardIcon size={20} color={theme.colors.textSecondary} />,
                'CRM',
                () => goComingSoon('CRM'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <AnalyticsUpIcon size={20} color={theme.colors.textSecondary} />,
                'Gestão de Propostas',
                () => goComingSoon('Gestão de Propostas'),
                true,
                true,
                'Em breve'
              )}
            </View>
          </View>

          {/* General Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Geral</Text>
            <View style={styles.menuCard}>
              {renderMenuItem(
                <CalculateIcon size={20} color={theme.colors.textSecondary} />,
                'Cotações',
                () => router.push('/quotes')
              )}
              {renderMenuItem(
                <File01Icon size={20} color={theme.colors.textSecondary} />,
                'Minhas Propostas',
                () => goComingSoon('Minhas Propostas'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <TableIcon size={20} color={theme.colors.textSecondary} />,
                'Tabelas',
                () => goComingSoon('Tabelas'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <ArtificialIntelligence08Icon size={20} color={theme.colors.textSecondary} />,
                'Inteligência Artificial',
                () => goComingSoon('Inteligência Artificial'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <Target02Icon size={20} color={theme.colors.textSecondary} />,
                'Marketing',
                () => goComingSoon('Marketing'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <MegaphoneIcon size={20} color={theme.colors.textSecondary} />,
                'Informativos',
                () => goComingSoon('Informativos'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <ContactIcon size={20} color={theme.colors.textSecondary} />,
                'Contatos',
                () => goComingSoon('Contatos'),
                true,
                false,
                'Em breve'
              )}
              {renderMenuItem(
                <Logout02Icon size={20} color={theme.colors.textSecondary} />,
                'Sair',
                () => router.replace('/'),
                true,
                true
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark') =>
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
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    logoContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    logoTextContainer: {
      flex: 1,
    },
    logoTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    logoSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    syncButton: {
      padding: theme.spacing.xs,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    userAvatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.backgroundMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      overflow: 'hidden',
    },
    userAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
    },
    userAvatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userAvatarText: {
      fontSize: 18,
      fontFamily: theme.fonts.bold,
      color: theme.colors.textOnPrimary,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    userEmail: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    menuCard: {
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    menuDivider: {
      height: 1,
      backgroundColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    menuItemIcon: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    menuItemLabel: {
      flex: 1,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    badge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary + '1A',
      borderWidth: 1,
      borderColor: theme.colors.primary + '55',
      marginRight: theme.spacing.sm,
    },
    badgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    indiqueIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
  });
