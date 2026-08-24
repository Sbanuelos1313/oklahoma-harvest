import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert, TouchableOpacity } from 'react-native';
import AppButton from '../components/AppButton';
import FormField from '../components/FormField';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';

export default function LeaveReviewScreen({ API, token, route, navigation }) {
  const { order } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!order?.id && !order?.producer_id) {
      Alert.alert('Review unavailable', 'Missing order details.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reviews/`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          producer_id: order.producer_id,
          rating,
          comment,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to submit review.');
      Alert.alert('Review submitted', 'Thank you for supporting local vendors.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to submit review', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Review</Text>
          <Text style={styles.title}>How was your order?</Text>
          <Text style={styles.subtitle}>Your review helps other customers discover trusted local vendors.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={[styles.ratingBtn, rating >= n && styles.ratingActive]}>
                  <Text style={[styles.ratingText, rating >= n && styles.ratingTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField label="Comment" value={comment} onChangeText={setComment} placeholder="Tell others what stood out." multiline />
            <AppButton title="Submit Review" onPress={submit} loading={loading} style={{ marginTop: 18 }} />
            <AppButton title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 60 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 6, marginBottom: 18 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
  label: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.sage, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  ratingRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  ratingBtn: { flex: 1, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  ratingActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  ratingText: { fontFamily: FONTS.bodyBold, color: COLORS.forest },
  ratingTextActive: { color: COLORS.warmWhite },
});
