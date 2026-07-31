import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';

export default function CartScreen({
  API,
  token,
  user,
  cart,
  setCart,
  navigation,
}) {
  const [fulfillmentType, setFulfillmentType] =
    useState('pickup');

  const [loading, setLoading] = useState(false);

  const {
    initPaymentSheet,
    presentPaymentSheet,
  } = useStripe();

  const totals = useMemo(() => {
    const subtotal =
      cart?.items?.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ) || 0;

    const tax =
      subtotal * Number(cart?.tax_rate || 0.08375);

    const deliveryFee =
      fulfillmentType === 'delivery'
        ? Number(cart?.delivery_fee || 0)
        : 0;

    const total =
      subtotal + tax + deliveryFee;

    return {
      subtotal,
      tax,
      deliveryFee,
      total,
    };
  }, [cart, fulfillmentType]);

  const cartCount =
    cart?.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;

  function updateQuantity(index, delta) {
    if (!cart?.items?.length) {
      return;
    }

    const items = cart.items.map((item) => ({
      ...item,
    }));

    items[index].quantity += delta;

    if (items[index].quantity <= 0) {
      items.splice(index, 1);
    }

    if (!items.length) {
      setCart(null);
      return;
    }

    setCart({
      ...cart,
      items,
    });
  }

  function removeItem(index) {
    if (!cart?.items?.length) {
      return;
    }

    const items = cart.items.filter(
      (_, itemIndex) => itemIndex !== index
    );

    if (!items.length) {
      setCart(null);
      return;
    }

    setCart({
      ...cart,
      items,
    });
  }

  async function doCheckout() {
    if (!token || token === 'guest') {
      Alert.alert(
        'Sign in required',
        'Please sign in or create an account to complete checkout.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: () =>
              navigation
                .getParent()
                ?.navigate('Auth'),
          },
        ]
      );

      return;
    }

    if (!cart?.items?.length) {
      return;
    }

    setLoading(true);

    try {
      const paymentResponse = await fetch(
        `${API}/api/stripe/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(
              totals.total * 100
            ),
            producer_id: cart.producer_id,
          }),
        }
      );

      const paymentData =
        await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.detail ||
            'Payment setup failed.'
        );
      }

      const { error: initializationError } =
        await initPaymentSheet({
          merchantDisplayName:
            'From Our Place',
          paymentIntentClientSecret:
            paymentData.client_secret,
          style: 'automatic',
        });

      if (initializationError) {
        throw new Error(
          initializationError.message
        );
      }

      const { error: paymentError } =
        await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          throw new Error(
            paymentError.message
          );
        }

        return;
      }

      const orderResponse = await fetch(
        `${API}/api/orders/from-payment`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            producer_id: cart.producer_id,
            items: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
            fulfillment_type:
              fulfillmentType,
            payment_intent_id:
              paymentData.payment_intent_id,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.detail ||
            'Your order could not be placed.'
        );
      }

      setCart(null);

      navigation
        .getParent()
        ?.navigate('OrderConfirmation', {
          order: orderData,
          fulfillmentType,
        });
    } catch (error) {
      Alert.alert(
        'Checkout error',
        error.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function renderFulfillmentOption({
    key,
    title,
    subtitle,
    icon,
  }) {
    const selected =
      fulfillmentType === key;

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.86}
        style={[
          styles.fulfillmentOption,
          selected &&
            styles.fulfillmentOptionActive,
        ]}
        onPress={() =>
          setFulfillmentType(key)
        }
      >
        <View
          style={[
            styles.fulfillmentIconWrap,
            selected &&
              styles.fulfillmentIconWrapActive,
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={
              selected
                ? COLORS.white
                : COLORS.forest
            }
          />
        </View>

        <Text
          style={[
            styles.fulfillmentTitle,
            selected &&
              styles.fulfillmentTitleActive,
          ]}
        >
          {title}
        </Text>

        <Text
          numberOfLines={2}
          style={[
            styles.fulfillmentSubtitle,
            selected &&
              styles.fulfillmentSubtitleActive,
          ]}
        >
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  }

  if (!cart?.items?.length) {
    return (
      <ImageBackground
        source={require('../assets/backgrounds/bg_settings.jpg')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.emptyHeader}>
              <Text style={styles.screenTitle}>
                Your Cart
              </Text>
            </View>

            <View style={styles.emptyState}>
              <Image
                source={IMAGE_ASSETS.hero.checkout}
                style={styles.emptyImage}
              />

              <View style={styles.emptyImageOverlay} />

              <View style={styles.emptyContent}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="basket-outline"
                    size={34}
                    color={COLORS.forest}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Ready to shop local?
                </Text>

                <Text style={styles.emptyMessage}>
                  Add fresh food, handmade goods,
                  gifts, wellness products, and
                  local market finds to your cart.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.shopButton}
                  onPress={() =>
                    navigation.navigate('Home')
                  }
                >
                  <Text style={styles.shopButtonText}>
                    Start Shopping
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
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
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>
                  Checkout
                </Text>

                <Text style={styles.screenTitle}>
                  Your Cart
                </Text>

                <Text style={styles.vendorLine}>
                  From {cart.producer_name}
                </Text>
              </View>

              <View style={styles.cartCountBadge}>
                <Ionicons
                  name="bag-outline"
                  size={21}
                  color={COLORS.forest}
                />

                <Text style={styles.cartCountText}>
                  {cartCount}
                </Text>
              </View>
            </View>

            <View style={styles.fulfillmentCard}>
              <Text style={styles.sectionTitle}>
                How would you like it?
              </Text>

              <Text style={styles.sectionSubtitle}>
                Select the fulfillment option for
                this order.
              </Text>

              <View style={styles.fulfillmentRow}>
                {renderFulfillmentOption({
                  key: 'pickup',
                  title: 'Pickup',
                  subtitle: 'Collect from the producer',
                  icon: 'bag-handle-outline',
                })}

                {renderFulfillmentOption({
                  key: 'delivery',
                  title: 'Delivery',
                  subtitle: 'Delivered to your address',
                  icon: 'car-outline',
                })}

                {renderFulfillmentOption({
                  key: 'shipping',
                  title: 'Shipping',
                  subtitle: 'Shipped when available',
                  icon: 'cube-outline',
                })}
              </View>
            </View>

            <Text style={styles.itemsHeading}>
              Your Items
            </Text>

            {cart.items.map((item, index) => {
              const lineTotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);

              return (
                <View
                  key={`${item.product_id}-${index}`}
                  style={styles.itemCard}
                >
                  <Image
                    source={
                      item.image_url
                        ? {
                            uri: item.image_url,
                          }
                        : IMAGE_ASSETS.products.default
                    }
                    style={styles.itemImage}
                  />

                  <View style={styles.itemBody}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemTextBlock}>
                        <Text
                          numberOfLines={2}
                          style={styles.itemName}
                        >
                          {item.name}
                        </Text>

                        <Text style={styles.itemMeta}>
                          $
                          {Number(
                            item.price || 0
                          ).toFixed(2)}
                          {item.unit
                            ? ` / ${item.unit}`
                            : ''}
                        </Text>
                      </View>

                      <Text style={styles.lineTotal}>
                        ${lineTotal.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.itemFooter}>
                      <View
                        style={styles.quantitySelector}
                      >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={
                            styles.quantityButton
                          }
                          onPress={() =>
                            updateQuantity(
                              index,
                              -1
                            )
                          }
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color={COLORS.brown}
                          />
                        </TouchableOpacity>

                        <Text
                          style={styles.quantityText}
                        >
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={
                            styles.quantityButton
                          }
                          onPress={() =>
                            updateQuantity(
                              index,
                              1
                            )
                          }
                        >
                          <Ionicons
                            name="add"
                            size={18}
                            color={COLORS.brown}
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.removeButton}
                        onPress={() =>
                          removeItem(index)
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={COLORS.danger}
                        />

                        <Text
                          style={styles.removeText}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>
                Order Summary
              </Text>

              <SummaryRow
                label="Subtotal"
                value={`$${totals.subtotal.toFixed(
                  2
                )}`}
              />

              <SummaryRow
                label="Estimated tax"
                value={`$${totals.tax.toFixed(2)}`}
              />

              {fulfillmentType === 'delivery' && (
                <SummaryRow
                  label="Delivery fee"
                  value={`$${totals.deliveryFee.toFixed(
                    2
                  )}`}
                />
              )}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.totalValue}>
                  ${totals.total.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={loading}
                style={[
                  styles.checkoutButton,
                  loading &&
                    styles.checkoutButtonDisabled,
                ]}
                onPress={doCheckout}
              >
                {loading ? (
                  <ActivityIndicator
                    color={COLORS.brown}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="lock-closed-outline"
                      size={19}
                      color={COLORS.brown}
                    />

                    <Text
                      style={
                        styles.checkoutButtonText
                      }
                    >
                      Continue to Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secureRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={COLORS.forest}
                />

                <Text style={styles.secureText}>
                  Secure payment powered by Stripe
                </Text>
              </View>

              <Text style={styles.note}>
                The producer has 12 hours to
                confirm your order. Unconfirmed
                orders are automatically cancelled
                and refunded.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
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
    backgroundColor: 'rgba(248,244,236,0.10)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },

  header: {
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  screenTitle: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 35,
    lineHeight: 41,
    color: COLORS.brown,
  },

  vendorLine: {
    marginTop: 3,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.subText,
  },

  cartCountBadge: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  cartCountText: {
    marginLeft: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  fulfillmentCard: {
    padding: 18,
    marginBottom: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.brown,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.subText,
  },

  fulfillmentRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 9,
  },

  fulfillmentOption: {
    flex: 1,
    minHeight: 122,
    paddingHorizontal: 8,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  fulfillmentOptionActive: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },

  fulfillmentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  fulfillmentIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  fulfillmentTitle: {
    marginTop: 9,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brown,
  },

  fulfillmentTitleActive: {
    color: COLORS.white,
  },

  fulfillmentSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: COLORS.subText,
  },

  fulfillmentSubtitleActive: {
    color: COLORS.cream,
  },

  itemsHeading: {
    marginBottom: 13,
    fontFamily: FONTS.display,
    fontSize: 27,
    color: COLORS.brown,
  },

  itemCard: {
    padding: 12,
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    backgroundColor: 'rgba(252,250,247,0.95)',
    ...SHADOWS.soft,
  },

  itemImage: {
    width: 92,
    height: 108,
    marginRight: 13,
    borderRadius: 19,
    backgroundColor: COLORS.cream,
  },

  itemBody: {
    flex: 1,
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  itemTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  itemName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.brown,
  },

  itemMeta: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.subText,
  },

  lineTotal: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },

  itemFooter: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantitySelector: {
    height: 38,
    paddingHorizontal: 4,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  quantityText: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  removeText: {
    marginLeft: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.danger,
  },

  summaryCard: {
    padding: 20,
    marginTop: 8,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.medium,
  },

  summaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.subText,
  },

  summaryValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  divider: {
    height: 1,
    marginVertical: 17,
    backgroundColor: COLORS.border,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.brown,
  },

  totalValue: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.forest,
  },

  checkoutButton: {
    height: 56,
    marginTop: 19,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    ...SHADOWS.medium,
  },

  checkoutButtonDisabled: {
    opacity: 0.65,
  },

  checkoutButtonText: {
    marginLeft: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  secureRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secureText: {
    marginLeft: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
  },

  note: {
    marginTop: 12,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.subText,
  },

  emptyHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  emptyState: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 108,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.medium,
  },

  emptyImage: {
    width: '100%',
    height: 230,
  },

  emptyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 230,
    backgroundColor: 'rgba(35,69,44,0.10)',
  },

  emptyContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.12)',
  },

  emptyTitle: {
    marginTop: 17,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.brown,
  },

  emptyMessage: {
    marginTop: 9,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: COLORS.subText,
  },

  shopButton: {
    height: 54,
    marginTop: 21,
    paddingHorizontal: 29,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  shopButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});