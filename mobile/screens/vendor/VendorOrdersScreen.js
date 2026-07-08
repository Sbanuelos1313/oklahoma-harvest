import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, RefreshControl
} from 'react-native';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

const NEXT_ACTIONS = {
  pending: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Cancel', status: 'cancelled', variant: 'outline' }
  ],
  confirmed: [
    { label: 'Ready for Pickup', status: 'ready_for_pickup' },
    { label: 'Out for Delivery', status: 'out_for_delivery', variant: 'secondary' }
  ],
  ready_for_pickup: [{ label: 'Mark Fulfilled', status: 'fulfilled' }],
  out_for_delivery: [{ label: 'Mark Fulfilled', status: 'fulfilled' }],
};

export default function VendorOrdersScreen({ API, token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API}/api/orders/producer/incoming`, {
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

  async function updateStatus(orderId, status) {
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to update');
      loadOrders();
    } catch (e) {
      Alert.alert('Order update failed', e.message || 'Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.forest} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor={COLORS.forest} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Vendor orders</Text>
              <Text style={styles.title}>Incoming orders</Text>
              <Text style={styles.subtitle}>Confirm, prepare, and complete customer orders from your local storefront.</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              image={IMAGE_ASSETS.hero.checkout}
              title="No orders yet"
              message="Orders will appear here once customers purchase from your store."
              buttonTitle="Refresh"
              onPress={() => loadOrders()}
            />
          }
          renderItem={({ item }) => {
            const actions = NEXT_ACTIONS[item.status] || [];
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumber}>Order #{item.id}</Text>
                    <Text style={styles.customer}>{item.shopper_name || 'Customer'}</Text>
                  </View>
                  <Text style={styles.total}>${Number(item.total || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <StatusBadge status={item.status} />
                  <Text style={styles.badge}>{item.fulfillment_type || 'pickup'}</Text>
                  {item.hours_remaining !== null && item.status === 'pending' && (
                    <Text style={styles.warning}>{Number(item.hours_remaining || 0).toFixed(1)} hrs left</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  {actions.map(action => (
                    <AppButton
                      key={action.status}
                      title={action.label}
                      variant={action.variant || 'primary'}
                      onPress={() => updateStatus(item.id, action.status)}
                      style={styles.actionBtn}
                    />
                  ))}
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  header: { paddingTop: 14, marginBottom: 18 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 6 },
  card: {
    backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 16, ...SHADOWS.soft
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  orderNumber: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.sage },
  customer: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark, marginTop: 3 },
  total: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forest },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' },
  badge: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.forest, backgroundColor: COLORS.sageSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, overflow: 'hidden', textTransform: 'capitalize' },
  warning: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.rust, backgroundColor: '#FDE8DC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, minWidth: 130, minHeight: 44 },
});
