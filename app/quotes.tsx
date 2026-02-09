import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  Linking,
  Share,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  FilterEditIcon,
  Search01Icon,
  Mortarboard01Icon,
  Settings01Icon,
  Share01Icon,
  ViewIcon,
  Copy01Icon,
  Delete01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import api from '../src/lib/api';
import {
  ArrowRightIcon,
  HomeIcon,
  MenuIcon,
  TableIcon,
  CalculatorIconWrapper,
} from '../src/components/HugeIconsWrapper';

type QuoteItem = {
  id: string;
  slug: string;
  client?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  status?: number;
  views?: number | null;
};

type QuoteDetails = {
  id: string;
  slug: string;
  client?: string | null;
  productsIds?: string[];
  plans?: Array<{
    id: string;
    name: string;
    managerName?: string | null;
    quoteType?: 'HEALTH' | 'ODONTO';
    image?: string | null;
    managerImage?: string | null;
    tables?: Array<{
      id: string;
      products: Array<{
        id: string;
        name: string;
        accommodation?: { name: string } | null;
      }>;
    }>;
  }>;
};

type QuotesResponse = {
  data: QuoteItem[];
  total: number;
  totalPages: number;
  currentPage: number;
};

type TabOption = 'list' | 'kanban';
type CategoryFilter = 'all' | 0 | 1;

type KanbanBoard = {
  label: string;
  status: number;
  color: string;
  badgeColor: string;
};

const PAGE_SIZE = 10;

const getInitial = (value?: string | null) => {
  if (!value) return '#';
  return value.trim().charAt(0).toUpperCase();
};

const formatQuoteDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(
    date.getHours(),
  )}h`;
};

const avatarPalette = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7D2FE', '#FED7AA', '#BBF7D0'];
const FILTER_MENU_WIDTH = 200;

const QUOTE_STATUS = {
  Sent: 0,
  InNegotiation: 1,
  Closed: 2,
  AfterSales: 3,
};

const categoryOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Pessoa Física', value: 0 },
  { label: 'Pessoa Jurídica', value: 1 },
];

const getAvatarColor = (id: string) => {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarPalette[seed % avatarPalette.length];
};

const getStatusMeta = (status?: number) => {
  switch (status) {
    case QUOTE_STATUS.Sent:
      return { label: 'Enviada', color: '#F97316', tint: 'rgba(249,115,22,0.18)' };
    case QUOTE_STATUS.InNegotiation:
      return { label: 'Em Negociação', color: '#3B82F6', tint: 'rgba(59,130,246,0.18)' };
    case QUOTE_STATUS.Closed:
      return { label: 'Em Fechamento', color: '#22C55E', tint: 'rgba(34,197,94,0.18)' };
    case QUOTE_STATUS.AfterSales:
      return { label: 'Pós venda', color: '#ff00dd', tint: 'rgba(255,0,221,0.18)' };
    default:
      return { label: 'Enviada', color: '#F97316', tint: 'rgba(249,115,22,0.18)' };
  }
};

const formatKanbanDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export default function QuotesScreen() {
  const { theme: themeMode } = useTheme();
  const { userName } = useUser();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);

  const [tab, setTab] = useState<TabOption>('list');
  const [search, setSearch] = useState('');
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMenuPosition, setFilterMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [kanbanData, setKanbanData] = useState<Record<number, { items: QuoteItem[]; total: number }>>(
    {},
  );
  const [isKanbanLoading, setIsKanbanLoading] = useState(false);
  const [kanbanError, setKanbanError] = useState<string | null>(null);
  const filterButtonRef = useRef<View | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);
  const [quoteActionTab, setQuoteActionTab] = useState<'settings' | 'send'>('settings');
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  const [isTextShareOpen, setIsTextShareOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [shareText, setShareText] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);
  const [isDuplicatingQuote, setIsDuplicatingQuote] = useState(false);

  const tutorialVideoId = 'nykAtIxx2RY';
  const tutorialVideoUrl = `https://www.youtube.com/watch?v=${tutorialVideoId}`;
  const tutorialThumbnailUrl = `https://img.youtube.com/vi/${tutorialVideoId}/hqdefault.jpg`;

  const kanbanBoards = useMemo<KanbanBoard[]>(
    () => [
      {
        label: 'Cotação Enviada',
        status: QUOTE_STATUS.Sent,
        color: '#F97316',
        badgeColor: '#F97316',
      },
      {
        label: 'Em Negociação',
        status: QUOTE_STATUS.InNegotiation,
        color: '#3B82F6',
        badgeColor: '#3B82F6',
      },
      {
        label: 'Em Fechamento',
        status: QUOTE_STATUS.Closed,
        color: '#22C55E',
        badgeColor: '#22C55E',
      },
      {
        label: 'Pós venda',
        status: QUOTE_STATUS.AfterSales,
        color: theme.colors.primary,
        badgeColor: theme.colors.primary,
      },
    ],
    [theme.colors.primary],
  );

  const handleOpenTutorial = () => setIsTutorialOpen(true);
  const handleCloseTutorial = () => setIsTutorialOpen(false);
  const handleWatchTutorial = () => {
    Linking.openURL(tutorialVideoUrl);
  };

  const handleOpenQuote = (quote: QuoteItem) => {
    setQuoteActionTab('settings');
    setSelectedQuote(quote);
  };

  const shareLink = selectedQuote ? `https://proteger.vc/cotacao/${selectedQuote.slug}` : '';

  const pdfOptions = {
    showRefnets: true,
    showSalesAreas: false,
    showImportantNotes: true,
    showNeededDocuments: false,
    showGracePeriod: false,
    showDifferentials: false,
    showCoparticipationNotes: false,
    showAssociations: false,
    showCongenersNotes: false,
    showAgeLimitNotes: false,
    showRefundNotes: false,
    showCompulsoryRulesNotes: false,
    showFranchiseNotes: false,
    showRepiqueNotes: false,
    showCommercialCampaignNotes: false,
    showPaymentMethodsNotes: false,
    showAlertNotes: false,
    showRegistrationFeeNotes: false,
  };

  useEffect(() => {
    setShareText('');
    setIsLinkCopied(false);
    setIsTextCopied(false);
  }, [selectedQuote?.id]);

  const buildQuoteSummary = (details: QuoteDetails) => {
    const lines: string[] = [];
    lines.push('✨ Sua simulação foi realizada com sucesso!');
    lines.push('📌 Estes são os dados da simulação:');
    lines.push('------------------------------');

    const selectedIds = details.productsIds ?? [];
    const groups: Record<'HEALTH' | 'ODONTO', string[]> = { HEALTH: [], ODONTO: [] };

    details.plans?.forEach((plan) => {
      const type = plan.quoteType || 'HEALTH';
      const products =
        plan.tables
          ?.flatMap((table) => table.products)
          .filter((product) => selectedIds.length === 0 || selectedIds.includes(product.id)) || [];

      if (products.length === 0) return;

      const productLines = products.map((product) => {
        const accommodation = product.accommodation?.name ? ` - ${product.accommodation.name}` : '';
        return `• ${product.name}${accommodation}`;
      });

      groups[type].push(
        `🏥 Operadora: *${plan.name}*${plan.managerName ? ` (${plan.managerName})` : ''}`,
        ...productLines,
      );
    });

    if (groups.HEALTH.length > 0) {
      lines.push('💚 *Saúde*');
      lines.push(...groups.HEALTH);
    }

    if (groups.ODONTO.length > 0) {
      lines.push('🦷 *Dental*');
      lines.push(...groups.ODONTO);
    }

    if (shareLink) {
      lines.push('🔗 Link da cotação:');
      lines.push(shareLink);
    }

    return lines.join('\n');
  };

  const handleOpenPdf = async () => {
    if (!selectedQuote) return;
    setIsPdfLoading(true);
    try {
      const response = await api.get<{ pdf: string }>(`/quotes/${selectedQuote.id}/pdf`, {
        params: Object.fromEntries(
          Object.entries(pdfOptions).map(([key, value]) => [key, value ? 'true' : 'false']),
        ),
      });
      const pdfBase64 = response.data?.pdf;
      if (!pdfBase64) throw new Error('PDF não gerado');

      const cleanBase64 = pdfBase64.includes('base64,')
        ? pdfBase64.split('base64,')[1]
        : pdfBase64;
      const base64Encoding = (FileSystem as any).EncodingType?.Base64 ?? 'base64';

      const fileUri = `${FileSystem.cacheDirectory}cotacao-${selectedQuote.slug}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
        encoding: base64Encoding,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
      } else {
        await Linking.openURL(fileUri);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      Alert.alert('Erro ao gerar PDF', 'Não foi possível gerar o PDF da cotação. Tente novamente.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleOpenShareLink = () => {
    setIsShareLinkOpen(true);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await Clipboard.setStringAsync(shareLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 1500);
  };

  const handleGenerateText = async () => {
    if (!selectedQuote) return;
    setIsTextShareOpen(true);
    if (shareText) return;
    setIsGeneratingText(true);
    try {
      const response = await api.get(`/quotes/me/${selectedQuote.id}/details`);
      const data: QuoteDetails = response.data?.quote || response.data?.data || response.data;
      if (data) {
        setShareText(buildQuoteSummary(data));
      }
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleCopyText = async () => {
    if (!shareText) return;
    await Clipboard.setStringAsync(shareText);
    setIsTextCopied(true);
    setTimeout(() => setIsTextCopied(false), 1500);
  };

  const handleSendText = async () => {
    if (!shareText) return;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Share.share({ message: shareText });
    }
  };

  const handleDuplicateQuote = async () => {
    if (!selectedQuote || isDuplicatingQuote) return;
    setIsDuplicatingQuote(true);
    try {
      const response = await api.post('/quotes/duplicate', { quoteId: selectedQuote.id });
      const newQuote = response.data?.quote || response.data?.data || response.data;
      setSelectedQuote(null);
      if (newQuote?.id) {
        router.push({ pathname: '/quote-profile', params: { id: newQuote.id } });
      } else {
        handleRefresh();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível duplicar a cotação.');
    } finally {
      setIsDuplicatingQuote(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!selectedQuote || isDeletingQuote) return;
    setIsDeletingQuote(true);
    try {
      await api.delete(`/quotes/${selectedQuote.id}`);
      setIsDeleteConfirmOpen(false);
      setSelectedQuote(null);
      handleRefresh();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível deletar a cotação.');
    } finally {
      setIsDeletingQuote(false);
    }
  };

  const handleGoToQuoteDetails = (quote: QuoteItem, event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.();
    router.push({ pathname: '/quote-profile', params: { id: quote.id } });
  };

  const handleCloseQuote = () => {
    setSelectedQuote(null);
  };

  const openFilterMenu = () => {
    if (filterButtonRef.current?.measureInWindow) {
      filterButtonRef.current.measureInWindow((x, y, width, height) => {
        setFilterMenuPosition({ x, y, width, height });
        setIsFilterOpen(true);
      });
      return;
    }

    setFilterMenuPosition(null);
    setIsFilterOpen(true);
  };

  const filterMenuStyle = useMemo(() => {
    if (filterMenuPosition) {
      const left = Math.max(
        theme.spacing.lg,
        filterMenuPosition.x + filterMenuPosition.width - FILTER_MENU_WIDTH,
      );
      return {
        top: filterMenuPosition.y + filterMenuPosition.height + 8,
        left,
      };
    }

    return {
      top: insets.top + 220,
      right: theme.spacing.lg,
    };
  }, [filterMenuPosition, insets.top, theme.spacing.lg]);

  const userInitials = useMemo(() => {
    if (!userName) return 'KT';
    const parts = userName.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);


  const fetchQuotes = useCallback(
    async ({ pageToLoad, replace }: { pageToLoad: number; replace: boolean }) => {
      if (replace) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const response = await api.get<QuotesResponse>('/quotes/me', {
          params: {
            page: pageToLoad,
            pageSize: PAGE_SIZE,
            search: search.trim() ? search.trim() : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            category: categoryFilter === 'all' ? undefined : categoryFilter,
          },
        });

        const nextQuotes = response.data.data || [];
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
        setPage(response.data.currentPage || pageToLoad);

        setQuotes((prev) => {
          if (replace) return nextQuotes;
          const map = new Map(prev.map((item) => [item.id, item]));
          nextQuotes.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
      } catch {
        setQuotes((prev) => (replace ? [] : prev));
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
        setIsRefreshing(false);
      }
    },
    [search, categoryFilter],
  );

  useEffect(() => {
    if (tab !== 'list') return;
    const handler = setTimeout(() => {
      setPage(1);
      fetchQuotes({ pageToLoad: 1, replace: true });
    }, 350);

    return () => clearTimeout(handler);
  }, [fetchQuotes, tab, search]);

  const handleRefresh = () => {
    if (tab !== 'list') return;
    setIsRefreshing(true);
    fetchQuotes({ pageToLoad: 1, replace: true });
  };

  const handleLoadMore = () => {
    if (tab !== 'list') return;
    if (isFetchingMore || isLoading) return;
    if (page >= totalPages) return;
    fetchQuotes({ pageToLoad: page + 1, replace: false });
  };

  const fetchKanban = useCallback(async () => {
    setIsKanbanLoading(true);
    setKanbanError(null);
    try {
      const responses = await Promise.all(
        kanbanBoards.map((board) =>
          api.get<QuotesResponse>('/quotes/me', {
            params: {
              page: 1,
              pageSize: 10,
              status: board.status,
            },
          }),
        ),
      );

      const nextData: Record<number, { items: QuoteItem[]; total: number }> = {};
      responses.forEach((response, index) => {
        const board = kanbanBoards[index];
        nextData[board.status] = {
          items: response.data.data || [],
          total: response.data.total || 0,
        };
      });

      setKanbanData(nextData);
    } catch {
      setKanbanError('Erro ao carregar o kanban.');
    } finally {
      setIsKanbanLoading(false);
    }
  }, [kanbanBoards]);

  useEffect(() => {
    if (tab !== 'kanban') return;
    fetchKanban();
  }, [tab, fetchKanban]);

  useEffect(() => {
    setIsFilterOpen(false);
  }, [tab]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cotações</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleOpenTutorial}>
            <HugeiconsIcon icon={Mortarboard01Icon} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <CalculatorIconWrapper size={18} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.statsValue}>{total}</Text>
          <Text style={styles.statsLabel}>Cotações</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/quote-create')}
      >
        <Text style={styles.createButtonText}>Criar Cotação</Text>
        <ArrowRightIcon size={18} color={theme.colors.textOnPrimary} />
        <View style={styles.createPulse} />
      </TouchableOpacity>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'list' && styles.tabButtonActive]}
          onPress={() => setTab('list')}
        >
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'kanban' && styles.tabButtonActive]}
          onPress={() => setTab('kanban')}
        >
          <Text style={[styles.tabText, tab === 'kanban' && styles.tabTextActive]}>Kanban</Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' && (
        <View style={styles.searchWrapper}>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <HugeiconsIcon icon={Search01Icon} size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchField}
                placeholder="Buscar cotação"
                placeholderTextColor={theme.colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              ref={filterButtonRef}
              onPress={openFilterMenu}
            >
              <HugeiconsIcon icon={FilterEditIcon} size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {tab === 'list' && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Suas Cotações</Text>
        </View>
      )}
    </View>
  );

  const renderQuoteItem = ({ item }: { item: QuoteItem }) => {
    const clientName = item.client?.trim() || `#${item.slug}`;
    const subtitle = item.client ? `#${item.slug}` : formatQuoteDate(item.createdAt);
    const dateLabel = item.client ? formatQuoteDate(item.createdAt) : '';

    return (
      <TouchableOpacity style={styles.quoteRow} onPress={() => handleOpenQuote(item)}>
        <View style={[styles.quoteAvatar, { backgroundColor: getAvatarColor(item.id) }]}>
          <Text style={styles.quoteAvatarText}>{getInitial(clientName)}</Text>
        </View>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteTitle} numberOfLines={1}>
            {clientName}
          </Text>
          <Text style={styles.quoteSubtitle} numberOfLines={1}>
            {subtitle || dateLabel}
          </Text>
          {item.client && <Text style={styles.quoteDate}>{dateLabel}</Text>}
        </View>
        <TouchableOpacity
          style={styles.quoteAction}
          onPress={(event) => handleGoToQuoteDetails(item, event)}
        >
          <ArrowRightIcon size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderKanbanCard = (item: QuoteItem, status: number) => {
    const meta = getStatusMeta(item.status ?? status);
    const updatedAt = item.updatedAt ?? item.createdAt;
    return (
      <TouchableOpacity key={item.id} style={styles.kanbanCardItem} onPress={() => handleOpenQuote(item)}>
        <View style={styles.kanbanCardTop}>
          <View style={styles.viewsBadge}>
            <Text style={styles.viewsBadgeText}>{item.views ?? 0} visualizações</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: meta.color, backgroundColor: meta.tint }]}>
            <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={styles.kanbanQuoteTitle} numberOfLines={1}>
          {item.client?.trim() || `#${item.slug}`}
        </Text>
        {item.client && (
          <Text style={styles.kanbanQuoteSlug} numberOfLines={1}>
            #{item.slug}
          </Text>
        )}
        <Text style={styles.kanbanQuoteDate}>Atualizada em: {formatKanbanDate(updatedAt)}</Text>
      </TouchableOpacity>
    );
  };

  const renderKanbanSection = (board: KanbanBoard) => {
    const data = kanbanData[board.status] || { items: [], total: 0 };
    return (
      <View key={`${board.status}`} style={styles.kanbanSection}>
        <View style={styles.kanbanSectionHeader}>
          <Text style={styles.kanbanSectionTitle}>{board.label}</Text>
          <View style={[styles.kanbanCountBadge, { backgroundColor: board.badgeColor }]}>
            <Text style={styles.kanbanCountText}>{data.total}</Text>
          </View>
        </View>
        {data.items.length > 0 ? (
          data.items.map((item) => renderKanbanCard(item, board.status))
        ) : (
          <Text style={styles.kanbanEmptyText}>Sem cotações nesta coluna</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {tab === 'kanban' ? (
          <ScrollView contentContainerStyle={styles.kanbanContent} showsVerticalScrollIndicator={false}>
            {renderHeader()}
            {isKanbanLoading && (
              <View style={styles.kanbanLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
            {kanbanError && !isKanbanLoading && (
              <View style={styles.kanbanError}>
                <Text style={styles.kanbanErrorText}>{kanbanError}</Text>
                <TouchableOpacity style={styles.kanbanRetry} onPress={fetchKanban}>
                  <Text style={styles.kanbanRetryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
            {!isKanbanLoading && !kanbanError && kanbanBoards.map((board) => renderKanbanSection(board))}
          </ScrollView>
        ) : (
          <FlatList
            data={quotes}
            keyExtractor={(item) => item.id}
            renderItem={renderQuoteItem}
            ListHeaderComponent={renderHeader()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              isLoading ? null : <Text style={styles.emptyText}>Nenhuma cotação encontrada.</Text>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : isFetchingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
          />
        )}

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
            icon={<CalculatorIconWrapper size={24} color={theme.colors.primary} />}
            label="Cotações"
            active
            theme={theme}
            insets={insets}
          />
          <BottomNavItem
            icon={<MenuIcon size={24} color={theme.colors.textSecondary} />}
            label="Menu"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/settings')}
          />
        </View>
      </SafeAreaView>

      <Modal transparent visible={isFilterOpen} animationType="fade" onRequestClose={() => setIsFilterOpen(false)}>
        <View style={styles.filterOverlay} pointerEvents="box-none">
          <Pressable style={styles.filterBackdrop} onPress={() => setIsFilterOpen(false)} />
          <View style={[styles.filterMenu, filterMenuStyle]}>
            <Text style={styles.filterMenuTitle}>Filtro</Text>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={`${option.value}`}
                style={styles.filterOption}
                onPress={() => {
                  setCategoryFilter(option.value);
                  setIsFilterOpen(false);
                }}
              >
                <Text style={styles.filterOptionText}>{option.label}</Text>
                {categoryFilter === option.value && <Text style={styles.filterOptionCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isTutorialOpen} animationType="fade" onRequestClose={handleCloseTutorial}>
        <View style={styles.tutorialOverlay}>
          <Pressable style={styles.tutorialBackdrop} onPress={handleCloseTutorial} />
          <View style={styles.tutorialModal}>
            <View style={styles.tutorialHeader}>
              <Text style={styles.tutorialTitle}>Como criar uma Cotação no Koter</Text>
              <TouchableOpacity onPress={handleCloseTutorial} style={styles.tutorialClose}>
                <Text style={styles.tutorialCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.videoCard}>
              <Pressable style={styles.videoThumbnailWrapper} onPress={handleWatchTutorial}>
                <Image source={{ uri: tutorialThumbnailUrl }} style={styles.videoThumbnail} />
                <View style={styles.videoPlayOverlay}>
                  <View style={styles.videoPlayCircle}>
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                </View>
              </Pressable>
              <View style={styles.videoMeta}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  COTAÇÃO - COMO CRIAR UMA COTAÇÃO
                </Text>
                <Text style={styles.videoChannel}>Koter</Text>
                <TouchableOpacity style={styles.youtubeButton} onPress={handleWatchTutorial}>
                  <Text style={styles.youtubeButtonText}>Assista no YouTube</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!selectedQuote} animationType="slide" onRequestClose={handleCloseQuote}>
        <View style={styles.quoteSheetOverlay}>
          <Pressable style={styles.quoteSheetBackdrop} onPress={handleCloseQuote} />
          <View style={styles.quoteSheet}>
            <View style={styles.quoteSheetHandle} />
            <View style={styles.quoteSheetHeader}>
              <View style={styles.quoteSheetIcon}>
                <HugeiconsIcon icon={Settings01Icon} size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.quoteSheetTitle}>
                {selectedQuote ? `Cotação #${selectedQuote.slug}` : 'Cotação'}
              </Text>
              <TouchableOpacity style={styles.quoteSheetClose} onPress={handleCloseQuote}>
                <Text style={styles.quoteSheetCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quoteSheetTabs}>
              <TouchableOpacity
                style={[styles.quoteSheetTab, quoteActionTab === 'settings' && styles.quoteSheetTabActive]}
                onPress={() => setQuoteActionTab('settings')}
              >
                <HugeiconsIcon
                  icon={Settings01Icon}
                  size={16}
                  color={quoteActionTab === 'settings' ? theme.colors.text : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.quoteSheetTabText,
                    quoteActionTab === 'settings' && styles.quoteSheetTabTextActive,
                  ]}
                >
                  Configurações
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quoteSheetTab, quoteActionTab === 'send' && styles.quoteSheetTabActive]}
                onPress={() => setQuoteActionTab('send')}
              >
                <HugeiconsIcon
                  icon={Share01Icon}
                  size={16}
                  color={quoteActionTab === 'send' ? theme.colors.text : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.quoteSheetTabText,
                    quoteActionTab === 'send' && styles.quoteSheetTabTextActive,
                  ]}
                >
                  Enviar
                </Text>
              </TouchableOpacity>
            </View>

            {quoteActionTab === 'settings' ? (
              <>
                <View style={styles.quoteStatusCard}>
                  <Text style={styles.quoteStatusLabel}>
                    Status:{' '}
                    <Text style={[styles.quoteStatusValue, { color: getStatusMeta(selectedQuote?.status).color }]}>
                      {getStatusMeta(selectedQuote?.status).label}
                    </Text>
                  </Text>
                  <View style={styles.quoteStatusUser}>
                    <Text style={styles.quoteStatusUserText}>{userInitials}</Text>
                  </View>
                </View>

                <View style={styles.quoteClientCard}>
                  <View style={styles.quoteClientAvatar}>
                    <Text style={styles.quoteClientAvatarText}>
                      {getInitial(selectedQuote?.client || selectedQuote?.slug)}
                    </Text>
                  </View>
                  <View style={styles.quoteClientInfo}>
                    <Text style={styles.quoteClientName} numberOfLines={1}>
                      {selectedQuote?.client?.trim() || `#${selectedQuote?.slug}`}
                    </Text>
                    <Text style={styles.quoteClientDate}>
                      Criado em {formatKanbanDate(selectedQuote?.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.quoteActionsList}>
                  <TouchableOpacity
                    style={styles.quoteActionRow}
                    onPress={() => router.push({ pathname: '/quote-profile', params: { id: selectedQuote?.id } })}
                  >
                    <HugeiconsIcon icon={ViewIcon} size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.quoteActionText}>Visualizar</Text>
                    <View style={styles.quoteActionArrow}>
                      <ArrowRightIcon size={14} color={theme.colors.textOnPrimary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quoteActionRow}
                    onPress={() => {
                      const quoteId = selectedQuote?.id;
                      setSelectedQuote(null);
                      if (quoteId) {
                        router.push({ pathname: '/quote-create', params: { id: quoteId } });
                      }
                    }}
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.quoteActionText}>Editar</Text>
                    <View style={styles.quoteActionArrow}>
                      <ArrowRightIcon size={14} color={theme.colors.textOnPrimary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quoteActionRow}
                    onPress={handleDuplicateQuote}
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.quoteActionText}>
                      {isDuplicatingQuote ? 'Duplicando...' : 'Duplicar'}
                    </Text>
                    <View style={styles.quoteActionArrow}>
                      <ArrowRightIcon size={14} color={theme.colors.textOnPrimary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quoteActionRow, styles.quoteActionRowDanger]}
                    onPress={() => setIsDeleteConfirmOpen(true)}
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={18} color={theme.colors.error || '#EF4444'} />
                    <Text style={[styles.quoteActionText, styles.quoteActionTextDanger]}>Deletar</Text>
                    <View style={[styles.quoteActionArrow, styles.quoteActionArrowDanger]}>
                      <ArrowRightIcon size={14} color={theme.colors.textOnPrimary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.sendList}>
                <TouchableOpacity style={styles.sendRow} onPress={handleOpenPdf}>
                  <View style={[styles.sendIcon, styles.sendIconPdf]}>
                    <Text style={styles.sendIconText}>PDF</Text>
                  </View>
                  <View style={styles.sendInfo}>
                    <Text style={styles.sendTitle}>Visualizar PDF</Text>
                    <Text style={styles.sendSubtitle}>
                      {isPdfLoading ? 'Gerando o PDF da cotação...' : 'Visualize o PDF da cotação'}
                    </Text>
                  </View>
                  <ArrowRightIcon size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.sendRow} onPress={handleOpenShareLink}>
                  <View style={styles.sendIcon}>
                    <HugeiconsIcon icon={Share01Icon} size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.sendInfo}>
                    <Text style={styles.sendTitle}>Compartilhar Link</Text>
                    <Text style={styles.sendSubtitle}>Compartilhe o link da cotação</Text>
                  </View>
                  <ArrowRightIcon size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.sendRow} onPress={handleGenerateText}>
                  <View style={styles.sendIcon}>
                    <HugeiconsIcon icon={PencilEdit01Icon} size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.sendInfo}>
                    <Text style={styles.sendTitle}>Gerar Texto</Text>
                    <Text style={styles.sendSubtitle}>Gere um texto personalizado da cotação</Text>
                  </View>
                  <ArrowRightIcon size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <Text style={styles.sendHint}>
                  Para mais opções de configuração (escolher informações a exibir, exportar como imagem, etc.),
                  acesse a página completa da cotação.
                </Text>
                <TouchableOpacity
                  style={styles.sendFullButton}
                  onPress={() => router.push({ pathname: '/quote-profile', params: { id: selectedQuote?.id } })}
                >
                  <Text style={styles.sendFullButtonText}>Ver página completa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isShareLinkOpen} animationType="fade" onRequestClose={() => setIsShareLinkOpen(false)}>
        <View style={styles.shareOverlay}>
          <Pressable style={styles.shareBackdrop} onPress={() => setIsShareLinkOpen(false)} />
          <View style={styles.shareCard}>
            <Text style={styles.shareTitle}>Compartilhe o link da cotação com o seu cliente!</Text>
            <View style={styles.shareLinkBox}>
              <Text style={styles.shareLinkText}>
                ✅ Sua cotação está pronta!{'\n'}Acesse os detalhes da sua cotação neste link:{'\n'}
                {shareLink}
              </Text>
            </View>
            <View style={styles.shareActions}>
              <TouchableOpacity style={styles.shareButton} onPress={() => Linking.openURL(shareLink)}>
                <Text style={styles.shareButtonText}>Abrir Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleCopyLink}>
                <Text style={styles.shareButtonText}>{isLinkCopied ? 'Copiado' : 'Copiar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isTextShareOpen} animationType="fade" onRequestClose={() => setIsTextShareOpen(false)}>
        <View style={styles.shareOverlay}>
          <Pressable style={styles.shareBackdrop} onPress={() => setIsTextShareOpen(false)} />
          <View style={styles.textCard}>
            <View style={styles.textHeader}>
              <Text style={styles.textTitle}>Cotação em Texto/Link</Text>
              <TouchableOpacity onPress={() => setIsTextShareOpen(false)}>
                <Text style={styles.textClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.textBody}>
              {isGeneratingText ? (
                <View style={styles.textLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.textLoadingText}>Gerando texto...</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.textArea}
                  value={shareText}
                  onChangeText={setShareText}
                  multiline
                />
              )}
            </View>
            <View style={styles.textActions}>
              <TouchableOpacity style={styles.textButton} onPress={() => Linking.openURL(shareLink)}>
                <Text style={styles.textButtonText}>Ver Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={handleCopyText}>
                <Text style={styles.textButtonText}>{isTextCopied ? 'Copiado' : 'Copiar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.textButton, styles.textButtonWhatsapp]} onPress={handleSendText}>
                <Text style={[styles.textButtonText, styles.textButtonWhatsappText]}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isDeleteConfirmOpen}
        animationType="fade"
        onRequestClose={() => setIsDeleteConfirmOpen(false)}
      >
        <View style={styles.shareOverlay}>
          <Pressable style={styles.shareBackdrop} onPress={() => setIsDeleteConfirmOpen(false)} />
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Tem certeza que deseja deletar esta cotação?</Text>
            <Text style={styles.deleteSubtitle}>Esta ação não pode ser desfeita.</Text>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonPrimary]}
              onPress={handleDeleteQuote}
              disabled={isDeletingQuote}
            >
              <Text style={styles.deleteButtonText}>
                {isDeletingQuote ? 'Deletando...' : 'Deletar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonGhost]}
              onPress={() => setIsDeleteConfirmOpen(false)}
            >
              <Text style={styles.deleteButtonGhostText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      fontSize: theme.fontSize.xl,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsCard: {
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    statsIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsValue: {
      fontSize: theme.fontSize.xxl,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    statsLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    createButton: {
      marginTop: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      position: 'relative',
    },
    createButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    createPulse: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#F6C744',
      top: -4,
      right: 18,
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#EFEFEF',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    tabButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: theme.colors.background,
    },
    tabText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    searchWrapper: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      position: 'relative',
      zIndex: 2,
    },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : theme.colors.background,
    },
    searchField: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : theme.colors.background,
    },
    filterMenu: {
      position: 'absolute',
      width: FILTER_MENU_WIDTH,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
      zIndex: 999,
      elevation: 12,
    },
    filterOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 998,
    },
    filterBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    filterMenuTitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    filterOption: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filterOptionText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    filterOptionCheck: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.bold,
      color: theme.colors.primary,
    },
    sectionHeader: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    sectionHeaderText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    listContent: {
      paddingBottom: 120 + insets.bottom,
    },
    quoteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    quoteAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    quoteAvatarText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.bold,
      color: '#0F172A',
    },
    quoteInfo: {
      flex: 1,
    },
    quoteTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    quoteDate: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    quoteAction: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingMore: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    kanbanContent: {
      paddingBottom: 120 + insets.bottom,
    },
    kanbanLoading: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kanbanError: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F7F7F7',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    kanbanErrorText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    kanbanRetry: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    kanbanRetryText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    kanbanSection: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1D1D1D' : '#F8F8F8',
    },
    kanbanSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    kanbanSectionTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    kanbanCountBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    kanbanCountText: {
      color: theme.colors.textOnPrimary,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSize.xs,
    },
    kanbanCardItem: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#242424' : '#FFFFFF',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#E6E6E6' : theme.colors.border,
      marginTop: theme.spacing.sm,
    },
    kanbanCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    viewsBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F0F0F0',
    },
    viewsBadgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
    },
    kanbanQuoteTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    kanbanQuoteSlug: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    kanbanQuoteDate: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    kanbanEmptyText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
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
    tutorialOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    tutorialBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    },
    tutorialModal: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
    },
    tutorialHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    tutorialTitle: {
      flex: 1,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      paddingRight: theme.spacing.sm,
    },
    tutorialClose: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1D1D1D' : '#F0F0F0',
    },
    tutorialCloseText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    videoCard: {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: themeMode === 'dark' ? '#1A1A1A' : '#F5F5F5',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    videoThumbnailWrapper: {
      position: 'relative',
    },
    videoThumbnail: {
      width: '100%',
      height: 180,
    },
    videoPlayOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    videoPlayCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FF0033',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    videoPlayIcon: {
      color: '#fff',
      fontSize: 22,
      marginLeft: 3,
    },
    videoMeta: {
      padding: theme.spacing.md,
    },
    videoTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    videoChannel: {
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    youtubeButton: {
      marginTop: theme.spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#2A2A2A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    youtubeButtonText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteSheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    quoteSheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    quoteSheet: {
      backgroundColor: themeMode === 'dark' ? '#151515' : '#FFFFFF',
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: '85%',
    },
    quoteSheetHandle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: themeMode === 'dark' ? '#333' : '#DDD',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    quoteSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    quoteSheetIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#F7F7F7',
    },
    quoteSheetTitle: {
      flex: 1,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteSheetClose: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#F1F1F1',
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
    },
    quoteSheetCloseText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    quoteSheetTabs: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      padding: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#F1F1F1',
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      marginBottom: theme.spacing.md,
    },
    quoteSheetTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: 'transparent',
    },
    quoteSheetTabActive: {
      backgroundColor: themeMode === 'dark' ? '#111111' : '#FFFFFF',
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E6E6E6',
      shadowColor: '#000',
      shadowOpacity: themeMode === 'dark' ? 0 : 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: themeMode === 'dark' ? 0 : 2,
    },
    quoteSheetTabText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    quoteSheetTabTextActive: {
      color: theme.colors.text,
    },
    quoteStatusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#FFFFFF',
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOpacity: themeMode === 'dark' ? 0 : 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: themeMode === 'dark' ? 0 : 1,
    },
    quoteStatusLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    quoteStatusValue: {
      fontFamily: theme.fonts.semiBold,
    },
    quoteStatusUser: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '22',
    },
    quoteStatusUserText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteClientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#FFFFFF',
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOpacity: themeMode === 'dark' ? 0 : 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: themeMode === 'dark' ? 0 : 1,
    },
    quoteClientAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quoteClientAvatarText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteClientInfo: {
      flex: 1,
    },
    quoteClientName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteClientDate: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    quoteActionsList: {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#FFFFFF',
      overflow: 'hidden',
    },
    quoteActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeMode === 'dark' ? '#2B2B2B' : '#EDEDED',
    },
    quoteActionRowDanger: {
      borderBottomWidth: 0,
    },
    quoteActionText: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quoteActionTextDanger: {
      color: theme.colors.error || '#EF4444',
    },
    quoteActionArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    quoteActionArrowDanger: {
      backgroundColor: theme.colors.error || '#EF4444',
    },
    sendList: {
      gap: theme.spacing.md,
    },
    sendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? '#2A2A2A' : '#E8E8E8',
      backgroundColor: themeMode === 'dark' ? '#1C1C1C' : '#FFFFFF',
    },
    sendIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#262626' : '#F2F2F2',
    },
    sendIconPdf: {
      backgroundColor: themeMode === 'dark' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
    },
    sendIconText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.bold,
      color: theme.colors.error || '#EF4444',
    },
    sendInfo: {
      flex: 1,
      gap: 2,
    },
    sendTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    sendSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    sendHint: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sendFullButton: {
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    sendFullButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    shareOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    shareBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    shareCard: {
      width: '100%',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    shareTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    shareLinkBox: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#121212' : '#F5F5F5',
    },
    shareLinkText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    shareActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    shareButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    textCard: {
      width: '100%',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    textHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    textClose: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    textBody: {
      minHeight: 200,
    },
    textArea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
      backgroundColor: themeMode === 'dark' ? '#121212' : '#F5F5F5',
      minHeight: 200,
      textAlignVertical: 'top',
    },
    textActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    textButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    textButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    textButtonWhatsapp: {
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34,197,94,0.12)',
    },
    textButtonWhatsappText: {
      color: '#22C55E',
    },
    textLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    textLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    deleteCard: {
      width: '100%',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    deleteTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    deleteSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    deleteButton: {
      width: '100%',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      borderWidth: 1,
    },
    deleteButtonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    deleteButtonGhost: {
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#151515' : '#F5F5F5',
    },
    deleteButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    deleteButtonGhostText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
  });
