import { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform, Linking, Modal, ScrollView } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import AppHeader from '../components/AppHeader';

const C = {
  sage: '#4A6741', darkBrown: '#2A1A08', cream: '#F0E6D3',
  cardBg: '#FAF5ED', rootBg: '#EDE8DC', textMid: '#5C3818',
  textLight: '#9C7A50', feedbackBg: '#4A6741', gold2: '#8C6A30',
  rust: '#B85C2A', gold: '#C9A84C',
};

const CATEGORIES = [
  { key: null,             label: 'All Categories',  image: require('../assets/images/categories/cat_all.jpg') },
  { key: 'vegetables',     label: 'Vegetables',       image: require('../assets/images/categories/cat_vegetables.jpg') },
  { key: 'fruit',          label: 'Fruit',            image: require('../assets/images/categories/cat_fruit.jpg') },
  { key: 'eggs_dairy',     label: 'Eggs & Dairy',     image: require('../assets/images/categories/cat_eggs_dairy.jpg') },
  { key: 'meat',           label: 'Meat',             image: require('../assets/images/categories/cat_meat.jpg') },
  { key: 'baked',          label: 'Baked Goods',      image: require('../assets/images/categories/cat_baked.jpg') },
  { key: 'honey',          label: 'Honey',            image: require('../assets/images/categories/cat_honey.jpg') },
  { key: 'jams',           label: 'Jams & Preserves', image: require('../assets/images/categories/cat_jams.jpg') },
  { key: 'herbs',          label: 'Herbs',            image: require('../assets/images/categories/cat_herbs.jpg') },
  { key: 'pantry',         label: 'Pantry',           image: require('../assets/images/categories/cat_pantry.jpg') },
  { key: 'sauces',         label: 'Sauces',           image: require('../assets/images/categories/cat_sauces.jpg') },
  { key: 'nuts',           label: 'Nuts',             image: require('../assets/images/categories/cat_nuts.jpg') },
  { key: 'coffee_tea',     label: 'Coffee & Tea',     image: require('../assets/images/categories/cat_coffee_tea.jpg') },
  { key: 'candy',          label: 'Candy',            image: require('../assets/images/categories/cat_candy.jpg') },
  { key: 'flowers',        label: 'Flowers',          image: require('../assets/images/categories/cat_flowers.jpg') },
  { key: 'plants',         label: 'Plants',           image: require('../assets/images/categories/cat_plants.jpg') },
  { key: 'candles',        label: 'Candles',          image: require('../assets/images/categories/cat_candles.jpg') },
  { key: 'soaps',          label: 'Soaps',            image: require('../assets/images/categories/cat_soaps.jpg') },
  { key: 'essential_oils', label: 'Essential Oils',   image: require('../assets/images/categories/cat_essential_oils.jpg') },
  { key: 'tinctures',      label: 'Tinctures',        image: require('../assets/images/categories/cat_tinctures.jpg') },
  { key: 'jewelry',        label: 'Jewelry',          image: require('../assets/images/categories/cat_jewelry.jpg') },
  { key: 'crafts',         label: 'Crafts',           image: require('../assets/images/categories/cat_crafts.jpg') },
  { key: 'other',          label: 'Other',            image: require('../assets/images/categories/cat_other.jpg') },
];

export default function HomeScreen({ API, token, user, cart, setCart, navigation }) {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });

  useEffect(() => { loadProducers(); }, []);

  async function loadProducers(zipCode, category) {
    setLoading(true);
    try {
      const lat = 35.4676, lng = -97.5164;
      let url = `${API}/api/producers/nearby?lat=${lat}&lng=${lng}&radius_miles=50`;
      if (category) url += `&category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducers(Array.isArray(data) ? data : []);
    } catch { setProducers([]); }
    setLoading(false);
  }

  function handleCategorySelect(cat) {
    setSelectedCategory(cat.key);
    setShowCategoryModal(false);
    loadProducers(zip, cat.key);
  }

  const selectedCat = CATEGORIES.find(c => c.key === selectedCategory) || CATEGORIES[0];
  const selectedLabel = selectedCat.label;
  const selectedImage = selectedCat.image;

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
                <TouchableOpacity style={styles.goBtn} onPress={() => loadProducers(zip, selectedCategory)}>
                  <Text style={styles.goBtnText}>Go</Text>
                </TouchableOpacity>
              </View>

              {/* Category dropdown */}
              <TouchableOpacity
                style={[styles.categoryRow, selectedCategory && styles.categoryRowActive]}
                onPress={() => setShowCategoryModal(true)}>
                <View style={styles.categoryIconBox}>
                  <Image source={selectedImage} style={styles.categoryIconImg} />
                </View>
                <Text style={[styles.categoryText, selectedCategory && styles.categoryTextActive]}>
                  {selectedLabel}
                </Text>
                {selectedCategory && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => { setSelectedCategory(null); loadProducers(zip, null); }}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.categoryChevron}>›</Text>
              </TouchableOpacity>

              {/* Section header */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory ? `${selectedLabel} Producers` : 'Producers Near You'}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedCategory(null); loadProducers(zip, null); }}>
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
                <Image source={require('../assets/images/categories/shop_icon.jpg')} style={styles.cardIconImg} />
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

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={String(cat.key)}
                  style={[
                    styles.catRow,
                    selectedCategory === cat.key && styles.catRowActive
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                  activeOpacity={0.75}>
                  <View style={[
                    styles.catIconBox,
                    selectedCategory === cat.key && styles.catIconBoxActive
                  ]}>
                    <Image source={cat.image} style={styles.catIconImg} />
                  </View>
                  <Text style={[
                    styles.catLabel,
                    selectedCategory === cat.key && styles.catLabelActive
                  ]}>
                    {cat.label}
                  </Text>
                  {selectedCategory === cat.key && (
                    <Text style={styles.catCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
  subHeader: { backgroundColor: C.rootBg, padding: 16, paddingBottom: 12 },
  greeting: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.darkBrown, marginBottom: 14 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 10, gap: 8, marginBottom: 10, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)' },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  goBtn: { backgroundColor: C.sage, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  goBtnText: { color: 'white', fontFamily: 'DMSans_400Regular', fontWeight: '700', fontSize: 12 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 10, marginBottom: 4, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)', gap: 8 },
  categoryRowActive: { borderColor: C.sage, backgroundColor: 'rgba(74,103,65,0.06)' },
  categoryIconBox: { width: 36, height: 36, borderRadius: 8, overflow: 'hidden', backgroundColor: C.cream },
  categoryIconImg: { width: 36, height: 36 },
  categoryText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.darkBrown },
  categoryTextActive: { color: C.sage, fontWeight: '600' },
  categoryChevron: { fontSize: 20, color: C.textLight },
  clearBtn: { backgroundColor: 'rgba(90,50,10,0.08)', borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 11, color: C.textMid, fontWeight: '700' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.darkBrown },
  seeAll: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.sage, fontWeight: '600' },

  producerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, shadowColor: '#5A320A', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardIcon: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 2, borderColor: '#8C6A30', marginRight: 12 },
  cardIconImg: { width: 52, height: 52 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: C.darkBrown },
  cardSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textLight, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: 'rgba(74,103,65,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.sage, fontWeight: '600' },
  shopBtn: { backgroundColor: C.sage, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8 },
  shopBtnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 12 },
  empty: { fontFamily: 'DMSans_400Regular', textAlign: 'center', color: C.textLight, marginTop: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.cardBg, borderRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(90,50,10,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: C.darkBrown, marginBottom: 16 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 6, gap: 12, backgroundColor: 'white', borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.06)' },
  catRowActive: { backgroundColor: 'rgba(74,103,65,0.08)', borderColor: C.sage },
  catIconBox: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', backgroundColor: C.cream },
  catIconBoxActive: { borderWidth: 2, borderColor: C.sage },
  catIconImg: { width: 44, height: 44 },
  catLabel: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.darkBrown },
  catLabelActive: { color: C.sage, fontWeight: '700' },
  catCheck: { fontSize: 16, color: C.sage, fontWeight: '700' },

  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});