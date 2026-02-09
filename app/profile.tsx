import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getTheme } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUser } from '../src/contexts/UserContext';
import { Input, Button, ArrowLeft02Icon, UserIcon, Mail01Icon, IdentityCardIcon } from '../src/components';
import { authService } from '../src/services/auth.service';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  SmartPhone01Icon,
} from '@hugeicons/core-free-icons';

export default function ProfileScreen() {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const router = useRouter();
  const { userName, userEmail, profileImage, setUserName, setUserEmail, setProfileImage } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    phone: '',
    document: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar dados do usuário ao montar
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await authService.getAuthenticatedUser();
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        document: userData.document || '',
      });
      setUserName(userData.name);
      setUserEmail(userData.email);
      if (userData.avatar) {
        setProfileImage(userData.avatar);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados');
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Função para escolher foto
  const pickImage = async () => {
    // Solicitar permissão
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso às fotos para alterar sua foto de perfil.');
      return;
    }

    // Abrir seletor de imagem
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      // TODO: Fazer upload para o servidor
      Alert.alert('Sucesso', 'Foto alterada com sucesso!');
    }
  };

  // Função para tirar foto
  const takePhoto = async () => {
    // Solicitar permissão
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar uma foto.');
      return;
    }

    // Abrir câmera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      // TODO: Fazer upload para o servidor
      Alert.alert('Sucesso', 'Foto alterada com sucesso!');
    }
  };

  // Mostrar opções de foto
  const showImageOptions = () => {
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma opção',
      [
        { text: 'Tirar Foto', onPress: takePhoto },
        { text: 'Escolher da Galeria', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Salvar alterações
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar API de atualização de perfil
      // await api.put('/users/me', formData);
      
      setUserName(formData.name);
      setUserEmail(formData.email);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(theme);

  if (isLoadingUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft02Icon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isLoading}
          >
            <Text style={styles.editButton}>
              {isEditing ? 'Salvar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(formData.name)}</Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <HugeiconsIcon
                  icon={Camera01Icon}
                  size={16}
                  color={theme.colors.textOnPrimary}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <Input
                placeholder="Digite seu nome"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={errors.name}
                editable={isEditing}
                icon={<UserIcon size={20} color={theme.colors.textSecondary} />}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                error={errors.email}
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail01Icon size={20} color={theme.colors.textSecondary} />}
              />
            </View>

            {/* Telefone */}
            {formData.phone && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <Input
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  error={errors.phone}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  icon={
                    <HugeiconsIcon
                      icon={SmartPhone01Icon}
                      size={20}
                      color={theme.colors.textSecondary}
                      strokeWidth={1.5}
                    />
                  }
                />
              </View>
            )}

            {/* CPF */}
            {formData.document && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF</Text>
                <Input
                  placeholder="000.000.000-00"
                  value={formData.document}
                  editable={false}
                  icon={<IdentityCardIcon size={20} color={theme.colors.textSecondary} />}
                />
                <Text style={styles.helperText}>O CPF não pode ser alterado</Text>
              </View>
            )}
          </View>

          {/* Botões de Ação */}
          {isEditing && (
            <View style={styles.buttonGroup}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    name: userName,
                    email: userEmail,
                    phone: formData.phone,
                    document: formData.document,
                  });
                }}
                variant="outline"
                containerStyle={styles.cancelButton}
              />
              <Button
                title={isLoading ? 'Salvando...' : 'Salvar Alterações'}
                onPress={handleSave}
                disabled={isLoading}
                icon={
                  isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                  ) : undefined
                }
                containerStyle={styles.saveButton}
              />
            </View>
          )}
        </ScrollView>
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
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginLeft: -theme.spacing.xs,
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    editButton: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl * 2,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      position: 'relative',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: theme.fontSize.xxl,
      fontFamily: theme.fonts.bold,
      color: theme.colors.textOnPrimary,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    avatarHint: {
      marginTop: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
    },
    formSection: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    buttonGroup: {
      gap: theme.spacing.md,
    },
    cancelButton: {
      marginBottom: 0,
    },
    saveButton: {
      marginBottom: 0,
    },
  });
