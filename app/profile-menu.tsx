import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ContactIcon,
  LockIcon,
  DeviceIcon,
  Share08Icon,
  HomeIcon,
  TableIcon,
  CalculatorIconWrapper,
  MenuIcon,
} from '../src/components/HugeIconsWrapper';

export default function ProfileMenuScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);

  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onPress?: () => void,
    showArrow: boolean = true,
    isLast: boolean = false,
    rightIcon?: React.ReactNode
  ) => (
    <View key={label}>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemIcon}>{icon}</View>
        <Text style={styles.menuItemLabel}>{label}</Text>
        {rightIcon ? rightIcon : (showArrow && <ArrowRightIcon size={20} color={theme.colors.textSecondary} />)}
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
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Account Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes da Conta</Text>
            <View style={styles.menuCard}>
              {renderMenuItem(
                <UserCircleIcon size={20} color={theme.colors.textSecondary} />,
                'Aparência',
                () => router.push('/appearance')
              )}
              {renderMenuItem(
                <BriefcaseIcon size={20} color={theme.colors.textSecondary} />,
                'Corretoras Vinculadas',
                () => router.push('/brokers')
              )}
              {renderMenuItem(
                <ContactIcon size={20} color={theme.colors.textSecondary} />,
                'Dados Pessoais',
                () => router.push('/personal-data'),
                false,
                true,
                <Share08Icon size={20} color="#ff00dd" />
              )}
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segurança</Text>
            <View style={styles.menuCard}>
              {renderMenuItem(
                <LockIcon size={20} color={theme.colors.textSecondary} />,
                'Segurança & Privacidade',
                () => router.push('/security-privacy')
              )}
              {renderMenuItem(
                <DeviceIcon size={20} color={theme.colors.textSecondary} />,
                'Dispositivos Conectados',
                () => router.push('/devices'),
                true,
                true
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <BottomNavItem
            icon={<HomeIcon size={24} color={theme.colors.textSecondary} />}
            label="Início"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/home')}
          />
          <BottomNavItem
            icon={<TableIcon size={24} color={theme.colors.textSecondary} />}
            label="Tabela"
            theme={theme}
            insets={insets}
            onPress={() => router.push({ pathname: '/coming-soon', params: { title: 'Tabelas' } })}
          />
          <BottomNavItem
            icon={<CalculatorIconWrapper size={24} color={theme.colors.textSecondary} />}
            label="Cotações"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/quotes')}
          />
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

function BottomNavItem({ icon, label, active, theme, onPress, insets }: { icon: React.ReactNode; label: string; active?: boolean; theme: any; onPress?: () => void; insets: any }) {
  const { theme: themeMode } = useTheme();
  const styles = createStyles(theme, themeMode, insets);
  return (
    <TouchableOpacity style={styles.bottomNavItem} onPress={onPress}>
      <View style={[styles.bottomNavIconContainer, active && styles.bottomNavIconActive]}>
        {icon}
      </View>
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

