// components/SectionHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {!!actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.forestDark,
  },
  action: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.sage,
  },
});
