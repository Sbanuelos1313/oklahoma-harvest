import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function ToggleRow({ title, subtitle, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  title: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.forestDark },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 3, lineHeight: 17 },
});
