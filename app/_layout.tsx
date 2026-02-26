import { Stack } from "expo-router";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { UserProvider } from '../src/contexts/UserContext';
import { NotificationsProvider } from '../src/contexts/NotificationsContext';
import { getTheme } from '../src/utils/theme';

// Previne que a splash screen seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  console.log('🧭 RootLayoutNav iniciando...')
  const { theme: themeMode } = useTheme();
  console.log('🎨 Theme mode:', themeMode)
  const theme = getTheme(themeMode);

  const navigationTheme = themeMode === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
    }
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* 
        Importante: esse wrapper evita "flash" branco durante transições (especialmente no Android),
        garantindo que o container raiz sempre tenha o background do tema.
      */}
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            // Evita flash do fundo nativo durante o pop: animação desabilitada
            animation: 'slide_from_right',
            // Mantém a tela anterior "congelada" quando perde o foco, evitando flash do fundo nativo ao voltar.
            freezeOnBlur: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
          <Stack.Screen name="theme" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="logo" />
          <Stack.Screen name="link" />
          <Stack.Screen name="home" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="verify-email" />
        <Stack.Screen name="verify-phone" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile-menu" />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="coming-soon" />
        <Stack.Screen name="tables" />
        <Stack.Screen name="tables/[operatorId]" />
        <Stack.Screen name="quotes" />
        <Stack.Screen name="quote-create" />
        <Stack.Screen name="quote-profile" />
        <Stack.Screen name="lead/[id]" />
        <Stack.Screen name="informativos" />
        <Stack.Screen name="informativos/[id]" />
      </Stack>
      </View>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  console.log('🚀 RootLayout iniciando...')
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  console.log('📝 Fontes carregadas?', fontsLoaded)

  useEffect(() => {
    if (fontsLoaded) {
      console.log('✅ Fontes OK, escondendo splash')
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    console.log('⏳ Aguardando fontes...')
    return null;
  }

  console.log('🎨 Montando Providers...')
  
  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationsProvider>
          <RootLayoutNav />
        </NotificationsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

