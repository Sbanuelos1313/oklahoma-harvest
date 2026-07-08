import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function OrderConfirmationScreen({ route, navigation }) {
  const { order, fulfillmentType = 'pickup' } = route.params || {};

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Image source={IMAGE_ASSETS.hero.checkout} style={styles.heroImage} />
            <View style={styles.overlay} />
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>Order placed</Text>
            <Text style={styles.title}>Your order is on its way to the vendor.</Text>
            <Text style={styles.message}>
              The vendor has 12 hours to confirm your order. If they do not respond, the order will be automatically cancelled and refunded.
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order</Text>
              <Text style={styles.detailValue}>#{order?.id || order?.order_id || 'Pending'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fulfillment</Text>
              <Text style={styles.detailValue}>{fulfillmentType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>Pending confirmation</Text>
            </View>

            <AppButton title="View My Orders" onPress={() => navigation.navigate('Main', { screen: 'Orders' })} style={{ marginTop: 18 }} />
            <AppButton title="Keep Shopping" variant="outline" onPress={() => navigation.navigate('Main', { screen: 'Home' })} style={{ marginTop: 10 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { padding: LAYOUT.screenPadding, paddingBottom: 40 },
  hero: { height: 260, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.card },
  heroImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,69,44,0.22)' },
  checkCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: 82,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.gold,
  },
  checkText: { fontFamily: FONTS.bodyBold, fontSize: 52, color: COLORS.forest },
  card: { marginTop: 18, backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 20, ...SHADOWS.soft },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage },
  title: { fontFamily: FONTS.display, fontSize: 31, lineHeight: 37, color: COLORS.forestDark, marginTop: 8 },
  message: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 22, color: COLORS.brown, marginTop: 10, marginBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 12 },
  detailLabel: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.brownSoft },
  detailValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.forest, textTransform: 'capitalize' },
});
