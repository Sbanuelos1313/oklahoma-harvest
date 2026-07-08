import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import InsightCard from '../../components/InsightCard';
import EmptyState from '../../components/EmptyState';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorAnalyticsScreen({ API, token }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const headers = { Authorization: 'Bearer ' + token };
      const [o, p] = await Promise.all([
        fetch(`${API}/api/orders/producer/incoming`, { headers }),
        fetch(`${API}/api/products/my`, { headers })
      ]);
      const od = await o.json(), pd = await p.json();
      setOrders(Array.isArray(od) ? od : []);
      setProducts(Array.isArray(pd) ? pd : []);
    } catch {
      setOrders([]);
      setProducts([]);
    }
    setLoading(false);
  }

  const stats = useMemo(() => {
    const fulfilled = orders.filter(o => o.status === 'fulfilled');
    const revenue = fulfilled.reduce((s, o) => s + Number(o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const avg = fulfilled.length ? revenue / fulfilled.length : 0;
    return { revenue, pending, avg, orders: orders.length, products: products.length };
  }, [orders, products]);

  if (loading) return <View style={styles.root}><SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.forest}/><Text style={styles.muted}>Loading analytics...</Text></SafeAreaView></View>;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Performance</Text>
          <Text style={styles.title}>Analytics</Text>

          <View style={styles.grid}><InsightCard label="Revenue" value={`$${stats.revenue.toFixed(0)}`} sub="Fulfilled orders" tone="dark" /><InsightCard label="Avg order" value={`$${stats.avg.toFixed(0)}`} sub="Completed" /></View>
          <View style={styles.grid}><InsightCard label="Orders" value={stats.orders} sub="All time" /><InsightCard label="Pending" value={stats.pending} sub="Need action" /></View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top products</Text>
            {products.slice(0, 8).map(p => (
              <View key={p.id} style={styles.row}>
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowValue}>{p.quantity_available} left</Text>
              </View>
            ))}
            {!products.length && <EmptyState image={IMAGE_ASSETS.products.default} title="No product data yet" message="Analytics will improve once products and orders exist." />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginTop: 8, ...SHADOWS.soft },
  cardTitle: { fontFamily: FONTS.display, fontSize: 25, color: COLORS.forestDark, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 12 },
  rowTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark, flex: 1 },
  rowValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.sage },
});
