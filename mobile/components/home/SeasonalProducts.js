import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

import { COLORS, FONTS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const PRODUCTS = [
  {
    id: 1,
    name: 'Wildflower Honey',
    vendor: 'Sweet Acres',
    price: '$12.99',
    image: require('../../assets/categories/cat_honey_jams.jpg'),
  },
  {
    id: 2,
    name: 'Artisan Bread',
    vendor: 'Golden Hearth',
    price: '$7.50',
    image: require('../../assets/categories/cat_bakery.jpg'),
  },
];

export default function SeasonalProducts({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Fresh This Week</Text>

        <TouchableOpacity activeOpacity={0.8}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {PRODUCTS.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => navigation?.navigate?.('ProductDetail', { product: item })}
          >
            <Image source={item.image} style={styles.image} />

            <View style={styles.content}>
              <Text numberOfLines={1} style={styles.name}>{item.name}</Text>

              <View style={styles.bottomRow}>
                <Text style={styles.price}>{item.price}</Text>

                <TouchableOpacity activeOpacity={0.85} style={styles.button}>
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heading: {
    fontFamily: FONTS.display,
    fontSize: 27,
    lineHeight: 32,
    color: COLORS.brown,
  },

  viewAll: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forest,
    fontSize: 14,
  },

  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.warmWhite,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },

  image: {
    width: '100%',
    height: 102,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },

  name: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.brown,
    marginBottom: 9,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  price: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.forest,
  },

  button: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brown,
    marginTop: -2,
  },
});