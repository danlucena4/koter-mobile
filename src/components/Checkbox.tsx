import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { getTheme } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onValueChange,
  style,
}) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        value && styles.containerChecked,
        style,
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      {value && (
        <HugeiconsIcon
          icon={Tick02Icon}
          size={16}
          color={theme.colors.text}
          strokeWidth={2.5}
        />
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});

