import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface TabOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface TabSwitchProps {
  options: TabOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const TabSwitch: React.FC<TabSwitchProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme, themeMode);
  
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.tab,
              isSelected && styles.tabSelected,
              isFirst && styles.tabFirst,
              isLast && styles.tabLast,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View style={styles.iconContainer}>{option.icon}</View>
            )}
            <Text
              style={[
                styles.tabText,
                isSelected && styles.tabTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, themeMode: 'light' | 'dark') => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: themeMode === 'dark' ? theme.colors.backgroundMuted : '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: themeMode === 'dark' ? theme.colors.border : '#F6F6F4',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  tabFirst: {
    marginRight: 2,
  },
  tabLast: {
    marginLeft: 2,
  },
  tabSelected: {
    backgroundColor: themeMode === 'dark' ? theme.colors.background : '#FFF0FB',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
  },
  tabTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
});

