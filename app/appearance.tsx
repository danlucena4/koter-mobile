import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import { authService } from '../src/services/auth.service';
import {
  ArrowLeftIcon,
  EditIcon,
  ArrowDown01Icon,
  HomeIcon,
  CalculatorIconWrapper,
  CRMIcon,
  TaskIcon,
  MenuIcon,
  UserCircleIcon,
  BriefcaseIcon,
  SettingsIcon,
  UserIconWrapper as UserIcon,
} from '../src/components/HugeIconsWrapper';

type BrokerProfileOption = 'enabled' | 'disabled';
type ThemeOption = 'light' | 'dark';

export default function AppearanceScreen() {
  const { theme: themeMode, toggleTheme } = useTheme();
  const theme = getTheme(themeMode);
  const { profileImage, brokerLogo, setProfileImage, setBrokerLogo, userName } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);
  const placeholderIconColor =
    themeMode === 'light' ? theme.colors.text : theme.colors.textOnPrimary;

  const [brokerProfile, setBrokerProfile] = useState<BrokerProfileOption>('disabled');
  const [selectOpen, setSelectOpen] = useState(false);
  const [themeSelectOpen, setThemeSelectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [brokerLogoError, setBrokerLogoError] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getAuthenticatedUser();

      setProfileImage(userData.avatar || null);
      setProfileImageError(false);
      setBrokerLogo(userData.logo || userData.company?.avatar || null);
      setBrokerLogoError(false);

      if (typeof userData.useCompanyProfile === 'boolean') {
        setBrokerProfile(userData.useCompanyProfile ? 'enabled' : 'disabled');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os dados do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const setBrokerProfileAndPersist = async (value: BrokerProfileOption) => {
    if (isUpdatingProfile) return;

    const previous = brokerProfile;
    setBrokerProfile(value);
    setIsUpdatingProfile(true);

    try {
      const updatedUser = await authService.updateAuthenticatedUser({
        useCompanyProfile: value === 'enabled',
      });
      setBrokerProfile(updatedUser.useCompanyProfile ? 'enabled' : 'disabled');
    } catch (error: any) {
      setBrokerProfile(previous);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil da corretora');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const brokerProfileLabel = brokerProfile === 'enabled' ? 'Habilitado' : 'Desabilitado';
  const themeLabel = themeMode === 'light' ? 'Claro' : 'Escuro';

  const handleThemeChange = (newTheme: ThemeOption) => {
    setThemeSelectOpen(false);
    if (newTheme !== themeMode) {
      toggleTheme();
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'U';
    const trimmedName = name.trim();
    const names = trimmedName.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return trimmedName.substring(0, 1).toUpperCase();
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImageError(false);
      try {
        setIsUpdatingAvatar(true);
        const updatedUser = await authService.updateAvatar(uri);
        setProfileImage(updatedUser.avatar || uri);
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível atualizar a foto de perfil.');
      } finally {
        setIsUpdatingAvatar(false);
      }
    }
  };

  const pickBrokerLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para escolher um logotipo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        setBrokerLogoError(false);
        setIsUpdatingLogo(true);
        const updatedUser = await authService.updateBrokerLogo(uri);
        setBrokerLogo(updatedUser.logo || uri);
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível atualizar o logotipo da corretora.');
      } finally {
        setIsUpdatingLogo(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aparência</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando aparência...</Text>
            </View>
          ) : (
            <View style={styles.appearanceCard}>
              {/* Tema */}
              <View style={styles.selectSection}>
                <Text style={styles.itemTitle}>Tema do Aplicativo</Text>
                <Text style={styles.itemSubtitle}>
                  Personalize a aparência do aplicativo.
                </Text>
                
                {/* Theme Toggle Buttons */}
                <View style={styles.themeToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.themeToggleButton,
                      themeMode === 'light' && styles.themeToggleButtonActive,
                    ]}
                    onPress={() => handleThemeChange('light')}
                  >
                    <View style={[
                      styles.themeToggleIcon,
                      themeMode === 'light' && styles.themeToggleIconLight,
                    ]}>
                      <View style={styles.sunIcon}>
                        <View style={styles.sunCore} />
                        <View style={[styles.sunRay, { top: -2, left: '50%', marginLeft: -0.5 }]} />
                        <View style={[styles.sunRay, { bottom: -2, left: '50%', marginLeft: -0.5 }]} />
                        <View style={[styles.sunRay, { left: -2, top: '50%', marginTop: -0.5, transform: [{ rotate: '90deg' }] }]} />
                        <View style={[styles.sunRay, { right: -2, top: '50%', marginTop: -0.5, transform: [{ rotate: '90deg' }] }]} />
                      </View>
                    </View>
                    <Text style={[
                      styles.themeToggleText,
                      themeMode === 'light' && styles.themeToggleTextActive,
                    ]}>
                      Claro
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeToggleButton,
                      themeMode === 'dark' && styles.themeToggleButtonActive,
                    ]}
                    onPress={() => handleThemeChange('dark')}
                  >
                    <View style={[
                      styles.themeToggleIcon,
                      themeMode === 'dark' && styles.themeToggleIconDark,
                    ]}>
                      <View style={styles.moonIcon}>
                        <View style={styles.moonCore} />
                        <View style={styles.moonCrescent} />
                      </View>
                    </View>
                    <Text style={[
                      styles.themeToggleText,
                      themeMode === 'dark' && styles.themeToggleTextActive,
                    ]}>
                      Escuro
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Foto do Perfil */}
              <View style={styles.itemRow}>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Foto do Perfil</Text>
                  <Text style={styles.itemSubtitle}>Atualize a foto de perfil.</Text>
                </View>
                <View style={styles.imageContainer}>
                  <TouchableOpacity style={styles.avatarWrapper} onPress={pickProfileImage} disabled={isUpdatingAvatar}>
                    {profileImage && !profileImageError ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={styles.profileAvatar}
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                      <View style={[styles.placeholderAvatar, styles.placeholderIconCircle]}>
                        <UserIcon
                          size={32}
                          color={placeholderIconColor}
                        />
                      </View>
                    )}
                    <View style={styles.editBadge}>
                      {isUpdatingAvatar ? (
                        <ActivityIndicator size="small" color={theme.colors.text} />
                      ) : (
                        <EditIcon size={14} color={theme.colors.text} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Logotipo da Corretora */}
              <View style={styles.itemRow}>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Logotipo da Corretora</Text>
                  <Text style={styles.itemSubtitle}>
                    O logotipo só fica visível se a corretora vinculada permitir.
                  </Text>
                </View>
                <View style={styles.imageContainer}>
                  <TouchableOpacity
                    style={[
                      styles.logoWrapper,
                      (!brokerLogo || brokerLogoError) && styles.logoWrapperEmpty,
                    ]}
                    onPress={pickBrokerLogo}
                    disabled={isUpdatingLogo}
                  >
                    {brokerLogo && !brokerLogoError ? (
                      <Image
                        source={{ uri: brokerLogo }}
                        style={styles.logoImage}
                        resizeMode="cover"
                        onError={() => setBrokerLogoError(true)}
                      />
                    ) : (
                      <View style={styles.placeholderLogo}>
                        <BriefcaseIcon size={32} color={placeholderIconColor} />
                      </View>
                    )}
                    <View style={styles.editBadgeLogo}>
                      {isUpdatingLogo ? (
                        <ActivityIndicator size="small" color={theme.colors.text} />
                      ) : (
                        <EditIcon size={14} color={theme.colors.text} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Perfil da Corretora */}
              <View style={styles.selectSection}>
                <Text style={styles.itemTitle}>Perfil da Corretora</Text>
                <Text style={styles.itemSubtitle}>
                  Ao ativar, o perfil da corretora será usado nos PDFs de tabelas e cotações.
                </Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setSelectOpen((open) => !open)}
                    disabled={isUpdatingProfile}
                  >
                    <Text style={styles.selectButtonText}>{brokerProfileLabel}</Text>
                    {isUpdatingProfile ? (
                      <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    ) : (
                      <ArrowDown01Icon size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  {selectOpen && (
                    <View style={styles.selectDropdown}>
                      <TouchableOpacity
                        style={[styles.selectDropdownOption, brokerProfile === 'enabled' && styles.selectDropdownOptionActive]}
                        onPress={() => {
                          setSelectOpen(false);
                          setBrokerProfileAndPersist('enabled');
                        }}
                      >
                        <Text
                          style={[
                            styles.selectDropdownOptionText,
                            brokerProfile === 'enabled' && styles.selectDropdownOptionTextActive,
                          ]}
                        >
                          Habilitado
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.selectDropdownOption,
                          styles.selectDropdownOptionDivider,
                          brokerProfile === 'disabled' && styles.selectDropdownOptionActive,
                        ]}
                        onPress={() => {
                          setSelectOpen(false);
                          setBrokerProfileAndPersist('disabled');
                        }}
                      >
                        <Text
                          style={[
                            styles.selectDropdownOptionText,
                            brokerProfile === 'disabled' && styles.selectDropdownOptionTextActive,
                          ]}
                        >
                          Desabilitado
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
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
            icon={<CalculatorIconWrapper size={24} color={theme.colors.textSecondary} />}
            label="Cotações"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/quotes')}
          />
          <BottomNavItem
            icon={<CRMIcon size={24} color={theme.colors.textSecondary} />}
            label="CRM"
            theme={theme}
            insets={insets}
          />
          <BottomNavItem
            icon={<TaskIcon size={24} color={theme.colors.textSecondary} />}
            label="Tarefas"
            theme={theme}
            insets={insets}
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
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl * 2,
    },
    appearanceCard: {
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      padding: theme.spacing.lg,
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
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: theme.spacing.md,
    },
    itemTextContainer: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    itemTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    itemSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    imageContainer: {
      width: 80,
      height: 80,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    avatarWrapper: {
      width: 70,
      height: 70,
      position: 'relative',
    },
    profileAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundMuted,
    },
    logoWrapper: {
      width: 80,
      height: 60,
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    logoWrapperEmpty: {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    placeholderIcon: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.md,
    },
    placeholderIconCircle: {
      borderRadius: 999,
    },
    placeholderAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    placeholderAvatarText: {
      fontSize: 28,
      fontFamily: theme.fonts.bold,
      color: themeMode === 'light' ? '#FFFFFF' : theme.colors.textOnPrimary,
    },
    placeholderLogo: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    editBadgeLogo: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    divider: {
      height: 1,
      backgroundColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      marginVertical: theme.spacing.md,
    },
    selectSection: {
      marginTop: theme.spacing.md,
    },
    selectContainer: {
      marginTop: theme.spacing.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    selectButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    selectButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    selectDropdown: {
      borderTopWidth: 1,
      borderTopColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    selectDropdownOption: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    selectDropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    selectDropdownOptionDivider: {
      borderTopWidth: 1,
      borderTopColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    selectDropdownOptionActive: {
      backgroundColor: theme.colors.primary + '08',
    },
    selectDropdownOptionText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    selectDropdownOptionTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.bold,
    },
    themeToggleContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    themeToggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md + 2,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    themeToggleButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '08',
    },
    themeToggleIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeToggleIconLight: {
      // Estilo adicional para ícone light ativo
    },
    themeToggleIconDark: {
      // Estilo adicional para ícone dark ativo
    },
    sunIcon: {
      width: 16,
      height: 16,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sunCore: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: themeMode === 'light' ? theme.colors.primary : theme.colors.textSecondary,
    },
    sunRay: {
      position: 'absolute',
      width: 1,
      height: 4,
      backgroundColor: themeMode === 'light' ? theme.colors.primary : theme.colors.textSecondary,
    },
    moonIcon: {
      width: 16,
      height: 16,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    moonCore: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: themeMode === 'dark' ? theme.colors.primary : theme.colors.textSecondary,
    },
    moonCrescent: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.background,
      right: 0,
      top: 1,
    },
    themeToggleText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    themeToggleTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.bold,
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
