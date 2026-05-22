import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar, SafeAreaView, Platform, Linking } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

const C = {
  sage: '#4A6741', darkBrown: '#2A1A08', cream: '#F0E6D3',
  cardBg: '#FAF5ED', rootBg: '#D4C4A8', textMid: '#5C3818',
  textLight: '#9C7A50', feedbackBg: '#4A6741', gold2: '#8C6A30',
};

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

export default function ProducerScreen({ route, navigation, API, token, cart, setCart }) {
  const { producer } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/producer/${producer.id}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    setLoading(false);
  }

  function addToCart(product) {
    if (cart && cart.producer_id !== producer.id) {
      Alert.alert('Replace cart?', 'Your cart has items from another producer.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', onPress: () => {
          setCart({ producer_id: producer.id, producer_name: producer.shop_name, tax_rate: producer.tax_rate || 0.08375, delivery_fee: producer.delivery_fee || 0, items: [{ product_id: product.id, name: product.name, price: product.price, unit: product.unit, quantity: 1 }] });
          Alert.alert('Added!', `${product.name} added to cart`);
        }}
      ]);
      return;
    }
    const newCart = cart ? { ...cart, items: [...cart.items] } : { producer_id: producer.id, producer_name: producer.shop_name, tax_rate: producer.tax_rate || 0.08375, delivery_fee: producer.delivery_fee || 0, items: [] };
    const existing = newCart.items.find(i => i.product_id === product.id);
    if (existing) { existing.quantity++; }
    else { newCart.items.push({ product_id: product.id, name: product.name, price: product.price, unit: product.unit, quantity: 1 }); }
    setCart(newCart);
    Alert.alert('Added! 🛒', `${product.name} added to cart`);
  }

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <BotanicalBackground />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            <View style={styles.header}>

              {/* Back button */}
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🌾</Text>
              </View>
              <Text style={styles.shopName}>{producer.shop_name}</Text>
              <Text style={styles.location}>📍 {producer.city}, {producer.state}</Text>
              <View style={styles.badges}>
                {producer.fulfillment_pickup && <View style={styles.badge}><Text style={styles.badgeText}>🚗 Pickup</Text></View>}
                {producer.fulfillment_delivery && <View style={styles.badge}><Text style={styles.badgeText}>🚚 Delivery</Text></View>}
                {producer.avg_rating > 0 && <View style={styles.badge}><Text style={styles.badgeText}>⭐ {parseFloat(producer.avg_rating).toFixed(1)}</Text></View>}
              </View>
              <Text style={styles.sectionTitle}>Available Products</Text>
            </View>
          }
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={C.sage} style={{ marginTop: 40 }} />
              : <View style={styles.emptyWrap}><Text style={styles.empty}>No products listed yet</Text></View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSub}>${item.price?.toFixed(2)} / {item.unit}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
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
  header: { alignItems: 'center', marginBottom: 16, paddingTop: 8 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 12 },
  backText: { fontFamily: 'DMSans_400Regular', fontSize: 16, color: C.darkBrown, fontWeight: '600' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.cardBg, borderWidth: 3, borderColor: C.gold2, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: C.gold2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  avatarText: { fontSize: 36 },
  shopName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.darkBrown, marginBottom: 4, textAlign: 'center' },
  location: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { backgroundColor: 'rgba(74,103,65,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.sage, fontWeight: '600' },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.darkBrown, alignSelf: 'flex-start', marginBottom: 8 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#5A320A', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  productInfo: { flex: 1 },
  productName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  productSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginTop: 3 },
  addBtn: { backgroundColor: C.sage, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 13 },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  empty: { fontFamily: 'DMSans_400Regular', color: C.textLight, fontSize: 14 },
  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});