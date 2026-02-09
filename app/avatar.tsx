import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, ThumbsUpIcon, ThumbsDownIcon, ImageUploadIcon, UserIcon } from '../src/components';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import { authService } from '../src/services/auth.service';

export default function AvatarScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { userName, profileImage, setProfileImage } = useUser();

  const [wantsAvatar, setWantsAvatar] = useState<boolean | null>(true);
  const [avatar, setAvatar] = useState<string | null>(profileImage);
  const [touchedNext, setTouchedNext] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      setProfileImage(uri);
    }
  };

  const handleNext = async () => {
    const needsAvatar = wantsAvatar !== false;
    if (needsAvatar && !avatar) {
      setTouchedNext(true);
      return;
    }

    // Se escolheu avatar, tentar fazer upload (mas não bloquear o fluxo se falhar)
    if (avatar && wantsAvatar) {
      setIsUploading(true);
      try {
        console.log('📤 Fazendo upload do avatar...');
        console.log('📁 URI do avatar:', avatar);
        await authService.updateAvatar(avatar);
        console.log('✅ Avatar enviado com sucesso!');
        setIsUploading(false);
        router.push('/logo');
      } catch (error: any) {
        console.error('❌ Erro ao enviar avatar:', error);
        console.error('❌ Mensagem do erro:', error.message);
        
        setIsUploading(false);
        
        // Mostra alerta perguntando se quer continuar
        Alert.alert(
          'Erro ao enviar foto',
          'Não foi possível enviar a foto de perfil. Você pode adicionar depois nas configurações. Deseja continuar?',
          [
            {
              text: 'Tentar Novamente',
              style: 'cancel',
              onPress: () => {
                // Não faz nada, usuário pode tentar de novo
              },
            },
            {
              text: 'Continuar sem foto',
              onPress: () => {
                console.log('⏭️ Continuando sem foto de perfil...');
                router.push('/logo');
              },
            },
          ]
        );
        return;
      }
    } else {
      // Se não quer avatar, vai direto para próxima etapa
      console.log('⏭️ Pulando foto de perfil...');
      router.push('/logo');
    }
  };

  const styles = createStyles(theme);
  const needsAvatar = wantsAvatar !== false;
  const canGoNext = !needsAvatar || !!avatar;
  const showAvatarError = touchedNext && needsAvatar && !avatar;

  // Função para obter as iniciais do nome
  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'US';
    const trimmedName = name.trim();
    const names = trimmedName.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return trimmedName.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.subtitle}>
              Adicione uma foto de <Text style={styles.subtitleBold}>perfil</Text>.
            </Text>
          </View>

          {/* Card com informações do usuário */}
          <View style={styles.userCard}>
            <View style={styles.userCardAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.userCardAvatarImage} />
              ) : (
                <View style={styles.userCardAvatarPlaceholder}>
                  <UserIcon size={24} color={theme.colors.textOnPrimary} />
                </View>
              )}
            </View>
            <View style={styles.userCardInfo}>
              <Text style={styles.userCardName}>{userName || 'Usuário'}</Text>
              <Text style={styles.userCardRole}>Corretor do Futuro</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={pickAvatar}>
              <ImageUploadIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Botões Sim/Não */}
          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[styles.selectionButton, wantsAvatar === false && styles.selectionButtonActive]}
              onPress={() => {
                setWantsAvatar(false);
                setAvatar(null);
                setProfileImage(null);
              }}
            >
              <ThumbsDownIcon size={20} color={wantsAvatar === false ? theme.colors.text : theme.colors.textMuted} />
              <Text style={[styles.selectionText, wantsAvatar === false && styles.selectionTextActive]}>Não</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectionButton, wantsAvatar === true && styles.selectionButtonActivePrimary]}
              onPress={() => setWantsAvatar(true)}
            >
              <ThumbsUpIcon size={20} color={wantsAvatar === true ? '#FFFFFF' : theme.colors.textMuted} />
              <Text style={[styles.selectionText, wantsAvatar === true && styles.selectionTextActivePrimary]}>Sim</Text>
            </TouchableOpacity>
          </View>

          {/* Seção de avatar (quando escolhe "Sim") */}
          {wantsAvatar !== false && (
            <View style={styles.avatarSection}>
              {/* Avatar e botão lado a lado */}
              <View style={styles.avatarRow}>
                {/* Avatar grande para preview */}
                <View style={[styles.avatarPreview, showAvatarError && styles.avatarPreviewError]}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatarPreviewImage} />
                  ) : (
                    <View style={styles.avatarPreviewPlaceholder}>
                      <UserIcon size={32} color={theme.colors.textSecondary} />
                    </View>
                  )}
                </View>

                {/* Botão de escolher arquivo */}
                <TouchableOpacity style={styles.uploadButton} onPress={pickAvatar}>
                  <ImageUploadIcon size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.uploadButtonText}>Escolher arquivo</Text>
                </TouchableOpacity>
              </View>

              {showAvatarError && (
                <Text style={styles.errorText}>Por favor, selecione uma foto de perfil</Text>
              )}
            </View>
          )}
        </View>

        {/* Footer com botões */}
        <View style={styles.footer}>
          <Button 
            title="Voltar" 
            onPress={() => router.back()} 
            variant="outline"
            containerStyle={styles.backButton}
          />
          <Button
            title={isUploading ? "Enviando..." : "Próximo"}
            onPress={handleNext}
            disabled={!canGoNext || isUploading}
            icon={isUploading ? <ActivityIndicator size="small" color={theme.colors.textOnPrimary} /> : undefined}
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
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.fonts.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    subtitleBold: {
      fontFamily: theme.fonts.bold,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      width: '100%',
      marginBottom: theme.spacing.lg,
    },
    userCardAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userCardAvatarImage: {
      width: '100%',
      height: '100%',
    },
    userCardAvatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      fontSize: 18,
      fontFamily: theme.fonts.bold,
      color: theme.colors.textOnPrimary,
    },
    userCardInfo: {
      flex: 1,
    },
    userCardName: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    userCardRole: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    editButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.backgroundLight,
    },
    selectionRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    selectionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    selectionButtonActive: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    selectionButtonActivePrimary: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    selectionText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.textMuted,
    },
    selectionTextActive: {
      color: theme.colors.text,
    },
    selectionTextActivePrimary: {
      color: '#FFFFFF',
    },
    avatarSection: {
      width: '100%',
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    avatarPreview: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.lg,
      flexShrink: 0,
    },
    avatarPreviewError: {
      borderWidth: 2,
      borderColor: theme.colors.error || '#ef4444',
    },
    avatarPreviewImage: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.lg,
    },
    avatarPreviewPlaceholder: {
      width: 80,
      height: 80,
      backgroundColor: theme.colors.backgroundLight,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.error || '#ef4444',
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    uploadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      height: 80,
    },
    uploadButtonText: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
    },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    backButton: {
      flex: 1,
    },
    nextButton: {
      flex: 2,
    },
  });
