import React from 'react';
import { ImageBackground, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function PromoHeroCard({ image, eyebrow, title, subtitle, buttonLabel, onPress, style }) {
  return (
    <ImageBackground source={image} imageStyle={styles.image} style={[styles.card, style]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {!!buttonLabel && (
          <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.86}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 310,
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.forest,
    ...SHADOWS.card,
  },
  image: { borderRadius: RADIUS.xl },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23,50,31,0.34)' },
  content: { flex: 1, justifyContent: 'flex-end', padding: 18 },
  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.cream,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 33,
    color: COLORS.warmWhite,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.cream,
    marginTop: 6,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },
});
