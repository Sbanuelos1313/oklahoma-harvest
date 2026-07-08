// components/ProductCard.js
import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function ProductCard({ product, onPress, onAdd }) {
  const imageSource = product?.image_url ? { uri: product.image_url } : IMAGE_ASSETS.products.default;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={onPress}>
      <Image source={imageSource} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product?.name || 'Market Product'}</Text>
        {!!product?.shop_name && <Text style={styles.vendor} numberOfLines={1}>{product.shop_name}</Text>}
        <View style={styles.bottom}>
          <Text style={styles.price}>${Number(product?.price || 0).toFixed(2)}</Text>
          {!!product?.unit && <Text style={styles.unit}>/ {product.unit}</Text>}
        </View>
        {!!onAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: COLORS.beige,
  },
  body: {
    padding: 12,
  },
  name: {
    minHeight: 40,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.forestDark,
  },
  vendor: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.brownSoft,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.forest,
  },
  unit: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.brownSoft,
  },
  addBtn: {
    marginTop: 10,
    backgroundColor: COLORS.forest,
    borderRadius: RADIUS.pill,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.warmWhite,
  },
});
