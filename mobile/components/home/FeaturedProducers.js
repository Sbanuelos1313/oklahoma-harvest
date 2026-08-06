import React from 'react';

import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { IMAGE_ASSETS } from '../../constants/assets';

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const PRODUCERS = [
  {
    id: 1,
    name: 'Willow & Wick',
    type: 'Candles',
    location: '2.4 mi',
    rating: '4.9',
    image: IMAGE_ASSETS.backgrounds.vendorOrders,
  },
  {
    id: 2,
    name: 'Golden Hearth',
    type: 'Bakery',
    location: '5.1 mi',
    rating: '4.8',
    image: IMAGE_ASSETS.categories.bakery,
  },
];

export default function FeaturedProducers({
  navigation,
  onViewAllPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Featured Near You
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onViewAllPress}
        >
          <Text style={styles.viewAll}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {PRODUCERS.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
              navigation?.navigate?.(
                'Producer',
                {
                  producer: item,
                }
              )
            }
          >
            <ImageBackground
              source={item.image}
              resizeMode="cover"
              style={styles.image}
              imageStyle={styles.imageStyle}
            >
              <View style={styles.overlay} />

              <View style={styles.content}>
                <View style={styles.badge}>
                  <Ionicons
                    name="star"
                    size={10}
                    color={COLORS.brown}
                  />

                  <Text style={styles.badgeText}>
                    {item.rating}
                  </Text>
                </View>

                <View>
                  <Text
                    numberOfLines={1}
                    style={styles.name}
                  >
                    {item.name}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={styles.type}
                  >
                    {item.type}
                  </Text>

                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={10}
                      color={COLORS.gold}
                    />

                    <Text style={styles.location}>
                      {item.location}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 26,
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
    fontSize: 14,
    color: COLORS.forest,
  },

  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  card: {
    width: CARD_WIDTH,
    height: 150,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.beige,
    ...SHADOWS.soft,
  },

  image: {
    flex: 1,
  },

  imageStyle: {
    borderRadius: 22,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },

  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
  },

  badgeText: {
    marginLeft: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.brown,
  },

  name: {
    marginBottom: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.white,
  },

  type: {
    marginBottom: 2,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.cream,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  location: {
    marginLeft: 4,
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.cream,
  },
});