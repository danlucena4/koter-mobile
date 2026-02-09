import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  textStyle,
  containerStyle,
  ...props
}) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme);
  
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabledButton,
        containerStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : theme.colors.textOnPrimary} />
      ) : (
        <>
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.inputBackground,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryText: {
    color: theme.colors.textOnPrimary, // Texto em botão primário (sempre branco)
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.semiBold,
  },
  secondaryText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.semiBold,
  },
  outlineText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.semiBold,
  },
});

