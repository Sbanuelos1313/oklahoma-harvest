import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function InsightCard({ label, value, sub, tone = 'light' }) {
  return (
    <View style={[styles.card, tone === 'dark' && styles.dark]}>
      <Text style={[styles.label, tone === 'dark' && styles.darkLabel]}>{label}</Text>
      <Text style={[styles.value, tone === 'dark' && styles.darkValue]}>{value}</Text>
      {!!sub && <Text style={[styles.sub, tone === 'dark' && styles.darkSub]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 104,
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...SHADOWS.soft,
  },
  dark: {
    backgroundColor: COLORS.forest,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.forestDark,
    marginTop: 8,
  },
  sub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.brownSoft,
    marginTop: 4,
  },
  darkLabel: { color: COLORS.sageSoft },
  darkValue: { color: COLORS.warmWhite },
  darkSub: { color: COLORS.cream },
});
