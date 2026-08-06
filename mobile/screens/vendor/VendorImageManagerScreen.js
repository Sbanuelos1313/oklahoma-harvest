import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorImageManagerScreen({ route }) {
  const { product, shop } = route.params || {};
  const image = product?.image_url ? { uri: product.image_url } : shop?.profile_image_url ? { uri: shop.profile_image_url } : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Media</Text>
          <Text style={styles.title}>Image manager</Text>

          {image ? (
            <View style={styles.card}>
              <Image source={image} style={styles.image} />
              <Text style={styles.cardTitle}>{product?.name || shop?.shop_name || 'Current image'}</Text>
              <Text style={styles.body}>Image upload, compression, cropping, and gallery ordering will connect here.</Text>
              <AppButton title="Replace Image Coming Next" onPress={() => Alert.alert('Coming next', 'Native image picker and upload will be wired next.')} style={{ marginTop: 16 }} />
            </View>
          ) : (
            <EmptyState image={IMAGE_ASSETS.products.default} title="No image yet" message="Add beautiful product and store images to improve customer trust and conversion." buttonTitle="Upload Coming Next" onPress={() => {}} />
          )}
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
  image: { width: '100%', height: 260, borderRadius: RADIUS.xl, backgroundColor: COLORS.beige },
  cardTitle: { fontFamily: FONTS.display, fontSize: 25, color: COLORS.forestDark, marginTop: 16 },
  body: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brownSoft, marginTop: 8 },
});
