import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, SafeAreaView, Platform, Linking } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';

const C = {
  rust: '#B85C2A', gold: '#C9A84C', sage: '#4A6741',
  darkBrown: '#2A1A08', cardBg: '#FAF5ED', rootBg: '#EDE8DC',
  textMid: '#5C3818', textLight: '#9C7A50', feedbackBg: '#4A6741',
};

const CARD_GRADIENT = [C.rust, C.gold, C.sage, C.gold, C.rust];

const STATUS_COLOR = {
  pending: '#C8901A', confirmed: '#4A6741', ready_for_pickup: '#2E7D32',
  out_for_delivery: '#2E7D32', fulfilled: '#666', cancelled: '#B43C1E', auto_cancelled: '#B43C1E'
};
const STATUS_LABEL = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', ready_for_pickup: '📦 Ready',
  out_for_delivery: '🚚 On the way', fulfilled: '✔ Completed',
  cancelled: '✗ Cancelled', auto_cancelled: '✗ Auto-cancelled'
};

export default function OrdersScreen({ API, token, user, cart, navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  useEffect(() => {
    if (token) loadOrders();
    else setLoading(false);
  }, [token]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/my`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    setLoading(false);
  }

  if (!fontsLoaded) return null;

  if (!token) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
        <SafeAreaView style={styles.safeArea}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Sign in to view your orders</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.getParent().navigate('Auth')}>
              <Text style={styles.btnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
        <SafeAreaView style={styles.safeArea}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.centered}>
            <ActivityIndicator color={C.sage} size="large" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!orders.length) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
        <SafeAreaView style={styles.safeArea}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No orders yet 🌾</Text>
            <Text style={styles.emptySub}>Start shopping!</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <SafeAreaView style={styles.safeArea}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            <View>
              <Text style={styles.pageTitle}>My Orders</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <LinearGradient
                colors={CARD_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.orderBar}
              />
              <View style={styles.orderInner}>
                <View style={styles.orderTop}>
                  <Text style={styles.producerName}>{item.shop_name || 'Producer'}</Text>
                  <Text style={[styles.status, { color: STATUS_COLOR[item.status] || '#666' }]}>
                    {STATUS_LABEL[item.status] || item.status}
                  </Text>
                </View>
                <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.orderItems}>{item.fulfillment_type}</Text>
                <Text style={styles.orderTotal}>${parseFloat(item.total || 0).toFixed(2)}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      </SafeAreaView>

      <TouchableOpacity
        style={styles.feedbackButton}
        onPress={() => Linking.openURL('https://forms.gle/bUWcVYSsHYb8RQuE6')}
        activeOpacity={0.85}>
        <Text style={styles.feedbackText}>💬 Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: '#9C7A50', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#9C7A50', textAlign: 'center' },
  btn: { backgroundColor: C.sage, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 16 },
  btnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 15 },
  pageTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.darkBrown, marginBottom: 16 },
  orderCard: { backgroundColor: C.cardBg, borderRadius: 20, overflow: 'hidden', marginBottom: 12, shadowColor: '#5A320A', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  orderBar: { height: 4, width: '100%' },
  orderInner: { padding: 16 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  producerName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  status: { fontFamily: 'DMSans_400Regular', fontSize: 12, fontWeight: '700' },
  orderDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginBottom: 4 },
  orderItems: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMid, marginBottom: 8 },
  orderTotal: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.sage },
  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});