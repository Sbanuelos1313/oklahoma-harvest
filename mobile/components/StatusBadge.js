import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

const COLOR_MAP = {
  pending: COLORS.gold,
  confirmed: COLORS.sage,
  ready_for_pickup: COLORS.success,
  out_for_delivery: COLORS.success,
  fulfilled: COLORS.brownSoft,
  cancelled: COLORS.danger,
  auto_cancelled: COLORS.danger,
  active: COLORS.success,
  hidden: COLORS.brownSoft,
};

export default function StatusBadge({ status, label }) {
  const bg = COLOR_MAP[status] || COLORS.sage;
  return <Text style={[styles.badge, { backgroundColor: bg }]}>{label || String(status || '').replaceAll('_', ' ')}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    overflow: 'hidden',
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.warmWhite,
    textTransform: 'capitalize',
  },
});
