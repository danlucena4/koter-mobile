import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTheme } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Calendar03Icon } from '@hugeicons/core-free-icons';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
}) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const styles = createStyles(theme, !!error);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS: apenas atualiza temporariamente
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const onPress = () => {
    setTempDate(value);
    setShow(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
        <HugeiconsIcon 
          icon={Calendar03Icon} 
          size={20} 
          color={theme.colors.textSecondary} 
          strokeWidth={1.5} 
        />
        <Text style={styles.text}>{formatDate(value)}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android: Modal nativo */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale="pt-BR"
        />
      )}

      {/* iOS: Modal customizado com botões */}
      {show && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={show}
          onRequestClose={handleCancel}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={handleCancel}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelButton}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Selecione a Data</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmButton}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="pt-BR"
                textColor={theme.colors.text}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, hasError: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: hasError ? theme.colors.error : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    text: {
      flex: 1,
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.regular,
      color: theme.colors.text,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.regular,
      marginTop: theme.spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.text,
    },
    cancelButton: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textSecondary,
    },
    confirmButton: {
      fontSize: theme.fontSize.md,
      fontFamily: theme.fonts.semiBold,
      color: theme.colors.primary,
    },
  });
