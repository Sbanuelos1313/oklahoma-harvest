import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert
} from 'react-native';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorProductsScreen({ API, token, navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProducts);
    loadProducts();
    return unsubscribe;
  }, [navigation]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/my`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleProduct(product) {
    try {
      const res = await fetch(`${API}/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active })
      });

      if (!res.ok) throw new Error();
      loadProducts();
    } catch {
      Alert.alert('Unable to update product', 'Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.forest} />
            <Text style={styles.loadingText}>Loading products...</Text>
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
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Inventory</Text>
              <Text style={styles.title}>Products</Text>
              <Text style={styles.subtitle}>Manage what customers can discover and purchase from your storefront.</Text>
              <AppButton title="Add Product" onPress={() => navigation.getParent()?.navigate('VendorAddProduct')} style={{ marginTop: 16 }} />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              image={IMAGE_ASSETS.products.default}
              title="No products yet"
              message="Add products so customers can shop your local goods, handmade items, and market favorites."
              buttonTitle="Add Product"
              onPress={() => navigation.getParent()?.navigate('VendorAddProduct')}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image_url ? { uri: item.image_url } : IMAGE_ASSETS.products.default} style={styles.image} />
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.category}>{item.category}</Text>
                  </View>
                  <Text style={styles.price}>${Number(item.price || 0).toFixed(2)}</Text>
                </View>

                {!!item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{item.quantity_available} available</Text>
                  <Text style={styles.meta}>{item.unit}</Text>
                  <StatusBadge status={item.is_active ? 'active' : 'hidden'} label={item.is_active ? 'Active' : 'Hidden'} />
                </View>

                <View style={styles.actionRow}>
                  <AppButton title={item.is_active ? 'Hide' : 'Activate'} variant="outline" onPress={() => toggleProduct(item)} style={styles.smallBtn} />
                  <AppButton title="Edit" variant="secondary" onPress={() => navigation.getParent()?.navigate('VendorEditProduct', { product: item })} style={styles.smallBtn} />
                </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  header: { paddingTop: 14, marginBottom: 18 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 6 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 16, ...SHADOWS.soft },
  image: { width: '100%', height: 170, backgroundColor: COLORS.beige },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark },
  category: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.sage, marginTop: 3, textTransform: 'capitalize' },
  price: { fontFamily: FONTS.display, fontSize: 23, color: COLORS.forest },
  description: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.brown, marginTop: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' },
  meta: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.brownSoft, backgroundColor: COLORS.beige, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  smallBtn: { flex: 1, minHeight: 44 },
});
