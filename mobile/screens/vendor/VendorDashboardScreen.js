import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import InsightCard from '../../components/InsightCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorDashboardScreen({ API, token, user, navigation }) {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadDashboard());
    loadDashboard();
    return unsubscribe;
  }, [navigation]);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = { Authorization: 'Bearer ' + token };
      const [shopRes, productRes, orderRes, stripeRes] = await Promise.all([
        fetch(`${API}/api/producers/me`, { headers }),
        fetch(`${API}/api/products/my`, { headers }),
        fetch(`${API}/api/orders/producer/incoming`, { headers }),
        fetch(`${API}/api/stripe/connect/status`, { headers }),
      ]);

      const shopData = await shopRes.json();
      const productData = await productRes.json();
      const orderData = await orderRes.json();
      const stripeData = await stripeRes.json();

      setShop(shopRes.ok ? shopData : null);
      setProducts(Array.isArray(productData) ? productData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setStripeStatus(stripeData || null);
    } catch {
      setShop(null);
      setProducts([]);
      setOrders([]);
      setStripeStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function startStripeOnboarding() {
    try {
      const res = await fetch(`${API}/api/stripe/connect/onboard`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data?.onboarding_url) alert('Open this Stripe onboarding link:\\n\\n' + data.onboarding_url);
      else alert(data?.message || 'Stripe is already set up.');
    } catch {
      alert('Unable to start Stripe onboarding.');
    }
  }

  const stats = useMemo(() => {
    const activeProducts = products.filter(p => p.is_active).length;
    const lowInventory = products.filter(p => Number(p.quantity_available || 0) <= 3).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalOpenValue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const fulfilledValue = orders.filter(o => o.status === 'fulfilled').reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { activeProducts, lowInventory, pendingOrders, totalOpenValue, fulfilledValue };
  }, [products, orders]);

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.forest} />
            <Text style={styles.loadingText}>Loading vendor dashboard...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyWrap}>
            <EmptyState
              image={IMAGE_ASSETS.vendor.storefront}
              title="Set up your vendor store"
              message="Create your storefront so customers can discover your products, place orders, and support your local business."
              buttonTitle="Create Store"
              onPress={() => navigation.getParent()?.navigate('VendorStoreSetup')}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const heroImage = shop.profile_image_url ? { uri: shop.profile_image_url } : IMAGE_ASSETS.vendor.storefront;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.forestDark} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={COLORS.forest} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={heroImage} style={styles.heroImage} />
            <View style={styles.overlay} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>Vendor dashboard</Text>
              <Text style={styles.title}>{shop.shop_name}</Text>
              <Text style={styles.subtitle}>{shop.admin_approved ? 'Live on From Our Place' : 'Pending admin approval'}</Text>
            </View>
          </View>

          <View style={styles.insightGrid}>
            <InsightCard label="Pending" value={stats.pendingOrders} sub="Orders" tone="dark" />
            <InsightCard label="Active" value={stats.activeProducts} sub="Products" />
          </View>

          <View style={styles.insightGrid}>
            <InsightCard label="Open value" value={`$${stats.totalOpenValue.toFixed(0)}`} sub="Current orders" />
            <InsightCard label="Alerts" value={stats.lowInventory} sub="Low inventory" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Store health</Text>
            <Health ok={shop.admin_approved} title="Admin approval" sub={shop.admin_approved ? 'Your store is visible to customers.' : 'Your store is waiting for platform approval.'} />
            <Health ok={stripeStatus?.onboarding_complete} title="Stripe payouts" sub={stripeStatus?.onboarding_complete ? 'Payouts are enabled.' : 'Complete Stripe onboarding to receive payments.'} />
            {!stripeStatus?.onboarding_complete && <AppButton title="Set Up Stripe" onPress={startStripeOnboarding} style={{ marginTop: 14 }} />}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recent orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VendorOrders')}>
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            </View>

            {orders.slice(0, 5).map(order => (
              <View key={order.id} style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>Order #{order.id}</Text>
                  <Text style={styles.orderSub}>{order.shopper_name} · {order.fulfillment_type}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.orderTotal}>${Number(order.total || 0).toFixed(2)}</Text>
                  <StatusBadge status={order.status} />
                </View>
              </View>
            ))}

            {!orders.length && <Text style={styles.emptyText}>Orders will appear here when customers purchase from your store.</Text>}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Inventory alerts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VendorProducts')}>
                <Text style={styles.linkText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {products.filter(p => Number(p.quantity_available || 0) <= 3).slice(0, 5).map(product => (
              <View key={product.id} style={styles.productRow}>
                <Image source={product.image_url ? { uri: product.image_url } : IMAGE_ASSETS.products.default} style={styles.productThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSub}>{product.quantity_available} available · ${Number(product.price || 0).toFixed(2)}</Text>
                </View>
              </View>
            ))}

            {!products.filter(p => Number(p.quantity_available || 0) <= 3).length && <Text style={styles.emptyText}>No low-inventory alerts right now.</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Health({ ok, title, sub }) {
  return (
    <View style={styles.healthRow}>
      <View style={[styles.healthDot, ok && styles.healthGood]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.healthTitle}>{title}</Text>
        <Text style={styles.healthSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  emptyWrap: { flex: 1, padding: LAYOUT.screenPadding, justifyContent: 'center' },
  scroll: { paddingBottom: 118 },
  hero: { height: 310, backgroundColor: COLORS.forestDark },
  heroImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23, 50, 31, 0.42)' },
  heroContent: { position: 'absolute', left: 22, right: 22, bottom: 28 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.cream, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontFamily: FONTS.display, fontSize: 39, lineHeight: 45, color: COLORS.warmWhite, marginTop: 6 },
  subtitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.cream, marginTop: 8 },
  insightGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: LAYOUT.screenPadding, marginTop: 14 },
  sectionCard: { marginHorizontal: LAYOUT.screenPadding, marginTop: 18, backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, ...SHADOWS.soft },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark },
  linkText: { fontFamily: FONTS.bodyBold, color: COLORS.sage, fontSize: 13 },
  healthRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 14 },
  healthDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.gold },
  healthGood: { backgroundColor: COLORS.success },
  healthTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark },
  healthSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 2, lineHeight: 17 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  orderTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark },
  orderSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 3, textTransform: 'capitalize' },
  orderTotal: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forest },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productThumb: { width: 52, height: 52, borderRadius: RADIUS.md },
  productName: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark },
  productSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 3 },
  emptyText: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 14 },
});
