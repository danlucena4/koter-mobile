import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { CheckIcon, EditIcon, CancelIcon, WhatsAppIcon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { authService } from '../src/services/auth.service';
import api from '../src/lib/api';
import {
  HomeIcon,
  CalculatorIconWrapper,
  CRMIcon,
  TaskIcon,
  MenuIcon,
  ArrowLeftIcon,
} from '../src/components/HugeIconsWrapper';
import LogoIcon from '../src/assets/images/Signo 2.svg';

type Broker = {
  id: string;
  name: string;
  logoUri?: string | null;
};

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    avatar?: {
      url?: string | null;
    } | null;
  };
};

const STATUS_LABELS: Record<number, string> = {
  0: 'PENDING',
  1: 'ACCEPTED',
  2: 'REJECTED',
};

const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
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
  if (error?.message?.includes?.('Network Error')) {
    return 'Sem conexão com a API. Verifique sua internet e tente novamente.';
  }

  return apiMessage || 'Não foi possível vincular a corretora. Tente novamente.';
};

export default function BrokersScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);

  const [code, setCode] = useState('');
  const [approvedBrokers, setApprovedBrokers] = useState<Broker[]>([]);
  const [pendingBrokers, setPendingBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const editButtonRefs = useRef<Record<string, any>>({});
  const [menuContext, setMenuContext] = useState<{
    broker: Broker;
    status: 'approved' | 'pending';
  } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const isMenuOpen = Boolean(menuContext && menuAnchor);

  useEffect(() => {
    loadBrokers();
  }, []);

  const normalizeStatus = (status: number | string | undefined) => {
    if (typeof status === 'string') return status.toUpperCase();
    if (typeof status === 'number') return STATUS_LABELS[status] || 'PENDING';
    return undefined;
  };

  const loadBrokers = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const userData = await authService.getAuthenticatedUser();
      const subscriptions = userData.subscribedOnCompanies || [];

      const approved: Broker[] = [];
      const pending: Broker[] = [];

      subscriptions.forEach((subscription) => {
        const status = normalizeStatus(subscription.status);
        const broker: Broker = {
          id: subscription.id,
          name: subscription.name,
          logoUri: subscription.avatar || null,
        };

        if (status === 'ACCEPTED') {
          approved.push(broker);
        } else if (status === 'PENDING') {
          pending.push(broker);
        }
      });

      setApprovedBrokers(approved);
      setPendingBrokers(pending);
      setSelectedCompanyId(userData.company?.id || null);
    } catch (error: any) {
      const message = error.message || 'Nao foi possivel carregar as corretoras vinculadas.';
      setLoadError(message);
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeMenu = () => {
    setMenuContext(null);
    setMenuAnchor(null);
  };

  const openMenu = (broker: Broker, status: 'approved' | 'pending', event?: any) => {
    if (menuContext?.broker.id === broker.id) {
      closeMenu();
      return;
    }

    setMenuContext({ broker, status });

    const ref = editButtonRefs.current[broker.id];
    if (ref && typeof ref.measureInWindow === 'function') {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({ x, y, width, height });
      });
      return;
    }

    if (event?.nativeEvent) {
      const { pageX, pageY } = event.nativeEvent;
      setMenuAnchor({ x: pageX, y: pageY, width: 0, height: 0 });
    }
  };

  const handleCompanyVinculation = async () => {
    const vinculationCode = code.trim().toUpperCase();

    if (!vinculationCode) {
      setCodeError('Preencha o codigo de vinculo.');
      return;
    }

    try {
      setIsLinking(true);
      setCodeError(null);
      const response = await api.get<CompanyResponse>(`/companies/vinculation-code/${vinculationCode}`);
      const company = response.data.company;

      const userData = await authService.getAuthenticatedUser();
      const existingSubscription = userData.subscribedOnCompanies?.find(
        (subscription) => subscription.id === company.id,
      );
      const status = existingSubscription
        ? normalizeStatus(existingSubscription.status)
        : undefined;

      if (status === 'ACCEPTED') {
        setCodeError(`Voce ja esta vinculado a corretora ${company.name}.`);
        return;
      }

      if (status === 'PENDING') {
        setCodeError(`Sua solicitacao para a corretora ${company.name} ja esta em analise.`);
        return;
      }

      await authService.updateAuthenticatedUser({ companyId: company.id });
      await loadBrokers();
      setCode('');
      setCodeError(null);
    } catch (error: any) {
      setCodeError(getVinculationErrorMessage(error));
    } finally {
      setIsLinking(false);
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    if (isChangingCompany || companyId === selectedCompanyId) return;

    try {
      setIsChangingCompany(true);
      await authService.updateAuthenticatedUser({ companyId });
      await loadBrokers();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel selecionar a corretora.');
    } finally {
      setIsChangingCompany(false);
      closeMenu();
    }
  };

  const handleContactCompany = async (companyId: string) => {
    try {
      const response = await api.get<CompanyResponse>(`/companies/${companyId}/active`);
      const phone = response.data.company?.phone;
      const email = response.data.company?.email;

      if (!phone && !email) {
        Alert.alert(
          'Contato indisponível',
          'Esta corretora ainda não informou telefone ou email para contato.',
        );
        return;
      }

      if (phone) {
        const formattedPhone = formatPhoneNumber(phone);
        const url = `https://wa.me/${formattedPhone}`;
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
          return;
        }
      }

      if (email) {
        const mailUrl = `mailto:${email}`;
        const supported = await Linking.canOpenURL(mailUrl);
        if (supported) {
          await Linking.openURL(mailUrl);
          return;
        }
      }

      Alert.alert(
        'Contato indisponível',
        'Não foi possível abrir um canal de contato agora. Tente novamente mais tarde.',
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel abrir o contato da corretora.');
    } finally {
      closeMenu();
    }
  };

  const handleUnlinkCompany = async (broker: Broker, context: 'approved' | 'pending') => {
    if (isUnlinking) return;

    closeMenu();
    const title = context === 'pending' ? 'Cancelar solicitacao' : 'Desvincular';
    const confirmLabel = context === 'pending' ? 'Cancelar solicitacao' : 'Desvincular';
    const description =
      context === 'pending'
        ? `Deseja cancelar a solicitacao para a corretora ${broker.name}?`
        : `Deseja realmente desvincular da corretora ${broker.name}?`;

    Alert.alert(
      title,
      description,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUnlinking(true);
              await api.delete(`/users/me/companies/${broker.id}`);
              await loadBrokers();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Nao foi possivel desvincular a corretora.');
            } finally {
              setIsUnlinking(false);
            }
          },
        },
      ]
    );
  };

  const renderBrokerRow = (broker: Broker, status: 'approved' | 'pending', isLast: boolean) => {
    const showLogo = broker.logoUri && !logoErrors[broker.id];
    const isSelected = selectedCompanyId === broker.id;
    const isApproved = status === 'approved';

    return (
      <View key={broker.id}>
        <View style={styles.brokerRow}>
          <View style={styles.logoCircle}>
            {showLogo ? (
              <Image
                source={{ uri: broker.logoUri as string }}
                style={styles.logoImage}
                onError={() => setLogoErrors((prev) => ({ ...prev, [broker.id]: true }))}
              />
            ) : (
              <LogoIcon width={24} height={24} />
            )}
          </View>
          <View style={styles.brokerInfo}>
            <Text style={styles.brokerName}>{broker.name}</Text>
            {status === 'approved' ? (
              isSelected ? (
                <View style={styles.statusSelected}>
                  <CheckIcon size={12} color={theme.colors.success} />
                  <Text style={styles.statusSelectedText}>Selecionado</Text>
                </View>
              ) : (
                <View style={styles.statusAvailable}>
                  <Text style={styles.statusAvailableText}>Disponivel</Text>
                </View>
              )
            ) : (
              <Text style={styles.statusPending}>Aguardando aprovacao</Text>
            )}
          </View>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              ref={(node) => {
                editButtonRefs.current[broker.id] = node;
              }}
              style={styles.editButton}
              onPress={(event) => openMenu(broker, status, event)}
            >
              <EditIcon size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        {!isLast && <View style={styles.rowDivider} />}
      </View>
    );
  };

  const menuPosition = (() => {
    if (!menuAnchor || !menuContext) {
      return { top: 0, left: 0 };
    }

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const menuWidth = 200;
    const estimatedHeight = menuContext.status === 'approved' ? 156 : 118;
    const padding = theme.spacing.lg;

    let left = menuAnchor.x + menuAnchor.width - menuWidth;
    left = Math.max(padding, Math.min(left, screenWidth - menuWidth - padding));

    let top = menuAnchor.y + menuAnchor.height + 8;
    if (top + estimatedHeight > screenHeight - padding) {
      top = Math.max(padding, menuAnchor.y - estimatedHeight - 8);
    }

    return { top, left };
  })();

  const menuSelected = menuContext ? selectedCompanyId === menuContext.broker.id : false;
  const menuApproved = menuContext?.status === 'approved';

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Corretoras Vinculadas</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={[styles.scrollView, isMenuOpen && styles.scrollViewOnTop]}
          onScrollBeginDrag={closeMenu}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enviar nova solicitacao</Text>
            <Text style={styles.cardSubtitle}>Digite o codigo de vinculo da Corretora que deseja se vincular.</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Codigo da Corretora"
                placeholderTextColor={theme.colors.textMuted}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  if (codeError) setCodeError(null);
                }}
                autoCapitalize="characters"
                onSubmitEditing={handleCompanyVinculation}
                editable={!isLinking}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleCompanyVinculation} disabled={isLinking}>
                {isLinking ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <CheckIcon size={18} color={theme.colors.textOnPrimary} />
                )}
              </TouchableOpacity>
            </View>
            {codeError && <Text style={styles.inputErrorText}>{codeError}</Text>}
          </View>

          {loadError && <Text style={styles.errorText}>{loadError}</Text>}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando corretoras...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Solicitacoes Aprovadas</Text>
                <View style={styles.listCard}>
                  {approvedBrokers.length === 0 ? (
                    <Text style={styles.emptyText}>Voce nao tem corretoras vinculadas.</Text>
                  ) : (
                    approvedBrokers.map((broker, index) =>
                      renderBrokerRow(broker, 'approved', index === approvedBrokers.length - 1)
                    )
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Solicitacoes Pendentes</Text>
                <View style={styles.listCard}>
                  {pendingBrokers.length === 0 ? (
                    <Text style={styles.emptyText}>Voce nao tem corretoras vinculadas.</Text>
                  ) : (
                    pendingBrokers.map((broker, index) =>
                      renderBrokerRow(broker, 'pending', index === pendingBrokers.length - 1)
                    )
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {menuContext && menuAnchor && (
          <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={closeMenu}
          >
            <View style={styles.menuOverlay}>
              <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
              <View style={[styles.dropdownMenu, { top: menuPosition.top, left: menuPosition.left }]}> 
                {menuApproved && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleSelectCompany(menuContext.broker.id)}
                    disabled={menuSelected || isChangingCompany}
                  >
                    <CheckIcon size={14} color={menuSelected ? theme.colors.textMuted : theme.colors.success} />
                    <Text style={[styles.dropdownItemText, menuSelected && styles.dropdownItemTextDisabled]}>
                      Selecionar
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleContactCompany(menuContext.broker.id)}
                >
                  <WhatsAppIcon size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.dropdownItemText}>Entrar em contato</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleUnlinkCompany(menuContext.broker, menuApproved ? 'approved' : 'pending')}
                  disabled={isUnlinking}
                >
                  <CancelIcon size={14} color={theme.colors.error} />
                  <Text style={[styles.dropdownItemText, styles.dropdownItemTextDanger]}>
                    {menuApproved ? 'Desvincular' : 'Cancelar solicitacao'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <View
          style={[styles.bottomNav, isMenuOpen && styles.bottomNavBehind]}
          pointerEvents={isMenuOpen ? 'none' : 'auto'}
        >
          <BottomNavItem
            icon={<HomeIcon size={24} color={theme.colors.textSecondary} />}
            label="Inicio"
            theme={theme}
            insets={insets}
            onPress={() => router.push('/home')}
          />
          <BottomNavItem
            icon={<CalculatorIconWrapper size={24} color={theme.colors.textSecondary} />}
            label="Cotacoes"
            theme={theme}
            onPress={() => router.push('/quotes')}
            insets={insets}
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
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl * 2,
    },
    scrollView: {
      position: 'relative',
      zIndex: 1,
    },
    scrollViewOnTop: {
      zIndex: 5,
      elevation: 5,
    },
    card: {
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    cardTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    cardSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    codeInput: {
      flex: 1,
      height: 44,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    inputErrorText: {
      marginTop: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
    },
    submitButton: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    listCard: {
      backgroundColor: themeMode === 'dark' ? '#222' : '#F8F8F8',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      padding: theme.spacing.lg,
    },
    brokerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      overflow: 'hidden',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    brokerInfo: {
      flex: 1,
    },
    brokerName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    statusSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: 4,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.success + '1A',
      alignSelf: 'flex-start',
    },
    statusSelectedText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.success,
    },
    statusAvailable: {
      marginTop: 4,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignSelf: 'flex-start',
    },
    statusAvailableText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    statusPending: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.warning,
      marginTop: 4,
    },
    menuContainer: {
      position: 'relative',
      alignItems: 'flex-end',
      zIndex: 20,
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    dropdownMenu: {
      position: 'absolute',
      width: 220,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xs,
      elevation: 12,
      ...theme.shadows.md,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    dropdownItemText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    dropdownItemTextDisabled: {
      color: theme.colors.textMuted,
    },
    dropdownItemTextDanger: {
      color: theme.colors.error,
    },
    rowDivider: {
      height: 1,
      backgroundColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
      marginVertical: theme.spacing.md,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      paddingVertical: theme.spacing.md,
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
    errorText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
      marginBottom: theme.spacing.lg,
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
      zIndex: 1,
    },
    bottomNavBehind: {
      zIndex: 0,
      elevation: 0,
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
