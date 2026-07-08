import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';

export default function VendorStoreSetupScreen({ API, token, navigation }) {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function createStore() {
    if (!shopName) {
      Alert.alert('Store name required', 'Please enter your store name.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/producers/setup`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          description,
          bio,
          city,
          state: 'OK',
          zip_code: zipCode,
          fulfillment_pickup: true,
          fulfillment_delivery: false,
          fulfillment_shipping: false,
          service_radius_miles: 25,
          delivery_fee: 0,
          tax_rate: 0.08375,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to create store.');
      Alert.alert('Store created', 'Your store is pending admin approval.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Store setup failed', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Vendor setup</Text>
          <Text style={styles.title}>Create your store</Text>
          <Text style={styles.subtitle}>Build the storefront customers will see when they discover your products.</Text>

          <View style={styles.card}>
            <FormField label="Store name" value={shopName} onChangeText={setShopName} placeholder="Example: Prairie Rose Market" />
            <FormField label="Short description" value={description} onChangeText={setDescription} placeholder="What do you sell?" multiline />
            <FormField label="Meet the maker bio" value={bio} onChangeText={setBio} placeholder="Tell customers your story." multiline />
            <FormField label="City" value={city} onChangeText={setCity} placeholder="City" />
            <FormField label="Zip code" value={zipCode} onChangeText={setZipCode} placeholder="Zip code" keyboardType="numeric" />
            <AppButton title="Create Store" onPress={createStore} loading={loading} style={{ marginTop: 18 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 6, marginBottom: 18 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
});
