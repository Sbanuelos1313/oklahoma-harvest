import React from 'react';

import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IMAGE_ASSETS } from '../../constants/assets';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../../constants/theme';

export default function BecomeProducerCard({
  onPress,
}) {
  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={
          IMAGE_ASSETS.backgrounds.vendorOrders
        }
        resizeMode="cover"
        style={styles.card}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          <View style={styles.textBlock}>
            <Text style={styles.kicker}>
              For Local Sellers
            </Text>

            <Text style={styles.title}>
              Bring your products to more people.
            </Text>

            <Text style={styles.body}>
              Reach nearby customers through a warm
              local marketplace.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={onPress}
          >
            <Text style={styles.buttonText}>
              Become a Producer
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 42,
  },

  card: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.brown,
    ...SHADOWS.soft,
  },

  image: {
    borderRadius: 24,
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  textBlock: {
    flexShrink: 1,
  },

  kicker: {
    marginBottom: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.cream,
  },

  title: {
    maxWidth: '92%',
    marginBottom: 9,
    fontFamily: FONTS.bodyBold,
    fontSize: 23,
    lineHeight: 28,
    color: COLORS.white,
  },

  body: {
    maxWidth: '92%',
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.cream,
  },

  button: {
    alignSelf: 'flex-start',
    height: 56,
    paddingHorizontal: 30,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    ...SHADOWS.soft,
  },

  buttonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});