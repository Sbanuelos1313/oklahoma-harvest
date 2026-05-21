import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, StatusBar, SafeAreaView, Platform, Linking } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  rust: '#B85C2A', gold: '#C9A84C', sage: '#4A6741',
  darkBrown: '#2A1A08', cream: '#F0E6D3', cardBg: '#FAF5ED',
  rootBg: '#D4C4A8', textMid: '#5C3818', textLight: '#9C7A50',
  feedbackBg: '#4A6741', gold2: '#8C6A30',
};

const CARD_GRADIENT = [C.rust, C.gold, C.sage, C.gold, C.rust];
const TILE_W = 110; const TILE_H = 110; const COLS = 4; const ROWS = 9;

const BotanicalBackground = () => {
  const tiles = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      tiles.push({ key: `${row}-${col}`, x: col * TILE_W, y: row * TILE_H });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#FAF5ED', opacity: 0.55 }} />
      <View style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#D4B888', opacity: 0.3 }} />
      <View style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#9C7840', opacity: 0.25 }} />
      {tiles.map(({ key, x, y }) => (
        <View key={key} style={{ position: 'absolute', left: x, top: y, width: TILE_W, height: TILE_H }}>
          <View style={{ position: 'absolute', left: 18, top: 28, width: 1.2, height: 77, backgroundColor: '#8C6A20', opacity: 0.3, borderRadius: 1 }} />
          <View style={{ position: 'absolute', left: 15, top: 20, width: 6, height: 16, backgroundColor: '#8C6A20', opacity: 0.28, borderRadius: 3 }} />
          <View style={{ position: 'absolute', left: 9, top: 32, width: 6, height: 14, backgroundColor: '#8C6A20', opacity: 0.22, borderRadius: 3, transform: [{ rotate: '18deg' }] }} />
          <View style={{ position: 'absolute', left: 21, top: 32, width: 6, height: 14, backgroundColor: '#8C6A20', opacity: 0.22, borderRadius: 3, transform: [{ rotate: '-18deg' }] }} />
          <View style={{ position: 'absolute', left: 85, top: 72, width: 1, height: 33, backgroundColor: '#4A6A2A', opacity: 0.22, borderRadius: 1 }} />
          {[0, 45, 90, 135].map((deg, i) => (
            <View key={i} style={{ position: 'absolute', left: 82, top: 62, width: 6, height: 14, backgroundColor: '#C8A870', opacity: 0.25, borderRadius: 3, transform: [{ rotate: `${deg}deg` }] }} />
          ))}
          <View style={{ position: 'absolute', left: 80, top: 67, width: 10, height: 10, backgroundColor: '#B8861A', opacity: 0.25, borderRadius: 5 }} />
          <View style={{ position: 'absolute', left: 60, top: 34, width: 18, height: 7, backgroundColor: '#4A6A2A', opacity: 0.18, borderRadius: 3, transform: [{ rotate: '-28deg' }] }} />
          <View style={{ position: 'absolute', left: 35, top: 79, width: 5, height: 5, backgroundColor: '#9C7A30', opacity: 0.18, borderRadius: 2.5 }} />
          <View style={{ position: 'absolute', left: 52, top: 85, width: 6, height: 6, backgroundColor: '#C8901A', opacity: 0.20, borderRadius: 3 }} />
        </View>
      ))}
    </View>
  );
};

export default function CartScreen({ API, token, cart, setCart, navigation }) {
  const [fulfillType, setFulfillType] = useState('pickup');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  if (!fontsLoaded) return null;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
        <BotanicalBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>Find fresh local products near you</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.btnText}>Shop Local</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const sub = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = sub * (cart.tax_rate || 0.08375);
  const dFee = fulfillType === 'delivery' ? (cart.delivery_fee || 0) : 0;
  const total = sub + tax + dFee;

  function changeQty(idx, delta) {
    const newItems = [...cart.items];
    newItems[idx].quantity += delta;
    if (newItems[idx].quantity <= 0) newItems.splice(idx, 1);
    if (newItems.length === 0) { setCart(null); return; }
    setCart({ ...cart, items: newItems });
  }

  async function doCheckout() {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to checkout', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.getParent().navigate('Auth') }
      ]);
      return;
    }
    try {
      const res = await fetch(`${API}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100), producer_id: cart.producer_id })
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.detail || 'Payment setup failed'); return; }
      const { error: initError } = await initPaymentSheet({ merchantDisplayName: 'From Our Place', paymentIntentClientSecret: data.client_secret, style: 'automatic' });
      if (initError) { Alert.alert('Error', initError.message); return; }
      const { error: payError } = await presentPaymentSheet();
      if (payError) { if (payError.code !== 'Canceled') Alert.alert('Payment failed', payError.message); return; }
      const orderRes = await fetch(`${API}/api/orders/from-payment`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ producer_id: cart.producer_id, items: cart.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })), fulfillment_type: fulfillType, payment_intent_id: data.payment_intent_id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { Alert.alert('Error', orderData.detail || 'Order failed'); return; }
      setCart(null);
      Alert.alert('Order placed! 🌾', 'The producer has 12 hours to confirm your order.');
      navigation.navigate('Orders');
    } catch { Alert.alert('Error', 'Something went wrong. Please try again.'); }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <BotanicalBackground />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={cart.items}
          keyExtractor={(item, idx) => String(idx)}
          ListHeaderComponent={
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Your Cart</Text>
              <Text style={styles.producerName}>From {cart.producer_name}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>${item.price?.toFixed(2)} / {item.unit}</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, -1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          )}
          ListFooterComponent={
            <View>
              <View style={styles.fulfillRow}>
                <TouchableOpacity style={[styles.fulfillOpt, fulfillType === 'pickup' && styles.fulfillActive]} onPress={() => setFulfillType('pickup')}>
                  <Text style={[styles.fulfillText, fulfillType === 'pickup' && styles.fulfillTextActive]}>🚗 Pickup</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fulfillOpt, fulfillType === 'delivery' && styles.fulfillActive]} onPress={() => setFulfillType('delivery')}>
                  <Text style={[styles.fulfillText, fulfillType === 'delivery' && styles.fulfillTextActive]}>🚚 Delivery +${(cart.delivery_fee || 0).toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryCard}>
                <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.summaryBar} />
                <View style={styles.summaryInner}>
                  <View style={styles.sumRow}><Text style={styles.sumLabel}>Subtotal</Text><Text style={styles.sumVal}>${sub.toFixed(2)}</Text></View>
                  <View style={styles.sumRow}><Text style={styles.sumLabel}>Tax</Text><Text style={styles.sumVal}>${tax.toFixed(2)}</Text></View>
                  {dFee > 0 && <View style={styles.sumRow}><Text style={styles.sumLabel}>Delivery</Text><Text style={styles.sumVal}>${dFee.toFixed(2)}</Text></View>}
                  <View style={styles.sumRowTotal}>
                    <Text style={styles.sumTotalLabel}>Total</Text>
                    <Text style={styles.sumTotalVal}>${total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={doCheckout}>
                <Text style={styles.checkoutText}>💳 Checkout · ${total.toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      </SafeAreaView>
      <TouchableOpacity style={styles.feedbackButton} onPress={() => Linking.openURL('https://forms.gle/bUWcVYSsHYb8RQuE6')} activeOpacity={0.85}>
        <Text style={styles.feedbackText}>💬 Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.darkBrown, marginBottom: 8 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: C.sage, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 15 },
  cartHeader: { marginBottom: 16 },
  cartTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: C.darkBrown, marginBottom: 4 },
  producerName: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#5A320A', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  itemSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: C.darkBrown },
  qty: { fontFamily: 'DMSans_400Regular', fontSize: 15, fontWeight: '700', color: C.darkBrown, minWidth: 20, textAlign: 'center' },
  itemTotal: { fontFamily: 'DMSans_400Regular', fontSize: 14, fontWeight: '700', color: C.sage },
  fulfillRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  fulfillOpt: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.cardBg, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)' },
  fulfillActive: { backgroundColor: C.sage, borderColor: C.sage },
  fulfillText: { fontFamily: 'DMSans_400Regular', fontSize: 13, fontWeight: '600', color: C.textLight },
  fulfillTextActive: { color: 'white' },
  summaryCard: { backgroundColor: C.cardBg, borderRadius: 20, overflow: 'hidden', marginBottom: 16, shadowColor: '#5A320A', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  summaryBar: { height: 4, width: '100%' },
  summaryInner: { padding: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textLight },
  sumVal: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  sumRowTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(90,50,10,0.08)' },
  sumTotalLabel: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.darkBrown },
  sumTotalVal: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.sage },
  checkoutBtn: { backgroundColor: C.sage, borderRadius: 16, padding: 18, alignItems: 'center' },
  checkoutText: { fontFamily: 'DMSans_400Regular', color: 'white', fontSize: 17, fontWeight: '700' },
  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});