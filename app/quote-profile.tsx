import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/contexts/ThemeContext';
import { getTheme } from '../src/utils/theme';
import api from '../src/lib/api';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Settings01Icon, Edit02Icon } from '@hugeicons/core-free-icons';
import { ArrowLeftIcon, ArrowRightIcon } from '../src/components/HugeIconsWrapper';

const TAB_OPTIONS = [
  { key: 'prices', label: 'Preços', default: true },
  { key: 'refnets', label: 'Rede Referenciada', default: true, field: 'fullRefnetsLink' },
  { key: 'discount', label: 'Regras de Desconto', default: false, field: 'discountNotes' },
  { key: 'observations', label: 'Observações', default: false, field: 'importantNotes' },
  { key: 'commercialArea', label: 'Área de Comercialização', default: false },
  { key: 'coparticipationNotes', label: 'Notas de coparticipação', default: false, field: 'coparticipationNotes' },
  { key: 'documents', label: 'Documentação necessária', default: false, field: 'neededDocumentsNotes' },
  { key: 'grace', label: 'Notas de carência', default: false, field: 'gracePeriodNotes' },
  { key: 'differentials', label: 'Diferenciais', default: false, field: 'differentialsNotes' },
  { key: 'congeners', label: 'Notas de congêneres', default: false, field: 'congenersNotes' },
  { key: 'ageLimit', label: 'Notas de limite de idade', default: false, field: 'ageLimitNotes' },
  { key: 'refund', label: 'Notas de reembolso', default: false, field: 'refundNotes' },
  { key: 'franchise', label: 'Notas de franquia', default: false, field: 'franchiseNotes' },
  { key: 'repique', label: 'Notas de repique', default: false, field: 'repiqueNotes' },
  { key: 'commercialCampaign', label: 'Campanhas comerciais', default: false, field: 'commercialCampaignNotes' },
  { key: 'payment', label: 'Formas de pagamento', default: false, field: 'paymentMethodsNotes' },
  { key: 'alert', label: 'Notas de alerta', default: false, field: 'alertNotes' },
  { key: 'registrationFee', label: 'Taxa de inscrição', default: false, field: 'registrationFeeNotes' },
];

type QuoteProduct = {
  id: string;
  name: string;
  accommodation?: { name: string } | null;
  coverage?: { name: string } | null;
  segment?: { name: string } | null;
  includesCoparticipation?: number | null;
  isRefundable?: boolean | null;
  cities?: Array<{ id: string; name: string }> | null;
  priceAgeGroup018?: number | null;
  priceAgeGroup1923?: number | null;
  priceAgeGroup2428?: number | null;
  priceAgeGroup2933?: number | null;
  priceAgeGroup3438?: number | null;
  priceAgeGroup3943?: number | null;
  priceAgeGroup4448?: number | null;
  priceAgeGroup4953?: number | null;
  priceAgeGroup5458?: number | null;
  priceAgeGroup59Upper?: number | null;
  refnets?: Array<{
    id: string;
    name: string;
    city?: string | null;
    expertises?: Array<{
      id: string;
      name: string;
    }>;
  }> | null;
};

type QuotePlan = {
  id: string;
  name: string;
  managerName?: string;
  image?: string | null;
  managerImage?: string | null;
  quoteType?: 'HEALTH' | 'ODONTO';
  fullRefnetsLink?: string | null;
  importantNotes?: string | null;
  coparticipationNotes?: string | null;
  neededDocumentsNotes?: string | null;
  gracePeriodNotes?: string | null;
  differentialsNotes?: string | null;
  discountNotes?: string | null;
  congenersNotes?: string | null;
  ageLimitNotes?: string | null;
  refundNotes?: string | null;
  compulsoryRulesNotes?: string | null;
  franchiseNotes?: string | null;
  repiqueNotes?: string | null;
  commercialCampaignNotes?: string | null;
  paymentMethodsNotes?: string | null;
  alertNotes?: string | null;
  registrationFeeNotes?: string | null;
  tables?: Array<{
    id: string;
    name: string;
    products: QuoteProduct[];
  }>;
};

type QuoteDetails = {
  id: string;
  slug: string;
  client?: string | null;
  productsIds?: string[];
  plans?: QuotePlan[];
  lives0to18?: number;
  lives19to23?: number;
  lives24to28?: number;
  lives29to33?: number;
  lives34to38?: number;
  lives39to43?: number;
  lives44to48?: number;
  lives49to53?: number;
  lives54to58?: number;
  lives59upper?: number;
};

export default function QuoteProfileScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const styles = createStyles(theme, themeMode, insets);

  const [activeTabKey, setActiveTabKey] = useState('prices');
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentType, setCurrentType] = useState<'HEALTH' | 'ODONTO'>('HEALTH');
  const [refnetSearch, setRefnetSearch] = useState('');
  const [salesAreaSearch, setSalesAreaSearch] = useState('');
  const [tabVisibility, setTabVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TAB_OPTIONS.map((tab) => [tab.key, tab.default])),
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configSection, setConfigSection] = useState<'info' | 'contact'>('info');
  const [clientNameInput, setClientNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isRemovingProduct, setIsRemovingProduct] = useState(false);
  const [expandedDiscountPlans, setExpandedDiscountPlans] = useState<string[]>([]);
  const [expandedNotePlans, setExpandedNotePlans] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!params.id) return;
    let isMounted = true;

    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/quotes/me/${params.id}/details`);
        const data = response.data?.quote || response.data?.data || response.data;
        if (isMounted) setQuote(data);
      } catch {
        if (isMounted) setError('Não foi possível carregar a cotação.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const availableTypes = useMemo(() => {
    const types = new Set<'HEALTH' | 'ODONTO'>();
    quote?.plans?.forEach((plan) => {
      const planType = plan.quoteType || 'HEALTH';
      if (planType === 'ODONTO') types.add('ODONTO');
      if (planType === 'HEALTH') types.add('HEALTH');
    });
    if (types.size === 0) types.add('HEALTH');
    return Array.from(types);
  }, [quote]);

  const filteredProducts = useMemo(() => {
    if (!quote?.plans?.length) return [];
    const ids = new Set(selectedProductIds);
    const result: Array<{ plan: QuotePlan; product: QuoteProduct }> = [];
    quote.plans.forEach((plan) => {
      const planType = plan.quoteType || 'HEALTH';
      if (planType !== currentType) return;
      plan.tables?.forEach((table) => {
        table.products.forEach((product) => {
          if (ids.size === 0 || ids.has(product.id)) {
            result.push({ plan, product });
          }
        });
      });
    });
    return result;
  }, [quote, selectedProductIds, currentType]);

  const featured = filteredProducts[currentIndex] || null;
  const activePlan = featured?.plan || null;
  const isNoteTab =
    activeTabKey !== 'prices' &&
    activeTabKey !== 'refnets' &&
    activeTabKey !== 'discount' &&
    activeTabKey !== 'commercialArea' &&
    Boolean(activeNoteConfig?.field);
  const expandedNotes = expandedNotePlans[activeTabKey] || [];

  useEffect(() => {
    if (!quote) return;
    const hasProductsIds = Array.isArray(quote.productsIds);
    const ids = hasProductsIds
      ? quote.productsIds
      : quote.plans?.flatMap((plan) =>
          plan.tables?.flatMap((table) => table.products.map((product) => product.id)) || [],
        ) || [];
    setSelectedProductIds(ids);
    setClientNameInput(quote.client || '');
  }, [quote]);

  useEffect(() => {
    if (!availableTypes.includes(currentType)) {
      setCurrentType(availableTypes[0] || 'HEALTH');
    }
  }, [availableTypes, currentType]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [currentType, selectedProductIds]);

  const visibleTabs = useMemo(
    () => TAB_OPTIONS.filter((tab) => tabVisibility[tab.key]),
    [tabVisibility],
  );

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((tab) => tab.key === activeTabKey)) {
      setActiveTabKey(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTabKey]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < filteredProducts.length - 1;

  const handlePrevProduct = () => {
    if (!canPrev) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextProduct = () => {
    if (!canNext) return;
    setCurrentIndex((prev) => Math.min(filteredProducts.length - 1, prev + 1));
  };

  const handleRemoveProduct = async (id: string) => {
    if (!quote || isRemovingProduct) return;
    setIsRemovingProduct(true);
    try {
      const response = await api.patch(`/quotes/${quote.id}/products/remove`, { productIds: id });
      const data = response.data?.quote || response.data?.data || response.data;
      if (data) {
        setQuote(data);
        const hasProductsIds = Array.isArray(data.productsIds);
        const ids = hasProductsIds
          ? data.productsIds
          : data.plans?.flatMap((plan: QuotePlan) =>
              plan.tables?.flatMap((table) => table.products.map((product) => product.id)) || [],
            ) || [];
        setSelectedProductIds(ids);
      } else {
        setSelectedProductIds((prev) => prev.filter((item) => item !== id));
      }
    } catch {
      setError('Não foi possível remover o produto da cotação.');
    } finally {
      setIsRemovingProduct(false);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const agePricingRows = useMemo(() => {
    if (!quote || !featured) return [];
    const ageRows = [
      { label: '0 a 18', lives: quote.lives0to18 || 0, price: featured.product.priceAgeGroup018 },
      { label: '19 a 23', lives: quote.lives19to23 || 0, price: featured.product.priceAgeGroup1923 },
      { label: '24 a 28', lives: quote.lives24to28 || 0, price: featured.product.priceAgeGroup2428 },
      { label: '29 a 33', lives: quote.lives29to33 || 0, price: featured.product.priceAgeGroup2933 },
      { label: '34 a 38', lives: quote.lives34to38 || 0, price: featured.product.priceAgeGroup3438 },
      { label: '39 a 43', lives: quote.lives39to43 || 0, price: featured.product.priceAgeGroup3943 },
      { label: '44 a 48', lives: quote.lives44to48 || 0, price: featured.product.priceAgeGroup4448 },
      { label: '49 a 53', lives: quote.lives49to53 || 0, price: featured.product.priceAgeGroup4953 },
      { label: '54 a 58', lives: quote.lives54to58 || 0, price: featured.product.priceAgeGroup5458 },
      { label: '59+', lives: quote.lives59upper || 0, price: featured.product.priceAgeGroup59Upper },
    ];

    return ageRows.filter((row) => row.lives > 0 && row.price !== null && row.price !== undefined);
  }, [quote, featured]);

  const totalPrice = useMemo(() => {
    return agePricingRows.reduce((acc, row) => acc + row.lives * Number(row.price || 0), 0);
  }, [agePricingRows]);

  const handleSaveClientName = async () => {
    if (!quote) return;
    const nextName = clientNameInput.trim();
    setIsSavingName(true);
    try {
      await api.patch(`/quotes/${quote.id}/client-name`, { client: nextName || null });
      setQuote((prev) => (prev ? { ...prev, client: nextName || null } : prev));
      setIsEditingName(false);
    } catch {
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleEditName = () => {
    if (isEditingName) {
      handleSaveClientName();
    } else {
      setIsEditingName(true);
    }
  };

  const refnets = featured?.product.refnets || [];
  const filteredRefnets = refnets.filter((item) => {
    if (!refnetSearch.trim()) return true;
    const term = refnetSearch.trim().toLowerCase();
    const city = item.city?.toLowerCase() || '';
    const name = item.name.toLowerCase();
    const expertises = item.expertises?.map((ex) => ex.name.toLowerCase()).join(' ') || '';
    return city.includes(term) || name.includes(term) || expertises.includes(term);
  });

  const discountPlans = useMemo(() => {
    if (!quote?.plans) return [];
    return quote.plans
      .filter((plan) => (plan.quoteType || 'HEALTH') === currentType)
      .map((plan) => {
        const note = plan.discountNotes?.trim() || '';
        const links = note.match(/https?:\/\/[^\s)]+/gi) || [];
        return {
          id: plan.id,
          name: plan.name,
          managerName: plan.managerName,
          links,
          note,
        };
      });
  }, [quote, currentType]);

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const salesAreaProducts = useMemo(() => {
    if (!quote?.plans) return [];
    const ids = new Set(selectedProductIds);
    const useSelected = ids.size > 0;
    const productMap = new Map<string, QuoteProduct>();
    quote.plans.forEach((plan) => {
      const planType = plan.quoteType || 'HEALTH';
      if (planType !== currentType) return;
      plan.tables?.forEach((table) => {
        table.products.forEach((product) => {
          if (!useSelected || ids.has(product.id)) {
            productMap.set(product.id, product);
          }
        });
      });
    });
    return Array.from(productMap.values());
  }, [quote, currentType, selectedProductIds]);

  const salesAreaCities = useMemo(() => {
    const citySet = new Set<string>();
    salesAreaProducts.forEach((product) => {
      product.cities?.forEach((city) => {
        if (city?.name) citySet.add(city.name);
      });
    });
    return Array.from(citySet);
  }, [salesAreaProducts]);

  const filteredSalesAreaCities = useMemo(() => {
    const term = normalizeText(salesAreaSearch.trim());
    if (!term) return salesAreaCities;
    return salesAreaCities.filter((city) => normalizeText(city).includes(term));
  }, [salesAreaCities, salesAreaSearch]);

  const activeNoteConfig = useMemo(
    () => TAB_OPTIONS.find((tab) => tab.key === activeTabKey),
    [activeTabKey],
  );

  const notePlans = useMemo(() => {
    if (!activeNoteConfig?.field || !quote?.plans) return [];
    const field = activeNoteConfig.field as keyof QuotePlan;
    return quote.plans
      .filter((plan) => (plan.quoteType || 'HEALTH') === currentType)
      .map((plan) => {
        const rawNote = plan[field];
        const note = typeof rawNote === 'string' ? rawNote.trim() : '';
        const links = note.match(/https?:\/\/[^\s)]+/gi) || [];
        return {
          id: plan.id,
          name: plan.name,
          managerName: plan.managerName,
          note,
          links,
          plan,
        };
      })
      .filter((item) => item.note.length > 0);
  }, [quote, currentType, activeNoteConfig]);

  const decodeHtml = (value: string) => {
    if (!value) return '';
    let output = value;
    for (let i = 0; i < 2; i += 1) {
      const prev = output;
      output = output
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
      if (output === prev) break;
    }
    return output;
  };

  const stripHtml = (value: string) => {
    if (!value) return '';
    const decoded = decodeHtml(value);
    return decoded
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|ul|ol|h[1-6])>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const parseHtmlTable = (value: string) => {
    if (!value) return null;
    const decoded = decodeHtml(value);
    const match = decoded.match(/<table[\s\S]*?<\/table>/i);
    if (!match) return null;
    const tableHtml = match[0];
    const restHtml = decoded.replace(tableHtml, '').trim();
    const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    let headers: string[] = [];
    const bodyRows: string[][] = [];

    rows.forEach((rowHtml) => {
      const cells = rowHtml.match(/<(th|td)[^>]*>[\s\S]*?<\/(th|td)>/gi) || [];
      const values = cells.map((cell) => stripHtml(cell.replace(/<(th|td)[^>]*>|<\/(th|td)>/gi, '')));
      if (rowHtml.toLowerCase().includes('<th') && headers.length === 0) {
        headers = values;
      } else if (values.length > 0) {
        bodyRows.push(values);
      }
    });

    return {
      headers,
      rows: bodyRows,
      restText: stripHtml(restHtml),
    };
  };

  const getPlanAvatars = (plan?: QuotePlan | null) => {
    if (!plan) return [];
    const avatars: string[] = [];
    if (plan.image) avatars.push(plan.image);
    if (plan.managerImage) avatars.push(plan.managerImage);
    return avatars;
  };

  const toggleDiscountPlan = (id: string) => {
    setExpandedDiscountPlans((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleNotePlan = (tabKey: string, id: string) => {
    setExpandedNotePlans((prev) => {
      const current = new Set(prev[tabKey] || []);
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      return { ...prev, [tabKey]: Array.from(current) };
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quote?.slug ? `Cotação ${quote.slug}` : 'Cotação'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setIsConfigOpen(true)}>
          <HugeiconsIcon icon={Settings01Icon} size={16} color={theme.colors.primary} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {visibleTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, tab.key === activeTabKey && styles.tabActive]}
              onPress={() => setActiveTabKey(tab.key)}
            >
              <Text style={[styles.tabText, tab.key === activeTabKey && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando cotação...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {activeTabKey === 'prices' && (
              <View style={styles.clientCard}>
                <View style={styles.clientHeaderRow}>
                  <Text style={styles.clientLabel}>COTAÇÃO AVULSA</Text>
                  <TouchableOpacity style={styles.clientEditButton} onPress={handleToggleEditName}>
                    {isSavingName ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <HugeiconsIcon icon={Edit02Icon} size={14} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {isEditingName ? (
                  <TextInput
                    style={styles.clientInput}
                    value={clientNameInput}
                    onChangeText={setClientNameInput}
                    placeholder="Definir nome do cliente"
                    placeholderTextColor={theme.colors.textSecondary}
                    onBlur={handleSaveClientName}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.clientName} numberOfLines={1}>
                    {quote?.client || 'Definir nome do cliente'}
                  </Text>
                )}
              </View>
            )}

            {activeTabKey === 'discount' ? (
              <View style={styles.discountSection}>
                <View style={styles.discountTypeRow}>
                  <Text style={styles.discountTypeLabel}>
                    {currentType === 'HEALTH' ? 'Saúde' : 'Dental'}
                  </Text>
                </View>
                {discountPlans.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma regra de desconto informada.</Text>
                ) : (
                  discountPlans.map((plan) => {
                    const isExpanded = expandedDiscountPlans.includes(plan.id);
                    const cleanNote = plan.note ? stripHtml(plan.note) : '';
                    const tableData = plan.note ? parseHtmlTable(plan.note) : null;
                    const avatars = getPlanAvatars(plan);
                    return (
                      <View key={plan.id} style={styles.discountAccordion}>
                        <TouchableOpacity
                          style={styles.discountAccordionHeader}
                          onPress={() => toggleDiscountPlan(plan.id)}
                        >
                          <View style={styles.discountAvatar}>
                            {avatars.length > 0 ? (
                              <View style={styles.avatarStack}>
                                {avatars.slice(0, 2).map((url, index) => (
                                  <Image
                                    key={`${plan.id}-${url}`}
                                    source={{ uri: url }}
                                    style={[
                                      styles.avatarImage,
                                      index === 1 && styles.avatarImageOverlay,
                                    ]}
                                  />
                                ))}
                              </View>
                            ) : (
                              <Text style={styles.discountAvatarText}>{plan.name[0]}</Text>
                            )}
                          </View>
                          <View style={styles.discountHeaderText}>
                            <Text style={styles.discountPlanName}>{plan.name}</Text>
                            {plan.managerName ? (
                              <Text style={styles.discountPlanManager}>{plan.managerName}</Text>
                            ) : null}
                          </View>
                          <View style={isExpanded ? styles.discountArrowOpen : undefined}>
                            <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
                          </View>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.discountAccordionBody}>
                            {plan.links.length > 0 ? (
                              plan.links.map((link) => (
                                <TouchableOpacity key={link} onPress={() => Linking.openURL(link)}>
                                  <Text style={styles.discountLink}>{link}</Text>
                                </TouchableOpacity>
                              ))
                            ) : null}
                            {tableData && tableData.headers.length > 0 && tableData.rows.length > 0 ? (
                              <View style={styles.discountTable}>
                                <View style={styles.discountTableRowHeader}>
                                  {tableData.headers.map((header) => (
                                    <Text key={header} style={styles.discountTableHeaderText}>
                                      {header}
                                    </Text>
                                  ))}
                                </View>
                                {tableData.rows.map((row, rowIndex) => (
                                  <View key={`${plan.id}-row-${rowIndex}`} style={styles.discountTableRow}>
                                    {row.map((cell, cellIndex) => (
                                      <Text key={`${plan.id}-cell-${rowIndex}-${cellIndex}`} style={styles.discountTableCell}>
                                        {cell}
                                      </Text>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            ) : null}
                            {tableData?.restText ? (
                              <Text style={styles.discountNote}>{tableData.restText}</Text>
                            ) : cleanNote ? (
                              <Text style={styles.discountNote}>{cleanNote}</Text>
                            ) : (
                              <Text style={styles.discountNoteMuted}>
                                Sem regras de desconto informadas.
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ) : activeTabKey === 'commercialArea' ? (
              <View style={styles.salesAreaSection}>
                <View style={styles.salesAreaSearchRow}>
                  <TextInput
                    style={styles.salesAreaSearchInput}
                    placeholder="Buscar cidade"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={salesAreaSearch}
                    onChangeText={setSalesAreaSearch}
                  />
                </View>

                {salesAreaProducts.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma cidade informada.</Text>
                ) : filteredSalesAreaCities.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Nenhuma cidade informada {salesAreaSearch ? `"${salesAreaSearch}"` : ''}.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.salesAreaTable}>
                      <View style={styles.salesAreaRowHeader}>
                        <Text style={styles.salesAreaHeaderCell}>Cidade</Text>
                        {salesAreaProducts.map((product) => (
                          <Text
                            key={product.id}
                            style={[styles.salesAreaHeaderCell, styles.salesAreaHeaderWide]}
                            numberOfLines={2}
                          >
                            {product.name}
                          </Text>
                        ))}
                      </View>
                      {filteredSalesAreaCities.map((city) => (
                        <View key={city} style={styles.salesAreaRow}>
                          <Text style={styles.salesAreaCell}>{city}</Text>
                          {salesAreaProducts.map((product) => {
                            const hasCity =
                              product.cities?.some((item) => item.name === city || item.id === city) || false;
                            return (
                              <View key={`${product.id}-${city}`} style={styles.salesAreaCellCenter}>
                                <Text
                                  style={[
                                    styles.salesAreaMark,
                                    hasCity ? styles.salesAreaMarkYes : styles.salesAreaMarkNo,
                                  ]}
                                >
                                  {hasCity ? '✓' : '×'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <View style={styles.salesAreaNote}>
                  <Text style={styles.salesAreaNoteText}>
                    A área de comercialização determina onde o plano de saúde pode ser comercializado.
                  </Text>
                  <Text style={styles.salesAreaNoteText}>
                    É importante que o comprovante de residência do titular conste o endereço aceito pela operadora.
                  </Text>
                </View>
              </View>
            ) : isNoteTab ? (
              <View style={styles.discountSection}>
                <View style={styles.discountTypeRow}>
                  <Text style={styles.discountTypeLabel}>
                    {currentType === 'HEALTH' ? 'Saúde' : 'Dental'}
                  </Text>
                </View>
                {notePlans.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma informação disponível.</Text>
                ) : (
                  notePlans.map((plan) => {
                    const isExpanded = expandedNotes.includes(plan.id);
                    const cleanNote = plan.note ? stripHtml(plan.note) : '';
                    const tableData = plan.note ? parseHtmlTable(plan.note) : null;
                    const avatars = getPlanAvatars(plan.plan);
                    return (
                      <View key={`${activeTabKey}-${plan.id}`} style={styles.discountAccordion}>
                        <TouchableOpacity
                          style={styles.discountAccordionHeader}
                          onPress={() => toggleNotePlan(activeTabKey, plan.id)}
                        >
                          <View style={styles.discountAvatar}>
                            {avatars.length > 0 ? (
                              <View style={styles.avatarStack}>
                                {avatars.slice(0, 2).map((url, index) => (
                                  <Image
                                    key={`${plan.id}-${url}`}
                                    source={{ uri: url }}
                                    style={[
                                      styles.avatarImage,
                                      index === 1 && styles.avatarImageOverlay,
                                    ]}
                                  />
                                ))}
                              </View>
                            ) : (
                              <Text style={styles.discountAvatarText}>{plan.name[0]}</Text>
                            )}
                          </View>
                          <View style={styles.discountHeaderText}>
                            <Text style={styles.discountPlanName}>{plan.name}</Text>
                            {plan.managerName ? (
                              <Text style={styles.discountPlanManager}>{plan.managerName}</Text>
                            ) : null}
                          </View>
                          <View style={isExpanded ? styles.discountArrowOpen : undefined}>
                            <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
                          </View>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.discountAccordionBody}>
                            {plan.links.length > 0 ? (
                              plan.links.map((link) => (
                                <TouchableOpacity key={link} onPress={() => Linking.openURL(link)}>
                                  <Text style={styles.discountLink}>{link}</Text>
                                </TouchableOpacity>
                              ))
                            ) : null}
                            {tableData && tableData.headers.length > 0 && tableData.rows.length > 0 ? (
                              <View style={styles.discountTable}>
                                <View style={styles.discountTableRowHeader}>
                                  {tableData.headers.map((header) => (
                                    <Text key={header} style={styles.discountTableHeaderText}>
                                      {header}
                                    </Text>
                                  ))}
                                </View>
                                {tableData.rows.map((row, rowIndex) => (
                                  <View key={`${plan.id}-row-${rowIndex}`} style={styles.discountTableRow}>
                                    {row.map((cell, cellIndex) => (
                                      <Text
                                        key={`${plan.id}-cell-${rowIndex}-${cellIndex}`}
                                        style={styles.discountTableCell}
                                      >
                                        {cell}
                                      </Text>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            ) : null}
                            {tableData?.restText ? (
                              <Text style={styles.discountNote}>{tableData.restText}</Text>
                            ) : cleanNote ? (
                              <Text style={styles.discountNote}>{cleanNote}</Text>
                            ) : (
                              <Text style={styles.discountNoteMuted}>Sem informações disponíveis.</Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ) : featured ? (
              <View style={styles.productCard}>
                <View style={styles.productHeaderRow}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productTitle}>{featured.product.name}</Text>
                    <Text style={styles.productSubtitle}>{featured.plan.name}</Text>
                  </View>
                  {activeTabKey === 'prices' && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveProduct(featured.product.id)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.typeRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {currentType === 'HEALTH' ? 'Saúde' : 'Dental'}
                    </Text>
                  </View>
                  <View style={styles.typeActions}>
                    <TouchableOpacity
                      style={[styles.typeArrow, !canPrev && styles.typeArrowDisabled]}
                      onPress={handlePrevProduct}
                      disabled={!canPrev}
                    >
                      <ArrowLeftIcon size={14} color={canPrev ? theme.colors.primary : theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeArrow, !canNext && styles.typeArrowDisabled]}
                      onPress={handleNextProduct}
                      disabled={!canNext}
                    >
                      <ArrowRightIcon size={14} color={canNext ? theme.colors.primary : theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {activeTabKey === 'prices' && (
                  <View style={styles.productTable}>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Produto</Text>
                    <Text style={styles.productValue}>{featured.product.name}</Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Operadora</Text>
                    <Text style={styles.productValue}>{featured.plan.managerName || featured.plan.name}</Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Coparticipação</Text>
                    <Text style={styles.productValue}>
                      {featured.product.includesCoparticipation ? 'Com coparticipação' : 'Sem coparticipação'}
                    </Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Cobertura</Text>
                    <Text style={styles.productValue}>
                      {featured.product.coverage?.name || featured.product.segment?.name || 'Completo'}
                    </Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Acomodação</Text>
                    <Text style={styles.productValue}>
                      {featured.product.accommodation?.name || 'Enfermaria'}
                    </Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Abrangência</Text>
                    <Text style={styles.productValue}>
                      {featured.product.segment?.name || featured.product.coverage?.name || 'Grupo de Estados'}
                    </Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productKey}>Reembolso</Text>
                    <Text style={styles.productValue}>
                      {featured.product.isRefundable ? 'Com Reembolso' : 'Sem Reembolso'}
                    </Text>
                  </View>
                  {agePricingRows.map((row) => (
                    <View key={row.label} style={styles.productRow}>
                      <Text style={styles.productKey}>
                        {row.label} <Text style={styles.productKeyMuted}>x{row.lives}</Text>
                      </Text>
                      <Text style={styles.productValue}>{formatCurrency(Number(row.price))}</Text>
                    </View>
                  ))}
                  {agePricingRows.length > 0 && (
                    <View style={styles.productRow}>
                      <Text style={styles.productKey}>Total</Text>
                      <Text style={styles.productValue}>{formatCurrency(totalPrice)}</Text>
                    </View>
                  )}
                  </View>
                )}

                {activeTabKey === 'refnets' && (
                  <View style={styles.refnetSection}>
                    <View style={styles.refnetSearchRow}>
                      <TextInput
                        style={styles.refnetSearchInput}
                        placeholder="Buscar rede"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={refnetSearch}
                        onChangeText={setRefnetSearch}
                      />
                    </View>

                    <View style={styles.refnetTable}>
                      <View style={styles.refnetRowHeader}>
                        <Text style={styles.refnetHeaderText}>Cidade</Text>
                        <Text style={[styles.refnetHeaderText, styles.refnetHeaderWide]}>Hospital / Clínica</Text>
                        <Text style={styles.refnetHeaderText}>Tipo</Text>
                      </View>
                      {filteredRefnets.length === 0 ? (
                        <Text style={styles.refnetEmptyText}>Nenhuma rede encontrada.</Text>
                      ) : (
                        filteredRefnets.map((item) => (
                          <View key={item.id} style={styles.refnetRow}>
                            <Text style={styles.refnetCell}>{item.city || '-'}</Text>
                            <Text style={[styles.refnetCell, styles.refnetCellWide]} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <Text style={styles.refnetCell} numberOfLines={2}>
                              {item.expertises?.map((ex) => ex.name).join(' | ') || '-'}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>

                    <View style={styles.refnetLegend}>
                      <Text style={styles.refnetLegendTitle}>Legendas:</Text>
                      <View style={styles.refnetLegendRow}>
                        <View style={styles.refnetLegendIcon} />
                        <Text style={styles.refnetLegendText}>
                          Possui atendimento, porém a operadora/seguradora não divulga quais tipos de atendimento são oferecidos.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.refnetOfficial}>
                      <Text style={styles.refnetOfficialTitle}>
                        Rede Referenciada Oficial - {currentType === 'HEALTH' ? 'Saúde' : 'Dental'}
                      </Text>
                      <Text style={styles.refnetOfficialText}>
                        Consulte a Rede Referenciada diretamente no site da operadora, para consulta de informações atualizadas.
                      </Text>
                      {activePlan && (
                        <View style={styles.refnetOfficialCard}>
                          <View style={styles.refnetOfficialAvatar}>
                            {getPlanAvatars(activePlan).length > 0 ? (
                              <View style={styles.avatarStack}>
                                {getPlanAvatars(activePlan)
                                  .slice(0, 2)
                                  .map((url, index) => (
                                    <Image
                                      key={`${activePlan.id}-${url}`}
                                      source={{ uri: url }}
                                      style={[
                                        styles.avatarImage,
                                        index === 1 && styles.avatarImageOverlay,
                                      ]}
                                    />
                                  ))}
                              </View>
                            ) : (
                              <Text style={styles.refnetOfficialAvatarText}>{activePlan.name[0]}</Text>
                            )}
                          </View>
                          <View style={styles.refnetOfficialInfo}>
                            <Text style={styles.refnetOfficialPlan}>{activePlan.name}</Text>
                            {activePlan.managerName ? (
                              <Text style={styles.refnetOfficialManager}>{activePlan.managerName}</Text>
                            ) : null}
                          </View>
                          {activePlan.fullRefnetsLink ? (
                            <TouchableOpacity
                              style={styles.refnetOfficialLink}
                              onPress={() => Linking.openURL(activePlan.fullRefnetsLink || '')}
                            >
                              <Text style={styles.refnetOfficialLinkText}>↗</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {activeTabKey !== 'prices' && activeTabKey !== 'refnets' && activeTabKey !== 'discount' && (
                  <View style={styles.tabContentCard}>
                    <Text style={styles.tabContentTitle}>
                      {TAB_OPTIONS.find((tab) => tab.key === activeTabKey)?.label}
                    </Text>
                    <Text style={styles.tabContentText}>
                      {(() => {
                        if (!activePlan) return 'Nenhuma informação disponível.';
                        const config = TAB_OPTIONS.find((tab) => tab.key === activeTabKey);
                        if (!config) return 'Nenhuma informação disponível.';
                        if (config.key === 'refnets') {
                          return activePlan.fullRefnetsLink || 'Nenhuma rede informada.';
                        }
                        const field = config.field as keyof QuotePlan | undefined;
                        const rawValue = field && activePlan[field] ? String(activePlan[field]) : '';
                        const cleanValue = rawValue ? stripHtml(rawValue) : '';
                        return cleanValue || 'Nenhuma informação disponível.';
                      })()}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIcon}>
                  <View style={styles.emptyStateIconInner} />
                </View>
                <Text style={styles.emptyStateTitle}>Nenhum produto selecionado</Text>
                <Text style={styles.emptyStateText}>
                  Parece que você removeu todos os produtos da cotação.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() =>
                    params.id
                      ? router.push({ pathname: '/quote-create', params: { id: params.id } })
                      : router.push('/quote-create')
                  }
                >
                  <Text style={styles.emptyStateButtonText}>Adicionar produtos</Text>
                  <Text style={styles.emptyStateButtonIcon}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            {availableTypes.length > 1 && (
              <View style={styles.typeSwitch}>
                {availableTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeSwitchButton,
                      currentType === type && styles.typeSwitchButtonActive,
                    ]}
                    onPress={() => setCurrentType(type)}
                  >
                    <Text
                      style={[
                        styles.typeSwitchText,
                        currentType === type && styles.typeSwitchTextActive,
                      ]}
                    >
                      {type === 'HEALTH' ? 'Saúde' : 'Dental'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonGhost]}
          onPress={() => router.push({ pathname: '/coming-soon', params: { title: 'Editar Cotação' } })}
        >
          <Text style={styles.footerButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonGhost]}
          onPress={() => setIsConfigOpen(true)}
        >
          <Text style={styles.footerButtonText}>Config</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonPrimary]}
          onPress={() => router.push({ pathname: '/coming-soon', params: { title: 'Enviar Cotação' } })}
        >
          <Text style={styles.footerButtonTextPrimary}>Enviar</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={isConfigOpen} animationType="slide" onRequestClose={() => setIsConfigOpen(false)}>
        <View style={styles.configOverlay}>
          <Pressable style={styles.configBackdrop} onPress={() => setIsConfigOpen(false)} />
          <View style={styles.configCard}>
            <View style={styles.configHandle} />
            <View style={styles.configHeader}>
              <View style={styles.configHeaderLeft}>
                <View style={styles.configIconCircle}>
                  <HugeiconsIcon icon={Settings01Icon} size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.configTitle}>Configurações da Cotação</Text>
              </View>
              <TouchableOpacity style={styles.configClose} onPress={() => setIsConfigOpen(false)}>
                <Text style={styles.configCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configTabs}>
              <TouchableOpacity
                style={[
                  styles.configTab,
                  configSection === 'info' && styles.configTabActive,
                ]}
                onPress={() => setConfigSection('info')}
              >
                <Text
                  style={[
                    styles.configTabText,
                    configSection === 'info' && styles.configTabTextActive,
                  ]}
                >
                  Informações
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.configTab,
                  configSection === 'contact' && styles.configTabActive,
                ]}
                onPress={() => setConfigSection('contact')}
              >
                <Text
                  style={[
                    styles.configTabText,
                    configSection === 'contact' && styles.configTabTextActive,
                  ]}
                >
                  Contato
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.configContent}>
              {configSection === 'info' ? (
                <>
                  {TAB_OPTIONS.filter((tab) => tab.key !== 'prices').map((tab) => (
                    <View key={tab.key} style={styles.configRow}>
                      <Text style={styles.configRowLabel}>{tab.label}</Text>
                      <Switch
                        value={Boolean(tabVisibility[tab.key])}
                        onValueChange={(value) =>
                          setTabVisibility((prev) => ({ ...prev, [tab.key]: value }))
                        }
                        trackColor={{ false: '#2A2A2A', true: theme.colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  ))}

                  <Text style={styles.configSectionTitle}>Planos Selecionados para o PDF</Text>
                  {quote?.plans?.map((plan) => (
                    <View key={plan.id} style={styles.configPlanRow}>
                      <View style={styles.configPlanInfo}>
                        <Text style={styles.configPlanName}>{plan.name}</Text>
                        <Text style={styles.configPlanSubtitle}>{plan.managerName || 'Operadora'}</Text>
                      </View>
                      <View style={styles.configPlanCheck}>
                        <Text style={styles.configPlanCheckText}>✓</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.configEmpty}>
                  <Text style={styles.configEmptyText}>Informações de contato em breve.</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.configConfirm} onPress={() => setIsConfigOpen(false)}>
              <Text style={styles.configConfirmText}>Confirmar Seleções</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark', insets: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      maxWidth: '70%',
      textAlign: 'center',
    },
    headerSpacer: {
      width: 36,
    },
    tabs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    tabsScroll: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.lg,
      alignItems: 'center',
    },
    settingsButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    tab: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F5F5F5',
    },
    tabActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '22',
    },
    tabText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: insets.bottom + 140,
      gap: theme.spacing.md,
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    loadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    errorText: {
      textAlign: 'center',
      color: theme.colors.error,
      fontFamily: theme.fonts.medium,
    },
    clientCard: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      gap: 6,
    },
    clientHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clientEditButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clientLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      letterSpacing: 0.6,
    },
    clientName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    clientInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
      backgroundColor: themeMode === 'dark' ? '#121212' : '#FAFAFA',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSize.sm,
    },
    productCard: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      gap: theme.spacing.md,
    },
    productHeader: {
      gap: 2,
      flex: 1,
    },
    productHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    productTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    productSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    productTable: {
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#121212' : '#FAFAFA',
    },
    productKey: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    productKeyMuted: {
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.medium,
    },
    productValue: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    tabContentCard: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      gap: theme.spacing.sm,
    },
    tabContentTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    tabContentText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    removeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      fontSize: 18,
      color: theme.colors.error,
      lineHeight: 20,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    typeBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    typeBadgeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    typeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    typeArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#101010' : '#FFFFFF',
    },
    typeArrowDisabled: {
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#0F0F0F' : '#F0F0F0',
      opacity: 0.7,
    },
    refnetSection: {
      gap: theme.spacing.md,
    },
    refnetSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    refnetSearchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    refnetTable: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: themeMode === 'dark' ? '#141414' : '#FFFFFF',
    },
    refnetRowHeader: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F5F5F5',
    },
    refnetHeaderText: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    refnetHeaderWide: {
      flex: 1.6,
    },
    refnetRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    refnetCell: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    refnetCellWide: {
      flex: 1.6,
    },
    refnetEmptyText: {
      paddingVertical: theme.spacing.md,
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    refnetLegend: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      gap: theme.spacing.sm,
    },
    refnetLegendTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    refnetLegendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    refnetLegendIcon: {
      width: 14,
      height: 14,
      borderRadius: 4,
      backgroundColor: themeMode === 'dark' ? '#2DD36F' : '#22C55E',
    },
    refnetLegendText: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    refnetOfficial: {
      gap: theme.spacing.xs,
    },
    refnetOfficialTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    refnetOfficialText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    refnetOfficialCard: {
      marginTop: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    refnetOfficialAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#101010' : '#F5F5F5',
    },
    refnetOfficialAvatarText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    avatarStack: {
      width: 36,
      height: 24,
      position: 'relative',
    },
    avatarImage: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#101010' : '#FFFFFF',
      position: 'absolute',
      left: 0,
    },
    avatarImageOverlay: {
      left: 12,
    },
    refnetOfficialInfo: {
      flex: 1,
    },
    refnetOfficialPlan: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    refnetOfficialManager: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    refnetOfficialLink: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    refnetOfficialLinkText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    salesAreaSection: {
      gap: theme.spacing.md,
    },
    salesAreaSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    salesAreaSearchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    salesAreaTable: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: themeMode === 'dark' ? '#141414' : '#FFFFFF',
    },
    salesAreaRowHeader: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F5F5F5',
    },
    salesAreaHeaderCell: {
      minWidth: 140,
      flexShrink: 0,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    salesAreaHeaderWide: {
      minWidth: 160,
    },
    salesAreaRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    salesAreaCell: {
      minWidth: 140,
      flexShrink: 0,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    salesAreaCellCenter: {
      minWidth: 160,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    salesAreaMark: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
    },
    salesAreaMarkYes: {
      color: '#22C55E',
    },
    salesAreaMarkNo: {
      color: theme.colors.error || '#EF4444',
    },
    salesAreaNote: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      gap: 2,
    },
    salesAreaNoteText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    discountSection: {
      gap: theme.spacing.sm,
    },
    discountTypeRow: {
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    discountTypeLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    discountAccordion: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      overflow: 'hidden',
    },
    discountAccordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    discountHeaderText: {
      flex: 1,
      gap: 2,
    },
    discountAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#101010' : '#F5F5F5',
    },
    discountAvatarText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    discountArrowOpen: {
      transform: [{ rotate: '90deg' }],
    },
    discountAccordionBody: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    discountTable: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginTop: theme.spacing.sm,
    },
    discountTableRowHeader: {
      flexDirection: 'row',
      backgroundColor: themeMode === 'dark' ? '#141414' : '#F5F5F5',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    discountTableHeaderText: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    discountTableRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    discountTableCell: {
      flex: 1,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    discountPlanName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    discountPlanManager: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    discountLink: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
      marginTop: theme.spacing.xs,
    },
    discountNote: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    discountNoteMuted: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    typeSwitch: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    typeSwitchButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F5F5F5',
    },
    typeSwitchButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '22',
    },
    typeSwitchText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    typeSwitchTextActive: {
      color: theme.colors.primary,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    emptyStateCard: {
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    emptyStateIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#141414' : '#F5F5F5',
    },
    emptyStateIconInner: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1F1F1F' : '#FFFFFF',
    },
    emptyStateTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    emptyStateButton: {
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primary + '22',
    },
    emptyStateButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    emptyStateButtonIcon: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
      lineHeight: theme.fontSize.md + 2,
    },
    footerActions: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: insets.bottom + theme.spacing.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    footerButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    footerButtonGhost: {
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    footerButtonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    footerButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    footerButtonTextPrimary: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    configOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    configBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    configCard: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg + insets.bottom,
      maxHeight: '85%',
    },
    configHandle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    configHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    configHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    configIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    configTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    configClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    configCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    configTabs: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    configTab: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F5F5F5',
    },
    configTabActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '22',
    },
    configTabText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    configTabTextActive: {
      color: theme.colors.primary,
    },
    configContent: {
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    configRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    configRowLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    configSectionTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    configPlanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    configPlanInfo: {
      flex: 1,
      gap: 2,
    },
    configPlanName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    configPlanSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    configPlanCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    configPlanCheckText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textOnPrimary,
      fontFamily: theme.fonts.semiBold,
    },
    configEmpty: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    configEmptyText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    configConfirm: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    configConfirmText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
  });
