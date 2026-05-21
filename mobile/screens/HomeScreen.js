import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform, Linking } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import AppHeader from '../components/AppHeader';

const C = {
  sage: '#4A6741', darkBrown: '#2A1A08', cream: '#F0E6D3',
  cardBg: '#FAF5ED', rootBg: '#EDE8DC', textMid: '#5C3818',
  textLight: '#9C7A50', feedbackBg: '#4A6741', gold2: '#8C6A30',
};

export default function HomeScreen({ API, token, user, cart, setCart, navigation }) {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState('');

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  useEffect(() => { loadProducers(); }, []);

  async function loadProducers(zipCode) {
    setLoading(true);
    try {
      const lat = 35.4676, lng = -97.5164;
      const url = `${API}/api/producers/nearby?lat=${lat}&lng=${lng}&radius_miles=50`;
      const res = await fetch(url);
      const data = await res.json();
      setProducers(Array.isArray(data) ? data : []);
    } catch { setProducers([]); }
    setLoading(false);
  }

// In HomeScreen.tsx or wherever voice log lives
const { consentStatus, showConsentModal, requestConsent, handleAccept, handleDecline } = useAIConsent();

// Before triggering any AI feature:
const handleVoiceLog = () => {
  if (consentStatus !== 'granted') {
    requestConsent();
    return;
  }
  // proceed with AI call
};

// In your JSX:
<AIConsentModal
  visible={showConsentModal}
  onAccept={handleAccept}
  onDecline={handleDecline}
/>

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning 🌅' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
  const name = user ? `, ${user.full_name.split(' ')[0]}!` : '!';

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <SafeAreaView style={styles.safeArea}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <FlatList
          data={producers}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            <View style={styles.subHeader}>
              <Text style={styles.greeting}>{greeting}{name}</Text>
              <Text style={styles.title}>Find local shops near you</Text>

              {/* Zip search */}
              <View style={styles.searchBar}>
                <Text>📍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter zip code to find shops..."
                  placeholderTextColor={C.textLight}
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TouchableOpacity style={styles.goBtn} onPress={() => loadProducers(zip)}>
                  <Text style={styles.goBtnText}>Go</Text>
                </TouchableOpacity>
              </View>

              {/* Category row */}
              <TouchableOpacity style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>📋</Text>
                <Text style={styles.categoryText}>All Categories</Text>
                <Text style={styles.categoryChevron}>›</Text>
              </TouchableOpacity>

              {/* Section header */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Producers Near You</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.producerCard}
              onPress={() => navigation.navigate('Producer', { producer: item })}
              activeOpacity={0.8}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>🏪</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.shop_name}</Text>
                <Text style={styles.cardSub}>
                  📍 {item.city}, {item.state}
                  {item.distance_miles ? `  ·  ${item.distance_miles.toFixed(1)} mi` : ''}
                </Text>
                <View style={styles.badgeRow}>
                  {item.fulfillment_pickup && <View style={styles.badge}><Text style={styles.badgeText}>🚗 Pickup</Text></View>}
                  {item.fulfillment_delivery && <View style={styles.badge}><Text style={styles.badgeText}>🚚 Delivery</Text></View>}
                  {item.avg_rating > 0 && <View style={styles.badge}><Text style={styles.badgeText}>⭐ {parseFloat(item.avg_rating).toFixed(1)}</Text></View>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => navigation.navigate('Producer', { producer: item })}>
                <Text style={styles.shopBtnText}>Shop →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={C.sage} style={{ marginTop: 40 }} />
              : <Text style={styles.empty}>No producers found nearby</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
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

  subHeader: { backgroundColor: C.cream, padding: 16, paddingBottom: 12 },
  greeting: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.darkBrown, marginBottom: 14 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 10, gap: 8, marginBottom: 10, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)' },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  goBtn: { backgroundColor: C.sage, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  goBtnText: { color: 'white', fontFamily: 'DMSans_400Regular', fontWeight: '700', fontSize: 12 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)', gap: 8 },
  categoryIcon: { fontSize: 16 },
  categoryText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  categoryChevron: { fontSize: 20, color: C.textLight },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.darkBrown },
  seeAll: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.sage, fontWeight: '600' },

  producerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, shadowColor: '#5A320A', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.cream, borderWidth: 2, borderColor: '#8C6A30', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconText: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  cardSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: 'rgba(74,103,65,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.sage, fontWeight: '600' },
  shopBtn: { backgroundColor: C.sage, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8 },
  shopBtnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 12 },

  empty: { fontFamily: 'DMSans_400Regular', textAlign: 'center', color: C.textLight, marginTop: 40 },

  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});