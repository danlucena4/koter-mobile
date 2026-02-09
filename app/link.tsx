import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Button, ThumbsUpIcon, ThumbsDownIcon, CheckIcon, UserIcon, BriefcaseIcon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import { onboardingService } from '../src/services/onboarding.service';
import { authService } from '../src/services/auth.service';
import api from '../src/lib/api';
import LogoIcon from '../src/assets/images/Signo 2.svg';

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    avatar?: {
      url?: string | null;
    } | null;
  };
};

type Choice = 'no' | 'yes';
type LinkStatus = 'PENDING' | 'ACCEPTED';

const STATUS_LABELS: Record<number, LinkStatus> = {
  0: 'PENDING',
  1: 'ACCEPTED',
};

const normalizeStatus = (status: number | string | undefined) => {
  if (typeof status === 'string') return status.toUpperCase();
  if (typeof status === 'number') return STATUS_LABELS[status] || 'PENDING';
  return undefined;
};

const getVinculationErrorMessage = (error: any) => {
  if (typeof error === 'string') {
    if (error.toLowerCase().includes('recurso não encontrado')) {
      return 'Corretora não encontrada.';
    }
    return error;
  }

  const status = error?.response?.status;
  const responseData = error?.response?.data;
  const apiMessage =
    (typeof responseData === 'string' ? responseData : undefined) ??
    responseData?.message ??
    responseData?.error;
  const rawMessage = error?.message;

  if (apiMessage?.toLowerCase?.().includes('recurso não encontrado')) {
    return 'Corretora não encontrada.';
  }
  if (rawMessage?.toLowerCase?.().includes('recurso não encontrado')) {
    return 'Corretora não encontrada.';
  }
  if (status === 404) return 'Corretora não encontrada.';
  if (status === 400) return apiMessage || 'Código de vínculo inválido.';
  if (status === 401) return 'Sessão expirada. Faça login novamente.';
  if (rawMessage?.includes?.('Network Error')) {
    return 'Sem conexão com a API. Verifique sua internet e tente novamente.';
  }

  return apiMessage || 'Não foi possível vincular a corretora. Tente novamente.';
};

export default function LinkScreen() {
  const { theme: themeMode } = useTheme();
  const { userName, profileImage } = useUser();
  const theme = getTheme(themeMode);
  const router = useRouter();

  const [choice, setChoice] = useState<Choice>('no');
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [linkedCompany, setLinkedCompany] = useState<{ id: string; name: string; logoUri?: string | null } | null>(null);
  const [linkedStatus, setLinkedStatus] = useState<LinkStatus | null>(null);
  const [logoError, setLogoError] = useState(false);

  const styles = createStyles(theme);

  const handleCompanyVinculation = async () => {
    const vinculationCode = code.trim().toUpperCase();

    if (!vinculationCode) {
      setCodeError('Preencha o código de vínculo.');
      return;
    }

    try {
      setIsLinking(true);
      setCodeError(null);
      setLogoError(false);

      const response = await api.get<CompanyResponse>(`/companies/vinculation-code/${vinculationCode}`);
      const company = response.data.company;

      const userData = await authService.getAuthenticatedUser();
      const existingSubscription = userData.subscribedOnCompanies?.find(
        (subscription) => subscription.id === company.id,
      );
      const status = existingSubscription ? normalizeStatus(existingSubscription.status) : undefined;

      if (status === 'ACCEPTED') {
        setLinkedCompany({
          id: company.id,
          name: company.name,
          logoUri: existingSubscription?.avatar || company.avatar?.url || null,
        });
        setLinkedStatus('ACCEPTED');
        setSubmitted(true);
        setCodeError('Você já está aprovado nesta corretora.');
        return;
      }

      if (status === 'PENDING') {
        setLinkedCompany({
          id: company.id,
          name: company.name,
          logoUri: existingSubscription?.avatar || company.avatar?.url || null,
        });
        setLinkedStatus('PENDING');
        setSubmitted(true);
        setCodeError('Sua solicitação já está em análise.');
        return;
      }

      await authService.updateAuthenticatedUser({ companyId: company.id });
      const refreshedUser = await authService.getAuthenticatedUser();
      const updatedSubscription = refreshedUser.subscribedOnCompanies?.find(
        (subscription) => subscription.id === company.id,
      );
      const updatedStatus = normalizeStatus(updatedSubscription?.status) || 'PENDING';

      setLinkedCompany({
        id: company.id,
        name: company.name,
        logoUri: updatedSubscription?.avatar || company.avatar?.url || null,
      });
      setLinkedStatus(updatedStatus === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING');
      setSubmitted(true);
      setCodeError(null);
    } catch (error: any) {
      setCodeError(getVinculationErrorMessage(error));
    } finally {
      setIsLinking(false);
    }
  };

  const handleNext = async () => {
    if (choice === 'yes') {
      if (!submitted) {
        if (!canSubmitYes || isLinking) return;
        await handleCompanyVinculation();
        return;
      }
      // Marca onboarding como completo e redireciona
      await onboardingService.markAsCompleted();
      router.replace('/home');
      return;
    }
    // Marca onboarding como completo e redireciona
    await onboardingService.markAsCompleted();
    router.replace('/home');
  };

  const canSubmitYes = choice === 'yes' && code.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Vínculo</Text>
            <Text style={styles.subtitle}>Deseja se conectar à uma Corretora Parceira?</Text>
          </View>

          <View style={styles.cardsBlock}>
          <View style={styles.partnerCard}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <UserIcon size={26} color={theme.colors.textSecondary} />
              )}
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.partnerRole}>Corretor do Futuro</Text>
            </View>
            <View style={styles.badgeCheck}>
              <CheckIcon size={16} color={theme.colors.primary} />
            </View>
          </View>

            <View style={[styles.partnerCard, styles.partnerCardMuted]}>
              <View style={styles.avatarMuted}>
                <BriefcaseIcon size={22} color={theme.colors.textMuted} />
              </View>
              <View style={styles.partnerInfo}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonLineSmall]} />
              </View>
              <View style={styles.badgeCheck}>
                <CheckIcon size={16} color={theme.colors.textMuted} />
              </View>
            </View>
          </View>

          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[styles.selectionButton, choice === 'no' && styles.selectionButtonActivePrimary]}
              onPress={() => {
                setChoice('no');
                setSubmitted(false);
                setCode('');
                setCodeError(null);
                setLinkedCompany(null);
                setLinkedStatus(null);
                setLogoError(false);
              }}
            >
              <ThumbsDownIcon size={22} color={choice === 'no' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.selectionText, choice === 'no' && styles.selectionTextActivePrimary]}>Não</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectionButton, choice === 'yes' && styles.selectionButtonActivePrimary]}
              onPress={() => {
                setChoice('yes');
                setSubmitted(false);
                setCodeError(null);
                setLinkedCompany(null);
                setLinkedStatus(null);
                setLogoError(false);
              }}
            >
              <ThumbsUpIcon size={22} color={choice === 'yes' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.selectionText, choice === 'yes' && styles.selectionTextActivePrimary]}>Sim</Text>
            </TouchableOpacity>
          </View>

          {choice === 'no' && !submitted && (
            <Text style={styles.helperText}>
              Com vínculo à uma corretora você desbloqueia diversos benefícios atrelados à assinatura da Corretora.
              Não perca tempo, entre em contato com sua corretora e peça o código do <Text style={styles.bold}>Koter</Text>!
            </Text>
          )}

          {choice === 'yes' && !submitted && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeLabel}>Código da Corretora</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Digite o código da corretora"
                placeholderTextColor={theme.colors.textSecondary}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  if (codeError) setCodeError(null);
                }}
                autoCapitalize="characters"
                editable={!isLinking}
              />
              {codeError && <Text style={styles.codeErrorText}>{codeError}</Text>}
            </View>
          )}

          {submitted && (
            <View style={styles.sentBlock}>
              <Text style={styles.sentTitle}>
                {linkedStatus === 'ACCEPTED' ? 'Corretora aprovada.' : 'Solicitação enviada.'}
              </Text>
              <View style={styles.sentPill}>
                <View style={styles.sentLeft}>
                  <View style={styles.sentLogo}>
                    {linkedCompany?.logoUri && !logoError ? (
                      <Image
                        source={{ uri: linkedCompany.logoUri }}
                        style={styles.sentLogoImage}
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <LogoIcon width={18} height={18} />
                    )}
                  </View>
                  <Text style={styles.sentName}>{linkedCompany?.name || 'Corretora vinculada'}</Text>
                </View>
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>

        <View style={styles.footer}>
          <Button
            title="Voltar"
            variant="secondary"
            onPress={() => router.back()}
            containerStyle={styles.backButton}
          />
          <Button
            title={
              isLinking
                ? 'Vinculando...'
                : choice === 'yes' && submitted
                  ? 'Finalizar'
                  : 'Próximo'
            }
            onPress={handleNext}
            disabled={isLinking || (choice === 'yes' && !submitted && !canSubmitYes)}
            containerStyle={styles.nextButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg },
  header: { alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl },
  title: { fontSize: theme.fontSize.huge, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary, textAlign: 'center' },

  cardsBlock: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  partnerCardMuted: { opacity: 0.65 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarMuted: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bold, color: theme.colors.text },
  partnerRole: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary },
  badgeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLine: { height: 10, backgroundColor: theme.colors.border, borderRadius: 6, width: '80%' },
  skeletonLineSmall: { width: '55%', marginTop: 6 },

  selectionRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  selectionButton: {
    flex: 1,
    height: 72,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  selectionButtonActivePrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05',
  },
  selectionText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary },
  selectionTextActivePrimary: { color: theme.colors.primary },

  helperText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  bold: { fontFamily: theme.fonts.bold, color: theme.colors.text },

  codeBlock: { marginTop: theme.spacing.sm },
  codeLabel: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: theme.spacing.md },
  codeInput: {
    height: 52,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  codeErrorText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.error,
  },

  sentBlock: { marginTop: theme.spacing.sm },
  sentTitle: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  sentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '12',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sentLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sentLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  sentLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sentName: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.medium, color: theme.colors.success },

  footer: { 
    flexDirection: 'row', 
    gap: theme.spacing.md, 
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: { flex: 1 },
  nextButton: { flex: 1 },
});


