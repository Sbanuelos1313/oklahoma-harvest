import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  forest: '#4A6741',
  border: '#E6DED1',
  text: '#2A1A08',
  placeholder: '#8F8A80',
  shadow: '#000000',
};

export default function SearchBar({
  placeholder = 'Search farms, products, and makers...',
  value = '',
  onChangeText,
  onPress,
}) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.container}
        onPress={onPress}
      >
        <Ionicons
          name="search"
          size={22}
          color={COLORS.placeholder}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
        />

        <TouchableOpacity style={styles.filterButton}>
          <Ionicons
            name="options-outline"
            size={20}
            color={COLORS.forest}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

  wrapper: {
    paddingHorizontal: 20,
    marginTop: -28,
    marginBottom: 24,
    zIndex: 20,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.background,

    borderRadius: 18,

    paddingHorizontal: 18,
    paddingVertical: 14,

    shadowColor: COLORS.shadow,
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 6,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
  },

  filterButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F7F2E8',
  },

});