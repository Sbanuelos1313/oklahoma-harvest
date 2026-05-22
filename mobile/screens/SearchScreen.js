import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform, Linking } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import AppHeader from '../components/AppHeader';

const C = {
  sage: '#4A6741', darkBrown: '#2A1A08', cream: '#F0E6D3',
  cardBg: '#FAF5ED', rootBg: '#EDE8DC', textMid: '#5C3818',
  textLight: '#9C7A50', feedbackBg: '#4A6741',
};

export default function SearchScreen({ API, token, user, cart, setCart, navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res = await fetch(`${API}/api/products/search?q=${encodeURIComponent(query)}&lat=35.4676&lng=-97.5164`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    setLoading(false);
  }

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <SafeAreaView style={styles.safeArea}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, farms..."
              placeholderTextColor={C.textLight}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <Text style={{ fontSize: 16, color: C.textLight }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={C.sage} style={{ marginTop: 40 }} />}

        {!loading && searched && results.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No results for "{query}"</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        )}

        {!loading && !searched && (
          <View style={styles.centered}>
            <Text style={styles.hintText}>Search for eggs, honey, vegetables and more</Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigation.navigate('Producer', { producer: { id: item.producer_id, shop_name: item.shop_name, city: item.city, state: item.state, tax_rate: 0.08375, delivery_fee: 0, fulfillment_pickup: item.fulfillment_pickup, fulfillment_delivery: item.fulfillment_delivery } })}
              activeOpacity={0.8}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultShop}>{item.shop_name} · {item.city}</Text>
                <Text style={styles.resultPrice}>${item.price?.toFixed(2)} / {item.unit}</Text>
              </View>
              <View style={styles.badges}>
                {item.fulfillment_pickup && <View style={styles.badge}><Text style={styles.badgeText}>🚗</Text></View>}
                {item.fulfillment_delivery && <View style={styles.badge}><Text style={styles.badgeText}>🚚</Text></View>}
              </View>
            </TouchableOpacity>
          )}
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

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.cream },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 10, gap: 8, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)' },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  searchBtn: { backgroundColor: C.sage, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  searchBtnText: { color: 'white', fontFamily: 'DMSans_400Regular', fontWeight: '700', fontSize: 13 },

  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: C.darkBrown, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, textAlign: 'center' },
  hintText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textLight, textAlign: 'center' },

  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#5A320A', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  resultInfo: { flex: 1 },
  resultName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  resultShop: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginTop: 2 },
  resultPrice: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.sage, fontWeight: '600', marginTop: 4 },
  badges: { flexDirection: 'row', gap: 4 },
  badge: { backgroundColor: 'rgba(74,103,65,0.1)', borderRadius: 8, padding: 4 },
  badgeText: { fontSize: 14 },

  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});