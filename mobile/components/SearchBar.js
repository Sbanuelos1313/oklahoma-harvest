// components/SearchBar.js
import React from 'react';
import { View, TextInput, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function SearchBar({ value, onChangeText, onSubmitEditing, placeholder = 'Search vendors, products, markets...', autoFocus = false, onClear }) {
  return (
    <View style={styles.wrap}>
      <Image source={IMAGE_ASSETS.icons.search} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.brownSoft}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      {!!value && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Image source={IMAGE_ASSETS.icons.close} style={styles.closeIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 54,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    color: COLORS.forestDark,
    fontSize: 15,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
});
