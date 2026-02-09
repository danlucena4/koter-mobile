import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { Button, ArrowLeft02Icon, InfoIcon } from '../src/components';

export default function ComingSoonScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string | string[] }>();
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const featureTitle = rawTitle || 'Funcionalidade';
  const styles = createStyles(theme, themeMode);

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{featureTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.glowPrimary} />
            <View style={styles.glowSecondary} />
            <View style={styles.heroCard}>
              <View style={styles.iconBadge}>
                <InfoIcon size={28} color={theme.colors.textOnPrimary} />
              </View>
              <Text style={styles.heroTitle}>Em breve</Text>
              <Text style={styles.heroSubtitle}>
                Estamos finalizando {featureTitle} com foco em velocidade e usabilidade.
              </Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Atualização em andamento</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>O que esperar</Text>
            <Text style={styles.detailItem}>- Fluxos mais rápidos e simples.</Text>
            <Text style={styles.detailItem}>- Visual alinhado com o KoterPRO.</Text>
            <Text style={styles.detailItem}>- Integração completa com seus dados.</Text>
          </View>

          <Button
            title="Voltar para o menu"
            onPress={() => router.back()}
            containerStyle={styles.backAction}
          />
        </View>
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
    headerSpacer: {
      width: 32,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xl,
    },
    hero: {
      position: 'relative',
    },
    glowPrimary: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.colors.primary,
      opacity: themeMode === 'dark' ? 0.22 : 0.12,
    },
    glowSecondary: {
      position: 'absolute',
      bottom: -50,
      left: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.secondary,
      opacity: themeMode === 'dark' ? 0.18 : 0.1,
    },
    heroCard: {
      padding: theme.spacing.xl,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      ...theme.shadows.md,
    },
    heroTitle: {
      fontSize: theme.fontSize.xxxl,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    heroSubtitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    pill: {
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#2B2B2B' : '#EFEFEF',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    pillText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    detailCard: {
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#E5E7EB' : theme.colors.border,
      gap: theme.spacing.sm,
    },
    detailTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    detailItem: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    backAction: {
      marginTop: theme.spacing.sm,
    },
  });
