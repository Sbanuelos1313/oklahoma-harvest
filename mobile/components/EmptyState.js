// components/EmptyState.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import AppButton from './AppButton';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function EmptyState({ image, title, message, buttonTitle, onPress }) {
  return (
    <View style={styles.card}>
      {image && <Image source={image} style={styles.image} />}
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!buttonTitle && <AppButton title={buttonTitle} onPress={onPress} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  image: {
    width: '100%',
    height: 170,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.forestDark,
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.brownSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
