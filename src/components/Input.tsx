import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { getTheme } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  icon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  ...props
}) => {
  const { theme: themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const styles = createStyles(theme);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    props.onFocus?.(e);
  }, [props.onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    props.onBlur?.(e);
  }, [props.onBlur]);

  const handleContainerPressIn = useCallback(() => {
    if (props.editable === false) return;
    // iOS: usar PressIn evita o “delay” de focar somente ao soltar o dedo
    inputRef.current?.focus();
  }, [props.editable]);

  return (
    <View>
      <TouchableWithoutFeedback
        onPressIn={handleContainerPressIn}
        accessible={false}
        // evita cancelar o toque do input quando o teclado abre/fecha
        rejectResponderTermination
      >
        <View
          style={[
            styles.container,
            isFocused && styles.containerFocused,
            error && styles.containerError,
            style,
          ]}
        >
          {icon && (
            <View style={styles.iconContainer} pointerEvents="none">
              {icon}
            </View>
          )}
          <TextInput
            ref={inputRef}
            key={props.secureTextEntry ? 'secure' : 'plain'}
            style={styles.input}
            placeholderTextColor={theme.colors.textSecondary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
            spellCheck={false}
            underlineColorAndroid="transparent"
            selectionColor={theme.colors.primary}
            {...props}
          />
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIconContainer}
              hitSlop={8}
              android_ripple={{ color: theme.colors.primary, radius: 20 }}
            >
              {rightIcon}
            </Pressable>
          )}
        </View>
      </TouchableWithoutFeedback>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    borderWidth: 2,
    borderColor: 'transparent',
    // No iOS, overflow:hidden pode acabar “cortando” o texto do TextInput em alguns layouts/fonts
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  containerFocused: {
    borderColor: theme.colors.primary,
  },
  containerError: {
    borderColor: theme.colors.error,
  },
  iconContainer: {
    width: 24,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.regular,
    outlineStyle: 'none' as any,
    ...Platform.select({
      ios: {
        height: '100%',
      },
      android: {
        paddingVertical: 0,
        textAlignVertical: 'center',
      },
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  rightIconContainer: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});

