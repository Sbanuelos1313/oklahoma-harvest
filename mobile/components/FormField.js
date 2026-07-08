import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export default function FormField({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) {
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.brownSoft}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.sage,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmWhite,
    paddingHorizontal: 16,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.forestDark,
  },
  multiline: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
});
