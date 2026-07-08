import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

export default function BecomeProducerCard({ onPress }) {
  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={require('../../assets/backgrounds/bg_vendor_store.jpg')}
        style={styles.card}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          <Text style={styles.kicker}>For Local Sellers</Text>

          <Text style={styles.title}>
            Bring your products to more people.
          </Text>

          <Text style={styles.body}>
            From Our Place helps farms, makers, bakers, ranchers, and local brands reach nearby customers.
          </Text>

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
    height: 245,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  image: {
    borderRadius: RADIUS.xl,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },

  kicker: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  title: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 33,
    marginBottom: 10,
  },

  body: {
    color: COLORS.cream,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },

  button: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  buttonText: {
    color: COLORS.brown,
    fontSize: 14,
    fontWeight: '800',
  },
});