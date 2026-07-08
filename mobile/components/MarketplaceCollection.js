import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ProductCard from './ProductCard';
import VendorCard from './VendorCard';
import CategoryCard from './CategoryCard';
import { COLORS, FONTS } from '../constants/theme';

export default function MarketplaceCollection({ title, actionLabel, onAction, type = 'product', data = [], onItemPress, onAdd }) {
  if (!data.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {!!actionLabel && <Text onPress={onAction} style={styles.action}>{actionLabel}</Text>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {data.map((item, index) => {
          if (type === 'vendor') {
            return <View key={item.id || index} style={styles.vendorWrap}><VendorCard vendor={item} onPress={() => onItemPress?.(item)} /></View>;
          }
          if (type === 'category') {
            return <CategoryCard key={item.key || item.label} label={item.label} image={item.image} onPress={() => onItemPress?.(item)} />;
          }
          return <ProductCard key={item.id || index} product={item} onPress={() => onItemPress?.(item)} onAdd={() => onAdd?.(item)} />;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark },
  action: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.sage },
  row: { gap: 14, paddingRight: 18 },
  vendorWrap: { width: 280 },
});
