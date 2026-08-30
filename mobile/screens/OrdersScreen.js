import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ImageBackground,
  StatusBar,
} from 'react-native';

import { 
  IMAGE_ASSETS,
} from '../constants/assets';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';


// ===========================================================
// ORDER STATUS GROUPS
// ===========================================================

const ACTIVE_STATUSES = [
  'pending',
  'confirmed',
  'ready_for_pickup',
  'out_for_delivery',
];

const COMPLETED_STATUSES = [
  'fulfilled',
  'cancelled',
  'auto_cancelled',
];


// ===========================================================
// STATUS DISPLAY
// ===========================================================

function getStatusDisplay(status) {
  switch (status) {
    case 'pending':
      return {
        label:
          'Pending Confirmation',
        icon:
          'time-outline',
      };

    case 'confirmed':
      return {
        label:
          'Confirmed',
        icon:
          'checkmark-circle-outline',
      };

    case 'ready_for_pickup':
      return {
        label:
          'Ready for Pickup',
        icon:
          'bag-check-outline',
      };

    case 'out_for_delivery':
      return {
        label:
          'Out for Delivery',
        icon:
          'car-outline',
      };

    case 'fulfilled':
      return {
        label:
          'Completed',
        icon:
          'checkmark-done-circle-outline',
      };

    case 'cancelled':
      return {
        label:
          'Cancelled',
        icon:
          'close-circle-outline',
      };

    case 'auto_cancelled':
      return {
        label:
          'Cancelled',
        icon:
          'close-circle-outline',
      };

    default:
      return {
        label:
          String(
            status || 'Unknown'
          )
            .replace(
              /_/g,
              ' '
            )
            .replace(
              /\b\w/g,
              (letter) =>
                letter.toUpperCase()
            ),

        icon:
          'receipt-outline',
      };
  }
}


// ===========================================================
// FULFILLMENT DISPLAY
// ===========================================================

function getFulfillmentDisplay(
  fulfillmentType
) {
  switch (
    fulfillmentType
  ) {
    case 'pickup':
      return {
        label: 'Pickup',
        icon:
          'bag-handle-outline',
      };

    case 'delivery':
      return {
        label: 'Delivery',
        icon:
          'car-outline',
      };

    case 'shipping':
      return {
        label: 'Shipping',
        icon:
          'cube-outline',
      };

    default:
      return {
        label:
          'Fulfillment',
        icon:
          'location-outline',
      };
  }
}


// ===========================================================
// FORMAT MONEY
// ===========================================================

function formatMoney(value) {
  const amount =
    Number(value || 0);

  return `$${amount.toFixed(
    2
  )}`;
}


// ===========================================================
// FORMAT DATE
// ===========================================================

function formatOrderDate(value) {
  if (!value) {
    return '';
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  } catch {
    return '';
  }
}


// ===========================================================
// ORDERS SCREEN
// ===========================================================

export default function OrdersScreen({
  API,
  token,
  navigation,
}) {
  // =========================================================
  // STATE
  // =========================================================

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    selectedTab,
    setSelectedTab,
  ] = useState('active');

  const [
    cancellingOrderId,
    setCancellingOrderId,
  ] = useState(null);


  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders =
    useCallback(
      async ({
        showLoader = false,
      } = {}) => {
        if (
          !token ||
          token === 'guest'
        ) {
          setOrders([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (showLoader) {
          setLoading(true);
        }

        try {
          const response =
            await fetch(
              `${API}/api/orders/my`,
              {
                method: 'GET',

                headers: {
                  Accept:
                    'application/json',

                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.detail ||
                'Unable to load your orders.'
            );
          }

          setOrders(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (error) {
          console.log(
            'LOAD ORDERS ERROR:',
            error
          );

          Alert.alert(
            'Unable to load orders',
            error?.message ||
              'Please try again.'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        API,
        token,
      ]
    );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadOrders({
      showLoader: true,
    });
  }, [loadOrders]);


  // =========================================================
  // REFRESH WHEN SCREEN RECEIVES FOCUS
  // =========================================================

  useEffect(() => {
    const unsubscribe =
      navigation.addListener(
        'focus',
        () => {
          loadOrders();
        }
      );

    return unsubscribe;
  }, [
    navigation,
    loadOrders,
  ]);


  // =========================================================
  // PULL TO REFRESH
  // =========================================================

  const handleRefresh =
    useCallback(() => {
      setRefreshing(true);
      loadOrders();
    }, [loadOrders]);


  // =========================================================
  // ACTIVE / COMPLETED ORDERS
  // =========================================================

  const activeOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            ACTIVE_STATUSES.includes(
              order?.status
            )
        ),
      [orders]
    );

  const completedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            COMPLETED_STATUSES.includes(
              order?.status
            )
        ),
      [orders]
    );


  // =========================================================
  // CURRENT ORDERS
  // =========================================================

  const visibleOrders =
    selectedTab === 'active'
      ? activeOrders
      : completedOrders;


  // =========================================================
  // OPEN ORDER
  // =========================================================

  function openOrder(order) {
    navigation.navigate(
      'OrderDetail',
      {
        orderId:
          order?.id,
      }
    );
  }


  // =========================================================
  // CUSTOMER CANCELLATION
  // =========================================================

  async function cancelOrder(
    order
  ) {
    if (!order?.id) {
      return;
    }

    // The UI should only expose this action
    // for pending orders, but we check again
    // here before sending anything to the API.
    if (
      order?.status !==
      'pending'
    ) {
      Alert.alert(
        'Cancellation unavailable',
        'This order can no longer be cancelled because the producer has already confirmed it.'
      );

      return;
    }

    setCancellingOrderId(
      order.id
    );

    try {
      const response =
        await fetch(
          `${API}/api/orders/${order.id}/status`,
          {
            method: 'PATCH',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                status:
                  'cancelled',

                cancel_reason:
                  'Cancelled by shopper before producer confirmation',
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => null
          );

      console.log(
        'SHOPPER CANCEL RESPONSE:',
        response.status,
        JSON.stringify(
          data,
          null,
          2
        )
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to cancel this order.'
        );
      }

      // Update locally immediately so the
      // order leaves Active without waiting
      // for another screen load.
      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              order.id
                ? {
                    ...currentOrder,
                    status:
                      'cancelled',
                    cancel_reason:
                      'Cancelled by shopper before producer confirmation',
                  }
                : currentOrder
          )
      );

      Alert.alert(
        'Order cancelled',
        'Your order has been cancelled. Your refund will be returned to the original payment method.'
      );

      // Reload from the server so the UI
      // reflects the authoritative order.
      await loadOrders();
    } catch (error) {
      console.log(
        'SHOPPER CANCEL ERROR:',
        error
      );

      Alert.alert(
        'Unable to cancel order',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setCancellingOrderId(
        null
      );
    }
  }


  // =========================================================
  // CONFIRM CUSTOMER CANCELLATION
  // =========================================================

  function confirmCancellation(
    order
  ) {
    if (
      order?.status !==
      'pending'
    ) {
      Alert.alert(
        'Cancellation unavailable',
        'This order can no longer be cancelled because the producer has already confirmed it.'
      );

      return;
    }

    Alert.alert(
      'Cancel this order?',
      'This order has not yet been confirmed by the producer. If you cancel now, your payment will be refunded to your original payment method.',
      [
        {
          text:
            'Keep Order',

          style:
            'cancel',
        },

        {
          text:
            'Cancel & Refund',

          style:
            'destructive',

          onPress: () =>
            cancelOrder(
              order
            ),
        },
      ]
    );
  }


  // =========================================================
  // ORDER CARD
  // =========================================================

  function renderOrderCard(
    item
  ) {
    const status =
      getStatusDisplay(
        item?.status
      );

    const fulfillment =
      getFulfillmentDisplay(
        item?.fulfillment_type
      );

    const canCancel =
      item?.status ===
      'pending';

    const isCancelling =
      cancellingOrderId ===
      item?.id;

    return (
      <View
        key={item?.id}
        style={
          styles.orderCard
        }
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            openOrder(item)
          }
        >
          <View
            style={
              styles.orderHeader
            }
          >
            <View
              style={
                styles.orderHeaderLeft
              }
            >
              <Text
                style={
                  styles.orderNumber
                }
              >
                Order #{item?.id}
              </Text>

              {!!item?.created_at && (
                <Text
                  style={
                    styles.orderDate
                  }
                >
                  {formatOrderDate(
                    item.created_at
                  )}
                </Text>
              )}
            </View>

            <View
              style={
                styles.statusBadge
              }
            >
              <Ionicons
                name={
                  status.icon
                }
                size={15}
                color={
                  COLORS.forest
                }
              />

              <Text
                style={
                  styles.statusText
                }
              >
                {status.label}
              </Text>
            </View>
          </View>


          {/* =============================================
              PRODUCER
          ============================================= */}

          <View
            style={
              styles.producerRow
            }
          >
            <View
              style={
                styles.producerIcon
              }
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color={
                  COLORS.forest
                }
              />
            </View>

            <View
              style={
                styles.producerText
              }
            >
              <Text
                style={
                  styles.producerLabel
                }
              >
                Producer
              </Text>

              <Text
                numberOfLines={1}
                style={
                  styles.producerName
                }
              >
                {item?.shop_name ||
                  item?.producer_name ||
                  'Local Producer'}
              </Text>
            </View>
          </View>


          {/* =============================================
              ORDER META
          ============================================= */}

          <View
            style={
              styles.metaRow
            }
          >
            <View
              style={
                styles.metaItem
              }
            >
              <Ionicons
                name={
                  fulfillment.icon
                }
                size={17}
                color={
                  COLORS.forest
                }
              />

              <View
                style={
                  styles.metaTextWrap
                }
              >
                <Text
                  style={
                    styles.metaLabel
                  }
                >
                  Fulfillment
                </Text>

                <Text
                  style={
                    styles.metaValue
                  }
                >
                  {fulfillment.label}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.metaItem
              }
            >
              <Ionicons
                name="cash-outline"
                size={17}
                color={
                  COLORS.forest
                }
              />

              <View
                style={
                  styles.metaTextWrap
                }
              >
                <Text
                  style={
                    styles.metaLabel
                  }
                >
                  Total
                </Text>

                <Text
                  style={
                    styles.metaValue
                  }
                >
                  {formatMoney(
                    item?.total
                  )}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
                {/* =============================================
            ACTIONS
        ============================================= */}

        <View
          style={
            styles.actionSection
          }
        >
          <TouchableOpacity
            activeOpacity={0.88}
            style={
              styles.viewOrderButton
            }
            onPress={() =>
              openOrder(item)
            }
          >
            <Text
              style={
                styles.viewOrderButtonText
              }
            >
              View Order
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={
                COLORS.forest
              }
            />
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={
                isCancelling
              }
              style={[
                styles.cancelOrderButton,

                isCancelling &&
                  styles
                    .cancelOrderButtonDisabled,
              ]}
              onPress={() =>
                confirmCancellation(
                  item
                )
              }
            >
              {isCancelling ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.danger
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={
                      COLORS.danger
                    }
                  />

                  <Text
                    style={
                      styles
                        .cancelOrderButtonText
                    }
                  >
                    Cancel Order
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>


        {/* =============================================
            CUSTOMER CANCELLATION WINDOW
        ============================================= */}

        {canCancel && (
          <View
            style={
              styles.cancelInfo
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={
                COLORS.subText
              }
            />

            <Text
              style={
                styles.cancelInfoText
              }
            >
              You may cancel this order
              until the producer confirms
              it. A cancellation will
              refund the original payment
              method.
            </Text>
          </View>
        )}
      </View>
    );
  }


  // =========================================================
  // EMPTY STATE
  // =========================================================

  function renderEmptyState() {
    const isCompleted =
      selectedTab ===
      'completed';

    return (
      <View
        style={
          styles.emptyCard
        }
      >
        <View
          style={
            styles.emptyIconWrap
          }
        >
          <Ionicons
            name={
              isCompleted
                ? 'checkmark-done-outline'
                : 'receipt-outline'
            }
            size={34}
            color={
              COLORS.forest
            }
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          {isCompleted
            ? 'No completed orders yet'
            : 'No active orders'}
        </Text>

        <Text
          style={
            styles.emptyMessage
          }
        >
          {isCompleted
            ? 'Completed and cancelled orders will appear here.'
            : 'Your current local purchases will appear here.'}
        </Text>

        {!isCompleted && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={
              styles.shopButton
            }
            onPress={() =>
              navigation.navigate(
                'Home'
              )
            }
          >
            <Ionicons
              name="storefront-outline"
              size={19}
              color={
                COLORS.brown
              }
            />

            <Text
              style={
                styles.shopButtonText
              }
            >
              Shop Local
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }


  // =========================================================
  // SIGNED OUT
  // =========================================================

  if (
    !token ||
    token === 'guest'
  ) {
    return (
      <ImageBackground
        source={IMAGE_ASSETS.backgrounds.orders}
        resizeMode="cover"
        style={
          styles.background
        }
      >
        <View
          style={
            styles.backgroundOverlay
          }
        >
          <SafeAreaView
            style={
              styles.safeArea
            }
          >
            <StatusBar
              barStyle="dark-content"
            />

            <View
              style={
                styles.signedOutWrap
              }
            >
              <View
                style={
                  styles.signedOutIcon
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={
                    COLORS.forest
                  }
                />
              </View>

              <Text
                style={
                  styles.signedOutTitle
                }
              >
                Sign in to view your
                orders
              </Text>

              <Text
                style={
                  styles.signedOutText
                }
              >
                Track confirmations,
                pickup status, delivery
                updates, refunds, and
                completed purchases.
              </Text>

              <TouchableOpacity
                activeOpacity={0.88}
                style={
                  styles.shopButton
                }
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate(
                      'Auth'
                    )
                }
              >
                <Ionicons
                  name="log-in-outline"
                  size={19}
                  color={
                    COLORS.brown
                  }
                />

                <Text
                  style={
                    styles
                      .shopButtonText
                  }
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading &&
    !orders.length
  ) {
    return (
      <ImageBackground
        source={IMAGE_ASSETS.backgrounds.orders}
        resizeMode="cover"
        style={
          styles.background
        }
      >
        <View
          style={
            styles.backgroundOverlay
          }
        >
          <SafeAreaView
            style={
              styles.loadingScreen
            }
          >
            <StatusBar
              barStyle="dark-content"
            />

            <ActivityIndicator
              size="large"
              color={
                COLORS.forest
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading your orders...
            </Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }


  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <ImageBackground
      source={IMAGE_ASSETS.backgrounds.orders}
      resizeMode="cover"
      style={
        styles.background
      }
    >
      <View
        style={
          styles.backgroundOverlay
        }
      >
        <SafeAreaView
          style={
            styles.safeArea
          }
        >
          <StatusBar
            barStyle="dark-content"
          />

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  handleRefresh
                }
                tintColor={
                  COLORS.forest
                }
                colors={[
                  COLORS.forest,
                ]}
              />
            }
            contentContainerStyle={
              styles.scrollContent
            }
          >

            {/* =========================================
                HEADER
            ========================================= */}

            <View
              style={
                styles.header
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                Purchases
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                My Orders
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Track confirmations,
                pickup status, delivery
                updates, refunds, and
                completed local
                purchases.
              </Text>
            </View>


            {/* =========================================
                TABS
            ========================================= */}

            <View
              style={
                styles.tabContainer
              }
            >
              <TouchableOpacity
                activeOpacity={0.82}
                style={[
                  styles.tabButton,

                  selectedTab ===
                    'active' &&
                    styles
                      .tabButtonActive,
                ]}
                onPress={() =>
                  setSelectedTab(
                    'active'
                  )
                }
              >
                <Text
                  style={[
                    styles.tabText,

                    selectedTab ===
                      'active' &&
                      styles
                        .tabTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                style={[
                  styles.tabButton,

                  selectedTab ===
                    'completed' &&
                    styles
                      .tabButtonActive,
                ]}
                onPress={() =>
                  setSelectedTab(
                    'completed'
                  )
                }
              >
                <Text
                  style={[
                    styles.tabText,

                    selectedTab ===
                      'completed' &&
                      styles
                        .tabTextActive,
                  ]}
                >
                  Completed
                </Text>
              </TouchableOpacity>
            </View>


            {/* =========================================
                ORDER COUNTS
            ========================================= */}

            <View
              style={
                styles.countRow
              }
            >
              <View
                style={
                  styles.countCard
                }
              >
                <Text
                  style={
                    styles.countValue
                  }
                >
                  {
                    activeOrders.length
                  }
                </Text>

                <Text
                  style={
                    styles.countLabel
                  }
                >
                  Active
                </Text>
              </View>

              <View
                style={
                  styles.countCard
                }
              >
                <Text
                  style={
                    styles.countValue
                  }
                >
                  {
                    completedOrders.length
                  }
                </Text>

                <Text
                  style={
                    styles.countLabel
                  }
                >
                  Completed
                </Text>
              </View>
            </View>


            {/* =========================================
                ORDERS
            ========================================= */}

            <View
              style={
                styles.ordersSection
              }
            >
              <View
                style={
                  styles.ordersHeadingRow
                }
              >
                <Text
                  style={
                    styles.ordersHeading
                  }
                >
                  {selectedTab ===
                  'active'
                    ? 'Current Orders'
                    : 'Order History'}
                </Text>

                <Text
                  style={
                    styles.ordersCountText
                  }
                >
                  {
                    visibleOrders.length
                  }{' '}
                  {visibleOrders.length ===
                  1
                    ? 'order'
                    : 'orders'}
                </Text>
              </View>

              {visibleOrders.length ? (
                visibleOrders.map(
                  (order) =>
                    renderOrderCard(
                      order
                    )
                )
              ) : (
                renderEmptyState()
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}


// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
    // =========================================================
  // SCREEN
  // =========================================================

  background: {
    flex: 1,
    backgroundColor:
      COLORS.cream,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(250,247,247,0.68)',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
  },


  // =========================================================
  // HEADER
  // =========================================================

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform:
      'uppercase',
    color:
      COLORS.forest,
  },

  title: {
    marginTop: 3,
    fontFamily:
      FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color:
      COLORS.brown,
  },

  subtitle: {
    marginTop: 6,
    maxWidth: 340,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    color:
      COLORS.subText,
  },


  // =========================================================
  // TABS
  // =========================================================

  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  tabButtonActive: {
    backgroundColor:
      COLORS.forest,
  },

  tabText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.subText,
  },

  tabTextActive: {
    color:
      COLORS.white,
  },


  // =========================================================
  // COUNTS
  // =========================================================

  countRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },

  countCard: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  countValue: {
    fontFamily:
      FONTS.display,
    fontSize: 25,
    color:
      COLORS.forest,
  },

  countLabel: {
    marginTop: 2,
    fontFamily:
      FONTS.body,
    fontSize: 11,
    color:
      COLORS.subText,
  },


  // =========================================================
  // ORDERS SECTION
  // =========================================================

  ordersSection: {
    flex: 1,
  },

  ordersHeadingRow: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  ordersHeading: {
    fontFamily:
      FONTS.display,
    fontSize: 22,
    color:
      COLORS.brown,
  },

  ordersCountText: {
    fontFamily:
      FONTS.body,
    fontSize: 11,
    color:
      COLORS.subText,
  },


  // =========================================================
  // ORDER CARD
  // =========================================================

  orderCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
  },

  orderHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },

  orderNumber: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 15,
    color:
      COLORS.brown,
  },

  orderDate: {
    marginTop: 3,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    color:
      COLORS.subText,
  },

  statusBadge: {
    maxWidth: 160,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.cream,
  },

  statusText: {
    flexShrink: 1,
    marginLeft: 5,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 9,
    color:
      COLORS.forest,
  },


  // =========================================================
  // PRODUCER
  // =========================================================

  producerRow: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.cream,
  },

  producerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.white,
  },

  producerText: {
    flex: 1,
    marginLeft: 10,
  },

  producerLabel: {
    fontFamily:
      FONTS.body,
    fontSize: 9,
    textTransform:
      'uppercase',
    letterSpacing: 0.7,
    color:
      COLORS.subText,
  },

  producerName: {
    marginTop: 2,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 13,
    color:
      COLORS.brown,
  },


  // =========================================================
  // META
  // =========================================================

  metaRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },

  metaItem: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.white,
  },

  metaTextWrap: {
    flex: 1,
    marginLeft: 8,
  },

  metaLabel: {
    fontFamily:
      FONTS.body,
    fontSize: 9,
    color:
      COLORS.subText,
  },

  metaValue: {
    marginTop: 2,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.brown,
  },


  // =========================================================
  // ORDER ACTIONS
  // =========================================================

  actionSection: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
    gap: 9,
  },

  viewOrderButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor:
      COLORS.cream,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  viewOrderButtonText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.forest,
  },


  // =========================================================
  // CUSTOMER CANCELLATION
  // =========================================================

  cancelOrderButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    borderWidth: 1,
    borderColor:
      COLORS.danger,
    backgroundColor:
      COLORS.white,
  },

  cancelOrderButtonDisabled: {
    opacity: 0.55,
  },

  cancelOrderButtonText: {
    marginLeft: 7,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.danger,
  },

  cancelInfo: {
    marginTop: 10,
    padding: 11,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    backgroundColor:
      COLORS.cream,
  },

  cancelInfoText: {
    flex: 1,
    marginLeft: 7,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color:
      COLORS.subText,
  },


  // =========================================================
  // EMPTY STATE
  // =========================================================

  emptyCard: {
    minHeight: 290,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cream,
  },

  emptyTitle: {
    marginTop: 16,
    fontFamily:
      FONTS.display,
    fontSize: 23,
    textAlign: 'center',
    color:
      COLORS.brown,
  },

  emptyMessage: {
    marginTop: 7,
    maxWidth: 280,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color:
      COLORS.subText,
  },

  shopButton: {
    minHeight: 49,
    marginTop: 20,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.gold,
  },

  shopButtonText: {
    marginLeft: 7,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.brown,
  },


  // =========================================================
  // SIGNED OUT
  // =========================================================

  signedOutWrap: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  signedOutIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  signedOutTitle: {
    marginTop: 18,
    fontFamily:
      FONTS.display,
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
    color:
      COLORS.brown,
  },

  signedOutText: {
    marginTop: 9,
    maxWidth: 310,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color:
      COLORS.subText,
  },


  // =========================================================
  // LOADING
  // =========================================================

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  loadingText: {
    marginTop: 12,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    color:
      COLORS.subText,
  },
});