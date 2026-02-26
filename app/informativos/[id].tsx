import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationsContext';
import { informativeService } from '../../src/services/informative.service';
import { Informative, InformativeCategory } from '../../src/@types/informative';
import { ArrowLeft02Icon } from '../../src/components';
import { NotificationIcon } from '../../src/components/HugeIconsWrapper';

const categoryLabelMap: Record<number, string> = {
  [InformativeCategory.UPDATE]: 'Atualização',
  [InformativeCategory.CAMPAIGN]: 'Campanha',
  [InformativeCategory.NEWS]: 'Notícia',
};

const categoryColorMap: Record<number, string> = {
  [InformativeCategory.UPDATE]: '#2f7dff',
  [InformativeCategory.CAMPAIGN]: '#f59e0b',
  [InformativeCategory.NEWS]: '#22c55e',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const decodeHtmlEntities = (value: string) => {
  const namedEntities: Record<string, string> = {
    '&aacute;': 'á',
    '&Aacute;': 'Á',
    '&agrave;': 'à',
    '&Agrave;': 'À',
    '&atilde;': 'ã',
    '&Atilde;': 'Ã',
    '&acirc;': 'â',
    '&Acirc;': 'Â',
    '&eacute;': 'é',
    '&Eacute;': 'É',
    '&ecirc;': 'ê',
    '&Ecirc;': 'Ê',
    '&iacute;': 'í',
    '&Iacute;': 'Í',
    '&oacute;': 'ó',
    '&Oacute;': 'Ó',
    '&otilde;': 'õ',
    '&Otilde;': 'Õ',
    '&ocirc;': 'ô',
    '&Ocirc;': 'Ô',
    '&uacute;': 'ú',
    '&Uacute;': 'Ú',
    '&ccedil;': 'ç',
    '&Ccedil;': 'Ç',
    '&ordm;': 'º',
    '&ordf;': 'ª',
    '&ndash;': '-',
    '&mdash;': '-',
  };

  let decoded = value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  decoded = decoded.replace(/&#(\d+);/g, (_match, decimalCode) => {
    const code = Number(decimalCode);
    if (Number.isNaN(code)) return _match;
    return String.fromCharCode(code);
  });

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, hexCode) => {
    const code = parseInt(hexCode, 16);
    if (Number.isNaN(code)) return _match;
    return String.fromCharCode(code);
  });

  Object.entries(namedEntities).forEach(([entity, char]) => {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  });

  return decoded;
};

const htmlToText = (html?: string) => {
  if (!html) return '';
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li)>/gi, '\n')
    .replace(/<li>/gi, '- ');

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export default function InformativeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme, themeMode, insets);
  const { openNotifications, unreadCount } = useNotifications();

  const [informative, setInformative] = useState<Informative | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInformative = async () => {
      if (!id) {
        setError('Informativo inválido.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await informativeService.getInformativeById(id);
        setInformative(response);
        setError(null);
      } catch (fetchError: unknown) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar o informativo.';
        setError(message);
        setInformative(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadInformative();
  }, [id]);

  const contentText = useMemo(() => htmlToText(informative?.content), [informative?.content]);
  const category = informative?.category ?? InformativeCategory.NEWS;
  const categoryLabel = categoryLabelMap[category] || 'Notícia';
  const categoryColor = categoryColorMap[category] || '#22c55e';

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informativo</Text>
          <TouchableOpacity style={styles.headerButton} onPress={openNotifications}>
            <NotificationIcon size={20} color={theme.colors.text} />
            {unreadCount > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando informativo...</Text>
          </View>
        ) : error || !informative ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error || 'Informativo não encontrado.'}</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.badgeText, { color: categoryColor }]}>{categoryLabel}</Text>
            </View>

            <Text style={styles.title}>{informative.title}</Text>
            <Text style={styles.date}>{formatDate(informative.createdAt)}</Text>

            <View style={styles.article}>
              <Text style={styles.articleText}>{contentText || 'Sem conteúdo para exibir.'}</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) => {
  const isDark = themeMode === 'dark';
  const headerBorder = isDark ? '#1f1f23' : '#e5e7eb';
  const mutedText = isDark ? '#9ca3af' : theme.colors.textSecondary;
  const articleBackground = isDark ? '#0f1014' : '#ffffff';
  const articleBorder = isDark ? '#1f1f23' : '#eceef2';

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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    loadingText: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
      color: mutedText,
    },
    errorText: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
      color: mutedText,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadius.full,
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    badgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: theme.fontSize.xxl,
      fontFamily: theme.fonts.bold,
      lineHeight: 32,
      color: theme.colors.text,
    },
    date: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      textTransform: 'capitalize',
    },
    article: {
      borderWidth: 1,
      borderColor: articleBorder,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: articleBackground,
      padding: theme.spacing.md,
    },
    articleText: {
      color: theme.colors.text,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      lineHeight: 24,
    },
  });
};
