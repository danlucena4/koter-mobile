import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import api from '../../src/lib/api';
import { ArrowLeft02Icon, WhatsAppIcon } from '../../src/components';

type LeadDetails = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  status?: { id: string; name: string; theme?: string | null } | null;
  company?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const formatPhone = (value?: string | null) => {
  if (!value) return '';
  return value;
};

export default function LeadProfileScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const styles = createStyles(theme, themeMode, insets);

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasWhatsApp = useMemo(() => {
    const phone = lead?.mobilePhone || lead?.phone;
    return Boolean(phone);
  }, [lead?.mobilePhone, lead?.phone]);

  const loadLead = async (leadId: string, isMountedRef?: { value: boolean }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/leads/${leadId}`);
      if (isMountedRef && !isMountedRef.value) return;
      setLead(response.data?.lead || null);
    } catch (err: any) {
      if (isMountedRef && !isMountedRef.value) return;
      setError(err?.message || 'Não foi possível carregar o lead.');
      setLead(null);
    } finally {
      if (!isMountedRef || isMountedRef.value) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) {
      setError('Lead não encontrado.');
      setIsLoading(false);
      return;
    }

    const isMountedRef = { value: true };
    loadLead(params.id, isMountedRef);

    return () => {
      isMountedRef.value = false;
    };
  }, [params.id]);

  const handleOpenWhatsApp = async () => {
    const phone = lead?.mobilePhone || lead?.phone;
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    const formatted = digits.startsWith('55') ? digits : `55${digits}`;
    const url = `https://wa.me/${formatted}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando lead...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => params.id && loadLead(params.id)}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.name}>{lead?.name || 'Lead sem nome'}</Text>
              {!!lead?.status?.name && (
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{lead?.status?.name}</Text>
                </View>
              )}

              <View style={styles.infoBlock}>
                {!!lead?.email && (
                  <Text style={styles.infoText}>Email: {lead.email}</Text>
                )}
                {!!lead?.phone && (
                  <Text style={styles.infoText}>Telefone: {formatPhone(lead.phone)}</Text>
                )}
                {!!lead?.mobilePhone && (
                  <Text style={styles.infoText}>Celular: {formatPhone(lead.mobilePhone)}</Text>
                )}
                {!!lead?.company?.name && (
                  <Text style={styles.infoText}>Corretora: {lead.company.name}</Text>
                )}
                {!!lead?.user?.name && (
                  <Text style={styles.infoText}>Responsável: {lead.user.name}</Text>
                )}
                {!!lead?.createdAt && (
                  <Text style={styles.infoText}>
                    Criado em: {formatDateTime(lead.createdAt)}
                  </Text>
                )}
              </View>

              {!!lead?.tags?.length && (
                <View style={styles.tagsContainer}>
                  {lead.tags.map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {hasWhatsApp && (
              <TouchableOpacity style={styles.whatsappButton} onPress={handleOpenWhatsApp}>
                <WhatsAppIcon size={18} color={theme.colors.white} />
                <Text style={styles.whatsappButtonText}>Chamar no WhatsApp</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) => {
  const isDark = themeMode === 'dark';
  const cardBackground = isDark ? '#151518' : theme.colors.cardBackground;
  const cardBorder = isDark ? '#1f1f22' : theme.colors.border;
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
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    headerSpacer: {
      width: 36,
      height: 36,
    },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl + insets.bottom,
    },
    card: {
      backgroundColor: cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: cardBorder,
      gap: theme.spacing.md,
    },
    name: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    statusPill: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#232327' : theme.colors.backgroundLight,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
    },
    statusText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: mutedText,
    },
    infoBlock: {
      gap: theme.spacing.xs,
    },
    infoText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    tagPill: {
      backgroundColor: isDark ? '#1f1f23' : theme.colors.backgroundLight,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    tagText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: mutedText,
    },
    whatsappButton: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      backgroundColor: '#25D366',
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.md,
    },
    whatsappButtonText: {
      color: theme.colors.white,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSize.sm,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    loadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    errorText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    retryButtonText: {
      color: theme.colors.white,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSize.sm,
    },
  });
};
