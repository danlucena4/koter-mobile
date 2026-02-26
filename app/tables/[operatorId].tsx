import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Location03Icon,
  Pdf02Icon,
  AiContentGenerator01Icon,
  Link01Icon,
  File01Icon,
  Search02Icon,
  LinkSquare02Icon,
  Share08Icon,
  Tick01Icon,
  Cancel01Icon,
  AddMoneyCircleIcon,
  HospitalBed01Icon,
  HeartCheckIcon,
  FilterAddIcon,
} from '@hugeicons/core-free-icons';
import { getTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNotifications } from '../../src/contexts/NotificationsContext';
import api from '../../src/lib/api';
import { authService } from '../../src/services/auth.service';
import {
  NotificationIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from '../../src/components/HugeIconsWrapper';
import { ArrowLeft02Icon } from '../../src/components';

const MaterialCategory = {
  TABLE: 0,
  SUPPORT_MATERIAL: 1,
  ASSOCIATIVE_ENTITY: 2,
  LINK: 3,
} as const;

type OperatorType = 'Physical' | 'Adhesion' | 'Legal';

type OperatorPlan = {
  id: string;
  image?: string | null;
  managerImage?: string | null;
  name: string;
  managerName?: string | null;
  state: { id: string; name: string };
  insurance: { id: string; name: string };
};

type OperatorContext = {
  id: string;
  image?: string | null;
  managerImage?: string | null;
  name: string;
  managerName?: string | null;
  plans?: OperatorPlan[];
};

type PlanDetails = {
  id: string;
  name: string;
  image?: string | null;
  managerImage?: string | null;
  managerName?: string | null;
  category: number;
  state?: { id: string; name: string };
  insurance?: { id: string; name: string };
  fullRefnetsLink?: string | null;
  importantNotes?: string | null;
  neededDocumentsNotes?: string | null;
  differentialsNotes?: string | null;
  gracePeriodNotes?: string | null;
  coparticipationNotes?: string | null;
  ageLimitNotes?: string | null;
  discountNotes?: string | null;
  congenersNotes?: string | null;
  refundNotes?: string | null;
  compulsoryRulesNotes?: string | null;
  franchiseNotes?: string | null;
  repiqueNotes?: string | null;
  commercialCampaignNotes?: string | null;
  paymentMethodsNotes?: string | null;
  alertNotes?: string | null;
  registrationFeeNotes?: string | null;
};

type Material = {
  id: string;
  name: string;
  category: number;
  fileUrl?: string | null;
  link?: string | null;
  updatedAt?: string | null;
};

type CustomTable = {
  id: string;
  name: string;
};

type ProductDetails = {
  id: string;
  name: string;
  includesCoparticipation?: number;
  isRefundable?: boolean;
  contractType?: number;
  discountType?: string;
  progressiveDiscountTiers?: Array<{
    firstUnit: number;
    lastUnit: number;
    discountPercentage: number;
  }>;
  coverage: { id: string; name: string };
  accommodation?: { id: string; name: string };
  segment: { id: string; name: string };
  priceAgeGroup018?: number;
  priceAgeGroup1923?: number;
  priceAgeGroup2428?: number;
  priceAgeGroup2933?: number;
  priceAgeGroup3438?: number;
  priceAgeGroup3943?: number;
  priceAgeGroup4448?: number;
  priceAgeGroup4953?: number;
  priceAgeGroup5458?: number;
  priceAgeGroup59Upper?: number;
  discountAgeGroup018?: number;
  discountAgeGroup1923?: number;
  discountAgeGroup2428?: number;
  discountAgeGroup2933?: number;
  discountAgeGroup3438?: number;
  discountAgeGroup3943?: number;
  discountAgeGroup4448?: number;
  discountAgeGroup4953?: number;
  discountAgeGroup5458?: number;
  discountAgeGroup59Upper?: number;
  updatedAt?: string | null;
};

type NetworkContext = {
  products: ProductDetails[];
  networks: Array<{
    id: string;
    name: string;
    city: string;
    expertises?: Array<{ id: string; name: string }>;
    productIds: string[];
  }>;
};

type CommercializationContext = {
  products: ProductDetails[];
  cities: Array<{ id: string; name: string; productIds: string[] }>;
};

const noteButtons = [
  { key: 'importantNotes', label: 'Observações Importantes' },
  { key: 'neededDocumentsNotes', label: 'Documentação' },
  { key: 'discountNotes', label: 'Descontos' },
  { key: 'differentialsNotes', label: 'Diferenciais' },
  { key: 'gracePeriodNotes', label: 'Carência' },
  { key: 'coparticipationNotes', label: 'Coparticipação' },
  { key: 'congenersNotes', label: 'Congêneres' },
  { key: 'ageLimitNotes', label: 'Detalhes de idade' },
  { key: 'refundNotes', label: 'Reembolso' },
  { key: 'compulsoryRulesNotes', label: 'Regras compulsórias' },
  { key: 'franchiseNotes', label: 'Franquia' },
  { key: 'repiqueNotes', label: 'Repique' },
  { key: 'commercialCampaignNotes', label: 'Campanhas comerciais' },
  { key: 'paymentMethodsNotes', label: 'Formas de pagamento' },
  { key: 'alertNotes', label: 'Alertas' },
  { key: 'registrationFeeNotes', label: 'Taxa de inscrição' },
] as const;

const getInitials = (value?: string | null) => {
  if (!value) return '#';
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

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

const stripHtml = (value?: string | null) => {
  if (!value) return '';
  const decoded = decodeHtml(value);
  return decoded
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const AGE_GROUP_LABELS: Record<string, string> = {
  '018': '0 à 18',
  '1923': '19 à 23',
  '2428': '24 à 28',
  '2933': '29 à 33',
  '3438': '34 à 38',
  '3943': '39 à 43',
  '4448': '44 à 48',
  '4953': '49 à 53',
  '5458': '54 à 58',
  '59Upper': '59+',
};
const AGE_GROUP_ORDER = Object.keys(AGE_GROUP_LABELS);

const formatAgeGroup = (key: string) => AGE_GROUP_LABELS[key] || key;

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

const getCoparticipationLabel = (value?: number) => {
  if (value === undefined || value === null) return '—';
  if (value === 0) return 'Copart. Total';
  if (value === 1) return 'Sem Copart.';
  if (value === 2) return 'Copart. Parcial';
  return '—';
};

const getContractTypeLabel = (value?: number) => {
  if (value === undefined || value === null) return '—';
  if (value === 0) return 'Compulsório';
  if (value === 1) return 'Livre Adesão';
  if (value === 2) return 'Não Aplicável';
  return '—';
};

const applyDiscount = (price: number, discount?: number) => {
  if (!discount || discount <= 0) return price;
  return price - price * (discount / 100);
};

const formatDateTime = (value?: string | number | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function TableDetailsScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);
  const router = useRouter();
  const { openNotifications } = useNotifications();
  const params = useLocalSearchParams();

  const operatorId = typeof params.operatorId === 'string' ? params.operatorId : '';
  const insuranceId = typeof params.insuranceId === 'string' ? params.insuranceId : '';
  const operatorType = typeof params.operatorType === 'string'
    ? (params.operatorType as OperatorType)
    : 'Physical';

  const [userStateId, setUserStateId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [contextOperator, setContextOperator] = useState<OperatorContext | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    materials: true,
    commercial: true,
    links: true,
  });

  const [materialModal, setMaterialModal] = useState<
    | { title: string; category: number }
    | null
  >(null);

  const [noteModal, setNoteModal] = useState<
    | { title: string; content: string }
    | null
  >(null);

  const [tablesModal, setTablesModal] = useState<
    | { mode: 'prices' | 'refnets' | 'sales'; title: string }
    | null
  >(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [tableProducts, setTableProducts] = useState<ProductDetails[]>([]);
  const [isTableProductsLoading, setIsTableProductsLoading] = useState(false);
  const [priceFilters, setPriceFilters] = useState({
    coparticipation: 'all',
    accommodation: 'all',
    segment: 'all',
  });
  const [filterModal, setFilterModal] = useState<
    | { type: 'coparticipation' | 'accommodation' | 'segment' }
    | null
  >(null);
  const [discountModal, setDiscountModal] = useState<
    | { productId: string; tiers: ProductDetails['progressiveDiscountTiers'] }
    | null
  >(null);
  const [selectedDiscountByProduct, setSelectedDiscountByProduct] = useState<Record<string, number>>(
    {},
  );
  const [networkContext, setNetworkContext] = useState<NetworkContext | null>(null);
  const [commercialContext, setCommercialContext] = useState<CommercializationContext | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  const [postSaleModalOpen, setPostSaleModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getAuthenticatedUser();
        setUserStateId(user.state?.id || null);
        setUserName(user.username || user.name || '');
      } catch {
        setUserStateId(null);
        setUserName('');
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      if (!operatorId || !insuranceId || !operatorType || !userStateId) return;
      try {
        setIsContextLoading(true);
        setErrorMessage(null);
        const response = await api.get(`/operators/${operatorId}/context`, {
          params: {
            insuranceId,
            stateId: userStateId,
            category: operatorType,
          },
        });

        const operator = response.data?.operator as OperatorContext | undefined;
        const primaryPlan = response.data?.primaryPlan as OperatorPlan | null | undefined;
        setContextOperator(operator || null);
        setSelectedPlanId(primaryPlan?.id || null);
      } catch (error) {
        console.error('Erro ao buscar contexto:', error);
        setErrorMessage('Não foi possível carregar o plano selecionado.');
      } finally {
        setIsContextLoading(false);
      }
    };

    fetchContext();
  }, [operatorId, insuranceId, operatorType, userStateId]);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!selectedPlanId) {
        setPlanDetails(null);
        setMaterials([]);
        setCustomTables([]);
        return;
      }

      try {
        setIsPlanLoading(true);
        setErrorMessage(null);
        const [planResponse, materialsResponse, tablesResponse] = await Promise.all([
          api.get(`/plans/${selectedPlanId}/active`, {
            params: { stateId: userStateId || undefined },
          }),
          api.get('/materials/all', {
            params: { planId: selectedPlanId, fromAdminPanel: false },
          }),
          api.get('/tables/all/active', {
            params: { planId: selectedPlanId },
          }),
        ]);

        setPlanDetails(planResponse.data?.plan || planResponse.data || null);
        setMaterials(materialsResponse.data?.materials || []);
        setCustomTables(tablesResponse.data?.tables || []);
      } catch (error) {
        console.error('Erro ao buscar plano:', error);
        setErrorMessage('Não foi possível carregar os dados deste plano.');
      } finally {
        setIsPlanLoading(false);
      }
    };

    fetchPlanData();
  }, [selectedPlanId, userStateId]);

  useEffect(() => {
    const fetchTablesContext = async () => {
      if (!tablesModal || !selectedTableId) return;
      if (tablesModal.mode === 'prices') return;

      setIsTablesLoading(true);
      try {
        if (tablesModal.mode === 'refnets') {
          const response = await api.get(`/tables/${selectedTableId}/network-context`);
          setNetworkContext(response.data || null);
          setCommercialContext(null);
        } else if (tablesModal.mode === 'sales') {
          const response = await api.get(`/tables/${selectedTableId}/commercialization-context`);
          setCommercialContext(response.data || null);
          setNetworkContext(null);
        }
      } catch (error) {
        console.error('Erro ao carregar contexto da tabela:', error);
        setNetworkContext(null);
        setCommercialContext(null);
      } finally {
        setIsTablesLoading(false);
      }
    };

    fetchTablesContext();
  }, [tablesModal, selectedTableId]);

  useEffect(() => {
    const fetchTableProducts = async () => {
      if (!tablesModal || !selectedTableId) return;
      if (tablesModal.mode !== 'prices') return;
      try {
        setIsTableProductsLoading(true);
        const response = await api.get('/products/all/active', {
          params: {
            tableId: selectedTableId,
            pageSize: 200,
          },
        });
        const products = response.data?.products || [];
        setTableProducts(products);

        const initialDiscounts: Record<string, number> = {};
        products.forEach((product: ProductDetails) => {
          if (
            product.discountType === 'PROGRESSIVE' &&
            product.progressiveDiscountTiers &&
            product.progressiveDiscountTiers.length > 0
          ) {
            initialDiscounts[product.id] = product.progressiveDiscountTiers[0].discountPercentage;
          }
        });
        setSelectedDiscountByProduct(initialDiscounts);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setTableProducts([]);
      } finally {
        setIsTableProductsLoading(false);
      }
    };

    fetchTableProducts();
  }, [tablesModal, selectedTableId]);

  useEffect(() => {
    if (!tablesModal) return;
    setPriceFilters({
      coparticipation: 'all',
      accommodation: 'all',
      segment: 'all',
    });
  }, [tablesModal, selectedTableId]);

  useEffect(() => {
    if (!tablesModal) return;
    if (!selectedTableId && customTables.length > 0) {
      setSelectedTableId(customTables[0].id);
    }
  }, [tablesModal, customTables, selectedTableId]);

  const groupedPlansByState = useMemo(() => {
    const plans = contextOperator?.plans || [];
    return plans.reduce((acc, plan) => {
      const stateId = plan.state?.id;
      if (!stateId) return acc;
      if (!acc[stateId]) acc[stateId] = [];
      acc[stateId].push(plan);
      return acc;
    }, {} as Record<string, OperatorPlan[]>);
  }, [contextOperator?.plans]);

  const stateOptions = useMemo(() => {
    return Object.values(groupedPlansByState)
      .map((plans) => plans[0])
      .filter(Boolean);
  }, [groupedPlansByState]);

  const selectedStateName = planDetails?.state?.name
    || stateOptions.find((option) => option?.state?.id === userStateId)?.state?.name
    || 'Selecione o estado';

  const materialsByCategory = useMemo(() => {
    const tables = materials.filter((material) => material.category === MaterialCategory.TABLE);
    const support = materials.filter(
      (material) => material.category === MaterialCategory.SUPPORT_MATERIAL,
    );
    const associative = materials.filter(
      (material) => material.category === MaterialCategory.ASSOCIATIVE_ENTITY,
    );
    const links = materials.filter((material) => material.category === MaterialCategory.LINK);

    return { tables, support, associative, links };
  }, [materials]);

  const linksList = useMemo(() => {
    const baseLinks = materialsByCategory.links
      .filter((link) => link.link)
      .map((link) => ({
      id: link.id,
      name: link.name,
      href: link.link || '',
    }));

    if (planDetails?.fullRefnetsLink) {
      const hasRefnet = baseLinks.some((item) =>
        normalizeText(item.name).includes('rede credenciada'),
      );
      if (!hasRefnet) {
        baseLinks.push({
          id: 'refnets',
          name: 'Rede Credenciada',
          href: planDetails.fullRefnetsLink,
        });
      }
    }

    return baseLinks;
  }, [materialsByCategory.links, planDetails?.fullRefnetsLink]);

  const commercialButtons = useMemo(() => {
    const buttons: Array<{
      key: string;
      label: string;
      action: () => void;
      visible: boolean;
    }> = [
      {
        key: 'prices',
        label: 'Preços',
        action: () => setTablesModal({ mode: 'prices', title: 'Preços' }),
        visible: customTables.length > 0,
      },
      {
        key: 'refnets',
        label: 'Rede Credenciada',
        action: () => setTablesModal({ mode: 'refnets', title: 'Rede Credenciada' }),
        visible: customTables.length > 0,
      },
      {
        key: 'sales',
        label: 'Comercialização',
        action: () => setTablesModal({ mode: 'sales', title: 'Comercialização' }),
        visible: customTables.length > 0,
      },
    ];

    noteButtons.forEach((note) => {
      const content = stripHtml((planDetails as any)?.[note.key]);
      buttons.push({
        key: note.key,
        label: note.label,
        action: () => setNoteModal({ title: note.label, content }),
        visible: Boolean(content),
      });
    });

    return buttons.filter((button) => button.visible);
  }, [customTables.length, planDetails]);

  const liveGroups = useMemo(() => {
    const groups: string[] = [];
    tableProducts.forEach((product) => {
      Object.keys(product)
        .filter((key) => key.startsWith('priceAgeGroup'))
        .forEach((key) => {
          const groupKey = key.replace('priceAgeGroup', '');
          if (groupKey && !groups.includes(groupKey)) groups.push(groupKey);
        });
    });
    return groups.sort((a, b) => {
      const indexA = AGE_GROUP_ORDER.indexOf(a);
      const indexB = AGE_GROUP_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [tableProducts]);

  const coparticipationOptions = useMemo(() => {
    const values = new Set<number>();
    tableProducts.forEach((product) => {
      if (product.includesCoparticipation !== undefined && product.includesCoparticipation !== null) {
        values.add(product.includesCoparticipation);
      }
    });
    return Array.from(values);
  }, [tableProducts]);

  const accommodationOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    tableProducts.forEach((product) => {
      if (product.accommodation) {
        map.set(product.accommodation.id, product.accommodation);
      }
    });
    return Array.from(map.values());
  }, [tableProducts]);

  const segmentOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    tableProducts.forEach((product) => {
      if (product.segment) {
        map.set(product.segment.id, product.segment);
      }
    });
    return Array.from(map.values());
  }, [tableProducts]);

  const filteredPriceProducts = useMemo(() => {
    return tableProducts.filter((product) => {
      if (priceFilters.coparticipation !== 'all') {
        if (product.includesCoparticipation?.toString() !== priceFilters.coparticipation) {
          return false;
        }
      }
      if (priceFilters.accommodation !== 'all' && product.accommodation) {
        if (product.accommodation.id !== priceFilters.accommodation) return false;
      }
      if (priceFilters.segment !== 'all' && product.segment) {
        if (product.segment.id !== priceFilters.segment) return false;
      }
      return true;
    });
  }, [tableProducts, priceFilters]);

  const shouldShowContractType = useMemo(
    () => filteredPriceProducts.some((product) => product.contractType !== undefined),
    [filteredPriceProducts],
  );
  const mostRecentUpdatedAt = useMemo(() => {
    if (!tableProducts.length) return '';
    const latest = tableProducts.reduce((acc, product) => {
      if (!product.updatedAt) return acc;
      const time = new Date(product.updatedAt).getTime();
      if (Number.isNaN(time)) return acc;
      return Math.max(acc, time);
    }, 0);
    return latest ? formatDateTime(latest) : '';
  }, [tableProducts]);

  const filteredNetworks = useMemo(() => {
    if (!networkContext?.networks) return [];
    const term = normalizeText(tableSearch.trim());
    if (!term) return networkContext.networks;
    return networkContext.networks.filter((network) => {
      const matchName = normalizeText(network.name).includes(term);
      const matchCity = normalizeText(network.city).includes(term);
      const matchExpertise =
        network.expertises?.some((exp) => normalizeText(exp.name).includes(term)) ?? false;
      return matchName || matchCity || matchExpertise;
    });
  }, [networkContext, tableSearch]);

  const filteredCities = useMemo(() => {
    if (!commercialContext?.cities) return [];
    const term = normalizeText(tableSearch.trim());
    if (!term) return commercialContext.cities;
    return commercialContext.cities.filter((city) =>
      normalizeText(city.name).includes(term),
    );
  }, [commercialContext, tableSearch]);

  const handleSelectState = (plan: OperatorPlan) => {
    setSelectedPlanId(plan.id);
    setIsStateModalOpen(false);
  };

  const handleToggleSection = (key: 'materials' | 'commercial' | 'links') => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenMaterialList = (title: string, category: number) => {
    setMaterialModal({ title, category });
  };

  const handleOpenMaterialItem = async (material: Material) => {
    const href = material.link || material.fileUrl;
    if (!href) return;

    try {
      const canOpen = await Linking.canOpenURL(href);
      if (!canOpen) throw new Error('cannot open');
      await Linking.openURL(href);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o conteúdo selecionado.');
    }
  };

  const handleOpenTablePdf = async (tableId: string, tableName: string) => {
    try {
      const response = await api.get(`/tables/${tableId}/pdf`);
      const pdfBase64 = response.data?.pdf;
      if (!pdfBase64) throw new Error('PDF não gerado');

      const cleanBase64 = pdfBase64.includes('base64,')
        ? pdfBase64.split('base64,')[1]
        : pdfBase64;
      const base64Encoding = (FileSystem as any).EncodingType?.Base64 ?? 'base64';
      const safeName = tableName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
      const fileUri = `${FileSystem.cacheDirectory}tabela-${safeName || tableId}.pdf`;

      await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
        encoding: base64Encoding,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
      } else {
        await Linking.openURL(fileUri);
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      Alert.alert('Erro', `Não foi possível abrir a tabela ${tableName}.`);
    }
  };

  const handleGeneratePostSaleLink = async () => {
    if (!clientName.trim() || !planDetails?.id) return;
    const nameEncoded = encodeURIComponent(clientName.trim());
    const broker = encodeURIComponent(userName || '');
    const url = `https://proteger.vc/pos-venda/${planDetails.id}?corretor=${broker}&nome=${nameEncoded}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot open');
      await Linking.openURL(url);
      setPostSaleModalOpen(false);
      setClientName('');
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o link de pós venda.');
    }
  };

  const handleSelectFilter = (
    type: 'coparticipation' | 'accommodation' | 'segment',
    value: string,
  ) => {
    setPriceFilters((prev) => ({ ...prev, [type]: value }));
    setFilterModal(null);
  };

  const handleSelectDiscountTier = (productId: string, discount: number) => {
    setSelectedDiscountByProduct((prev) => ({ ...prev, [productId]: discount }));
    setDiscountModal(null);
  };

  const currentOperatorName = planDetails?.name || contextOperator?.name || 'Tabelas';
  const isLoading = isContextLoading || isPlanLoading;

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft02Icon size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {`Tabelas/${currentOperatorName}`}
          </Text>
          <TouchableOpacity style={styles.headerButton} onPress={openNotifications}>
            <NotificationIcon size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando informações do plano...</Text>
          </View>
        ) : !selectedPlanId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Planos em atualização!</Text>
            <Text style={styles.emptySubtitle}>
              As tabelas para este seguro estão sendo atualizadas. Tente novamente em breve.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.stateSelector}
              onPress={() => setIsStateModalOpen(true)}
            >
              <View style={styles.stateSelectorLeft}>
                <HugeiconsIcon icon={Location03Icon} size={16} color={theme.colors.text} />
                <View style={styles.stateSeparator} />
                <Text style={styles.stateSelectorText} numberOfLines={1}>
                  {selectedStateName}
                </Text>
              </View>
              <ArrowDownIcon size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.operatorHeader}>
              <View style={styles.operatorAvatar}>
                {planDetails?.image ? (
                  <Image source={{ uri: planDetails.image }} style={styles.operatorAvatarImage} />
                ) : (
                  <Text style={styles.operatorAvatarText}>
                    {getInitials(planDetails?.name || contextOperator?.name)}
                  </Text>
                )}
              </View>
              <View style={styles.operatorMeta}>
                <Text style={styles.operatorName} numberOfLines={1}>
                  {planDetails?.name || contextOperator?.name}
                </Text>
                <TouchableOpacity
                  style={styles.postSaleLink}
                  onPress={() => setPostSaleModalOpen(true)}
                >
                  <HugeiconsIcon icon={Share08Icon} size={14} color={theme.colors.primary} />
                  <Text style={styles.postSaleText}>Link de Pós Venda</Text>
                </TouchableOpacity>
              </View>
            </View>

            <AccordionSection
              title="Materiais em PDF"
              icon={Pdf02Icon}
              isOpen={openSections.materials}
              onToggle={() => handleToggleSection('materials')}
              theme={theme}
              styles={styles}
            >
              <View style={styles.sectionCard}>
                {materialsByCategory.tables.length > 0 && (
                  <SectionRow
                    label="Tabelas"
                    onPress={() => handleOpenMaterialList('PDFs / Tabelas', MaterialCategory.TABLE)}
                    styles={styles}
                    theme={theme}
                    icon={File01Icon}
                  />
                )}
                {materialsByCategory.support.length > 0 && (
                  <SectionRow
                    label="Materiais de Apoio"
                    onPress={() =>
                      handleOpenMaterialList(
                        'PDFs / Materiais de Apoio',
                        MaterialCategory.SUPPORT_MATERIAL,
                      )
                    }
                    styles={styles}
                    theme={theme}
                    icon={File01Icon}
                  />
                )}
                {materialsByCategory.associative.length > 0 && (
                  <SectionRow
                    label="Fichas Associativas"
                    onPress={() =>
                      handleOpenMaterialList('PDFs / Fichas', MaterialCategory.ASSOCIATIVE_ENTITY)
                    }
                    styles={styles}
                    theme={theme}
                    icon={File01Icon}
                  />
                )}
                {materialsByCategory.tables.length === 0
                  && materialsByCategory.support.length === 0
                  && materialsByCategory.associative.length === 0 && (
                    <Text style={styles.sectionEmptyText}>Nenhum material disponível.</Text>
                  )}
              </View>
            </AccordionSection>

            <AccordionSection
              title="Dúvidas Comerciais"
              icon={AiContentGenerator01Icon}
              isOpen={openSections.commercial}
              onToggle={() => handleToggleSection('commercial')}
              theme={theme}
              styles={styles}
            >
              <View style={styles.sectionCard}>
                {commercialButtons.length === 0 && (
                  <Text style={styles.sectionEmptyText}>
                    Nenhuma informação comercial disponível.
                  </Text>
                )}
                {commercialButtons.map((item) => (
                  <SectionRow
                    key={item.key}
                    label={item.label}
                    onPress={item.action}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </View>
            </AccordionSection>

            <AccordionSection
              title="Links Úteis"
              icon={Link01Icon}
              isOpen={openSections.links}
              onToggle={() => handleToggleSection('links')}
              theme={theme}
              styles={styles}
            >
              <View style={styles.sectionCard}>
                {linksList.length === 0 && (
                  <Text style={styles.sectionEmptyText}>Nenhum link útil disponível.</Text>
                )}
                {linksList.map((link) => (
                  <SectionRow
                    key={link.id}
                    label={link.name}
                    icon={LinkSquare02Icon}
                    onPress={() => handleOpenMaterialItem({ id: link.id, name: link.name, category: MaterialCategory.LINK, link: link.href })}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </View>
            </AccordionSection>
          </ScrollView>
        )}

        {errorMessage && !isLoading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={isStateModalOpen} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setIsStateModalOpen(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o estado</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {stateOptions.map((plan) => {
                const isActive = planDetails?.state?.id === plan.state.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => handleSelectState(plan)}
                  >
                    <View style={styles.modalOptionRow}>
                      <Text style={styles.modalOptionText}>{plan.state.name}</Text>
                      {isActive && (
                        <HugeiconsIcon icon={Tick01Icon} size={16} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={!!materialModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setMaterialModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{materialModal?.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(materialsByCategory.tables
                .concat(materialsByCategory.support)
                .concat(materialsByCategory.associative))
                .filter((material) => material.category === materialModal?.category)
                .map((material, idx, list) => {
                  const isLast = idx === list.length - 1;
                  return (
                    <TouchableOpacity
                      key={material.id}
                      style={[styles.modalRow, !isLast && styles.modalRowBorder]}
                      onPress={() => handleOpenMaterialItem(material)}
                    >
                      <View style={styles.modalRowLeft}>
                        <HugeiconsIcon icon={File01Icon} size={16} color={theme.colors.textSecondary} />
                        <View style={styles.modalRowTextBlock}>
                          <Text style={styles.modalRowTitle} numberOfLines={1}>
                            {material.name}
                          </Text>
                          {material.updatedAt && (
                            <Text style={styles.modalRowSubtitle}>
                              Atualizado: {new Date(material.updatedAt).toLocaleDateString('pt-BR')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <ArrowRightIcon size={14} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={!!noteModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setNoteModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{noteModal?.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.noteText}>{noteModal?.content}</Text>
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={!!tablesModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setTablesModal(null);
              setTableSearch('');
              setFilterModal(null);
              setDiscountModal(null);
            }}
          />
          <View style={styles.modalContentLarge}>
            <View style={styles.tablesModalHeader}>
              <View style={styles.tablesModalTitleRow}>
                <HugeiconsIcon icon={Search02Icon} size={18} color={theme.colors.text} />
                <Text style={styles.tablesModalTitle}>{tablesModal?.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.tablesModalClose}
                onPress={() => {
                  setTablesModal(null);
                  setTableSearch('');
                  setFilterModal(null);
                  setDiscountModal(null);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tablesModalPlanRow}>
              <View style={styles.tablesModalPlanAvatar}>
                {planDetails?.image ? (
                  <Image source={{ uri: planDetails.image }} style={styles.tablesModalPlanAvatarImage} />
                ) : (
                  <Text style={styles.tablesModalPlanAvatarText}>
                    {getInitials(planDetails?.name || contextOperator?.name)}
                  </Text>
                )}
              </View>
              <View style={styles.tablesModalPlanInfo}>
                {planDetails?.insurance?.name && (
                  <Text style={styles.tablesModalPlanTag}>
                    {planDetails.insurance.name.toUpperCase()}
                  </Text>
                )}
                <Text style={styles.tablesModalPlanName} numberOfLines={1}>
                  {planDetails?.name || contextOperator?.name}
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tablesModalBody}>
              {customTables.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableTabs}>
                  {customTables.map((table) => {
                    const isActive = selectedTableId === table.id;
                    return (
                      <TouchableOpacity
                        key={table.id}
                        style={[styles.tableTab, isActive && styles.tableTabActive]}
                        onPress={() => setSelectedTableId(table.id)}
                      >
                        <Text style={[styles.tableTabText, isActive && styles.tableTabTextActive]}>
                          {table.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {tablesModal?.mode === 'prices' && (
                <>
                  {customTables.length === 0 ? (
                    <Text style={styles.sectionEmptyText}>Nenhuma tabela disponível.</Text>
                  ) : (
                    <>
                      <View style={styles.quickFiltersHeader}>
                        <HugeiconsIcon icon={FilterAddIcon} size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.quickFiltersTitle}>Filtros Rápidos</Text>
                      </View>
                      <View style={styles.quickFiltersRow}>
                        <TouchableOpacity
                          style={styles.filterPill}
                          onPress={() => setFilterModal({ type: 'coparticipation' })}
                        >
                          <HugeiconsIcon icon={AddMoneyCircleIcon} size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.filterPillText}>
                            {priceFilters.coparticipation === 'all'
                              ? 'Todas Coparticipações'
                              : getCoparticipationLabel(Number(priceFilters.coparticipation))}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.filterPill}
                          onPress={() => setFilterModal({ type: 'accommodation' })}
                        >
                          <HugeiconsIcon icon={HospitalBed01Icon} size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.filterPillText}>
                          {priceFilters.accommodation === 'all'
                            ? 'Todas Acomodações'
                            : accommodationOptions.find((item) => item.id === priceFilters.accommodation)?.name || 'Todas Acomodações'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.filterPill}
                          onPress={() => setFilterModal({ type: 'segment' })}
                        >
                          <HugeiconsIcon icon={HeartCheckIcon} size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.filterPillText}>
                          {priceFilters.segment === 'all'
                            ? 'Todas Coberturas'
                            : segmentOptions.find((item) => item.id === priceFilters.segment)?.name || 'Todas Coberturas'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isTableProductsLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                          <Text style={styles.loadingText}>Carregando preços...</Text>
                        </View>
                      ) : filteredPriceProducts.length === 0 ? (
                        <Text style={styles.sectionEmptyText}>Nenhum produto disponível.</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.tableGrid}>
                          <View style={[styles.tableRow, styles.tableHeaderRow]}>
                            <View style={[styles.tableCell, styles.tableHeaderCell, styles.tableFirstColumn]}>
                              <Text style={[styles.tableHeaderText, styles.tableHeaderTextLeft]}>
                                Produto
                              </Text>
                            </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={[styles.tableCell, styles.tableHeaderCell]}>
                            <Text style={styles.tableHeaderText} numberOfLines={2}>
                              {product.name}
                            </Text>
                            {product.discountType === 'PROGRESSIVE' &&
                              product.progressiveDiscountTiers &&
                              product.progressiveDiscountTiers.length > 0 && (
                                <TouchableOpacity
                                  onPress={() =>
                                    setDiscountModal({
                                      productId: product.id,
                                      tiers: product.progressiveDiscountTiers,
                                    })
                                  }
                                >
                                  <Text style={styles.tableHeaderMeta}>
                                    Desconto: {selectedDiscountByProduct[product.id] ?? product.progressiveDiscountTiers[0].discountPercentage}%
                                  </Text>
                                </TouchableOpacity>
                              )}
                          </View>
                        ))}
                      </View>

                      <View style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.tableFirstColumn]}>
                          <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                            Coparticipação
                          </Text>
                        </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={styles.tableCell}>
                            <Text style={styles.tableCellText}>
                              {getCoparticipationLabel(product.includesCoparticipation)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <View style={[styles.tableCell, styles.tableFirstColumn]}>
                          <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                            Reembolso
                          </Text>
                        </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={styles.tableCell}>
                            <Text style={styles.tableCellText}>
                              {product.isRefundable ? 'Com Reembolso' : 'Sem Reembolso'}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.tableFirstColumn]}>
                          <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                            Coberturas
                          </Text>
                        </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={styles.tableCell}>
                            <Text style={styles.tableCellText}>{product.segment?.name}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <View style={[styles.tableCell, styles.tableFirstColumn]}>
                          <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                            Abrangência
                          </Text>
                        </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={styles.tableCell}>
                            <Text style={styles.tableCellText}>{product.coverage?.name}</Text>
                          </View>
                        ))}
                      </View>

                      {shouldShowContractType && (
                        <View style={styles.tableRow}>
                          <View style={[styles.tableCell, styles.tableFirstColumn]}>
                            <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                              Tipo de Contrato
                            </Text>
                          </View>
                          {filteredPriceProducts.map((product) => (
                            <View key={product.id} style={styles.tableCell}>
                              <Text style={styles.tableCellText}>
                                {getContractTypeLabel(product.contractType)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <View style={[styles.tableCell, styles.tableFirstColumn]}>
                          <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                            Faixa Etária
                          </Text>
                        </View>
                        {filteredPriceProducts.map((product) => (
                          <View key={product.id} style={styles.tableCell}>
                            <Text style={styles.tableCellText}>
                              {product.accommodation?.name || '—'}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {liveGroups.map((groupKey, index) => (
                        <View
                          key={groupKey}
                          style={[styles.tableRow, index % 2 === 0 ? styles.tableRowAlt : null]}
                        >
                          <View style={[styles.tableCell, styles.tableFirstColumn]}>
                            <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                              {formatAgeGroup(groupKey)}
                            </Text>
                          </View>
                          {filteredPriceProducts.map((product) => {
                            const priceKey = `priceAgeGroup${groupKey}` as keyof ProductDetails;
                            const discountKey = `discountAgeGroup${groupKey}` as keyof ProductDetails;
                            const price = product[priceKey] as number | undefined;
                            if (!price) {
                              return (
                                <View key={product.id} style={styles.tableCell}>
                                  <Text style={styles.tableCellText}>Indisponível</Text>
                                </View>
                              );
                            }
                            const discount =
                              selectedDiscountByProduct[product.id] ??
                              (product[discountKey] as number | undefined);
                            const priceWithDiscount = applyDiscount(price, discount);
                            const hasDiscount = discount && discount > 0 && priceWithDiscount !== price;

                            return (
                              <View key={product.id} style={styles.tableCell}>
                                {hasDiscount ? (
                                  <View style={styles.priceCellStack}>
                                    <Text style={styles.priceOld}>{formatCurrency(price)}</Text>
                                    <View style={styles.priceDiscountRow}>
                                      <Text style={styles.priceNew}>{formatCurrency(priceWithDiscount)}</Text>
                                      <Text style={styles.priceBadge}>{`${discount}%`}</Text>
                                    </View>
                                  </View>
                                ) : (
                                  <Text style={styles.tableCellText}>{formatCurrency(price)}</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))}
                          </View>
                        </ScrollView>
                      )}
                      <View style={styles.noticeCard}>
                        <Text style={styles.noticeText}>
                          <Text style={styles.noticeStrong}>Informativo de caráter referencial:</Text>{' '}
                          preços, normas de venda, rede de serviços credenciados e termos contratuais são
                          estabelecidos pelas seguradoras ou operadoras e podem ser modificados por elas a
                          qualquer tempo. Mantemos o direito de corrigir possíveis equívocos, sem que isso
                          esteja atrelado à prestação do serviço, que ocorrerá apenas no momento da assinatura
                          do contrato.
                        </Text>
                      </View>
                      {mostRecentUpdatedAt ? (
                        <View style={styles.updatedBadge}>
                          <Text style={styles.updatedText}>
                            Data da última atualização: <Text style={styles.updatedStrong}>{mostRecentUpdatedAt}</Text>
                          </Text>
                        </View>
                      ) : null}
                    </>
                  )}
                </>
              )}

              {tablesModal?.mode !== 'prices' && (
                <>
                  <View style={styles.searchContainer}>
                    <HugeiconsIcon icon={Search02Icon} size={16} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={
                        tablesModal?.mode === 'refnets'
                          ? 'Buscar rede ou especialidade...'
                          : 'Buscar cidade...'
                      }
                      placeholderTextColor={theme.colors.textSecondary}
                      value={tableSearch}
                      onChangeText={setTableSearch}
                    />
                  </View>
                  {isTablesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.loadingText}>Carregando informações...</Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {tablesModal?.mode === 'refnets' && (
                        <View style={styles.tableGrid}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                          <View style={[styles.tableCell, styles.tableHeaderCell, styles.tableFirstColumnWide]}>
                            <Text style={[styles.tableHeaderText, styles.tableHeaderTextLeft]}>
                              Rede / Hospital
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.tableHeaderCell, styles.tableCityColumn]}>
                            <Text style={styles.tableHeaderText}>Cidade</Text>
                          </View>
                          {networkContext?.products?.map((product) => (
                            <View key={product.id} style={[styles.tableCell, styles.tableHeaderCell]}>
                              <Text style={styles.tableHeaderText} numberOfLines={2}>
                                {product.name}
                              </Text>
                              <Text style={styles.tableHeaderMeta}>{product.coverage?.name}</Text>
                              {product.accommodation?.name && (
                                <Text style={styles.tableHeaderAccent}>{product.accommodation.name}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                        {filteredNetworks.length === 0 ? (
                          <View style={styles.tableEmptyRow}>
                            <Text style={styles.sectionEmptyText}>
                              Nenhuma rede encontrada para a pesquisa atual.
                            </Text>
                          </View>
                        ) : (
                          filteredNetworks.map((network, rowIndex) => (
                            <View
                              key={network.id}
                              style={[styles.tableRow, rowIndex % 2 === 1 && styles.tableRowAlt]}
                            >
                              <View style={[styles.tableCell, styles.tableFirstColumnWide]}>
                                <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                                  {network.name}
                                </Text>
                              </View>
                              <View style={[styles.tableCell, styles.tableCityColumn]}>
                                <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                                  {network.city}
                                </Text>
                              </View>
                              {networkContext?.products?.map((product) => {
                                const isCovered = network.productIds?.includes(product.id);
                                return (
                                  <View key={product.id} style={styles.tableCell}>
                                    {isCovered ? (
                                      <View style={styles.checkBadge}>
                                        <HugeiconsIcon icon={Tick01Icon} size={12} color={theme.colors.white} />
                                      </View>
                                    ) : (
                                      <View style={styles.emptyBadge} />
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          ))
                        )}
                      </View>
                    )}

                      {tablesModal?.mode === 'sales' && (
                        <View style={styles.tableGrid}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                          <View style={[styles.tableCell, styles.tableHeaderCell, styles.tableFirstColumnWide]}>
                            <Text style={[styles.tableHeaderText, styles.tableHeaderTextLeft]}>
                              Cidade de Comercialização
                            </Text>
                          </View>
                          {commercialContext?.products?.map((product) => (
                            <View key={product.id} style={[styles.tableCell, styles.tableHeaderCell]}>
                              <Text style={styles.tableHeaderText} numberOfLines={2}>
                                {product.name}
                              </Text>
                              <Text style={styles.tableHeaderMeta}>{product.coverage?.name}</Text>
                              {product.accommodation?.name && (
                                <Text style={styles.tableHeaderAccent}>{product.accommodation.name}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                        {filteredCities.length === 0 ? (
                          <View style={styles.tableEmptyRow}>
                            <Text style={styles.sectionEmptyText}>
                              Nenhuma cidade encontrada para a pesquisa atual.
                            </Text>
                          </View>
                        ) : (
                          filteredCities.map((city, rowIndex) => (
                            <View
                              key={city.id}
                              style={[styles.tableRow, rowIndex % 2 === 1 && styles.tableRowAlt]}
                            >
                              <View style={[styles.tableCell, styles.tableFirstColumnWide]}>
                                <Text style={[styles.tableCellText, styles.tableCellTextLeft]}>
                                  {city.name}
                                </Text>
                              </View>
                              {commercialContext?.products?.map((product) => {
                                const isAvailable = city.productIds?.includes(product.id);
                                return (
                                  <View key={product.id} style={styles.tableCell}>
                                    {isAvailable ? (
                                      <View style={styles.checkBadge}>
                                        <HugeiconsIcon icon={Tick01Icon} size={12} color={theme.colors.white} />
                                      </View>
                                    ) : (
                                      <View style={styles.emptyBadge} />
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          ))
                        )}
                      </View>
                      )}
                    </ScrollView>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={!!filterModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setFilterModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filterModal?.type === 'coparticipation' && (
                <>
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => handleSelectFilter('coparticipation', 'all')}
                  >
                    <Text style={styles.modalRowTitle}>Todas Coparticipações</Text>
                  </TouchableOpacity>
                  {coparticipationOptions.map((option) => (
                    <TouchableOpacity
                      key={`${option}`}
                      style={styles.modalRow}
                      onPress={() => handleSelectFilter('coparticipation', option.toString())}
                    >
                      <Text style={styles.modalRowTitle}>{getCoparticipationLabel(option)}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {filterModal?.type === 'accommodation' && (
                <>
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => handleSelectFilter('accommodation', 'all')}
                  >
                    <Text style={styles.modalRowTitle}>Todas Acomodações</Text>
                  </TouchableOpacity>
                  {accommodationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.modalRow}
                      onPress={() => handleSelectFilter('accommodation', option.id)}
                    >
                      <Text style={styles.modalRowTitle}>{option.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {filterModal?.type === 'segment' && (
                <>
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => handleSelectFilter('segment', 'all')}
                  >
                    <Text style={styles.modalRowTitle}>Todas Coberturas</Text>
                  </TouchableOpacity>
                  {segmentOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.modalRow}
                      onPress={() => handleSelectFilter('segment', option.id)}
                    >
                      <Text style={styles.modalRowTitle}>{option.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={!!discountModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setDiscountModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Desconto</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {discountModal?.tiers?.map((tier, index) => (
                <TouchableOpacity
                  key={`${tier.firstUnit}-${tier.lastUnit}-${index}`}
                  style={styles.modalRow}
                  onPress={() => handleSelectDiscountTier(discountModal.productId, tier.discountPercentage)}
                >
                  <Text style={styles.modalRowTitle}>
                    {tier.firstUnit} a {tier.lastUnit} vidas • {tier.discountPercentage}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <Modal statusBarTranslucent
        navigationBarTranslucent
        visible={postSaleModalOpen} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setPostSaleModalOpen(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gerar Link de Pós Venda</Text>
            <Text style={styles.modalSubtitle}>Insira o nome do cliente para gerar o link.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Jéssica Conceição"
              placeholderTextColor={theme.colors.textSecondary}
              value={clientName}
              onChangeText={setClientName}
            />
            <TouchableOpacity
              style={[styles.primaryButton, !clientName.trim() && styles.primaryButtonDisabled]}
              onPress={handleGeneratePostSaleLink}
              disabled={!clientName.trim()}
            >
              <Text style={styles.primaryButtonText}>Gerar e Abrir Link</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  theme,
  styles,
}: {
  title: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: ReturnType<typeof getTheme>;
  styles: any;
}) {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionTitleRow}>
          <HugeiconsIcon icon={icon} size={16} color={theme.colors.text} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={[styles.sectionChevron, isOpen && styles.sectionChevronOpen]}>
          <ArrowDownIcon size={16} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function SectionRow({
  label,
  onPress,
  styles,
  icon,
  theme,
}: {
  label: string;
  onPress: () => void;
  styles: any;
  icon?: any;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <TouchableOpacity style={styles.sectionRow} onPress={onPress}>
      <View style={styles.sectionRowLeft}>
        <HugeiconsIcon
          icon={icon || Search02Icon}
          size={16}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.sectionRowText}>{label}</Text>
      </View>
      <ArrowRightIcon size={14} color={theme.colors.textSecondary} />
    </TouchableOpacity>
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
    headerTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: theme.spacing.sm,
    },
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl + insets.bottom,
      gap: theme.spacing.lg,
    },
    stateSelector: {
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
    stateSelectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    stateSeparator: {
      width: 1,
      height: 18,
      backgroundColor: cardBorder,
    },
    stateSelectorText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
    },
    operatorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    operatorAvatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: isDark ? '#f4f4f5' : '#f4f4f5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    operatorAvatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      resizeMode: 'contain',
    },
    operatorAvatarText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: '#6b7280',
    },
    operatorMeta: {
      flex: 1,
    },
    operatorName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    postSaleLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    postSaleText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.primary,
    },
    sectionContainer: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    sectionChevron: {
      transform: [{ rotate: '0deg' }],
    },
    sectionChevronOpen: {
      transform: [{ rotate: '180deg' }],
    },
    sectionBody: {
      gap: theme.spacing.sm,
    },
    sectionCard: {
      borderRadius: theme.borderRadius.lg,
      backgroundColor: cardBackground,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: 'hidden',
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
    },
    sectionRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    sectionRowText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      flex: 1,
    },
    sectionEmptyText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      padding: theme.spacing.lg,
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
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    emptyTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      textAlign: 'center',
    },
    errorBanner: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      backgroundColor: isDark ? '#2b1f1f' : '#fdecec',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: isDark ? '#4b2b2b' : '#f5c2c2',
    },
    errorText: {
      color: isDark ? '#fca5a5' : '#b91c1c',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      top: '18%',
      maxHeight: '64%',
      backgroundColor: cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    modalContentLarge: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      top: '12%',
      maxHeight: '76%',
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
    modalSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      marginBottom: theme.spacing.md,
    },
    modalOption: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
    },
    modalOptionActive: {
      backgroundColor: isDark ? '#232327' : theme.colors.backgroundLight,
    },
    modalOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalOptionText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    modalRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
    },
    modalRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    modalRowTextBlock: {
      flex: 1,
    },
    modalRowTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    modalRowSubtitle: {
      fontSize: theme.fontSize.xs,
      color: mutedText,
      marginTop: 2,
    },
    noteText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      lineHeight: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.text,
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      marginBottom: theme.spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.white,
    },
    tableTabs: {
      marginBottom: theme.spacing.md,
    },
    tableTab: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      marginRight: theme.spacing.sm,
    },
    tableTabActive: {
      backgroundColor: theme.colors.primary,
    },
    tableTabText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: mutedText,
    },
    tableTabTextActive: {
      color: theme.colors.white,
    },
    tablesModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    tablesModalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    tablesModalTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    tablesModalBody: {
      paddingBottom: theme.spacing.lg,
    },
    tablesModalClose: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    tablesModalPlanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    tablesModalPlanAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#f4f4f5' : '#f4f4f5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tablesModalPlanAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      resizeMode: 'contain',
    },
    tablesModalPlanAvatarText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: '#6b7280',
    },
    tablesModalPlanInfo: {
      flex: 1,
    },
    tablesModalPlanTag: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: mutedText,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    tablesModalPlanName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    quickFiltersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    quickFiltersTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    quickFiltersRow: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
    },
    filterPillText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      flexShrink: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
    },
    priceRowText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: cardBorder,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.text,
      paddingVertical: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    tableGrid: {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
    },
    tableRowAlt: {
      backgroundColor: isDark ? '#1b1b1f' : theme.colors.backgroundLight,
    },
    tableHeaderRow: {
      backgroundColor: isDark ? '#151518' : theme.colors.backgroundMuted,
    },
    tableCell: {
      minWidth: 140,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: cardBorder,
    },
    tableHeaderCell: {
      backgroundColor: isDark ? '#151518' : theme.colors.backgroundMuted,
    },
    tableFirstColumn: {
      minWidth: 120,
      alignItems: 'flex-start',
    },
    tableFirstColumnWide: {
      minWidth: 170,
      alignItems: 'flex-start',
    },
    tableCityColumn: {
      minWidth: 120,
      alignItems: 'flex-start',
    },
    tableHeaderText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    tableHeaderTextLeft: {
      textAlign: 'left',
    },
    tableHeaderMeta: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: mutedText,
      textAlign: 'center',
      marginTop: 4,
      textTransform: 'uppercase',
    },
    tableHeaderAccent: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: 2,
      textTransform: 'uppercase',
    },
    tableCellText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      textAlign: 'center',
    },
    tableCellTextLeft: {
      textAlign: 'left',
    },
    tableEmptyRow: {
      padding: theme.spacing.lg,
    },
    checkBadge: {
      width: 20,
      height: 20,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    emptyBadge: {
      width: 18,
      height: 18,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: cardBorder,
      alignSelf: 'center',
    },
    priceCellStack: {
      alignItems: 'center',
      gap: 4,
    },
    priceOld: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      textDecorationLine: 'line-through',
    },
    priceNew: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: '#22c55e',
    },
    priceDiscountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    priceBadge: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: '#22c55e',
    },
    noticeCard: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    noticeText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      lineHeight: 18,
    },
    noticeStrong: {
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    updatedBadge: {
      marginTop: theme.spacing.sm,
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: isDark ? '#1e1e23' : theme.colors.backgroundLight,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    updatedText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
    },
    updatedStrong: {
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    contextRow: {
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: cardBorder,
    },
    contextTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    contextSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      marginTop: 2,
    },
    contextMeta: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: mutedText,
      marginTop: 4,
    },
  });
};
