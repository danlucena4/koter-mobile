import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  Remove01Icon,
  Stethoscope02Icon,
  DentalToothIcon,
  PencilEdit01Icon,
  Alert01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  UserIcon,
  FilterEditIcon,
  CalculatorIcon,
  UserCircle02Icon,
  Location06Icon,
  Edit02Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/lib/api';
import { authService } from '../src/services/auth.service';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon,
  MenuIcon,
  TableIcon,
  CalculatorIconWrapper,
} from '../src/components/HugeIconsWrapper';

const ageGroups = [
  { label: '0 a 18', key: 'lives0to18' },
  { label: '19 a 23', key: 'lives19to23' },
  { label: '24 a 28', key: 'lives24to28' },
  { label: '29 a 33', key: 'lives29to33' },
  { label: '34 a 38', key: 'lives34to38' },
  { label: '39 a 43', key: 'lives39to43' },
  { label: '44 a 48', key: 'lives44to48' },
  { label: '49 a 53', key: 'lives49to53' },
  { label: '54 a 58', key: 'lives54to58' },
  { label: '59+', key: 'lives59upper' },
];

const MAX_LIVES = 999;

type QuoteType = 'health' | 'dental';

type AgeRangeMap = Record<string, number>;

enum QuoteCoparticipation {
  All = 0,
  With = 1,
  Without = 2,
  Partial = 3,
}

enum PlanCategory {
  PhysicalPerson = 0,
  LegalPerson = 1,
  Adhesion = 2,
}

enum ProductContractType {
  Compulsory = 0,
  Voluntary = 1,
  NotApplicable = 2,
}

type SelectOption = {
  label: string;
  value: string;
};

type LocationOption = {
  cityId: string;
  stateId: string;
  label: string;
};

type PickerType =
  | 'profession'
  | 'association'
  | 'lpt'
  | 'coparticipation'
  | 'accommodation'
  | 'planType'
  | 'contractType'
  | 'coverage'
  | 'segment'
  | 'refund'
  | 'refnet';

type PlanSummary = {
  id: string;
  name: string;
  image: string;
  managerName?: string;
  managerImage?: string;
  quoteType?: 'HEALTH' | 'ODONTO';
};

type ProductDetails = {
  id: string;
  name: string;
  accommodation?: { id: string; name: string } | null;
  coverage?: { id: string; name: string } | null;
  segment?: { id: string; name: string } | null;
  includesCoparticipation?: number | null;
  discountType?: string;
  progressiveDiscountTiers?: Array<{
    firstUnit: number;
    lastUnit: number;
    discountPercentage: number;
  }>;
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
  discountAgeGroup018?: number | null;
  discountAgeGroup1923?: number | null;
  discountAgeGroup2428?: number | null;
  discountAgeGroup2933?: number | null;
  discountAgeGroup3438?: number | null;
  discountAgeGroup3943?: number | null;
  discountAgeGroup4448?: number | null;
  discountAgeGroup4953?: number | null;
  discountAgeGroup5458?: number | null;
  discountAgeGroup59Upper?: number | null;
};

type PlanDetails = {
  id: string;
  name: string;
  tables: Array<{
    id: string;
    name: string;
    products: ProductDetails[];
  }>;
};

type CrmItem = {
  id: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
};

const AGE_RANGES = [
  { max: 18, key: 'lives0to18' },
  { max: 23, key: 'lives19to23' },
  { max: 28, key: 'lives24to28' },
  { max: 33, key: 'lives29to33' },
  { max: 38, key: 'lives34to38' },
  { max: 43, key: 'lives39to43' },
  { max: 48, key: 'lives44to48' },
  { max: 53, key: 'lives49to53' },
  { max: 58, key: 'lives54to58' },
  { key: 'lives59upper' },
];

const parseDateString = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!day || !month || !year) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2100) return null;

  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
};

const getAgeFromDate = (value: { day: number; month: number; year: number }) => {
  const today = new Date();
  let age = today.getFullYear() - value.year;

  const hasHadBirthday =
    today.getMonth() + 1 > value.month ||
    (today.getMonth() + 1 === value.month && today.getDate() >= value.day);

  if (!hasHadBirthday) age -= 1;
  return Math.max(age, 0);
};

const COPARTICIPATION_OPTIONS: SelectOption[] = [
  { label: 'Todas', value: String(QuoteCoparticipation.All) },
  { label: 'Com Coparticipação', value: String(QuoteCoparticipation.With) },
  { label: 'Sem Coparticipação', value: String(QuoteCoparticipation.Without) },
  { label: 'Coparticipação Parcial', value: String(QuoteCoparticipation.Partial) },
];

const PLAN_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pessoa Física', value: String(PlanCategory.PhysicalPerson) },
  { label: 'Adesão', value: String(PlanCategory.Adhesion) },
];

const CONTRACT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Compulsório', value: String(ProductContractType.Compulsory) },
  { label: 'Livre Adesão', value: String(ProductContractType.Voluntary) },
];

const REFUND_OPTIONS: SelectOption[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Com Reembolso', value: 'true' },
  { label: 'Sem Reembolso', value: 'false' },
];

const MIN_BUDGET = 0;
const MAX_BUDGET = 10000;
const BUDGET_STEP = 50;
const HANDLE_SIZE = 18;

const getCoparticipationLabel = (value?: number | null) => {
  if (value === null || value === undefined) return 'Sem Copart.';
  switch (value) {
    case 0:
      return 'Copart. Total';
    case 1:
      return 'Sem Copart.';
    case 2:
      return 'Copart. Parcial';
    default:
      return 'Sem Copart.';
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calculateTotalProductPriceByLivesGroup = ({
  product,
  totalLives,
  lives,
  includesDiscount = false,
}: {
  product: ProductDetails;
  totalLives: number;
  lives: Record<string, number>;
  includesDiscount?: boolean;
}) => {
  const total = Object.entries(lives).reduce((acc, [ageGroup, livesCount]) => {
    const priceKey = Object.keys(product).find((key) => key.includes(`priceAgeGroup${ageGroup}`));
    const price = priceKey ? (product as Record<string, number>)[priceKey] : undefined;
    if (!price || typeof price !== 'number') return acc;

    if (includesDiscount) {
      if (product.discountType === 'FIXED') {
        const discountKey =
          ageGroup === '59' ? 'discountAgeGroup59Upper' : `discountAgeGroup${ageGroup}`;
        const discount = (product as Record<string, number>)[discountKey];
        if (discount && typeof discount === 'number' && discount > 0) {
          const priceWithDiscount = price - (price * discount) / 100;
          return acc + priceWithDiscount * livesCount;
        }
      } else if (product.progressiveDiscountTiers?.length) {
        const tier = product.progressiveDiscountTiers.find(
          (item) => totalLives >= item.firstUnit && totalLives <= item.lastUnit,
        );
        if (tier) {
          const priceWithDiscount = price - (price * tier.discountPercentage) / 100;
          return acc + priceWithDiscount * livesCount;
        }
      }
    }

    return acc + price * livesCount;
  }, 0);

  return total;
};

export default function QuoteCreateScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const params = useLocalSearchParams<{ id?: string }>();
  const editingQuoteId = params.id;
  const isEditMode = Boolean(editingQuoteId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, themeMode, insets);

  const [quoteType, setQuoteType] = useState<QuoteType>('health');
  const [ages, setAges] = useState<AgeRangeMap>(
    Object.fromEntries(ageGroups.map((group) => [group.key, 0])),
  );
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [dobInput, setDobInput] = useState('');
  const [validDates, setValidDates] = useState<string[]>([]);
  const [invalidDates, setInvalidDates] = useState<string[]>([]);
  const [converterError, setConverterError] = useState('');
  const [editSectionOpen, setEditSectionOpen] = useState<'profile' | 'lives' | 'filters' | null>(
    'profile',
  );
  const [clientType, setClientType] = useState<'physical' | 'legal'>('physical');
  const [frameworkType, setFrameworkType] = useState<'profession' | 'entity'>('profession');
  const [clientName, setClientName] = useState('');
  const [locationLabel, setLocationLabel] = useState('Selecione a cidade');
  const [budgetMinValue, setBudgetMinValue] = useState(MIN_BUDGET);
  const [budgetMaxValue, setBudgetMaxValue] = useState(MAX_BUDGET);
  const [budgetMinInput, setBudgetMinInput] = useState(String(MIN_BUDGET));
  const [budgetMaxInput, setBudgetMaxInput] = useState(String(MAX_BUDGET));
  const [isNewQuoter, setIsNewQuoter] = useState(true);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsPage, setLocationsPage] = useState(1);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const [professions, setProfessions] = useState<SelectOption[]>([]);
  const [associations, setAssociations] = useState<SelectOption[]>([]);
  const [legalPersonTypes, setLegalPersonTypes] = useState<SelectOption[]>([]);
  const [accommodations, setAccommodations] = useState<SelectOption[]>([]);
  const [coverages, setCoverages] = useState<SelectOption[]>([]);
  const [segments, setSegments] = useState<SelectOption[]>([]);
  const [refnets, setRefnets] = useState<SelectOption[]>([]);

  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  const [selectedLpt, setSelectedLpt] = useState<string | null>(null);
  const [selectedRefnets, setSelectedRefnets] = useState<string[]>([]);

  const [coparticipation, setCoparticipation] = useState<QuoteCoparticipation>(
    QuoteCoparticipation.All,
  );
  const [planType, setPlanType] = useState<PlanCategory | null>(null);
  const [contractType, setContractType] = useState<ProductContractType | null>(null);
  const [accommodationId, setAccommodationId] = useState<string | null>(null);
  const [coverageId, setCoverageId] = useState<string | null>(null);
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [canBeRefunded, setCanBeRefunded] = useState<boolean | null>(null);

  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isLoadingRefnets, setIsLoadingRefnets] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ location?: string; lpt?: string } | null>(
    null,
  );
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [createQuoteError, setCreateQuoteError] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isInitialEditLoad, setIsInitialEditLoad] = useState(isEditMode);

  const [planSummaries, setPlanSummaries] = useState<PlanSummary[]>([]);
  const [planDetailsMap, setPlanDetailsMap] = useState<Record<string, PlanDetails>>({});
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [isLoadingPlanDetails, setIsLoadingPlanDetails] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newQuoterPlanId, setNewQuoterPlanId] = useState<string | null>(null);
  const [newQuoterStep, setNewQuoterStep] = useState<
    'tables' | 'coparticipation' | 'products' | null
  >(null);
  const [newQuoterTable, setNewQuoterTable] = useState<PlanDetails['tables'][number] | null>(
    null,
  );
  const [newQuoterCoparticipation, setNewQuoterCoparticipation] = useState<
    'with' | 'without' | null
  >(null);
  const [newQuoterSelectedProductIds, setNewQuoterSelectedProductIds] = useState<string[]>([]);
  const [isEditingAges, setIsEditingAges] = useState(false);
  const [livesError, setLivesError] = useState<string | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = React.useRef(0);
  const budgetValuesRef = React.useRef({ min: MIN_BUDGET, max: MAX_BUDGET });
  const productScrollRefs = React.useRef<Record<string, ScrollView | null>>({});
  const productScrollOffsets = React.useRef<Record<string, number>>({});

  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [activeCrmPicker, setActiveCrmPicker] = useState<'lead' | 'contact' | null>(null);
  const [leads, setLeads] = useState<CrmItem[]>([]);
  const [contacts, setContacts] = useState<CrmItem[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CrmItem | null>(null);
  const [selectedContact, setSelectedContact] = useState<CrmItem | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const totalLives = useMemo(
    () => Object.values(ages).reduce((sum, value) => sum + value, 0),
    [ages],
  );
  const showPlanResults = isLoadingPlans || planSummaries.length > 0 || plansError;
  useEffect(() => {
    if (totalLives > 0 && livesError) {
      setLivesError(null);
    }
  }, [totalLives, livesError]);
  const shouldShowAgeWarning = Boolean(ages.lives0to18 || ages.lives59upper);
  const ageSummary = useMemo(
    () =>
      ageGroups
        .map((group) => ({ ...group, value: ages[group.key] || 0 }))
        .filter((group) => group.value > 0),
    [ages],
  );

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const sanitizeBudget = (value: number) => {
    const stepped = Math.round(value / BUDGET_STEP) * BUDGET_STEP;
    return clamp(stepped, MIN_BUDGET, MAX_BUDGET);
  };

  const minBudgetValue = sanitizeBudget(budgetMinValue);
  const maxBudgetValue = sanitizeBudget(budgetMaxValue);

  useEffect(() => {
    budgetValuesRef.current = {
      min: Math.min(minBudgetValue, maxBudgetValue),
      max: Math.max(minBudgetValue, maxBudgetValue),
    };
  }, [minBudgetValue, maxBudgetValue]);

  useEffect(() => {
    if (isEditingBudget) return;
    setBudgetMinInput(String(minBudgetValue));
    setBudgetMaxInput(String(maxBudgetValue));
  }, [minBudgetValue, maxBudgetValue, isEditingBudget]);

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setSliderWidth(width);
    sliderWidthRef.current = width;
  };

  const valueToPosition = (value: number) => {
    if (!sliderWidthRef.current) return 0;
    return ((value - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * sliderWidthRef.current;
  };

  const positionToValue = (pos: number) => {
    if (!sliderWidthRef.current) return MIN_BUDGET;
    const raw = (pos / sliderWidthRef.current) * (MAX_BUDGET - MIN_BUDGET) + MIN_BUDGET;
    return sanitizeBudget(raw);
  };

  const setBudgetMinSafe = (value: number) => {
    const clamped = sanitizeBudget(value);
    const next = Math.min(clamped, budgetValuesRef.current.max);
    setBudgetMinValue(next);
  };

  const setBudgetMaxSafe = (value: number) => {
    const clamped = sanitizeBudget(value);
    const next = Math.max(clamped, budgetValuesRef.current.min);
    setBudgetMaxValue(next);
  };

  const handleBudgetInputChange = (type: 'min' | 'max', value: string) => {
    const numeric = value.replace(/[^\d]/g, '');
    if (type === 'min') {
      setBudgetMinInput(numeric);
    } else {
      setBudgetMaxInput(numeric);
    }
  };

  const commitBudgetInputs = () => {
    const minRaw = Number(budgetMinInput || MIN_BUDGET);
    const maxRaw = Number(budgetMaxInput || MAX_BUDGET);
    const safeMin = sanitizeBudget(Number.isNaN(minRaw) ? MIN_BUDGET : minRaw);
    const safeMax = sanitizeBudget(Number.isNaN(maxRaw) ? MAX_BUDGET : maxRaw);
    const nextMin = Math.min(safeMin, safeMax);
    const nextMax = Math.max(safeMin, safeMax);
    setBudgetMinValue(nextMin);
    setBudgetMaxValue(nextMax);
    setBudgetMinInput(String(nextMin));
    setBudgetMaxInput(String(nextMax));
    setIsEditingBudget(false);
  };

  const minPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const minPos = valueToPosition(budgetValuesRef.current.min);
        const maxPos = valueToPosition(budgetValuesRef.current.max);
        const nextPos = clamp(minPos + gesture.dx, 0, maxPos);
        setBudgetMinSafe(positionToValue(nextPos));
      },
      onPanResponderRelease: () => {
        setBudgetMinSafe(budgetValuesRef.current.min);
      },
    })
  ).current;

  const maxPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const minPos = valueToPosition(budgetValuesRef.current.min);
        const maxPos = valueToPosition(budgetValuesRef.current.max);
        const nextPos = clamp(maxPos + gesture.dx, minPos, sliderWidthRef.current || maxPos);
        setBudgetMaxSafe(positionToValue(nextPos));
      },
      onPanResponderRelease: () => {
        setBudgetMaxSafe(budgetValuesRef.current.max);
      },
    })
  ).current;

  const selectedEntityLabel =
    frameworkType === 'profession'
      ? getMultiLabel(professions, selectedProfessions, 'Todas as profissões')
      : getMultiLabel(associations, selectedAssociations, 'Todas as entidades');

  const selectedLptLabel = getSingleLabel(legalPersonTypes, selectedLpt, 'Selecione o tipo de CNPJ');

  const coparticipationLabel =
    COPARTICIPATION_OPTIONS.find((option) => Number(option.value) === coparticipation)?.label ||
    'Todas';

  const accommodationLabel = getSingleLabel(accommodations, accommodationId, 'Todas');
  const planTypeLabel =
    planType === null
      ? 'Todos'
      : PLAN_TYPE_OPTIONS.find((option) => option.value === String(planType))?.label || 'Todos';
  const contractTypeLabel =
    contractType === null
      ? 'Todos'
      : CONTRACT_TYPE_OPTIONS.find((option) => option.value === String(contractType))?.label ||
        'Todos';
  const coverageLabel = getSingleLabel(coverages, coverageId, 'Todas');
  const segmentLabel = getSingleLabel(segments, segmentId, 'Todas');
  const refundLabel =
    canBeRefunded === null
      ? 'Todos'
      : canBeRefunded
        ? 'Com Reembolso'
        : 'Sem Reembolso';
  const refnetLabel = isLoadingRefnets
    ? 'Carregando...'
    : getMultiLabel(refnets, selectedRefnets, 'Filtre por hospitais...');

  const minHandlePos = sliderWidth ? valueToPosition(minBudgetValue) : 0;
  const maxHandlePos = sliderWidth ? valueToPosition(maxBudgetValue) : 0;
  const fillLeft = Math.min(minHandlePos, maxHandlePos);
  const fillWidth = Math.max(maxHandlePos - minHandlePos, 0);

  const newQuoterPlanDetails = newQuoterPlanId ? planDetailsMap[newQuoterPlanId] : null;
  const newQuoterTables = newQuoterPlanDetails?.tables || [];
  const newQuoterProducts = useMemo(() => {
    if (!newQuoterTable) return [];
    if (!newQuoterCoparticipation) return newQuoterTable.products;
    return newQuoterTable.products.filter((product) =>
      newQuoterCoparticipation === 'with'
        ? Boolean(product.includesCoparticipation)
        : !product.includesCoparticipation,
    );
  }, [newQuoterTable, newQuoterCoparticipation]);

  const selectedProductsByPlan = useMemo(() => {
    const map: Record<string, Array<{ product: ProductDetails; total: number }>> = {};
    planSummaries.forEach((plan) => {
      const details = planDetailsMap[plan.id];
      if (!details) return;
      details.tables.forEach((table) => {
        table.products.forEach((product) => {
          if (!selectedProducts.includes(product.id)) return;
          const total = calculateTotalProductPriceByLivesGroup({
            product,
            totalLives,
            lives:
              quoteType === 'dental'
                ? { '018': totalLives }
                : {
                    '018': ages.lives0to18 || 0,
                    '1923': ages.lives19to23 || 0,
                    '2428': ages.lives24to28 || 0,
                    '2933': ages.lives29to33 || 0,
                    '3438': ages.lives34to38 || 0,
                    '3943': ages.lives39to43 || 0,
                    '4448': ages.lives44to48 || 0,
                    '4953': ages.lives49to53 || 0,
                    '5458': ages.lives54to58 || 0,
                    '59': ages.lives59upper || 0,
                  },
          });
          if (!map[plan.id]) map[plan.id] = [];
          map[plan.id].push({ product, total });
        });
      });
    });
    return map;
  }, [planSummaries, planDetailsMap, selectedProducts, ages, totalLives, quoteType]);

  const selectedPlanIds = useMemo(
    () => Object.keys(selectedProductsByPlan).filter((key) => selectedProductsByPlan[key]?.length),
    [selectedProductsByPlan],
  );
  const hasSelectedProducts = selectedProducts.length > 0;

  useEffect(() => {
    if (hasSelectedProducts && createQuoteError) {
      setCreateQuoteError(null);
    }
  }, [hasSelectedProducts, createQuoteError]);

  useEffect(() => {
    if (newQuoterStep !== 'products') return;
    const preselected = newQuoterProducts
      .filter((product) => selectedProducts.includes(product.id))
      .map((product) => product.id);
    setNewQuoterSelectedProductIds(preselected);
  }, [newQuoterStep, newQuoterProducts, selectedProducts]);

  const accommodationOptions = useMemo(
    () => [{ label: 'Todas', value: 'all' }, ...accommodations],
    [accommodations],
  );
  const coverageOptions = useMemo(
    () => [{ label: 'Todas', value: 'all' }, ...coverages],
    [coverages],
  );
  const segmentOptions = useMemo(
    () => [{ label: 'Todas', value: 'all' }, ...segments],
    [segments],
  );

  const pickerConfig = useMemo(() => {
    if (!activePicker) return null;

    switch (activePicker) {
      case 'profession':
        return {
          title: 'Profissões',
          options: professions,
          selected: selectedProfessions,
          multi: true,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhuma profissão encontrada.',
        };
      case 'association':
        return {
          title: 'Entidades',
          options: associations,
          selected: selectedAssociations,
          multi: true,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhuma entidade encontrada.',
        };
      case 'lpt':
        return {
          title: 'Tipos de CNPJ',
          options: legalPersonTypes,
          selected: selectedLpt ? [selectedLpt] : [],
          multi: false,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhum tipo de CNPJ encontrado.',
        };
      case 'coparticipation':
        return {
          title: 'Coparticipação',
          options: COPARTICIPATION_OPTIONS,
          selected: [String(coparticipation)],
          multi: false,
        };
      case 'accommodation':
        return {
          title: 'Acomodação',
          options: accommodationOptions,
          selected: accommodationId ? [accommodationId] : ['all'],
          multi: false,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhuma acomodação encontrada.',
        };
      case 'planType':
        return {
          title: 'Tipo de Plano',
          options: PLAN_TYPE_OPTIONS,
          selected: planType === null ? ['all'] : [String(planType)],
          multi: false,
        };
      case 'contractType':
        return {
          title: 'Tipo de Contrato',
          options: CONTRACT_TYPE_OPTIONS,
          selected: contractType === null ? ['all'] : [String(contractType)],
          multi: false,
        };
      case 'coverage':
        return {
          title: 'Abrangência',
          options: coverageOptions,
          selected: coverageId ? [coverageId] : ['all'],
          multi: false,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhuma abrangência encontrada.',
        };
      case 'segment':
        return {
          title: 'Cobertura',
          options: segmentOptions,
          selected: segmentId ? [segmentId] : ['all'],
          multi: false,
          loading: isLoadingCatalogs,
          emptyText: 'Nenhuma cobertura encontrada.',
        };
      case 'refund':
        return {
          title: 'Reembolso',
          options: REFUND_OPTIONS,
          selected: canBeRefunded === null ? ['all'] : [String(canBeRefunded)],
          multi: false,
        };
      case 'refnet':
        return {
          title: 'Rede Credenciada',
          options: refnets,
          selected: selectedRefnets,
          multi: true,
          loading: isLoadingRefnets,
          emptyText: 'Nenhum hospital encontrado.',
        };
      default:
        return null;
    }
  }, [
    activePicker,
    professions,
    associations,
    legalPersonTypes,
    coparticipation,
    accommodations,
    accommodationOptions,
    accommodationId,
    planType,
    contractType,
    coverageOptions,
    coverageId,
    segmentOptions,
    segmentId,
    canBeRefunded,
    refnets,
    selectedProfessions,
    selectedAssociations,
    selectedLpt,
    selectedRefnets,
    isLoadingCatalogs,
    isLoadingRefnets,
  ]);

  const filteredPickerOptions = useMemo(() => {
    if (!pickerConfig) return [];
    const term = pickerSearch.trim().toLowerCase();
    if (!term) return pickerConfig.options;
    return pickerConfig.options.filter((option) => option.label.toLowerCase().includes(term));
  }, [pickerConfig, pickerSearch]);

  const pickerSearchEnabled = useMemo(() => {
    if (!pickerConfig) return false;
    return pickerConfig.options.length > 8 || pickerConfig.multi;
  }, [pickerConfig]);

  const updateAge = (key: string, delta: number) => {
    setAges((prev) => {
      const next = Math.max(0, Math.min(MAX_LIVES, (prev[key] || 0) + delta));
      return { ...prev, [key]: next };
    });
  };

  useEffect(() => {
    if (!dobInput.trim()) {
      setValidDates([]);
      setInvalidDates([]);
      return;
    }

    const parts = dobInput
      .split(/[\n,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const nextValid: string[] = [];
    const nextInvalid: string[] = [];

    parts.forEach((value) => {
      if (parseDateString(value)) {
        nextValid.push(value);
      } else {
        nextInvalid.push(value);
      }
    });

    setValidDates(nextValid);
    setInvalidDates(nextInvalid);
  }, [dobInput]);

  const mergeLocations = (items: LocationOption[]) => {
    const map = new Map<string, LocationOption>();
    items.forEach((item) => {
      map.set(`${item.cityId}-${item.stateId}`, item);
    });
    return Array.from(map.values());
  };

  const loadUserDefaults = async () => {
    try {
      const userData = await authService.getAuthenticatedUser();
      const label =
        userData.city?.name && userData.state?.abbreviation
          ? `${userData.city.name} - ${userData.state.abbreviation}`
          : 'Selecione a cidade';

      setLocationLabel(label);
      setSelectedCityId(userData.city?.id || null);
      setSelectedStateId(userData.state?.id || null);

      setIsNewQuoter(true);
    } catch {
      setLocationLabel('Selecione a cidade');
    }
  };

  useEffect(() => {
    if (isEditMode) return;
    loadUserDefaults();
  }, [isEditMode]);

  useEffect(() => {
    if (!editingQuoteId) return;
    let isMounted = true;

    const loadQuoteDetails = async () => {
      setIsLoadingEdit(true);
      try {
        const response = await api.get(`/quotes/me/${editingQuoteId}/details`);
        const data = response.data?.quote || response.data?.data || response.data;
        if (!isMounted || !data) return;

        setClientName(data.client || '');
        setClientType(data.clientType === 1 ? 'legal' : 'physical');
        setCoparticipation(data.coparticipation ?? QuoteCoparticipation.All);
        setSelectedStateId(data.state?.id || null);
        setSelectedCityId(data.city?.id || null);
        const label =
          data.city?.name && (data.state?.abbreviation || data.state?.name)
            ? `${data.city.name} - ${data.state.abbreviation || data.state.name}`
            : 'Selecione a cidade';
        setLocationLabel(label);
        setSelectedLpt(data.lpt?.id || null);
        setSelectedAssociations((data.associations || []).map((item: any) => item.id));
        setSelectedProfessions((data.professions || []).map((item: any) => item.id));
        setFrameworkType(
          (data.professions || []).length > 0
            ? 'profession'
            : (data.associations || []).length > 0
              ? 'entity'
              : 'profession',
        );
        setLeadId(data.lead?.id || null);
        setContactId(data.contact?.id || null);
        setSelectedLead(data.lead ? { id: data.lead.id, name: data.lead.name } : null);
        setSelectedContact(data.contact ? { id: data.contact.id, name: data.contact.name } : null);

        const nextAges = { ...Object.fromEntries(ageGroups.map((group) => [group.key, 0])) };
        ageGroups.forEach((group) => {
          if (data[group.key] !== undefined && data[group.key] !== null) {
            nextAges[group.key] = Number(data[group.key]) || 0;
          }
        });
        setAges(nextAges);

        if (data.minPrice !== undefined && data.minPrice !== null) {
          setBudgetMinValue(Number(data.minPrice));
          setBudgetMinInput(String(data.minPrice));
        }
        if (data.maxPrice !== undefined && data.maxPrice !== null) {
          setBudgetMaxValue(Number(data.maxPrice));
          setBudgetMaxInput(String(data.maxPrice));
        }

        const productIds =
          data.productsIds ||
          data.plans?.flatMap((plan: any) =>
            plan.tables?.flatMap((table: any) => table.products.map((product: any) => product.id)) ||
            [],
          ) ||
          [];
        setSelectedProducts(productIds);

        if (data.plans?.length) {
          const summaries = data.plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            image: plan.image,
            managerName: plan.managerName,
            managerImage: plan.managerImage,
            quoteType: plan.quoteType,
          }));
          setPlanSummaries(summaries);
          const detailsMap = data.plans.reduce((acc: Record<string, PlanDetails>, plan: any) => {
            acc[plan.id] = {
              id: plan.id,
              name: plan.name,
              tables: plan.tables || [],
            };
            return acc;
          }, {});
          setPlanDetailsMap(detailsMap);
        }

        const hasDental = data.plans?.some((plan: any) => plan.quoteType === 'ODONTO');
        const hasHealth = data.plans?.some((plan: any) => plan.quoteType === 'HEALTH');
        if (hasDental && !hasHealth) setQuoteType('dental');
        if (hasHealth) setQuoteType('health');
        setIsInitialEditLoad(false);
      } catch (error) {
        setCreateQuoteError('Não foi possível carregar a cotação.');
      } finally {
        setIsLoadingEdit(false);
        setIsInitialEditLoad(false);
      }
    };

    loadQuoteDetails();
    return () => {
      isMounted = false;
    };
  }, [editingQuoteId]);

  const fetchLocations = async (page = 1, search = '') => {
    if (isLoadingLocations) return;

    try {
      setIsLoadingLocations(true);
      const response = await api.get('/locations/search', {
        params: {
          page,
          pageSize: 50,
          search: search ? search : undefined,
        },
      });

      const raw = response.data?.data || [];
      const data = raw.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        avatar: lead.avatar || null,
        phone: lead.phone || lead.mobilePhone || null,
        email: lead.email || null,
      }));
      const meta = response.data?.meta;

      setLocations((prev) => mergeLocations(page === 1 ? data : [...prev, ...data]));
      setLocationsPage(page);
      setHasMoreLocations(Boolean(meta?.currentPage < meta?.totalPages));
    } catch {
      setHasMoreLocations(false);
      setLocations((prev) => (page === 1 ? [] : prev));
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const openLocationModal = () => {
    setIsLocationModalOpen(true);
    setLocationSearch('');
    fetchLocations(1, '');
  };

  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
  };

  const handleLoadMoreLocations = () => {
    if (isLoadingLocations || !hasMoreLocations) return;
    fetchLocations(locationsPage + 1, locationSearch);
  };

  const handleSelectLocation = (location: LocationOption) => {
    setSelectedCityId(location.cityId);
    setSelectedStateId(location.stateId);
    setLocationLabel(location.label);
    setProfileErrors((prev) => (prev ? { ...prev, location: undefined } : prev));
    closeLocationModal();
  };

  useEffect(() => {
    if (!isLocationModalOpen) return;
    const handler = setTimeout(() => {
      fetchLocations(1, locationSearch);
    }, 350);

    return () => clearTimeout(handler);
  }, [locationSearch, isLocationModalOpen]);

  const fetchOptionsList = async (endpoint: string, key: string) => {
    const response = await api.get(endpoint);
    const items = response.data?.[key] || [];
    return items.map((item: { id: string; name: string }) => ({
      label: item.name,
      value: item.id,
    }));
  };

  const loadCatalogs = async () => {
    if (isLoadingCatalogs) return;
    setIsLoadingCatalogs(true);
    setCatalogError(null);

    const results = await Promise.allSettled([
      fetchOptionsList('/professions/all', 'professions'),
      fetchOptionsList('/associations/all', 'associations'),
      fetchOptionsList('/lpts/all', 'lpts'),
      fetchOptionsList('/accommodations/all', 'accommodations'),
      fetchOptionsList('/coverages/all', 'coverages'),
      fetchOptionsList('/segments/all', 'segments'),
    ]);

    if (results[0].status === 'fulfilled') setProfessions(results[0].value);
    if (results[1].status === 'fulfilled') setAssociations(results[1].value);
    if (results[2].status === 'fulfilled') setLegalPersonTypes(results[2].value);
    if (results[3].status === 'fulfilled') setAccommodations(results[3].value);
    if (results[4].status === 'fulfilled') setCoverages(results[4].value);
    if (results[5].status === 'fulfilled') setSegments(results[5].value);

    const hasErrors = results.some((result) => result.status === 'rejected');
    if (hasErrors) setCatalogError('Não foi possível carregar algumas opções.');

    setIsLoadingCatalogs(false);
  };

  useEffect(() => {
    if (!isEditProfileOpen) return;
    if (
      professions.length === 0 ||
      associations.length === 0 ||
      legalPersonTypes.length === 0 ||
      accommodations.length === 0 ||
      coverages.length === 0 ||
      segments.length === 0
    ) {
      loadCatalogs();
    }
  }, [
    isEditProfileOpen,
    professions.length,
    associations.length,
    legalPersonTypes.length,
    accommodations.length,
    coverages.length,
    segments.length,
  ]);

  useEffect(() => {
    if (!showPlanResults) return;
    fetchPlanSummaries(isEditMode);
  }, [quoteType, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setSelectedProducts([]);
      setPlanDetailsMap({});
    }
    setExpandedPlanId(null);
    setPlansError(null);
    closeNewQuoterFlow();
  }, [quoteType, isEditMode, isInitialEditLoad]);

  useEffect(() => {
    if (activeCrmPicker !== 'lead') return;
    const handler = setTimeout(() => {
      fetchLeadsList(1, leadSearch);
    }, 350);
    return () => clearTimeout(handler);
  }, [leadSearch, activeCrmPicker]);

  useEffect(() => {
    if (activeCrmPicker !== 'contact') return;
    const handler = setTimeout(() => {
      fetchContactsList(1, contactSearch);
    }, 350);
    return () => clearTimeout(handler);
  }, [contactSearch, activeCrmPicker]);

  const loadRefnets = async (stateId?: string | null) => {
    if (!stateId) {
      setRefnets([]);
      return;
    }
    if (isLoadingRefnets) return;
    setIsLoadingRefnets(true);
    try {
      const response = await api.get('/refnets/all', {
        params: {
          stateId,
        },
      });
      const items = response.data?.refnets || [];
      setRefnets(
        items.map((item: { id: string; name: string }) => ({
          label: item.name,
          value: item.id,
        })),
      );
    } catch {
      setRefnets([]);
    } finally {
      setIsLoadingRefnets(false);
    }
  };

  useEffect(() => {
    setSelectedRefnets([]);
    if (!selectedStateId) {
      setRefnets([]);
      return;
    }
    loadRefnets(selectedStateId);
  }, [selectedStateId]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!selectedCityId || !selectedStateId) return;
    fetchPlanSummaries(true);
  }, [isEditMode, selectedCityId, selectedStateId]);

  const openPicker = (type: PickerType) => {
    setActivePicker(type);
    setPickerSearch('');
  };

  const closePicker = () => setActivePicker(null);

  const handleClientTypeChange = (type: 'physical' | 'legal') => {
    if (type === clientType) return;
    setClientType(type);
    setProfileErrors((prev) => (prev ? { ...prev, lpt: undefined } : prev));

    if (type === 'physical') {
      setSelectedLpt(null);
      setContractType(null);
      setFrameworkType('profession');
      setSelectedAssociations([]);
      setSelectedProfessions([]);
    } else {
      setPlanType(null);
      setSelectedAssociations([]);
      setSelectedProfessions([]);
    }
  };

  const handleFrameworkTypeChange = (type: 'profession' | 'entity') => {
    if (type === frameworkType) return;
    setFrameworkType(type);
    setSelectedAssociations([]);
    setSelectedProfessions([]);
  };

  function getSingleLabel(options: SelectOption[], value: string | null, fallback: string) {
    if (!value) return fallback;
    const option = options.find((item) => item.value === value);
    return option?.label ?? fallback;
  }

  function getMultiLabel(options: SelectOption[], values: string[], fallback: string) {
    if (!values.length) return fallback;
    const firstLabel = options.find((item) => item.value === values[0])?.label || values[0];
    if (values.length === 1) return firstLabel;
    return `${firstLabel} +${values.length - 1}`;
  }

  const handleSelectSingleOption = (value: string) => {
    if (!activePicker) return;
    switch (activePicker) {
      case 'coparticipation':
        setCoparticipation(Number(value) as QuoteCoparticipation);
        break;
      case 'accommodation':
        setAccommodationId(value === 'all' ? null : value);
        break;
      case 'planType':
        setPlanType(value === 'all' ? null : (Number(value) as PlanCategory));
        break;
      case 'contractType':
        setContractType(value === 'all' ? null : (Number(value) as ProductContractType));
        break;
      case 'coverage':
        setCoverageId(value === 'all' ? null : value);
        break;
      case 'segment':
        setSegmentId(value === 'all' ? null : value);
        break;
      case 'refund':
        setCanBeRefunded(value === 'all' ? null : value === 'true');
        break;
      case 'lpt':
        setSelectedLpt(value);
        setProfileErrors((prev) => (prev ? { ...prev, lpt: undefined } : prev));
        break;
      default:
        break;
    }
    closePicker();
  };

  const handleToggleMultiOption = (value: string) => {
    if (!activePicker) return;
    if (activePicker === 'profession') {
      setSelectedProfessions((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
    }
    if (activePicker === 'association') {
      setSelectedAssociations((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
    }
    if (activePicker === 'refnet') {
      setSelectedRefnets((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
    }
  };

  const handleClearMultiSelection = () => {
    if (!activePicker) return;
    if (activePicker === 'profession') setSelectedProfessions([]);
    if (activePicker === 'association') setSelectedAssociations([]);
    if (activePicker === 'refnet') setSelectedRefnets([]);
  };

  const buildSimulationParams = () => {
    const agesPayload = Object.entries(ages).reduce<Record<string, number>>((acc, [key, value]) => {
      if (value > 0) acc[key] = value;
      return acc;
    }, {});

    const params: Record<string, any> = {
      page: 1,
      pageSize: 20,
      state: selectedStateId,
      city: selectedCityId,
      clientType: clientType === 'physical' ? 0 : 1,
      coparticipation,
      quoteType: quoteType === 'health' ? 'HEALTH' : 'ODONTO',
      ages: agesPayload,
    };

    if (!Number.isNaN(budgetMinValue)) params.minPrice = budgetMinValue;
    if (!Number.isNaN(budgetMaxValue)) params.maxPrice = budgetMaxValue;

    if (clientType === 'physical') {
      params.entityType = frameworkType === 'profession' ? 0 : 1;
      const selectedList = frameworkType === 'profession' ? selectedProfessions : selectedAssociations;
      params.withoutEntity = selectedList.length === 0;
      if (frameworkType === 'profession' && selectedProfessions.length) {
        params.professions = selectedProfessions;
      }
      if (frameworkType === 'entity' && selectedAssociations.length) {
        params.associations = selectedAssociations;
      }
      if (planType !== null) params.planType = planType;
    } else {
      if (selectedLpt) params.lpt = selectedLpt;
      if (contractType !== null) params.contractType = contractType;
    }

    if (accommodationId) params.accommodationId = accommodationId;
    if (coverageId) params.coverageId = coverageId;
    if (segmentId) params.segmentId = segmentId;
    if (canBeRefunded !== null) params.canBeRefunded = canBeRefunded;
    if (selectedRefnets.length) params.refnets = selectedRefnets;

    return params;
  };

  const fetchPlanSummaries = async (preserveSelection = false) => {
    if (!selectedCityId || !selectedStateId) {
      setPlansError('Selecione a localização para ver as cotações.');
      return;
    }

    setIsLoadingPlans(true);
    setPlansError(null);
    setExpandedPlanId(null);
    if (!preserveSelection) {
      setPlanDetailsMap({});
    }
    if (!preserveSelection) {
      setSelectedProducts([]);
    }
    try {
      const params = buildSimulationParams();
      const response = await api.get('/plans/quote/summary', { params });
      const raw = response.data?.data || [];
    const data = raw.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      image: plan.image,
      managerName: plan.managerName,
      managerImage: plan.managerImage,
      quoteType: plan.quoteType,
    }));
      setPlanSummaries((prev) => {
        if (!isEditMode) return data;
        const map = new Map(prev.map((item) => [item.id, item]));
        data.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });
    } catch (error: any) {
      setPlansError(error?.message || 'Não foi possível carregar as cotações.');
      setPlanSummaries([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchPlanDetails = async (planId: string) => {
    if (planDetailsMap[planId]) return;
    setIsLoadingPlanDetails(true);
    try {
      const params = buildSimulationParams();
      const response = await api.get(`/plans/quote/${planId}`, { params });
      const plan = response.data?.plan || response.data?.data || response.data?.planDetails;
      if (plan) {
        setPlanDetailsMap((prev) => ({ ...prev, [planId]: plan }));
      }
    } catch {
      // ignore for now
    } finally {
      setIsLoadingPlanDetails(false);
    }
  };

  const handleTogglePlan = async (planId: string) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
      return;
    }
    setExpandedPlanId(planId);
    await fetchPlanDetails(planId);
  };

  const openNewQuoterPlan = async (planId: string) => {
    setNewQuoterPlanId(planId);
    setNewQuoterStep('tables');
    setNewQuoterTable(null);
    setNewQuoterCoparticipation(null);
    setNewQuoterSelectedProductIds([]);
    await fetchPlanDetails(planId);
  };

  const closeNewQuoterFlow = () => {
    setNewQuoterPlanId(null);
    setNewQuoterStep(null);
    setNewQuoterTable(null);
    setNewQuoterCoparticipation(null);
    setNewQuoterSelectedProductIds([]);
  };

  const handleSelectNewQuoterTable = (table: PlanDetails['tables'][number]) => {
    setNewQuoterTable(table);
    setNewQuoterStep('coparticipation');
  };

  const handleSelectNewQuoterCoparticipation = (value: 'with' | 'without') => {
    setNewQuoterCoparticipation(value);
    setNewQuoterStep('products');
  };

  const handleConfirmNewQuoterProduct = () => {
    if (newQuoterSelectedProductIds.length === 0) return;
    setSelectedProducts((prev) => {
      const merged = new Set(prev);
      newQuoterSelectedProductIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
    closeNewQuoterFlow();
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((item) => item !== productId) : [...prev, productId],
    );
  };

  const handleRemoveSelectedProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item !== productId));
  };

  const buildQuotePayload = () => {
    const agesPayload = Object.entries(ages).reduce<Record<string, number>>((acc, [key, value]) => {
      if (value > 0) acc[key] = value;
      return acc;
    }, {});

    const payload: Record<string, any> = {
      stateId: selectedStateId,
      cityId: selectedCityId,
      leadId: leadId || undefined,
      contactId: contactId || undefined,
      client: clientName || undefined,
      clientType: clientType === 'physical' ? 0 : 1,
      coparticipation,
      plans: selectedPlanIds,
      products: selectedProducts.map((id) => ({ id, type: 'regular' })),
      ages: agesPayload,
      minPrice: budgetMinValue,
      maxPrice: budgetMaxValue,
    };

    if (clientType === 'physical') {
      const selectedList = frameworkType === 'profession' ? selectedProfessions : selectedAssociations;
      payload.withoutEntity = selectedList.length === 0;
      if (!payload.withoutEntity) {
        payload.entityType = frameworkType === 'profession' ? 0 : 1;
        if (frameworkType === 'profession') payload.professions = selectedProfessions;
        if (frameworkType === 'entity') payload.associations = selectedAssociations;
      }
    } else {
      if (selectedLpt) payload.lptId = selectedLpt;
    }

    return payload;
  };

  const handleCreateQuote = async () => {
    if (!hasSelectedProducts) {
      setCreateQuoteError(
        isEditMode
          ? 'Selecione pelo menos um produto para atualizar a cotação.'
          : 'Selecione pelo menos um produto para criar a cotação.',
      );
      return;
    }
    if (!selectedCityId || !selectedStateId) {
      setCreateQuoteError('Selecione a localização para continuar.');
      return;
    }

    setCreateQuoteError(null);
    setIsCreatingQuote(true);
    try {
      const payload = buildQuotePayload();
      if (isEditMode && editingQuoteId) {
        const response = await api.put(`/quotes/${editingQuoteId}`, payload);
        const updatedId =
          response.data?.quote?.id || response.data?.data?.id || response.data?.id || editingQuoteId;
        router.push({ pathname: '/quote-profile', params: { id: updatedId } });
      } else {
        const response = await api.post('/quotes', payload);
        const createdId =
          response.data?.quote?.id || response.data?.data?.id || response.data?.id || null;
        if (createdId) {
          router.push({ pathname: '/quote-profile', params: { id: createdId } });
        } else {
          router.push('/quotes');
        }
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      setCreateQuoteError(
        apiMessage ||
          (isEditMode
            ? 'Não foi possível atualizar a cotação. Tente novamente.'
            : 'Não foi possível criar a cotação. Tente novamente.'),
      );
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const scrollProducts = (tableId: string, direction: 'left' | 'right') => {
    const ref = productScrollRefs.current[tableId];
    if (!ref) return;
    const currentX = productScrollOffsets.current[tableId] || 0;
    const nextX = direction === 'left' ? Math.max(0, currentX - 220) : currentX + 220;
    ref.scrollTo({ x: nextX, animated: true });
  };

  const mergeCrmItems = (items: CrmItem[]) => {
    const map = new Map<string, CrmItem>();
    items.forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  const fetchLeadsList = async (page = 1, search = '') => {
    if (isLoadingLeads) return;
    try {
      setIsLoadingLeads(true);
      const response = await api.get('/leads', {
        params: {
          page,
          pageSize: 20,
          search: search ? search : undefined,
          active: true,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });

      const data = response.data?.data || [];
      const meta = response.data || {};
      setLeads((prev) => mergeCrmItems(page === 1 ? data : [...prev, ...data]));
      setLeadPage(page);
      setHasMoreLeads(Boolean(meta?.currentPage < meta?.totalPages));
    } catch {
      setHasMoreLeads(false);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const fetchContactsList = async (page = 1, search = '') => {
    if (isLoadingContacts) return;
    try {
      setIsLoadingContacts(true);
      const response = await api.get('/crm/contacts', {
        params: {
          page,
          pageSize: 20,
          search: search ? search : undefined,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });

      const data = response.data?.data || [];
      const meta = response.data || {};
      setContacts((prev) => mergeCrmItems(page === 1 ? data : [...prev, ...data]));
      setContactPage(page);
      setHasMoreContacts(Boolean(meta?.currentPage < meta?.totalPages));
    } catch {
      setHasMoreContacts(false);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const openCrmModal = () => {
    setIsCrmModalOpen(true);
    if (!leads.length) fetchLeadsList(1, '');
    if (!contacts.length) fetchContactsList(1, '');
  };

  const closeCrmModal = () => {
    setIsCrmModalOpen(false);
    setActiveCrmPicker(null);
  };

  const openCrmPicker = (type: 'lead' | 'contact') => {
    setActiveCrmPicker(type);
    if (type === 'lead') {
      setLeadSearch('');
      fetchLeadsList(1, '');
    }
    if (type === 'contact') {
      setContactSearch('');
      fetchContactsList(1, '');
    }
  };

  const closeCrmPicker = () => setActiveCrmPicker(null);

  const handleSelectLead = (lead: CrmItem) => {
    setSelectedLead(lead);
    setSelectedContact(null);
    setLeadId(lead.id);
    setContactId(null);
    setClientName(lead.name);
    closeCrmPicker();
  };

  const handleSelectContact = (contact: CrmItem) => {
    setSelectedContact(contact);
    setSelectedLead(null);
    setContactId(contact.id);
    setLeadId(null);
    setClientName(contact.name);
    closeCrmPicker();
  };

  const handleConcludeEdit = () => {
    const errors: { location?: string; lpt?: string } = {};

    if (!selectedCityId || !selectedStateId) {
      errors.location = 'Selecione uma localização.';
    }

    if (clientType === 'legal' && !selectedLpt) {
      errors.lpt = 'Selecione o tipo de CNPJ.';
    }

    if (totalLives === 0) {
      setLivesError('Informe pelo menos uma vida.');
    } else {
      setLivesError(null);
    }

    setProfileErrors(Object.keys(errors).length ? errors : null);

    if (Object.keys(errors).length || totalLives === 0) {
      if (Object.keys(errors).length) {
        setEditSectionOpen('profile');
      } else {
        setEditSectionOpen('lives');
      }
      return;
    }

    setIsEditProfileOpen(false);
    setIsEditingAges(false);
    fetchPlanSummaries(isEditMode);
  };

  const handleEditProfile = () => {
    setIsEditProfileOpen(true);
    setEditSectionOpen('profile');
  };

  const handleOpenConverter = () => {
    setIsConverterOpen(true);
  };

  const handleCloseConverter = () => {
    setIsConverterOpen(false);
    setConverterError('');
    setDobInput('');
    setValidDates([]);
    setInvalidDates([]);
  };

  const handleApplyConverter = () => {
    if (!dobInput.trim()) {
      setConverterError('Informe ao menos uma data no formato dd/mm/aaaa.');
      return;
    }

    if (invalidDates.length > 0) {
      const plural = invalidDates.length > 1;
      setConverterError(
        `Existe${plural ? 'm' : ''} data${plural ? 's' : ''} inválida${
          plural ? 's' : ''
        }. Verifique o formato (dd/mm/aaaa).`,
      );
      return;
    }

    if (validDates.length === 0) {
      setConverterError('Nenhuma data válida foi encontrada.');
      return;
    }

    const nextAges: AgeRangeMap = AGE_RANGES.reduce(
      (acc, range) => ({ ...acc, [range.key]: 0 }),
      {} as AgeRangeMap,
    );

    validDates.forEach((value) => {
      const parsed = parseDateString(value);
      if (!parsed) return;
      const age = getAgeFromDate(parsed);
      const range = AGE_RANGES.find((item) => item.max !== undefined && age <= item.max);
      if (!range) {
        nextAges.lives59upper += 1;
        return;
      }
      nextAges[range.key] += 1;
    });

    setAges(nextAges);
    handleCloseConverter();
  };

  const handleContinue = () => {
    setIsEditProfileOpen(true);
    setEditSectionOpen('profile');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/quotes')}>
              <ArrowLeftIcon size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>{isEditMode ? 'Editar Cotação' : 'Criar Cotação'}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.typeTabs}>
            <TouchableOpacity
              style={[styles.typeTab, quoteType === 'health' && styles.typeTabActive]}
              onPress={() => setQuoteType('health')}
            >
              <HugeiconsIcon
                icon={Stethoscope02Icon}
                size={16}
                color={quoteType === 'health' ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.typeTabText, quoteType === 'health' && styles.typeTabTextActive]}>
                Saúde
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeTab, quoteType === 'dental' && styles.typeTabActive]}
              onPress={() => setQuoteType('dental')}
            >
              <HugeiconsIcon
                icon={DentalToothIcon}
                size={16}
                color={quoteType === 'dental' ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.typeTabText, quoteType === 'dental' && styles.typeTabTextActive]}>
                Dental
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} color={theme.colors.primary} />
            <Text style={styles.editProfileText}>Editar Perfil da Cotação</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          {!showPlanResults && (
            <>
              <Text style={styles.sectionTitle}>Informe as vidas</Text>
              <View style={styles.agesCard}>
                <View style={styles.agesGrid}>
                  {ageGroups.map((group) => {
                    const value = ages[group.key] || 0;
                    const disableMinus = value <= 0;
                    const disablePlus = value >= MAX_LIVES;

                    return (
                      <View key={group.key} style={styles.ageItem}>
                        <Text style={styles.ageLabel}>{group.label}</Text>
                        <View style={styles.counterRow}>
                          <TouchableOpacity
                            style={[styles.counterButton, disableMinus && styles.counterButtonDisabled]}
                            disabled={disableMinus}
                            onPress={() => updateAge(group.key, -1)}
                          >
                            <HugeiconsIcon
                              icon={Remove01Icon}
                              size={16}
                              color={disableMinus ? theme.colors.textSecondary : theme.colors.primary}
                            />
                          </TouchableOpacity>
                          <Text style={styles.counterValue}>{value}</Text>
                          <TouchableOpacity
                            style={[styles.counterButton, disablePlus && styles.counterButtonDisabled]}
                            disabled={disablePlus}
                            onPress={() => updateAge(group.key, 1)}
                          >
                            <HugeiconsIcon
                              icon={Add01Icon}
                              size={16}
                              color={disablePlus ? theme.colors.textSecondary : theme.colors.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {shouldShowAgeWarning && (
                <View style={styles.warningCard}>
                  <View style={styles.warningHeader}>
                    <HugeiconsIcon icon={Alert01Icon} size={18} color="#FACC15" />
                    <Text style={styles.warningTitle}>Atenção!</Text>
                  </View>
                  <Text style={styles.warningText}>
                    A faixa etária {ages.lives0to18 ? '0-18' : ''}{' '}
                    {ages.lives59upper ? '59+' : ''} informada pode sofrer variações de preço em
                    determinadas Operadoras. Recomendamos que seja feita uma consulta junto a operadora
                    para garantir a autenticidade dos valores informados.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.continueButton, totalLives === 0 && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={totalLives === 0}
              >
                <Text style={styles.continueButtonText}>Continuar</Text>
                <ArrowRightIcon size={18} color={theme.colors.textOnPrimary} />
              </TouchableOpacity>

              <View style={styles.converterCard}>
                <View style={styles.converterTextBlock}>
                  <Text style={styles.converterTitle}>Conversor</Text>
                  <Text style={styles.converterSubtitle}>
                    Transforme datas de nascimento em faixas etárias
                  </Text>
                </View>
                <TouchableOpacity style={styles.converterButton} onPress={handleOpenConverter}>
                  <Text style={styles.converterButtonText}>Converter</Text>
                  <ArrowRightIcon size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {showPlanResults && (
            <View style={styles.planResults}>
              {isLoadingPlans && (
                <View style={styles.planLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.planLoadingText}>Carregando planos...</Text>
                </View>
              )}

              {plansError && <Text style={styles.planErrorText}>{plansError}</Text>}

              {!isLoadingPlans && !plansError && planSummaries.length === 0 && (
                <Text style={styles.planEmptyText}>Nenhum plano encontrado.</Text>
              )}

              {planSummaries.map((plan) => {
                const isExpanded = !isNewQuoter && expandedPlanId === plan.id;
                const planDetails = planDetailsMap[plan.id];

                return (
                  <View key={plan.id} style={styles.planCard}>
                    <TouchableOpacity
                      style={styles.planHeader}
                      onPress={() =>
                        isNewQuoter ? openNewQuoterPlan(plan.id) : handleTogglePlan(plan.id)
                      }
                    >
                      <View style={styles.planAvatarStack}>
                        <View style={styles.planAvatar}>
                          {plan.image ? (
                            <Image source={{ uri: plan.image }} style={styles.planAvatarImage} />
                          ) : (
                            <Text style={styles.planAvatarFallback}>{plan.name.charAt(0)}</Text>
                          )}
                        </View>
                        {plan.managerImage ? (
                          <View style={styles.planAvatarSecondary}>
                            <Image source={{ uri: plan.managerImage }} style={styles.planAvatarImage} />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planSubtitle}>{plan.managerName || 'Operadora'}</Text>
                      </View>
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {selectedProductsByPlan[plan.id]?.length ? (
                      <View style={styles.selectedProductsBlock}>
                        <Text style={styles.selectedProductsLabel}>
                          {selectedProductsByPlan[plan.id].length} Selecionado
                          {selectedProductsByPlan[plan.id].length > 1 ? 's' : ''}:
                        </Text>
                        {selectedProductsByPlan[plan.id].map(({ product, total }) => (
                          <View key={product.id} style={styles.selectedProductRow}>
                            <View style={styles.selectedProductInfo}>
                              <Text style={styles.selectedProductName} numberOfLines={1}>
                                {product.name}
                              </Text>
                              <Text style={styles.selectedProductPrice}>
                                {formatCurrency(total)}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.selectedProductRemove}
                              onPress={() => handleRemoveSelectedProduct(product.id)}
                            >
                              <Text style={styles.selectedProductRemoveText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {isExpanded && (
                      <View style={styles.planExpanded}>
                        {isLoadingPlanDetails && !planDetails && (
                          <View style={styles.planLoadingInline}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.planLoadingText}>Carregando detalhes...</Text>
                          </View>
                        )}

                        {planDetails?.tables?.map((table) => (
                          <View key={table.id} style={styles.tableSection}>
                            <View style={styles.tableHeaderRow}>
                              <Text style={styles.tableTitle} numberOfLines={1} ellipsizeMode="tail">
                                {table.name}
                              </Text>
                              <View style={styles.tableArrows}>
                                <TouchableOpacity
                                  style={styles.tableArrowButton}
                                  onPress={() => scrollProducts(table.id, 'left')}
                                >
                                  <ArrowLeftIcon size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.tableArrowButton}
                                  onPress={() => scrollProducts(table.id, 'right')}
                                >
                                  <ArrowRightIcon size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              ref={(ref) => {
                                productScrollRefs.current[table.id] = ref;
                              }}
                              onScroll={(event) => {
                                productScrollOffsets.current[table.id] =
                                  event.nativeEvent.contentOffset.x;
                              }}
                              scrollEventThrottle={16}
                            >
                              <View style={styles.productRow}>
                                {table.products.map((product) => {
                                  const isSelected = selectedProducts.includes(product.id);
                                  const total = calculateTotalProductPriceByLivesGroup({
                                    product,
                                    totalLives,
                                    lives:
                                      quoteType === 'dental'
                                        ? { '018': totalLives }
                                        : {
                                            '018': ages.lives0to18 || 0,
                                            '1923': ages.lives19to23 || 0,
                                            '2428': ages.lives24to28 || 0,
                                            '2933': ages.lives29to33 || 0,
                                            '3438': ages.lives34to38 || 0,
                                            '3943': ages.lives39to43 || 0,
                                            '4448': ages.lives44to48 || 0,
                                            '4953': ages.lives49to53 || 0,
                                            '5458': ages.lives54to58 || 0,
                                            '59': ages.lives59upper || 0,
                                          },
                                  });

                                  return (
                                    <View key={product.id} style={styles.productCard}>
                                      <View style={styles.productHeader}>
                                        <View
                                          style={[
                                            styles.productRadio,
                                            isSelected && styles.productRadioActive,
                                          ]}
                                        />
                                        <Text style={styles.productName}>{product.name}</Text>
                                      </View>
                                      <View style={styles.productMetaRow}>
                                        <Text style={styles.productMetaText}>
                                          {product.accommodation?.name || 'Enfermaria'}
                                        </Text>
                                      </View>
                                      <View style={styles.productMetaRow}>
                                        <Text style={styles.productMetaText}>
                                          {getCoparticipationLabel(product.includesCoparticipation)}
                                        </Text>
                                      </View>
                                      <View style={styles.productMetaRow}>
                                        <Text style={styles.productMetaText}>
                                          {product.segment?.name || product.coverage?.name || 'Segmento'}
                                        </Text>
                                      </View>
                                      <Text style={styles.productPrice}>{formatCurrency(total)}</Text>
                                      <TouchableOpacity
                                        style={[
                                          styles.selectProductButton,
                                          isSelected && styles.selectProductButtonActive,
                                        ]}
                                        onPress={() => handleToggleProduct(product.id)}
                                      >
                                        <Text
                                          style={[
                                            styles.selectProductText,
                                            isSelected && styles.selectProductTextActive,
                                          ]}
                                        >
                                          {isSelected ? 'Selecionado' : 'Selecionar'}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  );
                                })}
                              </View>
                            </ScrollView>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

            </View>
          )}
        </ScrollView>

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

        {isNewQuoter && hasSelectedProducts && (
          <View style={styles.createQuoteFloating}>
            {createQuoteError && <Text style={styles.createQuoteError}>{createQuoteError}</Text>}
            <TouchableOpacity
              style={[
                styles.createQuoteButton,
                isCreatingQuote && styles.createQuoteButtonDisabled,
              ]}
              onPress={handleCreateQuote}
              disabled={isCreatingQuote}
            >
              {isCreatingQuote ? (
                <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
              ) : (
                <>
                  <Text style={styles.createQuoteButtonText}>
                    {isEditMode ? 'Atualizar Cotação' : 'Criar Cotação'}
                  </Text>
                  <ArrowRightIcon size={18} color={theme.colors.textOnPrimary} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <Modal transparent visible={isConverterOpen} animationType="fade" onRequestClose={handleCloseConverter}>
        <View style={styles.converterOverlay}>
          <Pressable style={styles.converterBackdrop} onPress={handleCloseConverter} />
          <View style={styles.converterModal}>
            <View style={styles.converterHeader}>
              <Text style={styles.converterHeaderTitle}>Datas para faixas etárias</Text>
              <TouchableOpacity onPress={handleCloseConverter} style={styles.converterCloseButton}>
                <Text style={styles.converterCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.converterHint}>
              Informe datas no formato dd/mm/aaaa separadas por vírgula, espaço ou quebra de linha.
            </Text>
            <TextInput
              style={styles.converterInput}
              placeholder="Ex.: 20/06/1977, 01/12/1990"
              placeholderTextColor={theme.colors.textSecondary}
              value={dobInput}
              onChangeText={(value) => {
                setDobInput(value);
                setConverterError('');
              }}
              multiline
              textAlignVertical="top"
            />

            {converterError ? <Text style={styles.converterError}>{converterError}</Text> : null}

            {validDates.length > 0 && (
              <View style={styles.converterList}>
                <Text style={styles.converterListTitle}>Datas válidas ({validDates.length})</Text>
                <View style={styles.converterChips}>
                  {validDates.map((date) => (
                    <View key={`valid-${date}`} style={styles.converterChip}>
                      <Text style={styles.converterChipText}>{date}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {invalidDates.length > 0 && (
              <View style={styles.converterList}>
                <Text style={styles.converterListTitle}>Datas inválidas ({invalidDates.length})</Text>
                <View style={styles.converterChips}>
                  {invalidDates.map((date, index) => (
                    <View key={`invalid-${date}-${index}`} style={styles.converterChipInvalid}>
                      <Text style={styles.converterChipText}>{date}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.converterConfirmButton} onPress={handleApplyConverter}>
              <Text style={styles.converterConfirmText}>Confirmar</Text>
              <ArrowRightIcon size={18} color={theme.colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isEditProfileOpen} animationType="slide" onRequestClose={() => setIsEditProfileOpen(false)}>
        <View style={styles.editOverlay}>
          <Pressable style={styles.editBackdrop} onPress={() => setIsEditProfileOpen(false)} />
          <View style={styles.editSheet}>
            <View style={styles.editHandle} />
            <View style={styles.editHeader}>
              <View style={styles.editHeaderIcon}>
                <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.editHeaderText}>
                <Text style={styles.editTitle}>Editando Perfil</Text>
                <Text style={styles.editSubtitle}>Ajuste as configurações da cotação</Text>
              </View>
              <TouchableOpacity
                style={styles.editClose}
                onPress={() => setIsEditProfileOpen(false)}
              >
                <Text style={styles.editCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
              <TouchableOpacity
                style={styles.editSectionHeader}
                onPress={() =>
                  setEditSectionOpen((prev) => (prev === 'profile' ? null : 'profile'))
                }
              >
                <View style={styles.editSectionIcon}>
                  <HugeiconsIcon icon={UserIcon} size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.editSectionInfo}>
                  <Text style={styles.editSectionTitle}>Perfil e Local</Text>
                  <Text style={styles.editSectionSubtitle}>Cliente e região</Text>
                </View>
                <HugeiconsIcon
                  icon={editSectionOpen === 'profile' ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {editSectionOpen === 'profile' && (
                <View style={styles.editSectionBody}>
                  <View style={styles.segmentedRow}>
                    <TouchableOpacity
                      style={[
                        styles.segmentedButton,
                        clientType === 'physical' && styles.segmentedButtonActive,
                      ]}
                      onPress={() => handleClientTypeChange('physical')}
                    >
                      <View style={styles.segmentedContent}>
                        <Text
                          style={[
                            styles.segmentedText,
                            clientType === 'physical' && styles.segmentedTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          Pessoa Física
                        </Text>
                        <View
                          style={[
                            styles.segmentedRadio,
                            clientType === 'physical' && styles.segmentedRadioActive,
                          ]}
                        >
                          {clientType === 'physical' && <View style={styles.segmentedRadioDot} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentedButton,
                        clientType === 'legal' && styles.segmentedButtonActive,
                      ]}
                      onPress={() => handleClientTypeChange('legal')}
                    >
                      <View style={styles.segmentedContent}>
                        <Text
                          style={[
                            styles.segmentedText,
                            clientType === 'legal' && styles.segmentedTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          Pessoa Jurídica
                        </Text>
                        <View
                          style={[
                            styles.segmentedRadio,
                            clientType === 'legal' && styles.segmentedRadioActive,
                          ]}
                        >
                          {clientType === 'legal' && <View style={styles.segmentedRadioDot} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {isLoadingCatalogs && (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.inlineLoadingText}>Carregando opções...</Text>
                    </View>
                  )}
                  {catalogError && <Text style={styles.fieldErrorText}>{catalogError}</Text>}

                  <View style={styles.labelRow}>
                    <Text style={styles.editLabel}>Informações do Cliente</Text>
                    <TouchableOpacity style={styles.crmLink} onPress={openCrmModal}>
                      <HugeiconsIcon icon={UserCircle02Icon} size={14} color={theme.colors.primary} />
                      <Text style={styles.crmLinkText}>Vincular CRM</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIcon}>
                      <HugeiconsIcon icon={UserIcon} size={16} color={theme.colors.textSecondary} />
                    </View>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Nome do cliente"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={clientName}
                      onChangeText={setClientName}
                    />
                  </View>

                  <Text style={styles.editLabel}>Localização</Text>
                  <TouchableOpacity style={styles.selectRow} onPress={openLocationModal}>
                    <View style={styles.selectLeft}>
                      <HugeiconsIcon icon={Location06Icon} size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.selectText}>{locationLabel}</Text>
                    </View>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  {profileErrors?.location && (
                    <Text style={styles.fieldErrorText}>{profileErrors.location}</Text>
                  )}

                  {clientType === 'physical' ? (
                    <>
                      <Text style={styles.editLabel}>Enquadramento</Text>
                      <View style={styles.segmentedRow}>
                        <TouchableOpacity
                          style={[
                            styles.segmentedButton,
                            frameworkType === 'profession' && styles.segmentedButtonActive,
                          ]}
                          onPress={() => handleFrameworkTypeChange('profession')}
                        >
                          <View style={styles.segmentedContent}>
                            <Text
                              style={[
                                styles.segmentedText,
                                frameworkType === 'profession' && styles.segmentedTextActive,
                              ]}
                            >
                              Profissão
                            </Text>
                            <View
                              style={[
                                styles.segmentedRadio,
                                frameworkType === 'profession' && styles.segmentedRadioActive,
                              ]}
                            >
                              {frameworkType === 'profession' && (
                                <View style={styles.segmentedRadioDot} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentedButton,
                            frameworkType === 'entity' && styles.segmentedButtonActive,
                          ]}
                          onPress={() => handleFrameworkTypeChange('entity')}
                        >
                          <View style={styles.segmentedContent}>
                            <Text
                              style={[
                                styles.segmentedText,
                                frameworkType === 'entity' && styles.segmentedTextActive,
                              ]}
                            >
                              Entidade
                            </Text>
                            <View
                              style={[
                                styles.segmentedRadio,
                                frameworkType === 'entity' && styles.segmentedRadioActive,
                              ]}
                            >
                              {frameworkType === 'entity' && (
                                <View style={styles.segmentedRadioDot} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.selectRow}
                        onPress={() =>
                          openPicker(frameworkType === 'profession' ? 'profession' : 'association')
                        }
                      >
                        <View style={styles.selectLeft}>
                          <HugeiconsIcon icon={Search01Icon} size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.selectText}>{selectedEntityLabel}</Text>
                        </View>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.editLabel}>Tipo de CNPJ</Text>
                      <TouchableOpacity style={styles.selectRow} onPress={() => openPicker('lpt')}>
                        <Text style={styles.selectText}>{selectedLptLabel}</Text>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                      {profileErrors?.lpt && (
                        <Text style={styles.fieldErrorText}>{profileErrors.lpt}</Text>
                      )}
                    </>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.editSectionHeader}
                onPress={() =>
                  setEditSectionOpen((prev) => (prev === 'lives' ? null : 'lives'))
                }
              >
                <View style={styles.editSectionIcon}>
                  <HugeiconsIcon icon={CalculatorIcon} size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.editSectionInfo}>
                  <Text style={styles.editSectionTitle}>Vidas e Valores</Text>
                  <Text style={styles.editSectionSubtitle}>Idades e orçamento</Text>
                </View>
                <HugeiconsIcon
                  icon={editSectionOpen === 'lives' ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {editSectionOpen === 'lives' && (
                <View style={styles.editSectionBody}>
                  <View style={styles.ageSummaryHeader}>
                    <Text style={styles.editLabel}>Faixas Etárias</Text>
                    <TouchableOpacity
                      style={styles.editInlineButton}
                      onPress={() => setIsEditingAges((prev) => !prev)}
                    >
                      <Text style={styles.editInlineButtonText}>
                        {isEditingAges ? 'Concluir' : 'Editar'}
                      </Text>
                      <HugeiconsIcon icon={Edit02Icon} size={12} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {isEditingAges ? (
                    <View style={styles.modalAgeGrid}>
                      {ageGroups.map((group) => {
                        const value = ages[group.key] || 0;
                        const disableMinus = value <= 0;
                        const disablePlus = value >= MAX_LIVES;
                        return (
                          <View key={group.key} style={styles.modalAgeItem}>
                            <Text style={styles.modalAgeLabel}>{group.label}</Text>
                            <View style={styles.counterRow}>
                              <TouchableOpacity
                                style={[styles.counterButton, disableMinus && styles.counterButtonDisabled]}
                                disabled={disableMinus}
                                onPress={() => updateAge(group.key, -1)}
                              >
                                <HugeiconsIcon
                                  icon={Remove01Icon}
                                  size={14}
                                  color={disableMinus ? theme.colors.textSecondary : theme.colors.primary}
                                />
                              </TouchableOpacity>
                              <Text style={styles.counterValue}>{value}</Text>
                              <TouchableOpacity
                                style={[styles.counterButton, disablePlus && styles.counterButtonDisabled]}
                                disabled={disablePlus}
                                onPress={() => updateAge(group.key, 1)}
                              >
                                <HugeiconsIcon
                                  icon={Add01Icon}
                                  size={14}
                                  color={disablePlus ? theme.colors.textSecondary : theme.colors.primary}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.ageChips}>
                      {ageSummary.length > 0 ? (
                        ageSummary.map((item) => (
                          <View key={item.key} style={styles.ageChip}>
                            <Text style={styles.ageChipText}>
                              {item.label}: {item.value}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.mutedText}>Nenhuma vida informada.</Text>
                      )}
                    </View>
                  )}
                  {livesError && <Text style={styles.fieldErrorText}>{livesError}</Text>}

                  <Text style={styles.editLabel}>Orçamento total</Text>
                  <View style={styles.sliderTrack} onLayout={handleSliderLayout}>
                    <View style={[styles.sliderFill, { left: fillLeft, width: fillWidth }]} />
                    <View
                      style={[
                        styles.sliderHandle,
                        { left: minHandlePos - HANDLE_SIZE / 2 },
                      ]}
                      {...minPanResponder.panHandlers}
                    />
                    <View
                      style={[
                        styles.sliderHandle,
                        { left: maxHandlePos - HANDLE_SIZE / 2 },
                      ]}
                      {...maxPanResponder.panHandlers}
                    />
                  </View>
                  {!isEditingBudget ? (
                    <View style={styles.budgetSummaryRow}>
                    <View style={styles.budgetSummaryBox}>
                      <Text style={styles.budgetLabel}>Mínimo</Text>
                      <Text style={styles.budgetSummaryValue}>
                          {formatCurrency(minBudgetValue)}
                      </Text>
                    </View>
                      <TouchableOpacity
                        style={styles.budgetEditButton}
                        onPress={() => {
                          setBudgetMinInput(String(minBudgetValue));
                          setBudgetMaxInput(String(maxBudgetValue));
                          setIsEditingBudget(true);
                        }}
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    <View style={styles.budgetSummaryBox}>
                      <Text style={styles.budgetLabel}>Máximo</Text>
                      <Text style={styles.budgetSummaryValue}>
                          {formatCurrency(maxBudgetValue)}
                      </Text>
                    </View>
                    </View>
                  ) : (
                    <View style={styles.budgetRow}>
                      <View style={styles.budgetBox}>
                        <Text style={styles.budgetLabel}>Mínimo</Text>
                        <TextInput
                          style={styles.budgetInput}
                          value={budgetMinInput}
                          onChangeText={(value) => handleBudgetInputChange('min', value)}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.budgetBox}>
                        <Text style={styles.budgetLabel}>Máximo</Text>
                        <TextInput
                          style={styles.budgetInput}
                          value={budgetMaxInput}
                          onChangeText={(value) => handleBudgetInputChange('max', value)}
                          keyboardType="numeric"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.budgetDoneButton}
                        onPress={commitBudgetInputs}
                      >
                        <Text style={styles.budgetDoneText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.editSectionHeader}
                onPress={() =>
                  setEditSectionOpen((prev) => (prev === 'filters' ? null : 'filters'))
                }
              >
                <View style={styles.editSectionIcon}>
                  <HugeiconsIcon icon={FilterEditIcon} size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.editSectionInfo}>
                  <Text style={styles.editSectionTitle}>Filtros Avançados</Text>
                  <Text style={styles.editSectionSubtitle}>Coparticipação, acomodação e mais</Text>
                </View>
                <HugeiconsIcon
                  icon={editSectionOpen === 'filters' ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {editSectionOpen === 'filters' && (
                <View style={styles.editSectionBody}>
                  <View style={styles.filterGroup}>
                    <Text style={styles.editLabel}>Coparticipação</Text>
                    <TouchableOpacity
                      style={styles.selectRow}
                      onPress={() => openPicker('coparticipation')}
                    >
                      <Text style={styles.selectText}>{coparticipationLabel}</Text>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterGroup}>
                    <Text style={styles.editLabel}>Acomodação</Text>
                    <TouchableOpacity
                      style={styles.selectRow}
                      onPress={() => openPicker('accommodation')}
                    >
                      <Text style={styles.selectText}>{accommodationLabel}</Text>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {clientType !== 'legal' && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.editLabel}>Tipo de Plano</Text>
                      <TouchableOpacity
                        style={styles.selectRow}
                        onPress={() => openPicker('planType')}
                      >
                        <Text style={styles.selectText}>{planTypeLabel}</Text>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {clientType === 'legal' && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.editLabel}>Tipo de Contrato</Text>
                      <TouchableOpacity
                        style={styles.selectRow}
                        onPress={() => openPicker('contractType')}
                      >
                        <Text style={styles.selectText}>{contractTypeLabel}</Text>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.filterGroup}>
                    <Text style={styles.editLabel}>Abrangência</Text>
                    <TouchableOpacity
                      style={styles.selectRow}
                      onPress={() => openPicker('coverage')}
                    >
                      <Text style={styles.selectText}>{coverageLabel}</Text>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterGroup}>
                    <Text style={styles.editLabel}>Cobertura</Text>
                    <TouchableOpacity
                      style={styles.selectRow}
                      onPress={() => openPicker('segment')}
                    >
                      <Text style={styles.selectText}>{segmentLabel}</Text>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterGroup}>
                    <Text style={styles.editLabel}>Reembolso</Text>
                    <TouchableOpacity style={styles.selectRow} onPress={() => openPicker('refund')}>
                      <Text style={styles.selectText}>{refundLabel}</Text>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.editLabel}>Rede Credenciada</Text>
                  <TouchableOpacity
                    style={[styles.selectRow, !selectedStateId && styles.selectRowDisabled]}
                    onPress={() => openPicker('refnet')}
                    disabled={!selectedStateId}
                  >
                    <Text style={styles.selectText}>
                      {selectedStateId ? refnetLabel : 'Selecione um estado primeiro'}
                    </Text>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.concludeButton} onPress={handleConcludeEdit}>
                <Text style={styles.concludeButtonText}>Concluir Edição</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isLocationModalOpen} animationType="slide" onRequestClose={closeLocationModal}>
        <View style={styles.locationModalOverlay}>
          <Pressable style={styles.locationModalBackdrop} onPress={closeLocationModal} />
          <View style={styles.locationModalCard}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Selecionar localidade</Text>
              <TouchableOpacity onPress={closeLocationModal} style={styles.locationModalClose}>
                <Text style={styles.locationModalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationSearchWrapper}>
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Pesquise por cidade ou estado"
                placeholderTextColor={theme.colors.textSecondary}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoCapitalize="words"
              />
            </View>

            {isLoadingLocations && locations.length === 0 ? (
              <View style={styles.locationLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.locationLoadingText}>Buscando localidades...</Text>
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => `${item.cityId}-${item.stateId}`}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.locationList}
                onEndReached={handleLoadMoreLocations}
                onEndReachedThreshold={0.2}
                ListEmptyComponent={
                  <Text style={styles.locationEmptyText}>Nenhuma localidade encontrada.</Text>
                }
                ListFooterComponent={
                  isLoadingLocations ? (
                    <View style={styles.locationFooterLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                  ) : null
                }
                renderItem={({ item }) => {
                  const isSelected = item.cityId === selectedCityId && item.stateId === selectedStateId;
                  return (
                    <TouchableOpacity
                      style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                      onPress={() => handleSelectLocation(item)}
                    >
                      <Text
                        style={[styles.locationItemLabel, isSelected && styles.locationItemLabelSelected]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.locationItemBadge}>Selecionado</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isCrmModalOpen} animationType="slide" onRequestClose={closeCrmModal}>
        <View style={styles.crmOverlay}>
          <Pressable style={styles.crmBackdrop} onPress={closeCrmModal} />
          <View style={styles.crmCard}>
            <View style={styles.crmHeader}>
              <Text style={styles.crmTitle}>Vincular Cotação</Text>
              <TouchableOpacity style={styles.crmClose} onPress={closeCrmModal}>
                <Text style={styles.crmCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.crmSubtitle}>
              Associe esta cotação a um lead ou contato do CRM.
            </Text>

            <Text style={styles.crmSectionLabel}>Vincular Lead</Text>
            <TouchableOpacity style={styles.selectRow} onPress={() => openCrmPicker('lead')}>
              <View style={styles.selectLeft}>
                <HugeiconsIcon icon={UserIcon} size={16} color={theme.colors.textSecondary} />
                <Text style={styles.selectText}>
                  {selectedLead ? selectedLead.name : 'Selecione um lead...'}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.crmDivider}>
              <View style={styles.crmDividerLine} />
              <Text style={styles.crmDividerText}>OU</Text>
              <View style={styles.crmDividerLine} />
            </View>

            <Text style={styles.crmSectionLabel}>Vincular Contato</Text>
            <TouchableOpacity style={styles.selectRow} onPress={() => openCrmPicker('contact')}>
              <View style={styles.selectLeft}>
                <HugeiconsIcon icon={UserIcon} size={16} color={theme.colors.textSecondary} />
                <Text style={styles.selectText}>
                  {selectedContact ? selectedContact.name : 'Selecione um contato...'}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {activeCrmPicker && (
        <Modal transparent visible animationType="slide" onRequestClose={closeCrmPicker}>
          <View style={styles.crmPickerOverlay}>
            <Pressable style={styles.crmPickerBackdrop} onPress={closeCrmPicker} />
            <View style={styles.crmPickerCard}>
              <View style={styles.crmPickerHeader}>
                <Text style={styles.crmPickerTitle}>
                  {activeCrmPicker === 'lead' ? 'Selecionar Lead' : 'Selecionar Contato'}
                </Text>
                <TouchableOpacity style={styles.crmPickerClose} onPress={closeCrmPicker}>
                  <Text style={styles.crmPickerCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.crmPickerSearch}
                placeholder={
                  activeCrmPicker === 'lead' ? 'Buscar lead...' : 'Buscar contato...'
                }
                placeholderTextColor={theme.colors.textSecondary}
                value={activeCrmPicker === 'lead' ? leadSearch : contactSearch}
                onChangeText={(value) =>
                  activeCrmPicker === 'lead' ? setLeadSearch(value) : setContactSearch(value)
                }
              />

              <FlatList
                data={activeCrmPicker === 'lead' ? leads : contacts}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.crmPickerList}
                onEndReached={() => {
                  if (activeCrmPicker === 'lead' && hasMoreLeads && !isLoadingLeads) {
                    fetchLeadsList(leadPage + 1, leadSearch);
                  }
                  if (activeCrmPicker === 'contact' && hasMoreContacts && !isLoadingContacts) {
                    fetchContactsList(contactPage + 1, contactSearch);
                  }
                }}
                onEndReachedThreshold={0.2}
                ListEmptyComponent={
                  (activeCrmPicker === 'lead' ? isLoadingLeads : isLoadingContacts) ? null : (
                    <Text style={styles.crmPickerEmpty}>
                      Nenhum {activeCrmPicker === 'lead' ? 'lead' : 'contato'} encontrado.
                    </Text>
                  )
                }
                ListFooterComponent={
                  (activeCrmPicker === 'lead' ? isLoadingLeads : isLoadingContacts) ? (
                    <View style={styles.crmPickerLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                  ) : null
                }
                renderItem={({ item }) => {
                  const isSelected =
                    activeCrmPicker === 'lead'
                      ? selectedLead?.id === item.id
                      : selectedContact?.id === item.id;
                  const initials = item.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join('')
                    .toUpperCase();

                  return (
                    <TouchableOpacity
                      style={[styles.crmPickerItem, isSelected && styles.crmPickerItemSelected]}
                      onPress={() =>
                        activeCrmPicker === 'lead' ? handleSelectLead(item) : handleSelectContact(item)
                      }
                    >
                      <View style={styles.crmAvatar}>
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={styles.crmAvatarImage} />
                        ) : (
                          <Text style={styles.crmAvatarText}>{initials}</Text>
                        )}
                      </View>
                      <View style={styles.crmPickerInfo}>
                        <Text style={styles.crmPickerName}>{item.name}</Text>
                        {item.phone && <Text style={styles.crmPickerMeta}>{item.phone}</Text>}
                        {item.email && <Text style={styles.crmPickerMeta}>{item.email}</Text>}
                      </View>
                      {isSelected && <Text style={styles.crmPickerCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {pickerConfig && (
        <Modal transparent visible={!!activePicker} animationType="slide" onRequestClose={closePicker}>
          <View style={styles.pickerOverlay}>
            <Pressable style={styles.pickerBackdrop} onPress={closePicker} />
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{pickerConfig.title}</Text>
                <TouchableOpacity onPress={closePicker} style={styles.pickerClose}>
                  <Text style={styles.pickerCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              {pickerSearchEnabled && (
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Buscar..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                />
              )}

              {pickerConfig.loading ? (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.pickerLoadingText}>Carregando...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredPickerOptions}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.pickerList}
                  ListEmptyComponent={
                    <Text style={styles.pickerEmptyText}>{pickerConfig.emptyText || 'Nada encontrado.'}</Text>
                  }
                  renderItem={({ item }) => {
                    const isSelected = pickerConfig.selected.includes(item.value);
                    return (
                      <TouchableOpacity
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() =>
                          pickerConfig.multi
                            ? handleToggleMultiOption(item.value)
                            : handleSelectSingleOption(item.value)
                        }
                      >
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                          {item.label}
                        </Text>
                        {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {pickerConfig.multi && (
                <View style={styles.pickerFooter}>
                  <TouchableOpacity style={styles.pickerClear} onPress={handleClearMultiSelection}>
                    <Text style={styles.pickerClearText}>Limpar seleção</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerDone} onPress={closePicker}>
                    <Text style={styles.pickerDoneText}>Concluir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {newQuoterStep && (
        <Modal transparent visible animationType="slide" onRequestClose={closeNewQuoterFlow}>
          <View style={styles.newQuoterOverlay}>
            <Pressable style={styles.newQuoterBackdrop} onPress={closeNewQuoterFlow} />
            <View
              style={[
                styles.newQuoterCard,
                newQuoterStep === 'products'
                  ? styles.newQuoterCardTall
                  : styles.newQuoterCardDefault,
              ]}
            >
              <View style={styles.newQuoterHandle} />
              <View style={styles.newQuoterHeader}>
                {newQuoterStep !== 'tables' ? (
                  <TouchableOpacity
                    style={styles.newQuoterBack}
                    onPress={() =>
                      setNewQuoterStep(newQuoterStep === 'products' ? 'coparticipation' : 'tables')
                    }
                  >
                    <ArrowLeftIcon size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.newQuoterBackPlaceholder} />
                )}
                <View style={styles.newQuoterHeaderText}>
                  <Text style={styles.newQuoterHeaderTitle}>
                    {newQuoterStep === 'tables'
                      ? 'Selecione uma opção'
                      : newQuoterStep === 'coparticipation'
                        ? 'Coparticipação'
                        : 'Produtos'}
                  </Text>
                  {newQuoterStep !== 'tables' && (
                    <Text style={styles.newQuoterHeaderSubtitle} numberOfLines={1}>
                      {newQuoterStep === 'coparticipation'
                        ? newQuoterTable?.name || ''
                        : newQuoterTable
                          ? `${newQuoterTable.name} > ${
                              newQuoterCoparticipation === 'with'
                                ? 'Com Coparticipação'
                                : 'Sem Coparticipação'
                            }`
                          : ''}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.newQuoterClose} onPress={closeNewQuoterFlow}>
                  <Text style={styles.newQuoterCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              {newQuoterStep === 'tables' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.newQuoterContent}
                >
                  {isLoadingPlanDetails && !newQuoterPlanDetails ? (
                    <View style={styles.newQuoterLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.newQuoterLoadingText}>Carregando opções...</Text>
                    </View>
                  ) : newQuoterTables.length === 0 ? (
                    <Text style={styles.newQuoterEmptyText}>Nenhuma opção encontrada.</Text>
                  ) : (
                    newQuoterTables.map((table) => (
                      <TouchableOpacity
                        key={table.id}
                        style={styles.newQuoterOptionRow}
                        onPress={() => handleSelectNewQuoterTable(table)}
                      >
                        <Text style={styles.newQuoterOptionText} numberOfLines={1}>
                          {table.name}
                        </Text>
                        <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}

              {newQuoterStep === 'coparticipation' && (
                <View style={styles.newQuoterContent}>
                  <TouchableOpacity
                    style={styles.newQuoterOptionRow}
                    onPress={() => handleSelectNewQuoterCoparticipation('with')}
                  >
                    <Text style={styles.newQuoterOptionText} numberOfLines={1}>
                      Com Coparticipação
                    </Text>
                    <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.newQuoterOptionRow}
                    onPress={() => handleSelectNewQuoterCoparticipation('without')}
                  >
                    <Text style={styles.newQuoterOptionText} numberOfLines={1}>
                      Sem Coparticipação
                    </Text>
                    <ArrowRightIcon size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {newQuoterStep === 'products' && (
                <View style={styles.newQuoterProductsWrapper}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.newQuoterContent}
                  >
                    {isLoadingPlanDetails && newQuoterProducts.length === 0 ? (
                      <View style={styles.newQuoterLoading}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.newQuoterLoadingText}>Carregando produtos...</Text>
                      </View>
                    ) : newQuoterProducts.length === 0 ? (
                      <Text style={styles.newQuoterEmptyText}>Nenhum produto disponível.</Text>
                    ) : (
                      newQuoterProducts.map((product) => {
                        const total = calculateTotalProductPriceByLivesGroup({
                          product,
                          totalLives,
                          lives:
                            quoteType === 'dental'
                              ? { '018': totalLives }
                              : {
                                  '018': ages.lives0to18 || 0,
                                  '1923': ages.lives19to23 || 0,
                                  '2428': ages.lives24to28 || 0,
                                  '2933': ages.lives29to33 || 0,
                                  '3438': ages.lives34to38 || 0,
                                  '3943': ages.lives39to43 || 0,
                                  '4448': ages.lives44to48 || 0,
                                  '4953': ages.lives49to53 || 0,
                                  '5458': ages.lives54to58 || 0,
                                  '59': ages.lives59upper || 0,
                                },
                        });
                        const isSelected = newQuoterSelectedProductIds.includes(product.id);
                        return (
                          <TouchableOpacity
                            key={product.id}
                            style={[
                              styles.newQuoterProductItem,
                              isSelected && styles.newQuoterProductItemActive,
                            ]}
                            onPress={() =>
                              setNewQuoterSelectedProductIds((prev) =>
                                prev.includes(product.id)
                                  ? prev.filter((item) => item !== product.id)
                                  : [...prev, product.id],
                              )
                            }
                          >
                            <View style={styles.newQuoterProductInfo}>
                              <Text style={styles.newQuoterProductName} numberOfLines={1}>
                                {product.name}
                              </Text>
                              <Text style={styles.newQuoterProductMeta}>
                                {product.accommodation?.name || 'Enfermaria'}
                              </Text>
                            </View>
                            <View style={styles.newQuoterProductPriceRow}>
                              <Text style={styles.newQuoterProductPrice}>{formatCurrency(total)}</Text>
                              <View
                                style={[
                                  styles.newQuoterProductRadio,
                                  isSelected && styles.newQuoterProductRadioActive,
                                ]}
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                  <TouchableOpacity
                    style={[
                      styles.newQuoterConfirmButton,
                      newQuoterSelectedProductIds.length === 0 &&
                        styles.newQuoterConfirmButtonDisabled,
                    ]}
                    disabled={newQuoterSelectedProductIds.length === 0}
                    onPress={handleConfirmNewQuoterProduct}
                  >
                    <Text style={styles.newQuoterConfirmText}>Confirmar Seleção</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: insets.bottom + 140,
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
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
    pageTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    headerSpacer: {
      width: 36,
    },
    typeTabs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#EFEFEF',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#D7D7D7' : theme.colors.border,
    },
    typeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    typeTabActive: {
      backgroundColor: theme.colors.background,
    },
    typeTabText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    typeTabTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    editProfileButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    editProfileText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    separator: {
      marginTop: theme.spacing.lg,
      height: 1,
      backgroundColor: themeMode === 'dark' ? '#2B2B2B' : '#E6E6E6',
    },
    sectionTitle: {
      marginTop: theme.spacing.lg,
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    agesCard: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#1D1D1D' : '#F6F6F6',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#DCDCDC' : theme.colors.border,
    },
    agesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    ageItem: {
      width: '48%',
      marginBottom: theme.spacing.md,
    },
    ageLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#DCDCDC' : theme.colors.border,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.background,
    },
    counterButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#222' : '#F0F0F0',
    },
    counterButtonDisabled: {
      opacity: 0.5,
    },
    counterValue: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    warningCard: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: '#FACC15',
      backgroundColor: 'rgba(250,204,21,0.08)',
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    warningTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: '#FACC15',
    },
    warningText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: themeMode === 'dark' ? '#FDE68A' : '#8A6D00',
    },
    continueButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    continueButtonDisabled: {
      opacity: 0.6,
    },
    continueButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    converterCard: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#1D1D1D' : '#F6F6F6',
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#DCDCDC' : theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    converterTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    converterSubtitle: {
      marginTop: 2,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    converterTextBlock: {
      flex: 1,
      paddingRight: theme.spacing.sm,
    },
    converterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      flexShrink: 0,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    converterButtonText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
      paddingTop: theme.spacing.xs,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
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
    converterOverlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    converterBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    },
    converterModal: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    converterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    converterHeaderTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
      paddingRight: theme.spacing.sm,
    },
    converterCloseButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1D1D1D' : '#F0F0F0',
    },
    converterCloseText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    converterHint: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    converterInput: {
      minHeight: 120,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSize.sm,
      backgroundColor: themeMode === 'dark' ? '#141414' : '#FAFAFA',
    },
    converterError: {
      marginTop: theme.spacing.sm,
      color: theme.colors.error || '#EF4444',
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
    },
    converterList: {
      marginTop: theme.spacing.md,
    },
    converterListTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    converterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    converterChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary + '1A',
    },
    converterChipInvalid: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: themeMode === 'dark' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.35)',
    },
    converterChipText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    converterConfirmButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    converterConfirmText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    editOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    editBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    editSheet: {
      backgroundColor: themeMode === 'dark' ? '#121212' : '#FFFFFF',
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      maxHeight: '90%',
      borderTopWidth: 1,
      borderColor: theme.colors.border,
    },
    editHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: themeMode === 'dark' ? '#2B2B2B' : '#E1E1E1',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    editHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    editHeaderIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F2F2F2',
    },
    editHeaderText: {
      flex: 1,
    },
    editTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    editSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    editClose: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F2F2F2',
    },
    editCloseText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    editContent: {
      paddingBottom: theme.spacing.xl,
    },
    editSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F7F7F7',
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    editSectionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '22',
    },
    editSectionInfo: {
      flex: 1,
    },
    editSectionTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    editSectionSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    editSectionBody: {
      paddingHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    segmentedButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F7F7F7',
    },
    segmentedContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    segmentedButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '22',
    },
    segmentedText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      flex: 1,
      textAlign: 'left',
      minWidth: 0,
    },
    segmentedTextActive: {
      color: theme.colors.primary,
    },
    segmentedRadio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    segmentedRadioActive: {
      borderColor: theme.colors.primary,
    },
    segmentedRadioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    editLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    crmLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary + '22',
    },
    crmLinkText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    inputIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    inputField: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
    },
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      marginBottom: theme.spacing.md,
    },
    selectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    selectRowDisabled: {
      opacity: 0.5,
    },
    selectText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      flexShrink: 1,
    },
    ageSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    editInlineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary + '22',
    },
    editInlineButtonText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    ageChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    modalAgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    modalAgeItem: {
      width: '48%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    modalAgeLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    ageChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#F7F7F7',
    },
    ageChipText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    mutedText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    sliderTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: themeMode === 'dark' ? '#2A2A2A' : '#E6E6E6',
      marginBottom: theme.spacing.md,
      position: 'relative',
      width: '100%',
      overflow: 'visible',
    },
    sliderFill: {
      position: 'absolute',
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    sliderHandle: {
      position: 'absolute',
      top: -6,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: HANDLE_SIZE / 2,
      backgroundColor: theme.colors.primary,
      zIndex: 2,
    },
    budgetRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    budgetBox: {
      flex: 1,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    budgetLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    budgetInput: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      padding: 0,
    },
    budgetSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    budgetSummaryBox: {
      flex: 1,
    },
    budgetSummaryValue: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    budgetEditButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    budgetDoneButton: {
      alignSelf: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    budgetDoneText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    filterGroup: {
      marginBottom: theme.spacing.sm,
    },
    newQuoterOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingBottom: insets.bottom,
    },
    newQuoterBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    newQuoterCard: {
      backgroundColor: themeMode === 'dark' ? '#101010' : '#FFFFFF',
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg + insets.bottom,
      shadowColor: '#000',
      shadowOpacity: themeMode === 'dark' ? 0.5 : 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 10,
    },
    newQuoterCardDefault: {
      maxHeight: '80%',
    },
    newQuoterCardTall: {
      maxHeight: '94%',
      minHeight: '70%',
    },
    newQuoterHandle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    newQuoterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    newQuoterBack: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newQuoterBackPlaceholder: {
      width: 32,
      height: 32,
    },
    newQuoterHeaderText: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
    },
    newQuoterHeaderTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    newQuoterHeaderSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
      minWidth: 0,
    },
    newQuoterClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newQuoterCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    newQuoterContent: {
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
      flexGrow: 1,
    },
    newQuoterLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    newQuoterLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    newQuoterOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: themeMode === 'dark' ? theme.colors.border : theme.colors.borderLight,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
    },
    newQuoterOptionText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
      flexShrink: 1,
    },
    newQuoterEmptyText: {
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSize.sm,
    },
    newQuoterProductsWrapper: {
      flex: 1,
      minHeight: 320,
    },
    newQuoterProductItem: {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    newQuoterProductItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '12',
    },
    newQuoterProductInfo: {
      flex: 1,
      gap: 4,
    },
    newQuoterProductName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flexShrink: 1,
    },
    newQuoterProductMeta: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    newQuoterProductPriceRow: {
      alignItems: 'flex-end',
      gap: 6,
    },
    newQuoterProductPrice: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.success,
    },
    newQuoterProductRadio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    newQuoterProductRadioActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    newQuoterConfirmButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newQuoterConfirmButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    newQuoterConfirmText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    createQuoteFloating: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: insets.bottom + 86,
      gap: theme.spacing.sm,
    },
    createQuoteError: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
      textAlign: 'center',
    },
    createQuoteButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    createQuoteButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    createQuoteButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    concludeButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    concludeButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    inlineLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    inlineLoadingText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    fieldErrorText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
      marginBottom: theme.spacing.sm,
    },
    locationModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    locationModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    locationModalCard: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      maxHeight: '75%',
    },
    locationModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    locationModalTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    locationModalClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationModalCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    locationSearchWrapper: {
      marginBottom: theme.spacing.md,
    },
    locationSearchInput: {
      height: 48,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
      fontFamily: theme.fonts.medium,
    },
    locationLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    locationLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    locationList: {
      paddingBottom: theme.spacing.lg,
    },
    locationItem: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.cardBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    locationItemLabel: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
    },
    locationItemLabelSelected: {
      color: theme.colors.primary,
    },
    locationItemBadge: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    locationFooterLoading: {
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
    },
    locationEmptyText: {
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.medium,
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    pickerBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    pickerCard: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      maxHeight: '75%',
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    pickerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    pickerClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    pickerSearchInput: {
      height: 44,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
      fontFamily: theme.fonts.medium,
      marginBottom: theme.spacing.md,
    },
    pickerLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    pickerLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    pickerList: {
      paddingBottom: theme.spacing.lg,
    },
    pickerItem: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.cardBackground,
    },
    pickerItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    pickerItemText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    pickerItemTextSelected: {
      color: theme.colors.primary,
    },
    pickerCheck: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    pickerEmptyText: {
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.medium,
    },
    pickerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    pickerClear: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    pickerClearText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    pickerDone: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerDoneText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textOnPrimary,
    },
    crmOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    crmBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    crmCard: {
      backgroundColor: themeMode === 'dark' ? '#121212' : '#FFFFFF',
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    crmHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    crmTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    crmClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crmCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    crmSubtitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    crmSectionLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    crmDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginVertical: theme.spacing.md,
    },
    crmDividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    crmDividerText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    crmPickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    crmPickerBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    crmPickerCard: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      maxHeight: '75%',
    },
    crmPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    crmPickerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    crmPickerClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crmPickerCloseText: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    crmPickerSearch: {
      height: 44,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
      fontFamily: theme.fonts.medium,
      marginBottom: theme.spacing.md,
    },
    crmPickerList: {
      paddingBottom: theme.spacing.lg,
    },
    crmPickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      marginBottom: theme.spacing.sm,
    },
    crmPickerItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    crmPickerInfo: {
      flex: 1,
    },
    crmPickerName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    crmPickerMeta: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    crmPickerCheck: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.primary,
      fontFamily: theme.fonts.semiBold,
    },
    crmPickerEmpty: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.medium,
      marginTop: theme.spacing.lg,
    },
    crmPickerLoading: {
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
    },
    crmAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.backgroundLight,
    },
    crmAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
    },
    crmAvatarText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    planResults: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    planLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    planLoadingInline: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    planLoadingText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    planErrorText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
      textAlign: 'center',
    },
    planEmptyText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    planCard: {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#1B1B1B' : '#FFFFFF',
      overflow: 'hidden',
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    planAvatarStack: {
      width: 56,
      height: 44,
      position: 'relative',
    },
    planAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planAvatarSecondary: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundLight,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      left: 24,
      top: 4,
    },
    planAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      resizeMode: 'cover',
    },
    planAvatarFallback: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    planSubtitle: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    planExpanded: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    selectedProductsBlock: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    selectedProductsLabel: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textSecondary,
    },
    selectedProductRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: themeMode === 'dark' ? '#161616' : '#FFFFFF',
      gap: theme.spacing.sm,
    },
    selectedProductInfo: {
      flex: 1,
      gap: 2,
    },
    selectedProductName: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    selectedProductPrice: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.success,
    },
    selectedProductRemove: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedProductRemoveText: {
      fontSize: 18,
      color: theme.colors.error,
      lineHeight: 20,
    },
    tableSection: {
      gap: theme.spacing.sm,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    tableArrows: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexShrink: 0,
    },
    tableArrowButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeMode === 'dark' ? '#101010' : '#FFFFFF',
    },
    tableTitle: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      flex: 1,
    },
    productRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    productCard: {
      width: 180,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
      backgroundColor: themeMode === 'dark' ? '#161616' : '#FAFAFA',
      gap: 6,
    },
    productHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    productRadio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      backgroundColor: 'transparent',
    },
    productRadioActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    productName: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    productMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    productMetaText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    productPrice: {
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.success,
    },
    selectProductButton: {
      marginTop: theme.spacing.xs,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    selectProductButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    selectProductText: {
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    selectProductTextActive: {
      color: theme.colors.textOnPrimary,
    },
  });
