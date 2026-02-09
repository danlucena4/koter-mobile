import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { getTheme } from '../utils/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  const STORAGE_KEY = 'koter.themeMode';

  // Carrega preferências do usuário (tema) ao iniciar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeMode(saved);
        }
      } catch (e) {
        // ignora erros de storage
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      // Se systemColorScheme for null, assume dark como padrão
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  };

  const theme = getEffectiveTheme();

  // Configura a barra de navegação transparente apenas uma vez na inicialização
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Força edge-to-edge: app desenha por baixo da barra de navegação
      NavigationBar.setPositionAsync('absolute').catch(() => {});
      NavigationBar.setBackgroundColorAsync('transparent').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  // Mantém o background nativo e a cor dos ícones da barra de navegação sincronizados
  useEffect(() => {
    const activeTheme = getTheme(theme);
    const bg = activeTheme.colors.background;
    
    // Fundo da Root View
    SystemUI.setBackgroundColorAsync(bg).catch(() => {});

    // Estilo dos botões da barra de navegação (Android)
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(theme === 'light' ? 'dark' : 'light').catch(() => {});
    }
  }, [theme]);

  // Debug: log para verificar o tema detectado
  useEffect(() => {
    console.log('System Color Scheme:', systemColorScheme);
    console.log('Theme Mode:', themeMode);
    console.log('Effective Theme:', theme);
  }, [systemColorScheme, themeMode, theme]);

  // Persiste o tema escolhido pelo usuário
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, themeMode).catch(() => {
      // ignora erros
    });
  }, [themeMode, isHydrated]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

