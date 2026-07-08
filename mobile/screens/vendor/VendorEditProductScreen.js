import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import FilterPill from '../../components/FilterPill';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { CATEGORY_ASSETS } from '../../constants/assets';

export default function VendorEditProductScreen({ API, token, route, navigation }) {
  const { product } = route.params || {};
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || 'other');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [unit, setUnit] = useState(product?.unit || 'each');
  const [quantity, setQuantity] = useState(String(product?.quantity_available ?? ''));
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!product?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          price: Number(price),
          unit,
          quantity_available: Number(quantity || 0),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to update product.');
      Alert.alert('Saved', 'Product updated.');
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
          <Text style={styles.eyebrow}>Inventory</Text>
          <Text style={styles.title}>Edit product</Text>
          <View style={styles.card}>
            <FormField label="Product name" value={name} onChangeText={setName} placeholder="Product name" />
            <FormField label="Description" value={description} onChangeText={setDescription} placeholder="Description" multiline />
            <Text style={styles.label}>Category</Text>
            <View style={styles.pills}>
              {CATEGORY_ASSETS.filter(c => c.key).slice(0, 22).map(c => (
                <FilterPill key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
              ))}
            </View>
            <FormField label="Price" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
            <FormField label="Unit" value={unit} onChangeText={setUnit} placeholder="each" />
            <FormField label="Quantity available" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" />
            <AppButton title="Save Product" onPress={save} loading={loading} style={{ marginTop: 18 }} />
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
