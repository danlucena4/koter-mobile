import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, ArrowRight02Icon, WhatsAppIcon, InfoIcon, ArrowLeft02Icon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';

export default function VerifyPhoneScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.slice(-1);
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleNext = () => {
    if (code.every(digit => digit !== '')) {
      console.log('Código verificado:', code.join(''));
      // Navegar para o dashboard ou próxima etapa
      router.push('/');
    }
  };

  const openWhatsApp = () => {
    const url = 'whatsapp://send?text=Olá';
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL('https://wa.me/');
      }
    });
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft02Icon size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Validar Celular</Text>
            <Text style={styles.subtitle}>
              Enviamos um código para o seu celular, digite ele abaixo:
            </Text>
          </View>

          <Button
            title="Visualizar Código"
            variant="outline"
            onPress={openWhatsApp}
            icon={<WhatsAppIcon size={20} color={theme.colors.primary} />}
            containerStyle={styles.whatsappButton}
          />

          <View style={styles.whatsappInfoCard}>
            <WhatsAppIcon size={32} color={theme.colors.success} />
            <Text style={styles.whatsappInfoText}>
              Enviamos um código para seu Whatsapp e SMS.
            </Text>
          </View>

          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Código de Validação</Text>
            <View style={styles.otpContainer}>
              <View style={styles.otpGroup}>
                {[0, 1, 2].map((i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { inputs.current[i] = ref; }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={code[i]}
                    onChangeText={(text) => handleCodeChange(text, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                ))}
              </View>
              <View style={styles.divider} />
              <View style={styles.otpGroup}>
                {[3, 4, 5].map((i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { inputs.current[i] = ref; }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={code[i]}
                    onChangeText={(text) => handleCodeChange(text, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.infoText}>
              Digite o código de 6 dígitos que enviamos para:{' '}
              <Text style={styles.boldText}>{identifier || '(71) 99999-9999'}</Text>
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.errorSection}>
              <Text style={styles.errorText}>Errou o celular na hora de se cadastrar?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Altere o celular</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Próximo"
              onPress={handleNext}
              icon={<ArrowRight02Icon size={20} color={theme.colors.textOnPrimary} />}
              disabled={code.some(digit => digit === '')}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  whatsappButton: {
    marginBottom: theme.spacing.lg,
    borderColor: theme.colors.primary,
  },
  whatsappInfoCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  whatsappInfoText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeSection: {
    marginBottom: theme.spacing.xxl,
  },
  codeLabel: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  otpGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  otpInput: {
    width: 45,
    height: 56,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  divider: {
    width: 10,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  footer: {
    marginTop: 'auto',
  },
  errorSection: {
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
});

