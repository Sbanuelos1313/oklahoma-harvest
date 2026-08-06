import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export default function FilterPill({ label, active = false, onPress }) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.active]} onPress={onPress} activeOpacity={0.84}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },
  text: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },
  textActive: {
    color: COLORS.warmWhite,
  },
});
