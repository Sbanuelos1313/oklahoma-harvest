import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { CATEGORIES } from '../../constants/categories';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';

export default function CategoryCarousel({ onCategoryPress, onViewAllPress }) {
  const visibleCategories = CATEGORIES.slice(0, 11);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Shop by Category</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={onViewAllPress}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {visibleCategories.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
            activeOpacity={0.88}
            style={styles.tile}
            onPress={() => onCategoryPress?.(item)}
          >
            <ImageBackground
              source={item.image}
              style={styles.image}
              imageStyle={styles.imageStyle}
            >
              <View style={styles.imageOverlay} />
            </ImageBackground>

            <Text numberOfLines={1} style={styles.label}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.tile}
          onPress={onViewAllPress}
        >
          <View style={styles.moreTile}>
            <Text style={styles.moreDots}>•••</Text>
          </View>

          <Text style={styles.label}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },

  header: {
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heading: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.brown,
  },

  viewAll: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forest,
    fontSize: 15,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  tile: {
    width: '23%',
    marginBottom: 14,
  },

  image: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...SHADOWS.soft,
  },

  imageStyle: {
    borderRadius: 12,
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  label: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: COLORS.brown,
  },

  moreTile: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.34)',
    ...SHADOWS.soft,
  },

  moreDots: {
    fontFamily: FONTS.bodyBold,
    fontSize: 24,
    letterSpacing: 4,
    color: COLORS.gold,
  },
});