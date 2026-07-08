import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  onPress,
  onFilterPress,
  placeholder = 'Search vendors, products, markets...',
  location = 'Near you',
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.locationPill}>
        <Ionicons name="location-outline" size={17} color={COLORS.forest} />
        <Text style={styles.locationText}>{location}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.95} style={styles.searchCard} onPress={onPress}>
        <Ionicons name="search-outline" size={24} color={COLORS.subText} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.subText}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />

        <TouchableOpacity activeOpacity={0.85} style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={22} color={COLORS.forest} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    marginBottom: SPACING.xl,
    paddingHorizontal: 20,
    zIndex: 20,
  },

  locationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    ...SHADOWS.soft,
  },

  locationText: {
    marginLeft: 6,
    color: COLORS.forest,
    fontSize: 14,
    fontWeight: '800',
  },

  searchCard: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 30,
    paddingLeft: 18,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    fontSize: 16,
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
});