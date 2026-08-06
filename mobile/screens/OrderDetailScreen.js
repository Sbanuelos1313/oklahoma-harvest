import React from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

const STATUS_LABELS = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  fulfilled: 'Completed',
  cancelled: 'Cancelled',
  auto_cancelled: 'Auto-Cancelled',
};


const STATUS_STEPS = [
  {
    key: 'placed',
    label: 'Placed',
    icon: 'receipt-outline',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'ready',
    label: 'Ready',
    icon: 'bag-check-outline',
  },
  {
    key: 'complete',
    label: 'Complete',
    icon: 'checkmark-done-outline',
  },
];


export default function OrderDetailScreen({
  route,
  navigation,
}) {
  const {
    order = {},
  } = route?.params || {};

  const items =
    order?.items ||
    order?.order_items ||
    [];

  const status =
    order?.status ||
    'pending';

  const fulfillment =
    order?.fulfillment_type ||
    'pickup';

  const orderNumber =
    order?.id ||
    order?.order_id ||
    '—';

  const vendorName =
    order?.shop_name ||
    order?.producer_name ||
    order?.vendor_name ||
    'Local Vendor';

  const total =
    Number(
      order?.total ||
      order?.order_total ||
      0
    );

  const subtotal =
    Number(
      order?.subtotal ||
      order?.sub_total ||
      total
    );

  const tax =
    Number(
      order?.tax ||
      order?.estimated_tax ||
      0
    );

  const deliveryFee =
    Number(
      order?.delivery_fee ||
      order?.shipping_fee ||
      0
    );

  const isCancelled = [
    'cancelled',
    'auto_cancelled',
  ].includes(status);

  const isCompleted =
    status === 'fulfilled';


  function formatDate(value) {
    if (!value) {
      return 'Date unavailable';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return 'Date unavailable';
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }


  function formatTime(value) {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleTimeString(
      undefined,
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  }


  function formatMoney(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }


  function getFulfillmentIcon() {
    if (fulfillment === 'delivery') {
      return 'car-outline';
    }

    if (fulfillment === 'shipping') {
      return 'cube-outline';
    }

    return 'bag-handle-outline';
  }


  function isStepActive(stepKey) {
    if (isCancelled) {
      return stepKey === 'placed';
    }

    const progress = {
      pending: 1,
      confirmed: 2,
      ready_for_pickup: 3,
      out_for_delivery: 3,
      fulfilled: 4,
    };

    const currentProgress =
      progress[status] || 1;

    const stepProgress = {
      placed: 1,
      confirmed: 2,
      ready: 3,
      complete: 4,
    };

    return (
      stepProgress[stepKey] <=
      currentProgress
    );
  }


  function goBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Main', {
      screen: 'Orders',
    });
  }


  function leaveReview() {
    navigation.navigate(
      'LeaveReview',
      {
        order,
      }
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
            <View style={styles.pageHeader}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.backButton}
                onPress={goBack}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={COLORS.brown}
                />
              </TouchableOpacity>

              <View style={styles.headerTextBlock}>
                <Text style={styles.eyebrow}>
                  Order Details
                </Text>

                <Text style={styles.screenTitle}>
                  Order #{orderNumber}
                </Text>
              </View>
            </View>


            <View style={styles.orderHero}>
              <View style={styles.heroTopRow}>
                <View style={styles.vendorIdentity}>
                  <View style={styles.vendorIconWrap}>
                    <Ionicons
                      name="storefront-outline"
                      size={25}
                      color={COLORS.forest}
                    />
                  </View>

                  <View style={styles.vendorTextBlock}>
                    <Text style={styles.vendorLabel}>
                      Purchased From
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={styles.vendorName}
                    >
                      {vendorName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderTotal}>
                  {formatMoney(total)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isCompleted &&
                    styles.statusBadgeCompleted,
                  isCancelled &&
                    styles.statusBadgeCancelled,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isCompleted &&
                      styles.statusDotCompleted,
                    isCancelled &&
                      styles.statusDotCancelled,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    isCompleted &&
                      styles.statusTextCompleted,
                    isCancelled &&
                      styles.statusTextCancelled,
                  ]}
                >
                  {STATUS_LABELS[status] ||
                    String(status).replaceAll(
                      '_',
                      ' '
                    )}
                </Text>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={COLORS.forest}
                  />

                  <Text style={styles.heroMetaText}>
                    {formatDate(
                      order?.created_at
                    )}
                  </Text>
                </View>

                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name={getFulfillmentIcon()}
                    size={17}
                    color={COLORS.forest}
                  />

                  <Text style={styles.heroMetaText}>
                    {String(
                      fulfillment
                    ).replaceAll('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Order Progress
              </Text>

              <View style={styles.timelineCard}>
                {isCancelled && (
                  <View style={styles.cancelledNotice}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={21}
                      color={COLORS.danger}
                    />

                    <Text style={styles.cancelledNoticeText}>
                      This order was cancelled.
                    </Text>
                  </View>
                )}

                <View style={styles.timeline}>
                  {STATUS_STEPS.map(
                    (step, index) => {
                      const active =
                        isStepActive(step.key);

                      const isLast =
                        index ===
                        STATUS_STEPS.length - 1;

                      return (
                        <View
                          key={step.key}
                          style={styles.timelineStep}
                        >
                          <View
                            style={styles.timelineIconColumn}
                          >
                            <View
                              style={[
                                styles.timelineIcon,
                                active &&
                                  styles.timelineIconActive,
                              ]}
                            >
                              <Ionicons
                                name={step.icon}
                                size={18}
                                color={
                                  active
                                    ? COLORS.white
                                    : COLORS.sage
                                }
                              />
                            </View>

                            {!isLast && (
                              <View
                                style={[
                                  styles.timelineLine,
                                  active &&
                                    isStepActive(
                                      STATUS_STEPS[
                                        index + 1
                                      ].key
                                    ) &&
                                    styles.timelineLineActive,
                                ]}
                              />
                            )}
                          </View>

                          <View style={styles.timelineTextBlock}>
                            <Text
                              style={[
                                styles.timelineLabel,
                                active &&
                                  styles.timelineLabelActive,
                              ]}
                            >
                              {step.label}
                            </Text>

                            <Text style={styles.timelineDescription}>
                              {getStepDescription(
                                step.key,
                                fulfillment
                              )}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Items
              </Text>

              <View style={styles.itemsCard}>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const quantity =
                      Number(
                        item?.quantity || 1
                      );

                    const unitPrice =
                      Number(
                        item?.price ||
                        item?.unit_price ||
                        0
                      );

                    const itemTotal =
                      Number(
                        item?.total ||
                        item?.line_total ||
                        unitPrice * quantity
                      );

                    return (
                      <View
                        key={
                          item?.id ||
                          item?.product_id ||
                          index
                        }
                        style={[
                          styles.itemRow,
                          index <
                            items.length - 1 &&
                            styles.itemRowBorder,
                        ]}
                      >
                        <Image
                          source={
                            item?.image_url
                              ? {
                                  uri: item.image_url,
                                }
                              : IMAGE_ASSETS
                                  .products.default
                          }
                          resizeMode="cover"
                          style={styles.itemImage}
                        />

                        <View style={styles.itemTextBlock}>
                          <Text
                            numberOfLines={2}
                            style={styles.itemName}
                          >
                            {item?.name ||
                              item?.product_name ||
                              'Local Product'}
                          </Text>

                          <Text style={styles.itemDetails}>
                            Quantity {quantity}
                          </Text>

                          <Text style={styles.itemUnitPrice}>
                            {formatMoney(
                              unitPrice
                            )}{' '}
                            each
                          </Text>
                        </View>

                        <Text style={styles.itemTotal}>
                          {formatMoney(
                            itemTotal
                          )}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noItemsState}>
                    <View style={styles.noItemsIcon}>
                      <Ionicons
                        name="basket-outline"
                        size={28}
                        color={COLORS.forest}
                      />
                    </View>

                    <Text style={styles.noItemsTitle}>
                      Item details unavailable
                    </Text>

                    <Text style={styles.noItemsText}>
                      Product details will appear here
                      when they become available.
                    </Text>
                  </View>
                )}
              </View>
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Fulfillment
              </Text>

              <View style={styles.fulfillmentCard}>
                <View style={styles.fulfillmentIcon}>
                  <Ionicons
                    name={getFulfillmentIcon()}
                    size={24}
                    color={COLORS.forest}
                  />
                </View>

                <View style={styles.fulfillmentTextBlock}>
                  <Text style={styles.fulfillmentTitle}>
                    {formatFulfillmentTitle(
                      fulfillment
                    )}
                  </Text>

                  <Text style={styles.fulfillmentText}>
                    {getFulfillmentDescription(
                      order,
                      fulfillment
                    )}
                  </Text>

                  {order?.pickup_time && (
                    <Text style={styles.fulfillmentDetail}>
                      {formatDate(
                        order.pickup_time
                      )}
                      {formatTime(
                        order.pickup_time
                      )
                        ? ` at ${formatTime(
                            order.pickup_time
                          )}`
                        : ''}
                    </Text>
                  )}

                  {order?.delivery_address && (
                    <Text style={styles.fulfillmentDetail}>
                      {order.delivery_address}
                    </Text>
                  )}

                  {order?.shipping_address && (
                    <Text style={styles.fulfillmentDetail}>
                      {order.shipping_address}
                    </Text>
                  )}
                </View>
              </View>
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Order Summary
              </Text>

              <View style={styles.summaryCard}>
                <SummaryRow
                  label="Subtotal"
                  value={formatMoney(subtotal)}
                />

                {tax > 0 && (
                  <SummaryRow
                    label="Tax"
                    value={formatMoney(tax)}
                  />
                )}

                {deliveryFee > 0 && (
                  <SummaryRow
                    label={
                      fulfillment === 'shipping'
                        ? 'Shipping'
                        : 'Delivery Fee'
                    }
                    value={formatMoney(
                      deliveryFee
                    )}
                  />
                )}

                <View style={styles.summaryDivider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    {formatMoney(total)}
                  </Text>
                </View>
              </View>
            </View>


            {order?.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Order Notes
                </Text>

                <View style={styles.notesCard}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={21}
                    color={COLORS.forest}
                  />

                  <Text style={styles.notesText}>
                    {order.notes}
                  </Text>
                </View>
              </View>
            )}


            {isCompleted && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.primaryButton}
                onPress={leaveReview}
              >
                <Ionicons
                  name="star-outline"
                  size={20}
                  color={COLORS.brown}
                />

                <Text style={styles.primaryButtonText}>
                  Leave a Review
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.secondaryButton}
              onPress={goBack}
            >
              <Ionicons
                name="arrow-back-outline"
                size={19}
                color={COLORS.forest}
              />

              <Text style={styles.secondaryButtonText}>
                Back to Orders
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}


function SummaryRow({
  label,
  value,
}) {
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


function formatFulfillmentTitle(
  fulfillment
) {
  if (fulfillment === 'delivery') {
    return 'Local Delivery';
  }

  if (fulfillment === 'shipping') {
    return 'Shipping';
  }

  return 'Local Pickup';
}


function getFulfillmentDescription(
  order,
  fulfillment
) {
  if (fulfillment === 'delivery') {
    return (
      order?.delivery_instructions ||
      'The producer will provide delivery updates as your order is prepared.'
    );
  }

  if (fulfillment === 'shipping') {
    return (
      order?.shipping_instructions ||
      'Tracking information will appear when your order ships.'
    );
  }

  return (
    order?.pickup_instructions ||
    'The producer will notify you when your order is ready for pickup.'
  );
}


function getStepDescription(
  step,
  fulfillment
) {
  if (step === 'placed') {
    return 'Your order was submitted.';
  }

  if (step === 'confirmed') {
    return 'The producer confirms availability.';
  }

  if (step === 'ready') {
    if (fulfillment === 'delivery') {
      return 'Your order is ready for delivery.';
    }

    if (fulfillment === 'shipping') {
      return 'Your order is ready to ship.';
    }

    return 'Your order is ready for pickup.';
  }

  return 'Your purchase is complete.';
}


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 55,
  },

  pageHeader: {
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 46,
    height: 46,
    marginRight: 13,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  headerTextBlock: {
    flex: 1,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  screenTitle: {
    marginTop: 2,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 37,
    color: COLORS.brown,
  },

  orderHero: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.medium,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  vendorIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },

  vendorIconWrap: {
    width: 52,
    height: 52,
    marginRight: 13,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  vendorTextBlock: {
    flex: 1,
  },

  vendorLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.subText,
  },

  vendorName: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 26,
    color: COLORS.brown,
  },

  orderTotal: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.forest,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    marginTop: 17,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.18)',
  },

  statusBadgeCompleted: {
    backgroundColor: 'rgba(74,103,65,0.13)',
  },

  statusBadgeCancelled: {
    backgroundColor: 'rgba(183,77,77,0.12)',
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },

  statusDotCompleted: {
    backgroundColor: COLORS.forest,
  },

  statusDotCancelled: {
    backgroundColor: COLORS.danger,
  },

  statusText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.brown,
  },

  statusTextCompleted: {
    color: COLORS.forest,
  },

  statusTextCancelled: {
    color: COLORS.danger,
  },

  heroDivider: {
    height: 1,
    marginVertical: 17,
    backgroundColor: COLORS.divider,
  },

  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },

  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMetaText: {
    marginLeft: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
    color: COLORS.subText,
  },

  section: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 11,
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.brown,
  },

  timelineCard: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  cancelledNotice: {
    minHeight: 45,
    marginBottom: 18,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(183,77,77,0.10)',
  },

  cancelledNoticeText: {
    marginLeft: 9,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.danger,
  },

  timeline: {
    paddingTop: 2,
  },

  timelineStep: {
    minHeight: 74,
    flexDirection: 'row',
  },

  timelineIconColumn: {
    width: 44,
    alignItems: 'center',
  },

  timelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },

  timelineIconActive: {
    borderColor: COLORS.forest,
    backgroundColor: COLORS.forest,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    backgroundColor: COLORS.divider,
  },

  timelineLineActive: {
    backgroundColor: COLORS.forest,
  },

  timelineTextBlock: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 7,
  },

  timelineLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.subText,
  },

  timelineLabelActive: {
    color: COLORS.brown,
  },

  timelineDescription: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.subText,
  },

  itemsCard: {
    paddingHorizontal: 17,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  itemRow: {
    minHeight: 96,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  itemImage: {
    width: 68,
    height: 68,
    marginRight: 13,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
  },

  itemTextBlock: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.brown,
  },

  itemDetails: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subText,
  },

  itemUnitPrice: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.subText,
  },

  itemTotal: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },

  noItemsState: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },

  noItemsIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  noItemsTitle: {
    marginTop: 14,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.brown,
  },

  noItemsText: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.subText,
  },

  fulfillmentCard: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  fulfillmentIcon: {
    width: 48,
    height: 48,
    marginRight: 13,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  fulfillmentTextBlock: {
    flex: 1,
  },

  fulfillmentTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  fulfillmentText: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.subText,
  },

  fulfillmentDetail: {
    marginTop: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.forest,
  },

  summaryCard: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  summaryRow: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.subText,
  },

  summaryValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.brown,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  totalRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.brown,
  },

  totalValue: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.forest,
  },

  notesCard: {
    padding: 17,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  notesText: {
    flex: 1,
    marginLeft: 11,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.subText,
  },

  primaryButton: {
    height: 56,
    marginTop: 27,
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
    marginTop: 11,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
  },

  secondaryButtonText: {
    marginLeft: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },
});