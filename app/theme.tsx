import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Animated,
  Dimensions,
  GestureResponderEvent,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Button, CheckIcon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { authService } from '../src/services/auth.service';

type Choice = 'light' | 'dark';

import ThemeLightIcon from '../src/assets/images/ui-light.svg';
import ThemeDarkIcon from '../src/assets/images/ui-dark.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
const MAX_RADIUS = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2) * 1.2; // Extra para garantir cobertura total

export default function ThemeScreen() {
  const { theme: effectiveTheme, themeMode, setThemeMode } = useTheme();
  const router = useRouter();

  // Memoiza o tema e os estilos para evitar re-renders e saltos de layout
  const theme = useMemo(() => getTheme(effectiveTheme), [effectiveTheme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const initialChoice: Choice = useMemo(() => {
    if (themeMode === 'light' || themeMode === 'dark') return themeMode;
    return effectiveTheme;
  }, [themeMode, effectiveTheme]);

  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationOrigin, setAnimationOrigin] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });
  const [pendingTheme, setPendingTheme] = useState<Choice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const circleScale = useRef(new Animated.Value(0)).current;

  // Limpa o estado da animação somente quando o tema efetivamente mudou no sistema
  useEffect(() => {
    if (isAnimating && effectiveTheme === pendingTheme) {
      // Finaliza imediatamente quando o tema efetivo já chegou
      setIsAnimating(false);
      setPendingTheme(null);
      circleScale.setValue(0);
    }
  }, [effectiveTheme, isAnimating, pendingTheme, circleScale]);

  const handleChoice = useCallback((newChoice: Choice, event?: GestureResponderEvent) => {
    if (isAnimating || newChoice === choice) return;
    
    if (event) {
      const { pageX, pageY } = event.nativeEvent;
      setAnimationOrigin({ x: pageX, y: pageY });
    }
    
    setChoice(newChoice);
    setIsAnimating(true);
    setPendingTheme(newChoice);
    circleScale.setValue(0);

    // Atualiza a barra de navegação e o fundo nativo imediatamente para evitar delay visual
    if (Platform.OS === 'android') {
      const nextTheme = getTheme(newChoice);
      NavigationBar.setButtonStyleAsync(newChoice === 'light' ? 'dark' : 'light').catch(() => {});
      NavigationBar.setBackgroundColorAsync('transparent').catch(() => {});
      SystemUI.setBackgroundColorAsync(nextTheme.colors.background).catch(() => {});
    }
    
    Animated.timing(circleScale, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setThemeMode(newChoice);
    });
  }, [isAnimating, choice, circleScale, setThemeMode]);

  const handleNext = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Salvando tema escolhido:', choice);
      
      // Salva o tema na API
      await authService.updateAuthenticatedUser({ theme: choice });
      
      console.log('✅ Tema salvo com sucesso!');
      
      // Redireciona para o próximo passo (foto de perfil)
      router.push('/avatar');
    } catch (error: any) {
      console.error('❌ Erro ao salvar tema:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar o tema. Deseja continuar mesmo assim?',
        [
          {
            text: 'Tentar Novamente',
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: () => router.push('/avatar'),
          },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  const visualTheme = pendingTheme ? getTheme(pendingTheme) : theme;
  const visualColors = visualTheme.colors;

  const circleColor = visualColors.background;

  const animatingTextColor = pendingTheme 
    ? getTheme(pendingTheme).colors.text 
    : theme.colors.text;

  const animatingTextSecondaryColor = pendingTheme 
    ? getTheme(pendingTheme).colors.textSecondary 
    : theme.colors.textSecondary;
  const labelTextColor = pendingTheme 
    ? getTheme(pendingTheme).colors.text 
    : theme.colors.text;

  return (
    <View style={styles.container}>
      <StatusBar style={(pendingTheme || effectiveTheme) === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.backgroundBase, { backgroundColor: theme.colors.background }]} />
      
      {isAnimating && pendingTheme && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.animationCircle,
            {
              backgroundColor: circleColor,
              left: animationOrigin.x - MAX_RADIUS,
              top: animationOrigin.y - MAX_RADIUS,
              width: MAX_RADIUS * 2,
              height: MAX_RADIUS * 2,
              borderRadius: MAX_RADIUS,
              transform: [{ scale: circleScale }],
            },
          ]}
        />
      )}
      
      <View style={styles.contentLayer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={[styles.title, isAnimating && { color: animatingTextColor }]}>Tema</Text>
            <Text style={[styles.subtitle, isAnimating && { color: animatingTextSecondaryColor }]}>Escolha o tema.</Text>
          </View>

          <View style={styles.cardsRow}>
            <View style={styles.choiceContainer}>
              <Pressable
                onPress={(e) => handleChoice('light', e)}
                style={[
                  styles.card,
                  choice === 'light' && styles.cardSelected,
                ]}
              >
                <ThemeLightIcon
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                  style={styles.cardImage}
                />
              </Pressable>
              <Pressable 
                onPress={(e) => handleChoice('light', e)}
                style={styles.cardFooter}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: visualColors.border },
                    choice === 'light' && {
                      borderColor: visualColors.primary,
                      backgroundColor: visualColors.primary,
                    },
                  ]}
                >
                  {choice === 'light' && <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.cardLabel, { color: labelTextColor }]}>Tema Claro</Text>
              </Pressable>
            </View>

            <View style={styles.choiceContainer}>
              <Pressable
                onPress={(e) => handleChoice('dark', e)}
                style={[
                  styles.card,
                  choice === 'dark' && styles.cardSelected,
                ]}
              >
                <ThemeDarkIcon
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                  style={styles.cardImage}
                />
              </Pressable>
              <Pressable 
                onPress={(e) => handleChoice('dark', e)}
                style={styles.cardFooter}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: visualColors.border },
                    choice === 'dark' && {
                      borderColor: visualColors.primary,
                      backgroundColor: visualColors.primary,
                    },
                  ]}
                >
                  {choice === 'dark' && <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.cardLabel, { color: labelTextColor }]}>Tema Escuro</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Button 
              title={isSaving ? "Salvando..." : "Próximo"} 
              onPress={handleNext}
              disabled={isSaving}
            />
            {isSaving && (
              <ActivityIndicator 
                size="small" 
                color={visualColors.primary} 
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundBase: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    animationCircle: {
      position: 'absolute',
      zIndex: 1,
    },
    contentLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    header: {
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 32,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    choiceContainer: {
      flex: 1,
      // Sombra fixa para não causar saltos de layout
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    card: {
      borderRadius: 15,
      backgroundColor: theme.colors.backgroundLight,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      marginBottom: 8,
      height: 120,
      width: '100%',
    },
    cardSelected: {
      borderColor: '#ff00dd',
      borderWidth: 3,
    },
    cardImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      borderColor: '#ff00dd',
      backgroundColor: '#ff00dd',
    },
    cardLabel: {
      fontSize: 14,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 32,
    },
  });
