import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import { COLORS, FONTS, SHADOWS } from '../../constants/theme';

export default function CommunitySpotlight({ onPress }) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.touchable}
      >
        <ImageBackground
          source={require('../../assets/backgrounds/bg_markets.jpg')}
          style={styles.card}
          imageStyle={styles.image}
        >
          <View style={styles.overlay}>
            <View style={styles.textBlock}>
              <Text style={styles.kicker}>
                Community Spotlight
              </Text>

              <Text style={styles.title}>
                Markets, makers & fresh finds
              </Text>

              <Text style={styles.body}>
                Explore nearby farms, markets, and community favorites.
              </Text>
            </View>

            <View style={styles.button}>
              <Text style={styles.buttonText}>
                Explore Markets
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 24,
  },

  touchable: {
    borderRadius: 24,
  },

  card: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
  },

  image: {
    borderRadius: 24,
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 24,
  },

  textBlock: {
    flexShrink: 1,
  },

  kicker: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },

  title: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 22,
    lineHeight: 27,
    marginBottom: 9,
    maxWidth: '92%',
  },

  body: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '92%',
  },

  button: {
    alignSelf: 'flex-start',
    height: 56,
    paddingHorizontal: 30,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },

  buttonText: {
    color: COLORS.brown,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
});