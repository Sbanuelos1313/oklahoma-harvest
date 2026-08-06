import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { CATEGORY_ASSETS } from '../../constants/assets';
import FilterPill from '../../components/FilterPill';

export default function VendorAddProductScreen({ API, token, navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('each');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name || !price) {
      Alert.alert('Missing information', 'Please enter a product name and price.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          price: Number(price),
          unit,
          quantity_available: Number(quantity || 0),
          is_active: true,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to create product.');
      Alert.alert('Product added', 'Your product was added to your storefront.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to add product', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Inventory</Text>
          <Text style={styles.title}>Add product</Text>
          <Text style={styles.subtitle}>Create a polished product listing for customers to browse and buy.</Text>

          <View style={styles.card}>
            <FormField label="Product name" value={name} onChangeText={setName} placeholder="Example: Handmade Soy Candle" />
            <FormField label="Description" value={description} onChangeText={setDescription} placeholder="Describe the item, materials, ingredients, or story." multiline />
            <Text style={styles.label}>Category</Text>
            <View style={styles.pills}>
              {CATEGORY_ASSETS.filter(c => c.key).slice(0, 22).map(c => (
                <FilterPill key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
              ))}
            </View>
            <FormField label="Price" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
            <FormField label="Unit" value={unit} onChangeText={setUnit} placeholder="each, lb, jar, bunch..." />
            <FormField label="Quantity available" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" />
            <AppButton title="Add Product" onPress={save} loading={loading} style={{ marginTop: 18 }} />
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
  label: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.sage, marginTop: 14, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
