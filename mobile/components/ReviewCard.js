import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function ReviewCard({ review }) {
  return (
    <View style={styles.card}>
      <Text style={styles.rating}>{Number(review?.rating || 5).toFixed(1)} rating</Text>
      <Text style={styles.comment}>{review?.comment || 'Great local experience.'}</Text>
      <Text style={styles.name}>{review?.full_name || review?.reviewer_name || 'Customer'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, ...SHADOWS.soft },
  rating: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.forest },
  comment: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brown, marginTop: 7 },
  name: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.brownSoft, marginTop: 9 },
});
