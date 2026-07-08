import React, { useMemo, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Alert, StatusBar, SafeAreaView, ScrollView
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import QuantitySelector from '../components/QuantitySelector';
import EmptyState from '../components/EmptyState';

import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function CartScreen({ API, token, user, cart, setCart, navigation }) {
  const [fulfillType, setFulfillType] = useState('pickup');
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const totals = useMemo(() => {
    const subtotal = cart?.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) || 0;
    const tax = subtotal * (cart?.tax_rate || 0.08375);
    const deliveryFee = fulfillType === 'delivery' ? (cart?.delivery_fee || 0) : 0;
    const total = subtotal + tax + deliveryFee;
    return { subtotal, tax, deliveryFee, total };
  }, [cart, fulfillType]);

  function updateQty(index, delta) {
    const items = [...cart.items];
    items[index].quantity += delta;
    if (items[index].quantity <= 0) items.splice(index, 1);
    if (!items.length) setCart(null);
    else setCart({ ...cart, items });
  }

  function removeItem(index) {
    const items = [...cart.items];
    items.splice(index, 1);
    if (!items.length) setCart(null);
    else setCart({ ...cart, items });
  }

  async function doCheckout() {
    if (!token || token === 'guest') {
      Alert.alert('Sign in required', 'Please sign in to complete checkout.');
      return;
    }

    if (!cart?.items?.length) return;

    setLoading(true);
    try {
      const paymentRes = await fetch(`${API}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totals.total * 100), producer_id: cart.producer_id })
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.detail || 'Payment setup failed.');

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'From Our Place',
        paymentIntentClientSecret: paymentData.client_secret,
        style: 'automatic'
      });
      if (initError) throw new Error(initError.message);

      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') throw new Error(payError.message);
        setLoading(false);
        return;
      }

      const orderRes = await fetch(`${API}/api/orders/from-payment`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producer_id: cart.producer_id,
          items: cart.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          fulfillment_type: fulfillType,
          payment_intent_id: paymentData.payment_intent_id
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.detail || 'Order could not be placed.');

      setCart(null);
      navigation.getParent()?.navigate('OrderConfirmation', { order: orderData, fulfillmentType: fulfillType });
    } catch (e) {
      Alert.alert('Checkout error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
        <SafeAreaView style={styles.safe}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.emptyWrap}>
            <EmptyState
              image={IMAGE_ASSETS.hero.checkout}
              title="Your cart is empty"
              message="Browse local vendors and add fresh food, handmade goods, gifts, wellness products, and market finds."
              buttonTitle="Start Shopping"
              onPress={() => navigation.navigate('Home')}
            />
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

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Checkout</Text>
          <Text style={styles.title}>Your cart</Text>
          <Text style={styles.vendorLine}>From {cart.producer_name}</Text>

          <View style={styles.fulfillmentCard}>
            <Text style={styles.cardTitle}>Fulfillment</Text>
            <View style={styles.fulfillRow}>
              {['pickup', 'delivery', 'shipping'].map(option => (
                <TouchableOpacity key={option} style={[styles.fulfillOption, fulfillType === option && styles.fulfillActive]} onPress={() => setFulfillType(option)}>
                  <Image source={option === 'pickup' ? IMAGE_ASSETS.icons.pickup : option === 'delivery' ? IMAGE_ASSETS.icons.delivery : IMAGE_ASSETS.icons.shipping} style={styles.fulfillIcon} />
                  <Text style={[styles.fulfillText, fulfillType === option && styles.fulfillTextActive]}>{option[0].toUpperCase() + option.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {cart.items.map((item, index) => (
            <View key={`${item.product_id}-${index}`} style={styles.itemCard}>
              <Image source={item.image_url ? { uri: item.image_url } : IMAGE_ASSETS.products.default} style={styles.itemImage} />
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>${Number(item.price || 0).toFixed(2)} / {item.unit}</Text>
                <View style={styles.itemFooter}>
                  <QuantitySelector quantity={item.quantity} onDecrease={() => updateQty(index, -1)} onIncrease={() => updateQty(index, 1)} />
                  <TouchableOpacity onPress={() => removeItem(index)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.lineTotal}>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Order summary</Text>
            <Row label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
            <Row label="Estimated tax" value={`$${totals.tax.toFixed(2)}`} />
            {fulfillType === 'delivery' && <Row label="Delivery fee" value={`$${totals.deliveryFee.toFixed(2)}`} />}
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text></View>
            <AppButton title="Continue to Payment" onPress={doCheckout} loading={loading} style={styles.checkoutBtn} />
            <Text style={styles.note}>Your vendor will confirm the order. If they do not respond within 12 hours, the order is automatically cancelled and refunded.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  emptyWrap: { flex: 1, padding: LAYOUT.screenPadding, justifyContent: 'center' },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 8 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  vendorLine: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.brownSoft, marginTop: 2, marginBottom: 16 },
  fulfillmentCard: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, ...SHADOWS.soft },
  cardTitle: { fontFamily: FONTS.display, fontSize: 23, color: COLORS.forestDark, marginBottom: 12 },
  fulfillRow: { flexDirection: 'row', gap: 9 },
  fulfillOption: { flex: 1, minHeight: 88, borderRadius: RADIUS.lg, backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', padding: 8 },
  fulfillActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  fulfillIcon: { width: 28, height: 28, marginBottom: 8 },
  fulfillText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.forest },
  fulfillTextActive: { color: COLORS.warmWhite },
  itemCard: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, padding: 12, flexDirection: 'row', gap: 12, ...SHADOWS.soft },
  itemImage: { width: 86, height: 96, borderRadius: RADIUS.lg, backgroundColor: COLORS.beige },
  itemBody: { flex: 1 },
  itemName: { fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 20, color: COLORS.forestDark },
  itemMeta: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 4 },
  itemFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  removeText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.rust },
  lineTotal: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forest },
  summaryCard: { marginTop: 6, backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.card },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontFamily: FONTS.body, color: COLORS.brownSoft, fontSize: 14 },
  summaryValue: { fontFamily: FONTS.bodyBold, color: COLORS.brown, fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  totalLabel: { fontFamily: FONTS.display, color: COLORS.forestDark, fontSize: 24 },
  totalValue: { fontFamily: FONTS.display, color: COLORS.forest, fontSize: 26 },
  checkoutBtn: { marginTop: 14 },
  note: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: COLORS.brownSoft, textAlign: 'center', marginTop: 12 },
});
