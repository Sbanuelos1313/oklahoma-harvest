import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function SkeletonCard({ height = 160, style }) {
  return <View style={[styles.card, { height }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.72,
    ...SHADOWS.soft,
  },
});
