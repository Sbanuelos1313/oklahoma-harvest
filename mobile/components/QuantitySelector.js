// components/QuantitySelector.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export default function QuantitySelector({ quantity = 1, onDecrease, onIncrease }) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.btn} onPress={onDecrease}>
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.qty}>{quantity}</Text>
      <TouchableOpacity style={styles.btn} onPress={onIncrease}>
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.pill,
    padding: 4,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.forest,
  },
  qty: {
    minWidth: 34,
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forestDark,
  },
});
