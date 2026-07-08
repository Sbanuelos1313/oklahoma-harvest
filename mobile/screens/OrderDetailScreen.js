import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Image } from 'react-native';
import AppButton from '../components/AppButton';
import StatusBadge from '../components/StatusBadge';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params || {};
  const items = order?.items || order?.order_items || [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Order details</Text>
          <Text style={styles.title}>Order #{order?.id || '—'}</Text>

          <View style={styles.card}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.shop}>{order?.shop_name || 'Local Vendor'}</Text>
                <Text style={styles.sub}>{order?.fulfillment_type || 'pickup'}</Text>
              </View>
              <StatusBadge status={order?.status || 'pending'} />
            </View>

            <View style={styles.timeline}>
              <Step label="Placed" active />
              <Step label="Confirmed" active={['confirmed','ready_for_pickup','out_for_delivery','fulfilled'].includes(order?.status)} />
              <Step label="Ready" active={['ready_for_pickup','out_for_delivery','fulfilled'].includes(order?.status)} />
              <Step label="Complete" active={order?.status === 'fulfilled'} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.length ? items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Image source={item.image_url ? { uri: item.image_url } : IMAGE_ASSETS.products.default} style={styles.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name || item.product_name}</Text>
                  <Text style={styles.itemSub}>Qty {item.quantity} · ${Number(item.price || item.unit_price || 0).toFixed(2)}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.body}>Item details will appear here when available.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Row label="Total" value={`$${Number(order?.total || 0).toFixed(2)}`} />
            <Row label="Fulfillment" value={order?.fulfillment_type || 'pickup'} />
            <Row label="Status" value={String(order?.status || 'pending').replaceAll('_', ' ')} />
          </View>

          {order?.status === 'fulfilled' && (
            <AppButton title="Leave a Review" onPress={() => navigation.navigate('LeaveReview', { order })} style={{ marginTop: 18 }} />
          )}

          <AppButton title="Back to Orders" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Step({ label, active }) {
  return (
    <View style={styles.step}>
      <View style={[styles.dot, active && styles.dotActive]} />
      <Text style={[styles.stepText, active && styles.stepTextActive]}>{label}</Text>
    </View>
  );
}

function Row({ label, value }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 60 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 16, ...SHADOWS.soft },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  shop: { fontFamily: FONTS.display, fontSize: 25, color: COLORS.forestDark },
  sub: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.brownSoft, marginTop: 4, textTransform: 'capitalize' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  step: { alignItems: 'center', flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.beige, borderWidth: 2, borderColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  stepText: { fontFamily: FONTS.bodyBold, color: COLORS.brownSoft, fontSize: 10, marginTop: 6, textAlign: 'center' },
  stepTextActive: { color: COLORS.forest },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark, marginBottom: 12 },
  body: { fontFamily: FONTS.body, color: COLORS.brownSoft, fontSize: 14, lineHeight: 21 },
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  itemImage: { width: 58, height: 58, borderRadius: RADIUS.md },
  itemName: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark },
  itemSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 12 },
  rowLabel: { fontFamily: FONTS.bodyBold, color: COLORS.brownSoft, fontSize: 13 },
  rowValue: { fontFamily: FONTS.bodyBold, color: COLORS.forest, fontSize: 13, textTransform: 'capitalize' },
});
