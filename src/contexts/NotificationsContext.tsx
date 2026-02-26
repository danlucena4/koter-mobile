import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getTheme } from '../utils/theme';
import { useTheme } from './ThemeContext';
import { authService } from '../services/auth.service';
import { ArrowDownIcon, SettingsIcon } from '../components/HugeIconsWrapper';
import { ArrowLeft02Icon } from '../components';

const { height } = Dimensions.get('window');

const NOVU_APP_ID = process.env.EXPO_PUBLIC_NOVU_APP_ID || 'CjWZUlDiNvYC';
const NOVU_API_BASE_URL = process.env.EXPO_PUBLIC_NOVU_API_URL || 'https://api.novu.co';
const NOVU_API_VERSION = '2024-06-26';
const NOTIFICATIONS_PAGE_SIZE = 20;

const channelLabels: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  in_app: 'In-App',
  chat: 'Chat',
  push: 'Push',
};

const channelOrder = ['email', 'sms', 'in_app', 'chat', 'push'];

const workflowNameMap: Record<string, string> = {
  'user-task-reminder': 'Lembrete de tarefa',
  'user-lead-task-reminder': 'Lembrete de tarefa dos Leads',
  'lead-received-notification': 'Novo Lead Recebido',
  'proposal-task-reminder': 'Lembrete de tarefa da proposta',
  'whats-app-verification-code': 'Código de verificação do WhatsApp',
  'email-verification-code': 'Código de verificação do email',
  'welcome-new-user': 'Bem-vindo(a) ao nosso sistema',
  'reset-password-code': 'Código de redefinição de senha',
  'new-koter-pro-invoice-notification': 'New Koter PRO Invoice Notification',
};

type NotificationAction = {
  label: string;
  redirect?: {
    url: string;
  };
};

type InboxNotification = {
  id: string;
  subject?: string;
  body: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
  avatar?: string;
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;
  data?: Record<string, any>;
  payload?: Record<string, any>;
  redirect?: {
    url: string;
  };
};

type NotificationFilterKey = 'default' | 'unread' | 'archived';

type ChannelPreference = {
  email?: boolean;
  sms?: boolean;
  in_app?: boolean;
  chat?: boolean;
  push?: boolean;
};

type PreferencesResponse = {
  level?: string;
  enabled?: boolean;
  channels?: ChannelPreference;
  workflow?: {
    id?: string;
    identifier?: string;
    name?: string;
  };
};

type PreferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  channels: ChannelPreference;
  workflowId?: string;
  isGlobal: boolean;
};

type NotificationsContextValue = {
  openNotifications: () => void;
  closeNotifications: () => void;
  unreadCount: number;
  isNotificationsModalOpen: boolean;
  IsNotificationsModalopen?: boolean;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'agora';
  if (diff < hour) return `há ${Math.floor(diff / minute)} min`;
  if (diff < day) return `há ${Math.floor(diff / hour)} h`;
  if (diff < day * 7) return `há ${Math.floor(diff / day)} dias`;

  const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const dayValue = date.getDate().toString().padStart(2, '0');
  const monthValue = months[date.getMonth()] || '';
  return `${dayValue} de ${monthValue}`;
};

const formatChannels = (channels: ChannelPreference) => {
  const enabled = channelOrder
    .filter((key) => channels[key as keyof ChannelPreference])
    .map((key) => channelLabels[key] || key);

  if (!enabled.length) return 'Nenhum canal ativo';
  return enabled.join(', ');
};

const notificationFilters = [
  { key: 'default' as const, label: 'Caixa de entrada', archived: false },
  { key: 'unread' as const, label: 'Não lidos', archived: false, read: false },
  { key: 'archived' as const, label: 'Arquivados', archived: true },
];

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);
  const router = useRouter();

  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const [novuToken, setNovuToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [notificationsFilter, setNotificationsFilter] = useState<NotificationFilterKey>('default');
  const [notificationsOffset, setNotificationsOffset] = useState(0);
  const [notificationsHasMore, setNotificationsHasMore] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [notificationView, setNotificationView] = useState<'inbox' | 'preferences'>('inbox');
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [expandedPreferences, setExpandedPreferences] = useState<Record<string, boolean>>({});
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);
  const [isPreferenceUpdating, setIsPreferenceUpdating] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriber = async () => {
      try {
        const user = await authService.getAuthenticatedUser();
        setSubscriberId(user.id || null);
      } catch {
        setSubscriberId(null);
      }
    };

    loadSubscriber();
  }, []);

  useEffect(() => {
    if (!subscriberId) return;
    refreshUnreadCount();
  }, [subscriberId]);

  useEffect(() => {
    if (!isOpen) return;
    if (notificationView !== 'inbox') return;
    setIsFilterMenuOpen(false);
    setIsActionsMenuOpen(false);
    loadNotifications(true);
  }, [isOpen, notificationsFilter, subscriberId, notificationView]);

  useEffect(() => {
    if (!isOpen) return;
    if (notificationView !== 'preferences') return;
    setIsFilterMenuOpen(false);
    setIsActionsMenuOpen(false);
    if (!preferences.length) {
      fetchPreferences();
    }
  }, [isOpen, notificationView, subscriberId]);

  const getNotificationTitle = (notification: InboxNotification) => {
    const payload = notification.data || notification.payload || {};
    return (
      notification.subject ||
      payload?.subject ||
      payload?.title ||
      'Notificação'
    );
  };

  const getNotificationBody = (notification: InboxNotification) => {
    const payload = notification.data || notification.payload || {};
    return notification.body || payload?.body || payload?.message || '';
  };

  const getNotificationPayload = (notification: InboxNotification) => {
    return notification.data || notification.payload || {};
  };

  const extractLeadIdFromUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/\/leads\/([^/?#]+)/i);
    return match?.[1] || null;
  };

  const resolveLeadId = (notification: InboxNotification, action?: NotificationAction) => {
    const payload = getNotificationPayload(notification);
    const candidateId =
      payload?.leadId ||
      payload?.lead?.id ||
      payload?.id ||
      notification.data?.leadId ||
      notification.data?.lead?.id ||
      notification.data?.id;
    if (candidateId) return String(candidateId);

    const urlCandidates = [
      action?.redirect?.url,
      notification.redirect?.url,
      payload?.link,
      payload?.url,
      payload?.whatsapp?.link,
    ].filter(Boolean) as string[];

    for (const url of urlCandidates) {
      const extracted = extractLeadIdFromUrl(url);
      if (extracted) return extracted;
    }

    return null;
  };

  const isLeadRedirect = (notification: InboxNotification, action?: NotificationAction) => {
    const label = action?.label?.toLowerCase() || '';
    if (label.includes('visualizar lead') || label.includes('ver lead')) return true;
    const payload = getNotificationPayload(notification);
    if (payload?.leadId || payload?.lead?.id) return true;
    const url = action?.redirect?.url || notification.redirect?.url || payload?.link;
    return Boolean(url && /\/leads\//i.test(url));
  };

  const ensureNovuSession = async () => {
    if (!subscriberId) {
      throw new Error('Usuário não identificado.');
    }
    if (!NOVU_APP_ID) {
      throw new Error('Configuração de notificações não encontrada.');
    }
    if (novuToken) return novuToken;

    const response = await fetch(`${NOVU_API_BASE_URL}/v1/inbox/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Novu-API-Version': NOVU_API_VERSION,
      },
      body: JSON.stringify({
        applicationIdentifier: NOVU_APP_ID,
        subscriberId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Não foi possível iniciar a sessão de notificações.');
    }

    const data = await response.json();
    const token = data?.data?.token || data?.token;

    if (!token) {
      throw new Error('Não foi possível obter token de notificações.');
    }

    setNovuToken(token);
    return token;
  };

  const novuRequest = async (
    path: string,
    options: { method?: string; body?: any } = {},
    retry = true
  ) => {
    const token = await ensureNovuSession();
    const response = await fetch(`${NOVU_API_BASE_URL}/v1${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Novu-API-Version': NOVU_API_VERSION,
        Authorization: `Bearer ${token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && retry) {
      setNovuToken(null);
      return novuRequest(path, options, false);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Erro ao carregar notificações.');
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const buildNotificationsQuery = (offset: number) => {
    const params = new URLSearchParams();
    params.append('limit', `${NOTIFICATIONS_PAGE_SIZE}`);
    if (offset > 0) {
      params.append('offset', `${offset}`);
    }

    const filter = notificationFilters.find((item) => item.key === notificationsFilter);
    if (filter?.archived !== undefined) {
      params.append('archived', `${filter.archived}`);
    }
    if (typeof filter?.read === 'boolean') {
      params.append('read', `${filter.read}`);
    }

    return params.toString();
  };

  const loadNotifications = async (reset = false) => {
    if (isNotificationsLoading) return;
    if (!subscriberId) return;

    try {
      setIsNotificationsLoading(true);
      setNotificationsError(null);

      const offset = reset ? 0 : notificationsOffset;
      const query = buildNotificationsQuery(offset);
      const response = await novuRequest(`/inbox/notifications?${query}`);
      const items = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
      const hasMore = Boolean(response?.hasMore ?? response?.data?.hasMore);

      setNotifications((prev) => (reset ? items : [...prev, ...items]));
      setNotificationsOffset(offset + items.length);
      setNotificationsHasMore(hasMore);
    } catch (error: any) {
      setNotificationsError(error?.message || 'Não foi possível carregar notificações.');
      setNotificationsHasMore(false);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!subscriberId) return;
    try {
      const filters = encodeURIComponent(JSON.stringify([{ read: false, archived: false }]));
      const response = await novuRequest(`/inbox/notifications/count?filters=${filters}`);
      const counts = response?.data;
      const countValue = Array.isArray(counts)
        ? counts[0]?.count ?? counts[0]?.unread ?? 0
        : counts?.count ?? 0;
      setUnreadCount(countValue);
    } catch {
      setUnreadCount(0);
    }
  };

  const fetchPreferences = async () => {
    if (!subscriberId) return;
    try {
      setIsPreferencesLoading(true);
      const response = await novuRequest('/inbox/preferences');
      const raw = response?.data || response?.data?.data || [];
      const list = Array.isArray(raw) ? raw : [];

      const mapped: PreferenceItem[] = list.map((item: PreferencesResponse, index: number) => {
        const channels = item.channels || {};
        const identifier = item.workflow?.identifier || '';
        const workflowName =
          workflowNameMap[identifier] || item.workflow?.name || 'Notificação';

        const isGlobal = !item.workflow?.id;
        const title = isGlobal ? 'Preferências globais' : workflowName;

        return {
          id: item.workflow?.id || `global-${index}`,
          title,
          subtitle: formatChannels(channels),
          channels,
          workflowId: item.workflow?.id,
          isGlobal,
        };
      });

      const sorted = mapped.sort((a, b) => (a.isGlobal === b.isGlobal ? 0 : a.isGlobal ? -1 : 1));
      setPreferences(sorted);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível carregar preferências.');
    } finally {
      setIsPreferencesLoading(false);
    }
  };

  const updatePreference = async (
    item: PreferenceItem,
    channelKey: keyof ChannelPreference,
    value: boolean
  ) => {
    if (isPreferenceUpdating) return;

    const updatedChannels = {
      ...item.channels,
      [channelKey]: value,
    };

    setIsPreferenceUpdating(item.id);
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === item.id
          ? {
              ...pref,
              channels: updatedChannels,
              subtitle: formatChannels(updatedChannels),
            }
          : pref
      )
    );

    try {
      if (item.isGlobal) {
        await novuRequest('/inbox/preferences', {
          method: 'PATCH',
          body: updatedChannels,
        });
      } else if (item.workflowId) {
        await novuRequest(`/inbox/preferences/${item.workflowId}`, {
          method: 'PATCH',
          body: updatedChannels,
        });
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar preferência.');
      fetchPreferences();
    } finally {
      setIsPreferenceUpdating(null);
    }
  };

  const togglePreference = (id: string) => {
    setExpandedPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMarkAllRead = async () => {
    try {
      await novuRequest('/inbox/notifications/read', { method: 'POST', body: {} });
      setIsActionsMenuOpen(false);
      await loadNotifications(true);
      await refreshUnreadCount();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível marcar todas como lidas.');
    }
  };

  const handleArchiveAll = async () => {
    try {
      await novuRequest('/inbox/notifications/archive', { method: 'POST', body: {} });
      setIsActionsMenuOpen(false);
      await loadNotifications(true);
      await refreshUnreadCount();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível arquivar todas.');
    }
  };

  const handleArchiveRead = async () => {
    try {
      await novuRequest('/inbox/notifications/read-archive', { method: 'POST', body: {} });
      setIsActionsMenuOpen(false);
      await loadNotifications(true);
      await refreshUnreadCount();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível arquivar lidas.');
    }
  };

  const handleToggleRead = async (notification: InboxNotification) => {
    try {
      const targetAction = notification.isRead ? 'unread' : 'read';
      await novuRequest(`/inbox/notifications/${notification.id}/${targetAction}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: !notification.isRead } : item
        )
      );
      await refreshUnreadCount();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar a notificação.');
    }
  };

  const handleNotificationAction = async (notification: InboxNotification, action?: NotificationAction) => {
    try {
      if (!notification.isRead) {
        await handleToggleRead(notification);
      }
      const payload = getNotificationPayload(notification);
      const url =
        action?.redirect?.url ||
        notification.redirect?.url ||
        payload?.link ||
        payload?.url ||
        payload?.whatsapp?.link;

      if (isLeadRedirect(notification, action)) {
        const leadId = resolveLeadId(notification, action);
        if (leadId) {
          closeNotifications();
          router.push({ pathname: '/lead/[id]', params: { id: leadId } });
          return;
        }
      }

      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      }
    } catch {
      // evita travar UX se o redirecionamento falhar
    }
  };

  const openNotifications = useCallback(() => {
    setNotificationView('inbox');
    setIsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsOpen(false);
    setIsFilterMenuOpen(false);
    setIsActionsMenuOpen(false);
    setNotificationView('inbox');
  }, []);

  const handleFilterSelect = (key: NotificationFilterKey) => {
    setNotificationsFilter(key);
    setNotificationsOffset(0);
    setNotificationsHasMore(false);
    setIsFilterMenuOpen(false);
  };

  const contextValue = useMemo(
    () => ({
      openNotifications,
      closeNotifications,
      unreadCount,
      isNotificationsModalOpen: isOpen,
      // Alias para chamadas legadas com casing incorreto.
      IsNotificationsModalopen: isOpen,
    }),
    [openNotifications, closeNotifications, unreadCount, isOpen]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      <Modal 
        transparent 
        animationType="fade" 
        visible={isOpen} 
        onRequestClose={closeNotifications}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={[styles.notificationModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <Pressable style={styles.notificationModalBackdrop} onPress={closeNotifications} />
          <View style={styles.notificationModalCard}>
            <View style={styles.notificationModalHeader}>
              {notificationView === 'preferences' ? (
                <View style={styles.notificationHeaderPreferences}>
                  <TouchableOpacity
                    style={styles.notificationBackButton}
                    onPress={() => setNotificationView('inbox')}
                  >
                    <ArrowLeft02Icon size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.notificationHeaderTitle}>Preferências</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.notificationFilterButton}
                    onPress={() => setIsFilterMenuOpen((prev) => !prev)}
                  >
                    <Text style={styles.notificationFilterText}>
                      {notificationFilters.find((item) => item.key === notificationsFilter)?.label ||
                        'Caixa de entrada'}
                    </Text>
                    <ArrowDownIcon size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.notificationHeaderActions}>
                    <TouchableOpacity
                      style={styles.notificationActionsButton}
                      onPress={() => setIsActionsMenuOpen((prev) => !prev)}
                    >
                      <Text style={styles.notificationActionsDots}>•••</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.notificationActionsButton}
                      onPress={() => setNotificationView('preferences')}
                    >
                      <SettingsIcon size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {notificationView === 'inbox' ? (
              <>
                {isFilterMenuOpen && (
                  <View style={styles.notificationDropdown}>
                    {notificationFilters.map((item) => {
                      const isActive = item.key === notificationsFilter;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[styles.notificationDropdownItem, isActive && styles.notificationDropdownItemActive]}
                          onPress={() => handleFilterSelect(item.key)}
                        >
                          <Text
                            style={[
                              styles.notificationDropdownItemText,
                              isActive && styles.notificationDropdownItemActiveText,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {isActionsMenuOpen && (
                  <View style={styles.notificationDropdown}>
                    <TouchableOpacity style={styles.notificationDropdownItem} onPress={handleMarkAllRead}>
                      <Text style={styles.notificationDropdownItemText}>Marcar todos como lidos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationDropdownItem} onPress={handleArchiveAll}>
                      <Text style={styles.notificationDropdownItemText}>Arquivar todos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationDropdownItem} onPress={handleArchiveRead}>
                      <Text style={styles.notificationDropdownItemText}>Arquivar lidos</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isNotificationsLoading && notifications.length === 0 ? (
                  <View style={styles.notificationLoading}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.notificationLoadingText}>Carregando notificações...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    style={styles.notificationListContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.notificationList}
                    onEndReached={() => {
                      if (notificationsHasMore && !isNotificationsLoading) {
                        loadNotifications(false);
                      }
                    }}
                    onEndReachedThreshold={0.2}
                    ListEmptyComponent={
                      <Text style={styles.notificationEmptyText}>
                        {notificationsError || 'Sem notificações por enquanto. Verifique mais tarde.'}
                      </Text>
                    }
                    ListFooterComponent={
                      isNotificationsLoading ? (
                        <View style={styles.notificationFooterLoading}>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                      ) : null
                    }
                    renderItem={({ item }) => {
                      const title = getNotificationTitle(item);
                      const avatarLetter = title?.trim()?.charAt(0)?.toUpperCase() || '!';
                      const isUnread = !item.isRead;

                      return (
                        <View style={[styles.notificationItem, isUnread && styles.notificationItemUnread]}>
                          <View style={styles.notificationItemInner}>
                            <View style={styles.notificationItemHeader}>
                              <View style={styles.notificationAvatar}>
                                <Text style={styles.notificationAvatarText}>{avatarLetter}</Text>
                              </View>
                              <View style={styles.notificationItemContent}>
                                <Text style={styles.notificationItemTitle} numberOfLines={2}>
                                  {title}
                                </Text>
                                <Text style={styles.notificationItemBody} numberOfLines={3}>
                                  {getNotificationBody(item)}
                                </Text>

                                {(item.primaryAction || item.secondaryAction) && (
                                  <View style={styles.notificationCtaRow}>
                                    {item.primaryAction && (
                                      <TouchableOpacity
                                        style={styles.notificationCtaPrimary}
                                        onPress={() => handleNotificationAction(item, item.primaryAction)}
                                      >
                                        <Text style={styles.notificationCtaPrimaryText}>
                                          {item.primaryAction.label}
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                    {item.secondaryAction && (
                                      <TouchableOpacity
                                        style={styles.notificationCtaSecondary}
                                        onPress={() => handleNotificationAction(item, item.secondaryAction)}
                                      >
                                        <Text style={styles.notificationCtaSecondaryText}>
                                          {item.secondaryAction.label}
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                )}
                              </View>
                              <View style={styles.notificationItemMeta}>
                                {isUnread && <View style={styles.notificationUnreadDot} />}
                                <Text style={styles.notificationItemTime}>
                                  {formatRelativeTime(item.createdAt)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
                )}
              </>
            ) : isPreferencesLoading ? (
              <View style={styles.notificationLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.notificationLoadingText}>Carregando preferências...</Text>
              </View>
            ) : (
              <FlatList
                data={preferences}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.preferencesList}
                renderItem={({ item }) => {
                  const isOpen = !!expandedPreferences[item.id];
                  return (
                    <View style={styles.preferenceCard}>
                      <TouchableOpacity
                        style={styles.preferenceHeader}
                        onPress={() => togglePreference(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.preferenceHeaderText}>
                          <Text style={styles.preferenceTitle}>{item.title}</Text>
                          <Text style={styles.preferenceSubtitle}>{item.subtitle}</Text>
                        </View>
                        <View style={[styles.preferenceChevron, isOpen && styles.preferenceChevronOpen]}>
                          <ArrowDownIcon size={16} color={theme.colors.textSecondary} />
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.preferenceBody}>
                          {channelOrder.map((key) => (
                            <View key={key} style={styles.preferenceRow}>
                              <Text style={styles.preferenceRowLabel}>{channelLabels[key]}</Text>
                              <Switch
                                value={Boolean(item.channels[key as keyof ChannelPreference])}
                                onValueChange={(value) =>
                                  updatePreference(item, key as keyof ChannelPreference, value)
                                }
                                disabled={isPreferenceUpdating === item.id}
                                thumbColor={theme.colors.white}
                                trackColor={{
                                  false: themeMode === 'dark' ? '#2d2d32' : theme.colors.border,
                                  true: theme.colors.primary,
                                }}
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) => {
  const isDark = themeMode === 'dark';
  const modalBackground = isDark ? '#0f0f10' : theme.colors.background;
  const modalBorder = isDark ? '#1f1f22' : theme.colors.border;
  const dropdownBackground = isDark ? '#151518' : theme.colors.inputBackground;
  const dropdownBorder = isDark ? '#2a2a2d' : theme.colors.border;
  const itemBorder = isDark ? '#1f1f22' : theme.colors.border;
  const secondaryText = isDark ? '#a1a1aa' : theme.colors.textSecondary;
  const titleText = isDark ? '#f4f4f5' : theme.colors.text;
  const timeText = isDark ? '#8b8b93' : theme.colors.textSecondary;
  const unreadDot = isDark ? '#8b5cf6' : theme.colors.primary;
  const ctaPrimary = isDark ? '#8b5cf6' : theme.colors.primary;
  const ctaSecondaryBg = isDark ? '#232327' : theme.colors.background;
  const ctaSecondaryBorder = isDark ? '#2f2f34' : theme.colors.border;
  const avatarBg = isDark ? '#f4f4f5' : '#f4f4f5';
  const avatarText = isDark ? '#9ca3af' : '#6b7280';

  return StyleSheet.create({
    notificationModalOverlay: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingTop: insets.top + theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    notificationModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    notificationModalCard: {
      width: '100%',
      maxWidth: 380,
      maxHeight: Math.max(320, Math.min(640, height * 0.75)),
      backgroundColor: modalBackground,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: modalBorder,
      ...theme.shadows.lg,
    },
    notificationModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: modalBorder,
    },
    notificationHeaderPreferences: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    notificationBackButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dropdownBackground,
      borderWidth: 1,
      borderColor: dropdownBorder,
    },
    notificationHeaderTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: titleText,
    },
    notificationHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    notificationFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    notificationFilterText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    notificationActionsButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dropdownBackground,
      borderWidth: 1,
      borderColor: dropdownBorder,
    },
    notificationActionsDots: {
      fontSize: 18,
      color: secondaryText,
    },
    notificationDropdown: {
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: dropdownBorder,
      backgroundColor: dropdownBackground,
      marginBottom: theme.spacing.sm,
      overflow: 'hidden',
    },
    notificationDropdownItem: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    notificationDropdownItemActive: {
      backgroundColor: theme.colors.primary + '1A',
    },
    notificationDropdownItemText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: titleText,
    },
    notificationDropdownItemActiveText: {
      color: ctaPrimary,
      fontFamily: theme.fonts.semiBold,
    },
    notificationLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    notificationLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    notificationListContainer: {
      maxHeight: Math.max(220, Math.min(520, height * 0.55)),
      marginHorizontal: -theme.spacing.md,
    },
    notificationList: {
      paddingBottom: theme.spacing.md,
    },
    notificationFooterLoading: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    notificationEmptyText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      paddingVertical: theme.spacing.lg,
    },
    notificationItem: {
      borderBottomWidth: 1,
      borderBottomColor: itemBorder,
    },
    notificationItemUnread: {
      backgroundColor: 'transparent',
    },
    notificationItemInner: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    notificationItemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    notificationAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: avatarBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    notificationAvatarText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.bold,
      color: avatarText,
    },
    notificationItemContent: {
      flex: 1,
      minWidth: 0,
    },
    notificationItemTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: titleText,
      marginBottom: 4,
    },
    notificationItemBody: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: secondaryText,
      lineHeight: 18,
    },
    notificationItemMeta: {
      alignItems: 'flex-end',
      marginLeft: theme.spacing.sm,
      flexShrink: 0,
      minWidth: 52,
    },
    notificationUnreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: unreadDot,
      marginBottom: theme.spacing.xs,
    },
    notificationItemTime: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: timeText,
      marginTop: theme.spacing.xs,
    },
    preferencesList: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    preferenceCard: {
      backgroundColor: dropdownBackground,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: dropdownBorder,
      overflow: 'hidden',
    },
    preferenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    preferenceHeaderText: {
      flex: 1,
      paddingRight: theme.spacing.sm,
    },
    preferenceTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: titleText,
      marginBottom: 2,
    },
    preferenceSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: secondaryText,
    },
    preferenceChevron: {
      transform: [{ rotate: '0deg' }],
    },
    preferenceChevronOpen: {
      transform: [{ rotate: '180deg' }],
    },
    preferenceBody: {
      borderTopWidth: 1,
      borderTopColor: dropdownBorder,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    preferenceRowLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: titleText,
    },
    notificationCtaRow: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    notificationCtaPrimary: {
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: ctaPrimary,
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    notificationCtaPrimaryText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    notificationCtaSecondary: {
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: ctaSecondaryBorder,
      backgroundColor: ctaSecondaryBg,
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    notificationCtaSecondaryText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: titleText,
    },
  });
};
