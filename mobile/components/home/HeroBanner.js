import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/theme';

export default function HeroBanner({
  firstName = 'Samantha',
  deliveryLabel = 'Deliver to',
  deliveryAddress = 'Near you',
  onNotificationPress,
  onPromoPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.goodMorning}>Good Morning,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{firstName}</Text>
            <Text style={styles.wave}>👋</Text>
          </View>
        </View>

        <View style={styles.deliveryBlock}>
          <Text style={styles.deliveryLabel}>{deliveryLabel}</Text>
          <Text numberOfLines={1} style={styles.deliveryAddress}>
            {deliveryAddress}
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.bellButton} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={21} color={COLORS.brown} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.promoCard} onPress={onPromoPress}>
        <ImageBackground
          source={require('../../assets/backgrounds/bg_login.jpg')}
          style={styles.promoImage}
          imageStyle={styles.promoImageStyle}
        >
          <View style={styles.promoOverlay}>
            <Text style={styles.promoTitle}>Support Local.</Text>
            <Text style={styles.promoSubtitle}>Every purchase makes a difference.</Text>

            <View style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Shop Now</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  greetingBlock: {
    flex: 1,
    paddingRight: 8,
  },

  goodMorning: {
    fontFamily: FONTS.displayRegular,
    fontSize: 24,
    lineHeight: 28,
    color: COLORS.brown,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  name: {
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 38,
    color: COLORS.brown,
    marginTop: -2,
  },

  wave: {
    fontSize: 25,
    marginLeft: 6,
    marginBottom: 5,
  },

  deliveryBlock: {
    width: 94,
    marginTop: 9,
    marginRight: 8,
    alignItems: 'flex-end',
  },

  deliveryLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.brownSoft,
  },

  deliveryAddress: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    lineHeight: 19,
    color: COLORS.brown,
    textAlign: 'right',
  },

  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },

  promoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  promoImage: {
    height: 150,
    width: '100%',
    justifyContent: 'center',
  },

  promoImageStyle: {
    borderRadius: 24,
  },

  promoOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(74,61,88,0.25)',
  },

  promoTitle: {
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 35,
    color: COLORS.white,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowRadius: 5,
  },

  promoSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 21,
    color: COLORS.white,
    marginBottom: 14,
  },

  promoButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },

  promoButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});