import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

const PRODUCERS = [
  {
    id: 1,
    name: 'Willow & Wick',
    type: 'Candles • Home Decor',
    location: '2.4 mi',
    rating: '4.9',
    image: require('../../assets/backgrounds/bg_vendor_store.jpg'),
  },
  {
    id: 2,
    name: 'Golden Hearth',
    type: 'Bakery',
    location: '5.1 mi',
    rating: '4.8',
    image: require('../../assets/categories/cat_bakery.jpg'),
  },
  {
    id: 3,
    name: 'Prairie Acres',
    type: 'Farm Fresh Produce',
    location: '8.3 mi',
    rating: '5.0',
    image: require('../../assets/categories/cat_produce.jpg'),
  },
];

export default function FeaturedProducers({ navigation, onViewAllPress }) {
  const renderProducer = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() =>
        navigation?.navigate?.('Producer', {
          producer: item,
        })
      }
    >
      <ImageBackground
        source={item.image}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={styles.badge}>
            <Ionicons name="star" size={13} color={COLORS.brown} />
            <Text style={styles.badgeText}>{item.rating}</Text>
          </View>

          <View style={styles.bottomContent}>
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>

            <Text numberOfLines={1} style={styles.type}>
              {item.type}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={COLORS.gold} />
              <Text style={styles.location}>{item.location}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Featured Near You</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={onViewAllPress}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={PRODUCERS}
        renderItem={renderProducer}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToInterval={318}
        decelerationRate="fast"
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
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heading: {
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 37,
    color: COLORS.brown,
  },

  viewAll: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forest,
    fontSize: 15,
  },

  list: {
    paddingHorizontal: 20,
    paddingRight: 34,
  },

  card: {
    width: 300,
    height: 214,
    marginRight: 18,
    borderRadius: 32,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  image: {
    flex: 1,
  },

  imageStyle: {
    borderRadius: 32,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },

  badgeText: {
    marginLeft: 5,
    color: COLORS.brown,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },

  bottomContent: {
    paddingBottom: 2,
  },

  name: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 24,
    lineHeight: 29,
    marginBottom: 5,
  },

  type: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 5,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  location: {
    marginLeft: 4,
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
});