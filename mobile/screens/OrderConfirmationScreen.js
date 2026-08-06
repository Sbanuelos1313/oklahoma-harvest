import React from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';

export default function OrderConfirmationScreen({
  route,
  navigation,
}) {
  const {
    order,
    fulfillmentType = 'pickup',
  } = route?.params || {};

  const orderNumber =
    order?.id ||
    order?.order_id ||
    'Pending';

  function viewOrders() {
    navigation.navigate('Main', {
      screen: 'Orders',
    });
  }

  function keepShopping() {
    navigation.navigate('Main', {
      screen: 'Home',
    });
  }

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_settings.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.hero}>
              <Image
                source={IMAGE_ASSETS.hero.checkout}
                resizeMode="cover"
                style={styles.heroImage}
              />

              <View style={styles.heroOverlay} />

              <View style={styles.successCircle}>
                <Ionicons
                  name="checkmark"
                  size={50}
                  color={COLORS.forest}
                />
              </View>
            </View>

            <View style={styles.confirmationCard}>
              <Text style={styles.eyebrow}>
                Order Placed
              </Text>

              <Text style={styles.title}>
                Your order has been sent to the producer.
              </Text>

              <Text style={styles.message}>
                The producer has 12 hours to confirm your
                order. If the order is not confirmed, it will
                automatically be cancelled and refunded.
              </Text>

              <View style={styles.detailCard}>
                <DetailRow
                  icon="receipt-outline"
                  label="Order"
                  value={`#${orderNumber}`}
                />

                <DetailRow
                  icon={
                    fulfillmentType === 'delivery'
                      ? 'car-outline'
                      : fulfillmentType === 'shipping'
                        ? 'cube-outline'
                        : 'bag-handle-outline'
                  }
                  label="Fulfillment"
                  value={String(
                    fulfillmentType
                  ).replaceAll('_', ' ')}
                />

                <DetailRow
                  icon="time-outline"
                  label="Status"
                  value="Pending confirmation"
                  isLast
                />
              </View>

              <View style={styles.noticeCard}>
                <View style={styles.noticeIconWrap}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={COLORS.forest}
                  />
                </View>

                <View style={styles.noticeTextBlock}>
                  <Text style={styles.noticeTitle}>
                    We will keep you updated
                  </Text>

                  <Text style={styles.noticeText}>
                    Watch the Orders tab for confirmation,
                    pickup, delivery, and completion updates.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.primaryButton}
                onPress={viewOrders}
              >
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={COLORS.brown}
                />

                <Text style={styles.primaryButtonText}>
                  View My Orders
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryButton}
                onPress={keepShopping}
              >
                <Text style={styles.secondaryButtonText}>
                  Keep Shopping
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast = false,
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && styles.detailRowBorder,
      ]}
    >
      <View style={styles.detailIdentity}>
        <View style={styles.detailIconWrap}>
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.forest}
          />
        </View>

        <Text style={styles.detailLabel}>
          {label}
        </Text>
      </View>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(247,242,232,0.60)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 42,
  },

  hero: {
    height: 270,
    borderRadius: 29,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,69,44,0.22)',
  },

  successCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 102,
    height: 102,
    marginLeft: -51,
    marginTop: -51,
    borderRadius: 51,
    borderWidth: 4,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.medium,
  },

  confirmationCard: {
    marginTop: -17,
    paddingHorizontal: 22,
    paddingTop: 33,
    paddingBottom: 24,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.97)',
    ...SHADOWS.medium,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  title: {
    marginTop: 7,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 37,
    color: COLORS.brown,
  },

  message: {
    marginTop: 11,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.subText,
  },

  detailCard: {
    marginTop: 21,
    paddingHorizontal: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },

  detailRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  detailIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIconWrap: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  detailLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.subText,
  },

  detailValue: {
    maxWidth: '55%',
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textAlign: 'right',
    textTransform: 'capitalize',
    color: COLORS.forest,
  },

  noticeCard: {
    marginTop: 17,
    padding: 15,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,103,65,0.09)',
  },

  noticeIconWrap: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.80)',
  },

  noticeTextBlock: {
    flex: 1,
  },

  noticeTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forest,
  },

  noticeText: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.subText,
  },

  primaryButton: {
    height: 56,
    marginTop: 21,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    ...SHADOWS.soft,
  },

  primaryButtonText: {
    marginLeft: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  secondaryButton: {
    height: 54,
    marginTop: 10,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.90)',
  },

  secondaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },
});