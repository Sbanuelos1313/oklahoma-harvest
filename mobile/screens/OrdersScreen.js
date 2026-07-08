import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet,
  ActivityIndicator, StatusBar, SafeAreaView, RefreshControl
} from 'react-native';

import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

const STATUS_LABELS = {
  pending: 'Pending vendor confirmation',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  fulfilled: 'Completed',
  cancelled: 'Cancelled',
  auto_cancelled: 'Auto-cancelled',
};

export default function OrdersScreen({ API, token, user, cart, navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token && token !== 'guest') loadOrders();
      else setLoading(false);
    });
    if (token && token !== 'guest') loadOrders();
    else setLoading(false);
    return unsubscribe;
  }, [token, navigation]);

  async function loadOrders(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API}/api/orders/my`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (!token || token === 'guest') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
        <SafeAreaView style={styles.safe}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.emptyWrap}>
            <EmptyState
              image={IMAGE_ASSETS.hero.checkout}
              title="Sign in to view orders"
              message="Create an account or sign in to see order history, confirmations, pickup updates, and receipts."
              buttonTitle="Sign In"
              onPress={() => navigation.getParent()?.navigate('Auth') || navigation.navigate('Auth')}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
        <SafeAreaView style={styles.safe}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.forest} />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />

        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor={COLORS.forest} />}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.eyebrow}>Purchases</Text>
              <Text style={styles.title}>My orders</Text>
              <Text style={styles.subtitle}>Track confirmations, pickup status, delivery updates, and completed local purchases.</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              image={IMAGE_ASSETS.vendor.default}
              title="No orders yet"
              message="Start shopping local vendors and your orders will appear here."
              buttonTitle="Shop Local"
              onPress={() => navigation.navigate('Home')}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>Order #{item.id}</Text>
                  <Text style={styles.shopName}>{item.shop_name || 'Local Vendor'}</Text>
                </View>
                <Text style={styles.total}>${Number(item.total || 0).toFixed(2)}</Text>
              </View>

              <StatusBadge status={item.status} label={STATUS_LABELS[item.status] || item.status} />

              <View style={styles.orderMeta}>
                <View style={styles.metaItem}>
                  <Image source={IMAGE_ASSETS.icons.location} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{item.city || 'Local vendor'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Image
                    source={item.fulfillment_type === 'delivery' ? IMAGE_ASSETS.icons.delivery : item.fulfillment_type === 'shipping' ? IMAGE_ASSETS.icons.shipping : IMAGE_ASSETS.icons.pickup}
                    style={styles.metaIcon}
                  />
                  <Text style={styles.metaText}>{item.fulfillment_type}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <AppButton title="View Details" variant="outline" style={styles.actionBtn} onPress={() => navigation.getParent()?.navigate('OrderDetail', { order: item })} />
                {item.status === 'fulfilled' ? (
                  <AppButton title="Leave Review" variant="secondary" style={styles.actionBtn} onPress={() => navigation.getParent()?.navigate('LeaveReview', { order: item })} />
                ) : (
                  <AppButton title="Shop Again" variant="secondary" style={styles.actionBtn} onPress={() => navigation.navigate('Home')} />
                )}
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  emptyWrap: { flex: 1, padding: LAYOUT.screenPadding, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  headerBlock: { marginTop: 8, marginBottom: 18 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 6 },
  orderCard: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, ...SHADOWS.soft },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  orderNumber: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.sage },
  shopName: { fontFamily: FONTS.display, fontSize: 23, color: COLORS.forestDark, marginTop: 3 },
  total: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forest },
  orderMeta: { flexDirection: 'row', gap: 12, marginTop: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon: { width: 20, height: 20 },
  metaText: { fontFamily: FONTS.bodyBold, color: COLORS.brownSoft, fontSize: 12, textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, minHeight: 44 },
});
