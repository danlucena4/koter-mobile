/**
 * Cores do sistema Koter
 * Baseado no global.css do sistema web
 */

export const colors = {
  // Cores principais
  colorOne: '#ff00dd',
  colorTwo: '#fe8bbb',
  colorThree: '#9e7aff',
  
  // Cores de gráficos
  charts: {
    yellow: '#ebbc00',
    orange: '#ff8000',
    pink: '#ff7381',
    blue: '#0296e0',
    red: '#c20d1f',
    green: '#00b10c',
    purple: '#7869ff',
    magenta: '#ff00dd',
  },
  
  // Cores de status
  status: {
    success: '#00b10c',
    error: '#c20d1f',
    warning: '#ebbc00',
    info: '#0296e0',
  },
  
  // Gradientes (HSL)
  gradients: {
    color1: 'hsl(0, 100%, 63%)',
    color2: 'hsl(270, 100%, 63%)',
    color3: 'hsl(210, 100%, 63%)',
    color4: 'hsl(195, 100%, 63%)',
    color5: 'hsl(90, 100%, 63%)',
  },
  
  // Backgrounds
  backgrounds: {
    dark: '#1a191e',
    darker: '#0f0e13',
    light: '#2A2A2A',
    muted: '#1f1e23',
  },
  
  // Textos
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    muted: '#6B7280',
  },
  
  // Borders
  borders: {
    default: '#3A3A3A',
    light: '#4A4A4A',
    muted: '#28272c',
  },
} as const;

export type Colors = typeof colors;

