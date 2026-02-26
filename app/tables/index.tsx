import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { getTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationsContext';
import api from '../../src/lib/api';
import { authService } from '../../src/services/auth.service';
import {
  NotificationIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  HomeIcon,
  MenuIcon,
  TableIcon,
  CalculatorIconWrapper,
} from '../../src/components/HugeIconsWrapper';
import { ArrowLeft02Icon } from '../../src/components';

type Insurance = {
  id: string;
  name: string;
  icon?: string | null;
};

type Operator = {
  id: string;
  name: string;
  image?: string | null;
  managerImage?: string | null;
  managerName?: string | null;
  plansCount?: number | null;
};

type OperatorType = 'Physical' | 'Adhesion' | 'Legal';

const PAGE_SIZE = 20;

const operatorTabs: Array<{ key: OperatorType; label: string }> = [
  { key: 'Physical', label: 'Individual' },
  { key: 'Adhesion', label: 'Adesão' },
  { key: 'Legal', label: 'PJ' },
];

const mergeById = <T extends { id: string }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

const getInitials = (value?: string | null) => {
  if (!value) return '#';
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function TablesScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);
  const { openNotifications } = useNotifications();

  const [userStateId, setUserStateId] = useState<string | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [insurancePage, setInsurancePage] = useState(1);
  const [insuranceHasMore, setInsuranceHasMore] = useState(true);
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [isInsuranceLoading, setIsInsuranceLoading] = useState(false);

  const [operatorType, setOperatorType] = useState<OperatorType>('Physical');
  const [operatorSearchInput, setOperatorSearchInput] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorsPage, setOperatorsPage] = useState(1);
  const [operatorsHasMore, setOperatorsHasMore] = useState(true);
  const [isOperatorsLoading, setIsOperatorsLoading] = useState(false);
  const [isOperatorsFetchingMore, setIsOperatorsFetchingMore] = useState(false);
  const [operatorsError, setOperatorsError] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadUserState = async () => {
      try {
        const user = await authService.getAuthenticatedUser();
        setUserStateId(user.state?.id || null);
      } catch {
        setUserStateId(null);
      }
    };

    loadUserState();
  }, []);

  useEffect(() => {
    if (!userStateId) return;
    fetchInsurances(1, '', true);
  }, [userStateId]);

  useEffect(() => {
    if (!isInsuranceModalOpen) return;
    const handler = setTimeout(() => {
      fetchInsurances(1, insuranceSearch, false);
    }, 350);

    return () => clearTimeout(handler);
  }, [insuranceSearch, isInsuranceModalOpen]);

  useEffect(() => {
    if (!selectedInsurance || !userStateId) return;
    setOperators([]);
    setOperatorsPage(1);
    setOperatorsHasMore(true);
    fetchOperators(1, true);
  }, [selectedInsurance?.id, operatorType, operatorSearch, userStateId]);

  const fetchInsurances = async (page = 1, search = '', syncSelection = false) => {
    if (isInsuranceLoading) return;
    try {
      setIsInsuranceLoading(true);
      const response = await api.get('/insurances/active', {
        params: {
          page,
          pageSize: PAGE_SIZE,
          search: search ? search : undefined,
          stateId: userStateId || undefined,
        },
      });

      const data = response.data?.data || [];
      const meta = response.data || {};
      const nextList = page === 1 ? data : mergeById([...insurances, ...data]);

      setInsurances(nextList);
      setInsurancePage(page);
      setInsuranceHasMore(Boolean(meta?.currentPage < meta?.totalPages));

      if (syncSelection && nextList.length) {
        if (!selectedInsurance || !nextList.some((item: Insurance) => item.id === selectedInsurance.id)) {
          setSelectedInsurance(nextList[0]);
        }
      }
    } catch {
      setInsuranceHasMore(false);
    } finally {
      setIsInsuranceLoading(false);
    }
  };

  const fetchOperators = async (page = 1, reset = false) => {
    if (!selectedInsurance || !userStateId) return;
    if (isOperatorsLoading || isOperatorsFetchingMore) return;

    try {
      if (reset) {
        setIsOperatorsLoading(true);
        setOperatorsError(null);
      } else {
        setIsOperatorsFetchingMore(true);
      }

      const response = await api.get('/operators/active', {
        params: {
          page,
          pageSize: PAGE_SIZE,
          search: operatorSearch ? operatorSearch : undefined,
          type: operatorType,
          stateId: userStateId,
          insuranceName: selectedInsurance.name,
          summary: true,
        },
      });

      const data = response.data?.data || [];
      const meta = response.data || {};
      setOperators((prev) => (reset ? data : mergeById([...prev, ...data])));
      setOperatorsPage(page);
      setOperatorsHasMore(Boolean(meta?.currentPage < meta?.totalPages));
    } catch {
      setOperatorsError('Não foi possível carregar as tabelas.');
      setOperatorsHasMore(false);
      if (reset) setOperators([]);
    } finally {
      setIsOperatorsLoading(false);
      setIsOperatorsFetchingMore(false);
    }
  };

  const handleInsuranceSelect = (insurance: Insurance) => {
    setSelectedInsurance(insurance);
    setIsInsuranceModalOpen(false);
    setInsuranceSearch('');
  };

  const handleLoadMoreInsurances = () => {
    if (isInsuranceLoading || !insuranceHasMore) return;
    fetchInsurances(insurancePage + 1, insuranceSearch, false);
  };

  const handleLoadMoreOperators = () => {
    if (isOperatorsLoading || isOperatorsFetchingMore || !operatorsHasMore) return;
    fetchOperators(operatorsPage + 1, false);
  };

  const handleSearchSubmit = () => {
    const trimmed = operatorSearchInput.trim();
    setOperatorSearch(trimmed);
  };

  const renderInsuranceItem = ({ item }: { item: Insurance }) => {
    const isActive = selectedInsurance?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.insuranceOption, isActive && styles.insuranceOptionActive]}
        onPress={() => handleInsuranceSelect(item)}
      >
        <Text style={[styles.insuranceOptionText, isActive && styles.insuranceOptionTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderOperatorItem = ({ item, index }: { item: Operator; index: number }) => {
    const hasLogo = item.image && !logoErrors[item.id];
    const metaParts = [
      item.managerName?.trim(),
      item.plansCount ? `${item.plansCount} ${item.plansCount === 1 ? 'Estado' : 'Estados'}` : null,
    ].filter(Boolean);
    const isFirst = index === 0;
    const isLast = index === operators.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.operatorItem,
          isFirst && styles.operatorItemFirst,
          isLast && styles.operatorItemLast,
        ]}
        onPress={() => {
          if (!selectedInsurance?.id) return;
          router.push({
            pathname: '/tables/[operatorId]',
            params: {
              operatorId: item.id,
              insuranceId: selectedInsurance.id,
              operatorType,
            },
          });
        }}
      >
        <View style={styles.operatorInfo}>
          <View style={styles.operatorAvatar}>
            {hasLogo ? (
              <Image
                source={{ uri: item.image as string }}
                style={styles.operatorAvatarImage}
                onError={() => setLogoErrors((prev) => ({ ...prev, [item.id]: true }))}
              />
            ) : (
              <Text style={styles.operatorAvatarText}>{getInitials(item.name)}</Text>
            )}
          </View>
          <View style={styles.operatorText}>
            <Text style={styles.operatorName} numberOfLines={1}>
              {item.name}
            </Text>
            {metaParts.length > 0 && (
              <Text style={styles.operatorMeta} numberOfLines={1}>
                {metaParts.join(' • ')}
              </Text>
            )}
          </View>
        </View>
        <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <TouchableOpacity
        style={styles.insuranceSelector}
        onPress={() => setIsInsuranceModalOpen(true)}
      >
        <Text style={styles.insuranceSelectorText} numberOfLines={1}>
          {selectedInsurance?.name || 'Selecione o seguro'}
        </Text>
        <ArrowDownIcon size={14} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        {operatorTabs.map((tab) => {
          const isActive = operatorType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setOperatorType(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchContainer}>
        <HugeiconsIcon icon={Search01Icon} size={16} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar plano..."
          placeholderTextColor={theme.colors.textSecondary}
          value={operatorSearchInput}
          onChangeText={setOperatorSearchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        <TouchableOpacity style={styles.searchAction} onPress={handleSearchSubmit}>
          <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tabelas</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openNotifications}
          >
            <NotificationIcon size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {isOperatorsLoading && operators.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando tabelas...</Text>
          </View>
        ) : (
          <FlatList
            data={operators}
            keyExtractor={(item) => item.id}
            renderItem={renderOperatorItem}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {operatorsError || 'Nenhuma tabela encontrada para o filtro selecionado.'}
              </Text>
            }
            ListFooterComponent={
              isOperatorsFetchingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
            onEndReached={handleLoadMoreOperators}
            onEndReachedThreshold={0.2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={isInsuranceModalOpen} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setIsInsuranceModalOpen(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o seguro</Text>
            <View style={styles.modalSearch}>
              <HugeiconsIcon icon={Search01Icon} size={16} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Pesquisar seguro..."
                placeholderTextColor={theme.colors.textSecondary}
                value={insuranceSearch}
                onChangeText={setInsuranceSearch}
              />
            </View>
            {isInsuranceLoading && insurances.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Buscando seguros...</Text>
              </View>
            ) : (
              <FlatList
                data={insurances}
                keyExtractor={(item) => item.id}
                renderItem={renderInsuranceItem}
                onEndReached={handleLoadMoreInsurances}
                onEndReachedThreshold={0.2}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Nenhum seguro encontrado para a pesquisa atual.
                  </Text>
                }
                contentContainerStyle={styles.modalList}
              />
            )}
          </View>
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
            icon={<TableIcon size={24} color={theme.colors.primary} />}
            label="Tabela"
            active
            theme={theme}
            insets={insets}
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
      <View style={[styles.bottomNavIconContainer, active && styles.bottomNavIconActive]}>
        {icon}
      </View>
      <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) => {
  const isDark = themeMode === 'dark';
  const cardBackground = isDark ? '#151518' : theme.colors.cardBackground;
  const cardBorder = isDark ? '#1f1f22' : theme.colors.border;
  const tabActive = '#2F7DFF';
  const tabInactive = isDark ? '#1f1f23' : theme.colors.backgroundLight;
  const mutedText = isDark ? '#9ca3af' : theme.colors.textSecondary;

  return StyleSheet.create({
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
      borderBottomColor: cardBorder,
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    listHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    insuranceSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: cardBackground,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    insuranceSelectorText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: tabInactive,
      borderRadius: theme.borderRadius.full,
      padding: 4,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    tabItemActive: {
      backgroundColor: tabActive,
    },
    tabText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: mutedText,
    },
    tabTextActive: {
      color: theme.colors.white,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBackground,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.text,
      paddingVertical: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    searchAction: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    listContent: {
      paddingBottom: 90 + insets.bottom,
    },
    operatorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
      backgroundColor: cardBackground,
      marginHorizontal: theme.spacing.lg,
    },
    operatorItemFirst: {
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      marginTop: theme.spacing.md,
    },
    operatorItemLast: {
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
      borderBottomWidth: 0,
      marginBottom: theme.spacing.md,
    },
    operatorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    operatorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#f4f4f5' : '#f4f4f5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    operatorAvatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      resizeMode: 'contain',
    },
    operatorAvatarText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: '#6b7280',
    },
    operatorText: {
      flex: 1,
    },
    operatorName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    operatorMeta: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      marginTop: 2,
    },
    emptyText: {
      textAlign: 'center',
      color: mutedText,
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      fontFamily: theme.fonts.regular,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    loadingText: {
      fontSize: theme.fontSize.sm,
      color: mutedText,
      fontFamily: theme.fonts.regular,
    },
    footerLoading: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      top: '20%',
      maxHeight: '60%',
      backgroundColor: cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    modalTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    modalSearch: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: cardBorder,
      marginBottom: theme.spacing.md,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.text,
      paddingVertical: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    modalList: {
      paddingBottom: theme.spacing.md,
    },
    insuranceOption: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
    },
    insuranceOptionActive: {
      backgroundColor: isDark ? '#232327' : theme.colors.backgroundLight,
    },
    insuranceOptionText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    insuranceOptionTextActive: {
      color: theme.colors.primary,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: theme.spacing.xs,
      paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
      borderTopWidth: 1,
      borderTopColor: cardBorder,
      backgroundColor: theme.colors.background,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 70 + insets.bottom,
    },
    bottomNavItem: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minWidth: 64,
    },
    bottomNavIconContainer: {
      padding: 6,
      borderRadius: theme.borderRadius.full,
    },
    bottomNavIconActive: {
      backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(99,102,241,0.12)',
    },
    bottomNavLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: mutedText,
    },
    bottomNavLabelActive: {
      color: theme.colors.primary,
    },
  });
};
