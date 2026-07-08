import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import { COLORS, FONTS, LAYOUT } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function RecentlyViewedScreen({ user, cart, navigation, route }) {
  const products = route?.params?.products || [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <FlatList
          data={products}
          keyExtractor={(item, idx) => String(item.id || idx)}
          numColumns={2}
          columnWrapperStyle={products.length ? styles.row : null}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<><Text style={styles.eyebrow}>Browsing</Text><Text style={styles.title}>Recently viewed</Text></>}
          ListEmptyComponent={<EmptyState image={IMAGE_ASSETS.products.default} title="No recent products" message="Products you view will appear here so you can quickly find them again." buttonTitle="Discover Products" onPress={() => navigation.navigate('Main', { screen: 'Search' })} />}
          renderItem={({ item }) => <View style={styles.cell}><ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { product: item })} /></View>}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 8 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  cell: { width: '48%' },
});
