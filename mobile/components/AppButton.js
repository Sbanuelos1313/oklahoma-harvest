// components/AppButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'outline' && styles.outlineLabel,
    disabled && styles.disabledLabel,
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.warmWhite : COLORS.forest} />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primary: {
    backgroundColor: COLORS.forest,
    ...SHADOWS.soft,
  },
  secondary: {
    backgroundColor: COLORS.sageSoft,
  },
  outline: {
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  primaryLabel: {
    color: COLORS.warmWhite,
  },
  secondaryLabel: {
    color: COLORS.forestDark,
  },
  outlineLabel: {
    color: COLORS.forest,
  },
  disabledLabel: {
    color: COLORS.brownSoft,
  },
});
