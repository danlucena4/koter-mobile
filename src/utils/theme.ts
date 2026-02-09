// Cores que não mudam entre temas
const baseColors = {
  // Cores principais do sistema web
  primary: '#ff00dd', // color-one
  secondary: '#fe8bbb', // color-two
  tertiary: '#9e7aff', // color-three
  
  // Cores fixas (não mudam com tema)
  white: '#FFFFFF',
  black: '#1a191e',
  
  // Status colors
  success: '#00b10c',
  error: '#c20d1f',
  warning: '#ebbc00',
  info: '#0296e0',
  
  // Chart colors (para gráficos futuros)
  chart1: '#ebbc00',
  chart2: '#ff8000',
  chart3: '#ff7381',
  chart4: '#0296e0',
  chart5: '#c20d1f',
  chart6: '#00b10c',
  chart7: '#7869ff',
  chart8: '#ff00dd',
  
  // Gradient colors (para animações/destaques)
  gradient1: 'hsl(0, 100%, 63%)',
  gradient2: 'hsl(270, 100%, 63%)',
  gradient3: 'hsl(210, 100%, 63%)',
  gradient4: 'hsl(195, 100%, 63%)',
  gradient5: 'hsl(90, 100%, 63%)',
};

// Tema Dark
const darkColors = {
  ...baseColors,
  background: '#1a191e',
  backgroundLight: '#2A2A2A',
  backgroundMuted: '#1f1e23',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF', // Texto em botões primários
  sidebarBackground: '#0f0e13',
  sidebarForeground: '#f5f5f5',
  sidebarAccent: '#28272c',
  sidebarBorder: '#28272c',
  border: '#3A3A3A',
  borderLight: '#4A4A4A',
  inputBackground: '#2A2A2A',
  cardBackground: '#2A2A2A',
};

// Tema Light
const lightColors = {
  ...baseColors,
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  backgroundMuted: '#FAFAFA',
  text: '#3E3E3E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF', // Texto em botões primários (sempre branco)
  sidebarBackground: '#FAFAFA',
  sidebarForeground: '#3E3E3E',
  sidebarAccent: '#F5F5F5',
  sidebarBorder: '#E5E7EB',
  border: '#F6F6F4',
  borderLight: '#D1D5DB',
  inputBackground: '#F5F5F5',
  cardBackground: '#FFFFFF',
};

export const theme = {
  colors: darkColors, // Default para dark
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
  },
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  },
};

export type Theme = typeof theme;
export type ThemeColors = typeof darkColors;

// Função para obter o tema baseado no modo
export const getTheme = (mode: 'light' | 'dark') => ({
  ...theme,
  colors: mode === 'dark' ? darkColors : lightColors,
});

