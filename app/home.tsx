import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import {
  NotificationIcon,
  ArrowDownIcon,
  CalculatorIconWrapper,
  ArrowRightIcon,
  HomeIcon,
  MenuIcon,
  TableIcon,
} from '../src/components/HugeIconsWrapper';
import api from '../src/lib/api';
import { authService } from '../src/services/auth.service';
import MobileBankingIcon from '../src/assets/images/mobile-banking 1.svg';
import BannerMobile from '../src/assets/images/Banner-Mobile2.svg';

const { width } = Dimensions.get('window');
// Aspect ratio fixo do banner (altura / largura)
const bannerAspectRatio = 126 / 293;

type LocationOption = {
  cityId: string;
  cityName: string;
  stateId: string;
  stateAbbreviation: string;
  label: string;
};

// Função auxiliar para obter iniciais do nome
const getInitials = (name: string): string => {
  if (!name || name.trim() === '') {
    console.log('⚠️ getInitials: nome vazio, retornando "U"');
    return 'U';
  }
  
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    const initial = nameParts[0].charAt(0).toUpperCase();
    console.log('✅ getInitials:', name, '→', initial);
    return initial;
  }
  
  // Pega a primeira letra do primeiro e do último nome
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  const initials = `${firstInitial}${lastInitial}`;
  
  console.log('✅ getInitials:', name, '→', initials);
  return initials;
};

export default function HomeScreen() {
  const { theme: themeMode } = useTheme();
  const { userName, profileImage } = useUser();
  
  // Em desenvolvimento, ignora URLs de localhost (não funcionam no mobile)
  const hasValidImage = profileImage && 
                        profileImage.trim() !== '' && 
                        !profileImage.includes('localhost');
  
  console.log('🏠 HomeScreen - userName:', userName);
  console.log('🏠 HomeScreen - profileImage:', profileImage);
  console.log('🏠 HomeScreen - hasValidImage:', hasValidImage);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme, themeMode, insets);
  const [locationLabel, setLocationLabel] = useState('Selecione a cidade');
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsPage, setLocationsPage] = useState(1);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const bannerWidth = width - theme.spacing.lg * 2;
  const bannerHeight = bannerWidth * bannerAspectRatio;

  useEffect(() => {
    loadUserLocation();
  }, []);

  const mergeLocations = (items: LocationOption[]) => {
    const map = new Map<string, LocationOption>();
    items.forEach((item) => {
      map.set(`${item.cityId}-${item.stateId}`, item);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!isLocationModalOpen) return;

    const handler = setTimeout(() => {
      fetchLocations(1, locationSearch);
    }, 350);

    return () => clearTimeout(handler);
  }, [locationSearch, isLocationModalOpen]);

  const loadUserLocation = async () => {
    try {
      const userData = await authService.getAuthenticatedUser();
      const label =
        userData.city?.name && userData.state?.abbreviation
          ? `${userData.city.name} - ${userData.state.abbreviation}`
          : 'Selecione a cidade';

      setLocationLabel(label);
      setSelectedCityId(userData.city?.id || null);
    } catch {
      setLocationLabel('Selecione a cidade');
    }
  };

  const fetchLocations = async (page = 1, search = '') => {
    if (isLoadingLocations) return;

    try {
      setIsLoadingLocations(true);
      const response = await api.get('/locations/search', {
        params: {
          page,
          pageSize: 50,
          search: search ? search : undefined,
        },
      });

      const data = response.data?.data || [];
      const meta = response.data?.meta;

      setLocations((prev) => mergeLocations(page === 1 ? data : [...prev, ...data]));
      setLocationsPage(page);
      setHasMoreLocations(Boolean(meta?.currentPage < meta?.totalPages));
    } catch (error: any) {
      setHasMoreLocations(false);
      setLocations((prev) => (page === 1 ? [] : prev));
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const openLocationModal = () => {
    setIsLocationModalOpen(true);
    setLocationSearch('');
    fetchLocations(1, '');
  };

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
  };

  const handleLoadMoreLocations = () => {
    if (isLoadingLocations || !hasMoreLocations) return;
    fetchLocations(locationsPage + 1, locationSearch);
  };

  const handleSelectLocation = async (location: LocationOption) => {
    if (isUpdatingLocation) return;

    try {
      setIsUpdatingLocation(true);
      await authService.updateAuthenticatedUser({
        cityId: location.cityId,
        stateId: location.stateId,
      });
      setLocationLabel(location.label);
      setSelectedCityId(location.cityId);
      closeLocationModal();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel atualizar sua localidade.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Avatar do usuário */}
            <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/settings')}>
              {hasValidImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(userName || 'Usuário')}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Olá, {userName || 'Usuário'}</Text>
              <TouchableOpacity style={styles.locationSelector} onPress={openLocationModal}>
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
                {isUpdatingLocation ? (
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                ) : (
                  <ArrowDownIcon size={14} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <NotificationIcon size={24} color={theme.colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Banner */}
          <View style={[styles.bannerContainer, { height: Math.floor(bannerHeight) }]}>
            <BannerMobile width={bannerWidth} height={Math.floor(bannerHeight)} />
          </View>

          <View style={styles.actionsContainer}>
            {/* Create Quote Action */}
            <TouchableOpacity
              style={[styles.createQuoteCard, styles.actionCardPrimary]}
              onPress={() => router.push('/quotes')}
            >
              <View style={styles.actionCardHeader}>
                <View style={styles.createQuoteIconContainer}>
                  <MobileBankingIcon width={44} height={44} />
                </View>
                <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.createQuoteTitle}>Criar Cotação</Text>
                <Text style={styles.createQuoteSubtitle}>Inicie uma nova Cotação</Text>
              </View>
            </TouchableOpacity>

            {/* Tables Action */}
            <TouchableOpacity
              style={[styles.createQuoteCard, styles.actionCardSecondary]}
              onPress={() => router.push({ pathname: '/coming-soon', params: { title: 'Tabelas' } })}
            >
              <View style={styles.actionCardHeader}>
                <View style={styles.createQuoteIconContainer}>
                  <TableIcon size={38} color={theme.colors.textSecondary} />
                </View>
                <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.createQuoteTitle}>Página de Tabelas</Text>
                <Text style={styles.createQuoteSubtitle}>Consulte suas tabelas</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          transparent
          animationType="slide"
          visible={isLocationModalOpen}
          onRequestClose={closeLocationModal}
        >
          <View style={styles.locationModalOverlay}>
            <Pressable style={styles.locationModalBackdrop} onPress={closeLocationModal} />
            <View style={styles.locationModalCard}>
              <View style={styles.locationModalHeader}>
                <Text style={styles.locationModalTitle}>Selecionar localidade</Text>
                <TouchableOpacity onPress={closeLocationModal} style={styles.locationModalClose}>
                  <Text style={styles.locationModalCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.locationSearchWrapper}>
                <TextInput
                  style={styles.locationSearchInput}
                  placeholder="Pesquise por cidade ou estado"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  autoCapitalize="words"
                />
              </View>

              {isLoadingLocations && locations.length === 0 ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.locationLoadingText}>Buscando localidades...</Text>
                </View>
              ) : (
                <FlatList
                  data={locations}
                  keyExtractor={(item) => `${item.cityId}-${item.stateId}`}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.locationList}
                  onEndReached={handleLoadMoreLocations}
                  onEndReachedThreshold={0.2}
                  ListEmptyComponent={
                    <Text style={styles.locationEmptyText}>Nenhuma localidade encontrada.</Text>
                  }
                  ListFooterComponent={
                    isLoadingLocations ? (
                      <View style={styles.locationFooterLoading}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      </View>
                    ) : null
                  }
                  renderItem={({ item }) => {
                    const isSelected = item.cityId === selectedCityId;
                    return (
                      <TouchableOpacity
                        style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                        onPress={() => handleSelectLocation(item)}
                        disabled={isUpdatingLocation}
                      >
                        <Text style={[styles.locationItemLabel, isSelected && styles.locationItemLabelSelected]}>
                          {item.label}
                        </Text>
                        {isSelected && <Text style={styles.locationItemBadge}>Selecionado</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <BottomNavItem
            icon={<HomeIcon size={24} color={theme.colors.primary} />}
            label="Início"
            active
            theme={theme}
            insets={insets}
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
            onPress={() => router.push('/quotes')}
            insets={insets}
          />
          <BottomNavItem
            icon={<MenuIcon size={24} color={theme.colors.textSecondary} />}
            label="Menu"
            theme={theme}
            onPress={() => router.push('/settings')}
            insets={insets}
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

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) =>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontFamily: theme.fonts.bold,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    locationSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      maxWidth: 140,
    },
    locationModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    locationModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    locationModalCard: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      maxHeight: '75%',
    },
    locationModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    locationModalTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    locationModalClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationModalCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    locationSearchWrapper: {
      marginBottom: theme.spacing.md,
    },
    locationSearchInput: {
      height: 48,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
      fontFamily: theme.fonts.regular,
    },
    locationList: {
      paddingBottom: theme.spacing.lg,
    },
    locationItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    locationItemLabel: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    locationItemLabelSelected: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    locationItemBadge: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    locationLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
    },
    locationLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    locationFooterLoading: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    locationEmptyText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      paddingVertical: theme.spacing.lg,
    },
    notificationButton: {
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.error,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl * 2,
      flexGrow: 1,
    },
    bannerContainer: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    actionsContainer: {
      flex: 1,
      gap: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    createQuoteCard: {
      flex: 1,
      minHeight: 160,
      backgroundColor: theme.colors.inputBackground,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    actionCardPrimary: {
      backgroundColor: themeMode === 'dark' ? '#1F1F1F' : '#F7F7F7',
    },
    actionCardSecondary: {
      backgroundColor: themeMode === 'dark' ? '#1A1A1A' : '#F2F2F2',
    },
    actionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    createQuoteIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    createQuoteTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      marginBottom: 4,
    },
    createQuoteSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
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
