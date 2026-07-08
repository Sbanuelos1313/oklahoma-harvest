import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import VendorCard from '../components/VendorCard';
import { COLORS, FONTS, LAYOUT } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function FavoritesScreen({ API, token, user, cart, navigation }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFavorites(); }, []);

  async function loadFavorites() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/favorites/producers`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch {
      setVendors([]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.forest} /><Text style={styles.muted}>Loading saved vendors...</Text></View>
        ) : (
          <FlatList
            data={vendors}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<><Text style={styles.eyebrow}>Saved</Text><Text style={styles.title}>Favorite vendors</Text></>}
            ListEmptyComponent={<EmptyState image={IMAGE_ASSETS.vendor.default} title="No saved vendors yet" message="Save vendors you love so you can find them quickly next time." buttonTitle="Discover Vendors" onPress={() => navigation.navigate('Search')} />}
            renderItem={({ item }) => <VendorCard vendor={item} onPress={() => navigation.navigate('Producer', { producer: item })} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 8 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
});
