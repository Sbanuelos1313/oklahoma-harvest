import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';


const STATUS_LABELS = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  fulfilled: 'Completed',
  cancelled: 'Cancelled',
  auto_cancelled: 'Auto-Cancelled',
};

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


export default function OrdersScreen({
  API,
  token,
  user,
  cart,
  navigation,
}) {
  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const alertShownRef = useRef(false);

  const isGuest =
    !token ||
    token === 'guest' ||
    sessionExpired;


const navigateToAuth = useCallback(() => {
  let rootNavigation = navigation;

  while (rootNavigation.getParent()) {
    rootNavigation = rootNavigation.getParent();
  }

  rootNavigation.navigate('Auth');
}, [navigation]);

  const handleExpiredSession = useCallback(() => {
    setOrders([]);
    setSessionExpired(true);
    setLoading(false);
    setRefreshing(false);

    if (alertShownRef.current) {
      return;
    }

    alertShownRef.current = true;

    Alert.alert(
      'Session Expired',
      'Your sign-in session has expired. Please sign in again to view your orders.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Sign In',
          onPress: navigateToAuth,
        },
      ]
    );
  }, [navigateToAuth]);


  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!token || token === 'guest') {
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (sessionExpired) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${API}/api/orders/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 401) {
          handleExpiredSession();
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.message ||
              'Unable to load orders.'
          );
        }

        setOrders(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'Load orders error:',
          error
        );

        setOrders([]);

        Alert.alert(
          'Unable to Load Orders',
          error?.message ||
            'Your orders could not be loaded. Please try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      API,
      token,
      sessionExpired,
      handleExpiredSession,
    ]
  );


  useEffect(() => {
    if (token && token !== 'guest') {
      setSessionExpired(false);
      alertShownRef.current = false;
    }
  }, [token]);


  useEffect(() => {
    loadOrders();

    const unsubscribe = navigation.addListener(
      'focus',
      () => {
        loadOrders();
      }
    );

    return unsubscribe;
  }, [navigation, loadOrders]);


  const filteredOrders = useMemo(() => {
    if (selectedTab === 'completed') {
      return orders.filter((order) =>
        COMPLETED_STATUSES.includes(
          order?.status
        )
      );
    }

    return orders.filter(
      (order) =>
        ACTIVE_STATUSES.includes(
          order?.status
        ) || !order?.status
    );
  }, [orders, selectedTab]);


  function openOrder(order) {
    const parentNavigation =
      navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate(
        'OrderDetail',
        {
          order,
        }
      );

      return;
    }

    navigation.navigate(
      'OrderDetail',
      {
        order,
      }
    );
  }


  function goShopping() {
    navigation.navigate('Home');
  }


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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }


  function renderStatus(order) {
    const status =
      order?.status || 'pending';

    const isCompleted =
      status === 'fulfilled';

    const isCancelled = [
      'cancelled',
      'auto_cancelled',
    ].includes(status);

    return (
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
    );
  }


  function renderOrder({ item }) {
    const itemCount =
      item?.items?.reduce(
        (sum, orderItem) =>
          sum +
          Number(
            orderItem?.quantity || 0
          ),
        0
      ) ||
      item?.item_count ||
      0;

    const fulfillment =
      item?.fulfillment_type ||
      'pickup';

    const fulfillmentIcon =
      fulfillment === 'delivery'
        ? 'car-outline'
        : fulfillment === 'shipping'
          ? 'cube-outline'
          : 'bag-handle-outline';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.orderCard}
        onPress={() => openOrder(item)}
      >
        <View style={styles.orderTopRow}>
          <View style={styles.orderIdentity}>
            <View style={styles.vendorIconWrap}>
              <Ionicons
                name="storefront-outline"
                size={22}
                color={COLORS.forest}
              />
            </View>

            <View style={styles.orderIdentityText}>
              <Text style={styles.orderNumber}>
                Order #{item?.id || '—'}
              </Text>

              <Text
                numberOfLines={1}
                style={styles.vendorName}
              >
                {item?.shop_name ||
                  item?.producer_name ||
                  'Local Vendor'}
              </Text>
            </View>
          </View>

          <Text style={styles.orderTotal}>
            $
            {Number(
              item?.total || 0
            ).toFixed(2)}
          </Text>
        </View>

        {renderStatus(item)}

        <View style={styles.orderDivider} />

        <View style={styles.orderMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.forest}
            />

            <Text style={styles.metaText}>
              {formatDate(
                item?.created_at
              )}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name={fulfillmentIcon}
              size={16}
              color={COLORS.forest}
            />

            <Text style={styles.metaText}>
              {String(
                fulfillment
              ).replaceAll('_', ' ')}
            </Text>
          </View>

          {itemCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons
                name="basket-outline"
                size={16}
                color={COLORS.forest}
              />

              <Text style={styles.metaText}>
                {itemCount}{' '}
                {itemCount === 1
                  ? 'item'
                  : 'items'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.orderActionRow}>
          <Text style={styles.viewDetailsText}>
            View Order
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.forest}
          />
        </View>
      </TouchableOpacity>
    );
  }


  function renderEmptyState() {
    const completed =
      selectedTab === 'completed';

    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyDecorativeHeader}>
          <View style={styles.emptyHeaderIcon}>
            <Ionicons
              name={
                completed
                  ? 'checkmark-done-outline'
                  : 'receipt-outline'
              }
              size={38}
              color={COLORS.forest}
            />
          </View>

          <Text style={styles.emptyEyebrow}>
            {completed
              ? 'Order History'
              : 'Local Purchases'}
          </Text>
        </View>

        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>
            {completed
              ? 'No completed orders yet'
              : 'No active orders'}
          </Text>

          <Text style={styles.emptyMessage}>
            {completed
              ? 'Completed and cancelled purchases will appear here.'
              : 'Start shopping local vendors and your purchases will appear here.'}
          </Text>

          {!completed && (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.shopButton}
              onPress={goShopping}
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color={COLORS.brown}
              />

              <Text style={styles.shopButtonText}>
                Shop Local
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }


  function renderSignedOutState() {
    return (
      <ImageBackground
        source={require('../assets/backgrounds/bg_settings.jpg')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.guestHeader}>
              <Text style={styles.eyebrow}>
                Purchases
              </Text>

              <Text style={styles.title}>
                My Orders
              </Text>

              <Text style={styles.subtitle}>
                Sign in to view confirmations,
                pickup updates, deliveries,
                receipts, and completed purchases.
              </Text>
            </View>

            <View style={styles.guestCard}>
              <View style={styles.guestDecorativeHeader}>
                <View style={styles.guestHeaderIcon}>
                  <Ionicons
                    name={
                      sessionExpired
                        ? 'time-outline'
                        : 'receipt-outline'
                    }
                    size={38}
                    color={COLORS.forest}
                  />
                </View>

                <Text style={styles.guestCardEyebrow}>
                  {sessionExpired
                    ? 'Secure Access Required'
                    : 'Your Local Purchases'}
                </Text>
              </View>

              <View style={styles.guestContent}>
                <Text style={styles.emptyTitle}>
                  {sessionExpired
                    ? 'Your session expired'
                    : 'Sign in to view orders'}
                </Text>

                <Text style={styles.emptyMessage}>
                  {sessionExpired
                    ? 'Please sign in again to securely access your order history, confirmations, and pickup updates.'
                    : 'Sign in or create an account to track purchases from your favorite local producers.'}
                </Text>

                <View style={styles.guestFeatureList}>
                  <GuestFeature
                    icon="checkmark-circle-outline"
                    text="Track producer confirmations"
                  />

                  <GuestFeature
                    icon="bag-handle-outline"
                    text="View pickup and delivery updates"
                  />

                  <GuestFeature
                    icon="receipt-outline"
                    text="Access completed orders and receipts"
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.shopButton}
                  onPress={navigateToAuth}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={COLORS.brown}
                  />

                  <Text style={styles.shopButtonText}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }


  if (isGuest) {
    return renderSignedOutState();
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

          <FlatList
            data={filteredOrders}
            keyExtractor={(item, index) =>
              String(item?.id || index)
            }
            renderItem={renderOrder}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() =>
                  loadOrders(true)
                }
                tintColor={COLORS.forest}
              />
            }
            ListHeaderComponent={
              <View>
                <View style={styles.header}>
                  <Text style={styles.eyebrow}>
                    Purchases
                  </Text>

                  <Text style={styles.title}>
                    My Orders
                  </Text>

                  <Text style={styles.subtitle}>
                    Track confirmations, pickup
                    status, delivery updates, and
                    completed local purchases.
                  </Text>
                </View>

                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[
                      styles.tabButton,
                      selectedTab === 'active' &&
                        styles.tabButtonActive,
                    ]}
                    onPress={() =>
                      setSelectedTab('active')
                    }
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedTab === 'active' &&
                          styles.tabTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[
                      styles.tabButton,
                      selectedTab === 'completed' &&
                        styles.tabButtonActive,
                    ]}
                    onPress={() =>
                      setSelectedTab('completed')
                    }
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedTab === 'completed' &&
                          styles.tabTextActive,
                      ]}
                    >
                      Completed
                    </Text>
                  </TouchableOpacity>
                </View>

                {loading && (
                  <View style={styles.loadingState}>
                    <ActivityIndicator
                      size="large"
                      color={COLORS.forest}
                    />

                    <Text style={styles.loadingText}>
                      Loading your orders...
                    </Text>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              loading
                ? null
                : renderEmptyState()
            }
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}


function GuestFeature({
  icon,
  text,
}) {
  return (
    <View style={styles.guestFeatureRow}>
      <View style={styles.guestFeatureIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.forest}
        />
      </View>

      <Text style={styles.guestFeatureText}>
        {text}
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
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 132,
  },

  header: {
    paddingTop: 16,
    paddingBottom: 18,
  },

  guestHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 42,
    color: COLORS.brown,
  },

  subtitle: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.subText,
  },

  tabContainer: {
    height: 52,
    marginBottom: 18,
    padding: 5,
    borderRadius: 26,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.92)',
    ...SHADOWS.soft,
  },

  tabButton: {
    flex: 1,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabButtonActive: {
    backgroundColor: COLORS.forest,
  },

  tabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.subText,
  },

  tabTextActive: {
    color: COLORS.white,
  },

  loadingState: {
    paddingVertical: 50,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.subText,
  },

  orderCard: {
    marginBottom: 15,
    padding: 17,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.95)',
    ...SHADOWS.soft,
  },

  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  orderIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },

  vendorIconWrap: {
    width: 46,
    height: 46,
    marginRight: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  orderIdentityText: {
    flex: 1,
  },

  orderNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  vendorName: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 21,
    color: COLORS.brown,
  },

  orderTotal: {
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.forest,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    minHeight: 32,
    marginTop: 15,
    paddingHorizontal: 11,
    borderRadius: 16,
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

  orderDivider: {
    height: 1,
    marginVertical: 15,
    backgroundColor: COLORS.divider,
  },

  orderMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
    color: COLORS.subText,
  },

  orderActionRow: {
    minHeight: 42,
    marginTop: 15,
    paddingHorizontal: 13,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(74,103,65,0.09)',
  },

  viewDetailsText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  emptyCard: {
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.97)',
    ...SHADOWS.medium,
  },

  emptyDecorativeHeader: {
    minHeight: 165,
    paddingHorizontal: 24,
    paddingVertical: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  emptyHeaderIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  emptyEyebrow: {
    marginTop: 16,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  emptyContent: {
    paddingHorizontal: 27,
    paddingVertical: 29,
    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 25,
    lineHeight: 31,
    textAlign: 'center',
    color: COLORS.brown,
  },

  emptyMessage: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.subText,
  },

  shopButton: {
    width: '100%',
    height: 52,
    marginTop: 19,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    ...SHADOWS.soft,
  },

  shopButtonText: {
    marginLeft: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  guestCard: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 150,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.97)',
    ...SHADOWS.medium,
  },

  guestDecorativeHeader: {
    minHeight: 135,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  guestHeaderIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  guestCardEyebrow: {
    marginTop: 13,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  guestContent: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 26,
    alignItems: 'center',
  },

  guestFeatureList: {
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(74,103,65,0.07)',
  },

  guestFeatureRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
  },

  guestFeatureIcon: {
    width: 31,
    height: 31,
    marginRight: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.88)',
  },

  guestFeatureText: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.brown,
  },
});