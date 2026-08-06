import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import FilterPill from '../../components/FilterPill';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';

export default function VendorEditStoreScreen({ API, token, route, navigation }) {
  const { shop } = route.params || {};
  const [shopName, setShopName] = useState(shop?.shop_name || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [bio, setBio] = useState(shop?.bio || '');
  const [city, setCity] = useState(shop?.city || '');
  const [zipCode, setZipCode] = useState(shop?.zip_code || '');
  const [pickup, setPickup] = useState(Boolean(shop?.fulfillment_pickup));
  const [delivery, setDelivery] = useState(Boolean(shop?.fulfillment_delivery));
  const [shipping, setShipping] = useState(Boolean(shop?.fulfillment_shipping));
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/producers/me`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          description,
          bio,
          city,
          state: 'OK',
          zip_code: zipCode,
          fulfillment_pickup: pickup,
          fulfillment_delivery: delivery,
          fulfillment_shipping: shipping,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to update store.');
      Alert.alert('Saved', 'Store profile updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to save', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Storefront</Text>
          <Text style={styles.title}>Edit store</Text>
          <View style={styles.card}>
            <FormField label="Store name" value={shopName} onChangeText={setShopName} placeholder="Store name" />
            <FormField label="Description" value={description} onChangeText={setDescription} placeholder="What do you sell?" multiline />
            <FormField label="Meet the maker bio" value={bio} onChangeText={setBio} placeholder="Tell your story." multiline />
            <FormField label="City" value={city} onChangeText={setCity} placeholder="City" />
            <FormField label="Zip code" value={zipCode} onChangeText={setZipCode} placeholder="Zip code" keyboardType="numeric" />

            <Text style={styles.label}>Fulfillment</Text>
            <View style={styles.pills}>
              <FilterPill label="Pickup" active={pickup} onPress={() => setPickup(!pickup)} />
              <FilterPill label="Delivery" active={delivery} onPress={() => setDelivery(!delivery)} />
              <FilterPill label="Shipping" active={shipping} onPress={() => setShipping(!shipping)} />
            </View>

            <AppButton title="Save Store" onPress={save} loading={loading} style={{ marginTop: 18 }} />
            <AppButton title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 60 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
  label: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.sage, marginTop: 14, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
