import React from 'react';
import { View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  Mail01Icon,
  ArrowRight02Icon,
  IdentityCardIcon as IdentityCardIconDef,
  WhatsappIcon,
  InformationCircleIcon,
  ArrowLeft02Icon,
  Tick01Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CloudUploadIcon,
  ImageAdd01Icon,
  Briefcase01Icon,
  PencilEdit01Icon,
  UserIcon,
  Cancel01Icon,
  CancelCircleIcon as CancelCircleIconDef,
  Notification01Icon,
  ArrowDown01Icon as ArrowDown01IconDef,
  DashboardSquare01Icon,
  CalculatorIcon,
  Note01Icon,
  Shield01Icon,
  UserGroupIcon,
  Task01Icon,
  Menu01Icon,
  Home01Icon,
  SmartPhone01Icon,
  Megaphone03Icon,
  Store01Icon,
  Settings01Icon,
  LayoutTable01Icon,
  AiNetworkIcon,
  PresentationLineChart02Icon,
  Share01Icon,
  Share08Icon as Share08IconDef,
  Simcard02Icon as Simcard02IconDef,
  // Ãcones de configuraÃ§Ãµes (novos / solicitados)
  UserCircleIcon as UserCircleIconDef,
  Crown02Icon as Crown02IconDef,
  CheckListIcon as CheckListIconDef,
  AnalyticsUpIcon as AnalyticsUpIconDef,
  CalculateIcon as CalculateIconDef,
  File01Icon as File01IconDef,
  ArtificialIntelligence08Icon as ArtificialIntelligence08IconDef,
  Target02Icon as Target02IconDef,
  ContactIcon as ContactIconDef,
  Logout02Icon as Logout02IconDef,
  SquareLock01Icon as SquareLock01IconDef,
  Briefcase02Icon as Briefcase02IconDef,
  ComputerVideoIcon as ComputerVideoIconDef,
  ArrowUpRight01Icon as ArrowUpRight01IconDef,
  PasswordValidationIcon as PasswordValidationIconDef,
  Delete01Icon as Delete01IconDef,
} from '@hugeicons/core-free-icons';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Wrapper para o Ã­cone de NotificaÃ§Ã£o
export const NotificationIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Notification01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Seta para Baixo
export const ArrowDownIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ArrowDown01IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Home
export const HomeIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Home01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Dashboard/Painel
export const DashboardIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={DashboardSquare01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Calculadora/CotaÃ§Ãµes
export const CalculatorIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={CalculatorIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Nota/Propostas
export const NoteIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Note01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Escudo/Seguros
export const ShieldIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => {
  // ObservaÃ§Ã£o: o pacote "@hugeicons/core-free-icons" nÃ£o possui "SecurityCheckIcon".
  // Para manter o visual desejado (escudo com check), compomos Shield + Tick.
  const checkSize = Math.round(size * 0.55);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <HugeiconsIcon icon={Shield01Icon} size={size} color={color} strokeWidth={strokeWidth} />
      <View style={{ position: 'absolute' }}>
        <HugeiconsIcon icon={Tick01Icon} size={checkSize} color={color} strokeWidth={strokeWidth} />
      </View>
    </View>
  );
};

// Wrapper para o Ã­cone de CRM/Grupo
export const CRMIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={UserGroupIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Tarefas
export const TaskIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Task01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Menu
export const MenuIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Menu01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Smartphone
export const SmartphoneIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={SmartPhone01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Megafone/Informativos
export const MegaphoneIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Megaphone03Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Loja/Mercado
export const MarketIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Store01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Email
export const EmailIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Mail01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Seta para Direita
export const ArrowRightIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ArrowRight02Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de CartÃ£o de Identidade/CPF
export const IdentityIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={IdentityCardIconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper com nome solicitado (IdentityCardIcon)
export const IdentityCardIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={IdentityCardIconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de WhatsApp
export const WhatsAppIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={WhatsappIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de InformaÃ§Ã£o
export const InfoIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={InformationCircleIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Seta para Esquerda
export const ArrowLeftIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ArrowLeft02Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Check (MarcaÃ§Ã£o)
export const CheckIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Tick01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Thumbs Up
export const ThumbsUpIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ThumbsUpIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Thumbs Down
export const ThumbsDownIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ThumbsDownIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Cloud Upload
export const CloudUploadIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={CloudUploadIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Image Upload
export const ImageUploadIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ImageAdd01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Maleta/Briefcase
export const BriefcaseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Briefcase02IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Pincel/Edit
export const EditIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={PencilEdit01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Cancelar
export const CancelIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Cancel01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const CancelCircleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={CancelCircleIconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de UsuÃ¡rio
export const UserIconWrapper: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={UserIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// ===== Ãcones solicitados para ConfiguraÃ§Ãµes =====
export const UserCircleIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={UserCircleIconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const Crown02Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={Crown02IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const CheckListIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={CheckListIconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const AnalyticsUpIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={AnalyticsUpIconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const CalculateIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={CalculateIconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const File01Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={File01IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const ArtificialIntelligence08Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon
    icon={ArtificialIntelligence08IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const Target02Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={Target02IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const Logout02Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={Logout02IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const LockIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={SquareLock01IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const DeviceIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={ComputerVideoIconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const ArrowDown01Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={ArrowDown01IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

export const Simcard02Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#fff',
  strokeWidth = 1.5,
}) => (
  <HugeiconsIcon icon={Simcard02IconDef} size={size} color={color} strokeWidth={strokeWidth} />
);

// Wrapper para o Ã­cone de ConfiguraÃ§Ãµes
export const SettingsIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Settings01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Contatos
export const ContactIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ContactIconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Tabela
export const TableIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={LayoutTable01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de IA
export const AIIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={AiNetworkIcon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Marketing
export const MarketingIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={PresentationLineChart02Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Compartilhar
export const ShareIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Share01Icon}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const Share08Icon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Share08IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

// Wrapper para o Ã­cone de Logout/Sair
export const LogoutIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Logout02IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={ArrowUpRight01IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const PasswordIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={PasswordValidationIconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);

export const TrashIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#fff',
  strokeWidth = 1.5 
}) => (
  <HugeiconsIcon
    icon={Delete01IconDef}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
  />
);
