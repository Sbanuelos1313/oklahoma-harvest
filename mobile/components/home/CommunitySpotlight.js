import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

export default function CommunitySpotlight() {
  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={require('../../assets/backgrounds/bg_markets.jpg')}
        style={styles.card}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          <Text style={styles.kicker}>Community Spotlight</Text>
          <Text style={styles.title}>Markets, makers, and fresh finds near you.</Text>
          <Text style={styles.body}>
            Discover local producers, seasonal goods, and community favorites in one place.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  card: {
    height: 210,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 26,
  },
  overlay: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  kicker: {
    color: '#F7F2E8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  body: {
    color: '#F7F2E8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});