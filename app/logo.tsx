import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, ThumbsUpIcon, ThumbsDownIcon, ImageUploadIcon, BriefcaseIcon, CancelIcon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';

export default function LogoScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { brokerLogo, setBrokerLogo } = useUser();

  const [wantsLogo, setWantsLogo] = useState<boolean | null>(true);
  const [logo, setLogo] = useState<string | null>(brokerLogo);
  const [touchedNext, setTouchedNext] = useState(false);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para escolher um logotipo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setLogo(uri);
      setBrokerLogo(uri);
    }
  };

  const styles = createStyles(theme);
  const needsLogo = wantsLogo !== false;
  const canGoNext = !needsLogo || !!logo;
  const showLogoError = touchedNext && needsLogo && !logo;

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Logotipo</Text>
          <Text style={styles.subtitle}>Deseja Adicionar um logotipo?</Text>
        </View>

        <View style={styles.selectionRow}>
          <TouchableOpacity
            style={[styles.selectionButton, wantsLogo === false && styles.selectionButtonActive]}
            onPress={() => {
              setWantsLogo(false);
              setLogo(null);
              setBrokerLogo(null);
            }}
          >
            <ThumbsDownIcon size={24} color={wantsLogo === false ? theme.colors.textSecondary : theme.colors.textMuted} />
            <Text style={[styles.selectionText, wantsLogo === false && styles.selectionTextActive]}>Não</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectionButton, wantsLogo === true && styles.selectionButtonActivePrimary]}
            onPress={() => setWantsLogo(true)}
          >
            <ThumbsUpIcon size={24} color={wantsLogo === true ? theme.colors.primary : theme.colors.textMuted} />
            <Text style={[styles.selectionText, wantsLogo === true && styles.selectionTextActivePrimary]}>Sim</Text>
          </TouchableOpacity>
        </View>

        {wantsLogo !== false && (
          <>
            <View style={styles.logoPlaceholderCard}>
              {logo ? (
                <>
                  <Image source={{ uri: logo }} style={styles.logoPreviewLarge} />
                  <TouchableOpacity
                    style={styles.removeLogoButtonLarge}
                    onPress={() => {
                      setLogo(null);
                      setBrokerLogo(null);
                    }}
                  >
                    <CancelIcon size={20} color={theme.colors.white} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <BriefcaseIcon size={36} color={theme.colors.textMuted} />
                  <Text style={styles.placeholderText}>Seu logotipo aqui.</Text>
                </>
              )}
            </View>

            <View style={styles.uploadSection}>
              <View style={styles.iconPreview}>
                {logo ? (
                  <>
                    <Image source={{ uri: logo }} style={styles.logoPreviewSmall} />
                    <TouchableOpacity
                      style={styles.removeLogoButtonSmall}
                      onPress={() => {
                        setLogo(null);
                        setBrokerLogo(null);
                      }}
                    >
                      <CancelIcon size={14} color={theme.colors.white} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <BriefcaseIcon size={32} color={theme.colors.textMuted} />
                )}
              </View>
              <TouchableOpacity
                style={styles.uploadInput}
                onPress={() => {
                  setTouchedNext(false);
                  pickLogo();
                }}
              >
                <Text style={styles.uploadText}>{logo ? 'Arquivo escolhido' : 'Escolher arquivo'}</Text>
                <ImageUploadIcon size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {showLogoError && <Text style={styles.errorText}>Se você marcou “Sim”, escolha um arquivo para continuar.</Text>}

        <View style={styles.footer}>
          <Button title="Voltar" variant="secondary" onPress={() => router.back()} containerStyle={styles.backButton} />
          <Button
            title="Próximo"
            disabled={!canGoNext}
            onPress={() => {
              setTouchedNext(true);
              if (!canGoNext) return;
              router.push('/link');
            }}
            containerStyle={styles.nextButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
    },
    title: {
      fontSize: theme.fontSize.huge,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    selectionRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    selectionButton: {
      flex: 1,
      height: 80,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      gap: theme.spacing.xs,
    },
    selectionButtonActive: {
      borderColor: theme.colors.textSecondary,
    },
    selectionButtonActivePrimary: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05',
    },
    selectionText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    selectionTextActive: {
      color: theme.colors.text,
    },
    selectionTextActivePrimary: {
      color: theme.colors.primary,
    },
    logoPlaceholderCard: {
      height: 120,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
      overflow: 'hidden',
    },
    logoPreviewLarge: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    removeLogoButtonLarge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: theme.colors.error,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    placeholderText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    uploadSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    iconPreview: {
      width: 64,
      height: 64,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.backgroundLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    logoPreviewSmall: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeLogoButtonSmall: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: theme.colors.error,
      borderRadius: 9,
      width: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    uploadInput: {
      flex: 1,
      height: 64,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    uploadText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    errorText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.error,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: 'auto',
      marginBottom: theme.spacing.xl,
    },
    backButton: {
      flex: 1,
    },
    nextButton: {
      flex: 1,
    },
  });
