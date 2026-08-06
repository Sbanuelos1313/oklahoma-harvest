// components/VendorCard.js
import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function VendorCard({ vendor, onPress }) {
  const imageSource = vendor?.profile_image_url ? { uri: vendor.profile_image_url } : IMAGE_ASSETS.vendor.default;
  const rating = Number(vendor?.avg_rating || 0).toFixed(1);
  const distance = vendor?.distance_miles ? `${Number(vendor.distance_miles).toFixed(1)} mi` : vendor?.city || 'Local';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={onPress}>
      <Image source={imageSource} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{vendor?.shop_name || 'Local Vendor'}</Text>
        {!!vendor?.description && <Text style={styles.description} numberOfLines={2}>{vendor.description}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{rating} rating</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{distance}</Text>
        </View>
        <View style={styles.badgeRow}>
          {vendor?.fulfillment_pickup && <Text style={styles.badge}>Pickup</Text>}
          {vendor?.fulfillment_delivery && <Text style={styles.badge}>Delivery</Text>}
          {vendor?.fulfillment_shipping && <Text style={styles.badge}>Shipping</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  image: {
    height: 150,
    width: '100%',
    backgroundColor: COLORS.beige,
  },
  body: {
    padding: 16,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.forestDark,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.brown,
    marginTop: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  meta: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brownSoft,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginHorizontal: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
    backgroundColor: COLORS.sageSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
});
