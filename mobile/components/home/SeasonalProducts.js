import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

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
  {
    id: 3,
    name: 'Lavender Candle',
    vendor: 'Willow & Wick',
    price: '$18.00',
    image: require('../../assets/categories/cat_candles.jpg'),
  },
  {
    id: 4,
    name: 'Fresh Produce',
    vendor: 'Prairie Acres',
    price: '$5.99',
    image: require('../../assets/categories/cat_produce.jpg'),
  },
];

export default function SeasonalProducts({ navigation }) {

  const renderItem = ({ item }) => (

    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() =>
        navigation?.navigate?.('ProductDetail', {
          product: item,
        })
      }
    >

      <Image
        source={item.image}
        style={styles.image}
      />

      <View style={styles.content}>

        <Text
          numberOfLines={2}
          style={styles.name}
        >
          {item.name}
        </Text>

        <Text style={styles.vendor}>
          {item.vendor}
        </Text>

        <View style={styles.bottomRow}>

          <Text style={styles.price}>
            {item.price}
          </Text>

          <TouchableOpacity
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              +
            </Text>
          </TouchableOpacity>

        </View>

      </View>

    </TouchableOpacity>

  );

  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <Text style={styles.heading}>
          Fresh This Week
        </Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>
            View All
          </Text>
        </TouchableOpacity>

      </View>

      <FlatList
        horizontal
        data={PRODUCTS}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    marginBottom: SPACING.xxl,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 18,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heading: {
    ...TYPOGRAPHY.h2,
  },

  viewAll: {
    color: COLORS.forest,
    fontWeight: '700',
    fontSize: 14,
  },

  list: {
    paddingHorizontal: 20,
    paddingRight: 30,
  },

  card: {

    width: 190,

    marginRight: 18,

    backgroundColor: COLORS.warmWhite,

    borderRadius: RADIUS.xl,

    overflow: 'hidden',

    ...SHADOWS.medium,

  },

  image: {
    width: '100%',
    height: 145,
  },

  content: {
    padding: 16,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.brown,
    marginBottom: 6,
  },

  vendor: {
    fontSize: 13,
    color: COLORS.subText,
    marginBottom: 16,
  },

  bottomRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.forest,
  },

  button: {

    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: COLORS.gold,

    justifyContent: 'center',

    alignItems: 'center',

  },

  buttonText: {

    fontSize: 24,

    fontWeight: '700',

    color: COLORS.brown,

    marginTop: -2,

  },

});