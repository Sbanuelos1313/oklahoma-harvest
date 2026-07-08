import React, { useState } from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function FavoriteButton({ active = false, onPress, style }) {
  const [isActive, setIsActive] = useState(active);
  function press() {
    const next = !isActive;
    setIsActive(next);
    onPress?.(next);
  }
  return (
    <TouchableOpacity style={[styles.btn, isActive && styles.active, style]} onPress={press} activeOpacity={0.84}>
      <Image source={IMAGE_ASSETS.icons.heart} style={[styles.icon, isActive && styles.iconActive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(250,248,243,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  active: {
    backgroundColor: COLORS.sageSoft,
  },
  icon: {
    width: 24,
    height: 24,
    opacity: 0.72,
  },
  iconActive: {
    opacity: 1,
  },
});
