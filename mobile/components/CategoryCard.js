// components/CategoryCard.js
import React from 'react';
import { TouchableOpacity, ImageBackground, View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function CategoryCard({ label, image, onPress, large = false, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.card, large ? styles.large : styles.small, style]}
    >
      <ImageBackground source={image} imageStyle={styles.image} style={styles.bg}>
        <View style={styles.overlay} />
        <View style={styles.labelPill}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.beige,
    ...SHADOWS.soft,
  },
  small: {
    width: 158,
    height: 142,
  },
  large: {
    height: 170,
    width: '100%',
  },
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: RADIUS.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 50, 31, 0.18)',
  },
  labelPill: {
    margin: 12,
    backgroundColor: 'rgba(250,248,243,0.92)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forestDark,
    fontSize: 13,
  },
});
