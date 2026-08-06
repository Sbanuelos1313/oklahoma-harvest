import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export default function RatingBadge({ rating = 0, count = 0, label }) {
  const text = label || `${Number(rating || 0).toFixed(1)} rating`;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{text}{count ? ` · ${count} reviews` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  text: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },
});
