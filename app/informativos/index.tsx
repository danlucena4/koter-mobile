import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  InformationCircleIcon,
  Megaphone03Icon,
  Notification01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { getTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationsContext';
import { authService } from '../../src/services/auth.service';
import { informativeService } from '../../src/services/informative.service';
import { Informative, InformativeCategory } from '../../src/@types/informative';
import { ArrowLeft02Icon } from '../../src/components';
import { NotificationIcon } from '../../src/components/HugeIconsWrapper';

type CategoryFilter = 'all' | InformativeCategory;

const PAGE_SIZE = 15;

const categoryFilters: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: InformativeCategory.UPDATE, label: 'Atualizações' },
  { id: InformativeCategory.CAMPAIGN, label: 'Campanhas' },
  { id: InformativeCategory.NEWS, label: 'Notícias' },
];

const mergeById = <T extends { id: string }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
};

const categoryMeta = (category: InformativeCategory | number) => {
  if (category === InformativeCategory.CAMPAIGN) {
    return {
      label: 'Campanha',
      icon: Megaphone03Icon,
      iconColor: '#f59e0b',
      iconBackground: 'rgba(245, 158, 11, 0.14)',
    };
  }

  if (category === InformativeCategory.UPDATE) {
    return {
      label: 'Atualização',
      icon: Notification01Icon,
      iconColor: '#2f7dff',
      iconBackground: 'rgba(47, 125, 255, 0.14)',
    };
  }

  return {
    label: 'Notícia',
    icon: InformationCircleIcon,
    iconColor: '#22c55e',
    iconBackground: 'rgba(34, 197, 94, 0.14)',
  };
};

export default function InformativesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme, themeMode, insets);
  const { openNotifications, unreadCount } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [items, setItems] = useState<Informative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userStateId, setUserStateId] = useState<string | undefined>(undefined);
  const [userCompanyId, setUserCompanyId] = useState<string | undefined>(undefined);
  const [isUserContextReady, setIsUserContextReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const user = await authService.getAuthenticatedUser();
        setUserStateId(user.state?.id || undefined);
        setUserCompanyId(user.company?.id || undefined);
      } catch {
        setUserStateId(undefined);
        setUserCompanyId(undefined);
      } finally {
        setIsUserContextReady(true);
      }
    };

    loadUserContext();
  }, []);

  const fetchInformatives = useCallback(
    async (page: number, reset: boolean) => {
      if (!isUserContextReady) return;
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await informativeService.fetchActiveInformatives(
          {
            page,
            pageSize: PAGE_SIZE,
          },
          {
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            stateId: userStateId,
            companyId: userCompanyId,
            search: activeSearch || undefined,
          }
        );

        const nextItems = Array.isArray(response.data) ? response.data : [];
        setItems((prev) => (reset ? nextItems : mergeById([...prev, ...nextItems])));
        setCurrentPage(response.currentPage || page);
        setTotalPages(Math.max(response.totalPages || 1, 1));
        setError(null);
      } catch (fetchError: unknown) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar os informativos.';
        setError(message);
        if (reset) {
          setItems([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [activeSearch, isUserContextReady, selectedCategory, userCompanyId, userStateId]
  );

  useEffect(() => {
    if (!isUserContextReady) return;
    fetchInformatives(1, true);
  }, [fetchInformatives, isUserContextReady]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInformatives(1, true);
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore) return;
    if (currentPage >= totalPages) return;
    fetchInformatives(currentPage + 1, false);
  };

  const emptyStateMessage = useMemo(() => {
    if (error) return error;
    if (activeSearch) return 'Nenhum informativo encontrado para a busca atual.';
    return 'No momento, não há informativos disponíveis.';
  }, [activeSearch, error]);

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informativos</Text>
          <TouchableOpacity style={styles.headerButton} onPress={openNotifications}>
            <NotificationIcon size={20} color={theme.colors.text} />
            {unreadCount > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.25}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.searchContainer}>
                <HugeiconsIcon icon={Search01Icon} size={18} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar informativos..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchInput}
                  onChangeText={setSearchInput}
                  returnKeyType="search"
                />
              </View>

              <ScrollView
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                style={styles.filterPill}
                contentContainerStyle={styles.filterPillContent}
              >
                {categoryFilters.map((category) => {
                  const isActive = selectedCategory === category.id;
                  return (
                    <TouchableOpacity
                      key={`${category.id}`}
                      style={[styles.filterButton, isActive && styles.filterButtonActive]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text
                        numberOfLines={1}
                        style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Carregando informativos...</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>{emptyStateMessage}</Text>
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const config = categoryMeta(item.category);
            return (
              <TouchableOpacity
                style={[styles.itemRow, index % 2 === 1 && styles.itemRowAlt]}
                onPress={() =>
                  router.push({
                    pathname: '/informativos/[id]',
                    params: { id: item.id },
                  })
                }
              >
                <View style={[styles.itemIcon, { backgroundColor: config.iconBackground }]}>
                  <HugeiconsIcon icon={config.icon} size={18} color={config.iconColor} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {config.label} - {formatDate(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) => {
  const isDark = themeMode === 'dark';
  const headerBorder = isDark ? '#1f1f23' : '#e5e7eb';
  const searchBackground = isDark ? '#0f1014' : '#ffffff';
  const searchBorder = isDark ? '#1f1f23' : '#e5e7eb';
  const filterBackground = isDark ? '#0d0e12' : '#ffffff';
  const filterBorder = isDark ? '#1f1f23' : '#e5e7eb';
  const rowAlt = isDark ? '#0f1014' : '#fafafa';
  const rowBorder = isDark ? '#1a1b20' : '#eceef2';
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
      borderBottomColor: headerBorder,
    },
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#15161c' : '#f4f4f5',
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    notificationBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    listContent: {
      paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
    },
    listHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: searchBorder,
      backgroundColor: searchBackground,
      paddingHorizontal: theme.spacing.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSize.md,
    },
    filterPill: {
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: filterBorder,
      backgroundColor: filterBackground,
    },
    filterPillContent: {
      flexDirection: 'row',
      padding: 4,
      gap: 2,
    },
    filterButton: {
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 30,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    filterButtonActive: {
      backgroundColor: '#2f7dff',
    },
    filterButtonText: {
      fontSize: 12,
      lineHeight: 14,
      includeFontPadding: false,
      fontFamily: theme.fonts.semiBold,
      color: mutedText,
    },
    filterButtonTextActive: {
      color: '#ffffff',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: rowBorder,
      backgroundColor: theme.colors.background,
    },
    itemRowAlt: {
      backgroundColor: rowAlt,
    },
    itemIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    itemContent: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      lineHeight: 28,
    },
    itemSubtitle: {
      marginTop: 2,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: mutedText,
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
      fontFamily: theme.fonts.medium,
    },
    emptyText: {
      textAlign: 'center',
      color: mutedText,
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
    },
    footerLoading: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
  });
};
