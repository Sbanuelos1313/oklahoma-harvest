import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppButton from './AppButton';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function AddressCard({ address, onEdit, onSelect, selected }) {
  return (
    <View style={[styles.card, selected && styles.selected]}>
      <Text style={styles.name}>{address?.label || 'Address'}</Text>
      <Text style={styles.text}>{address?.street || address?.address_line1 || 'Street address'}</Text>
      <Text style={styles.text}>{address?.city || 'City'}, {address?.state || 'OK'} {address?.zip_code || ''}</Text>
      <View style={styles.actions}>
        {!!onSelect && <AppButton title={selected ? 'Selected' : 'Use Address'} variant={selected ? 'secondary' : 'outline'} onPress={onSelect} style={styles.btn} />}
        {!!onEdit && <AppButton title="Edit" variant="outline" onPress={onEdit} style={styles.btn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, ...SHADOWS.soft },
  selected: { borderColor: COLORS.forest, borderWidth: 2 },
  name: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.forestDark },
  text: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, minHeight: 42 },
});
