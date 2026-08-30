import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';

import {
  COLORS,
  FONTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorDashboardScreen({
  API,
  token,
  user,
  navigation,
}) {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stripe, setStripe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingStripe, setStartingStripe] =
    useState(false);

  const loadDashboard = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          shopResponse,
          productsResponse,
          ordersResponse,
          stripeResponse,
        ] = await Promise.all([
          fetch(`${API}/api/producers/me`, {
            headers,
          }),
          fetch(`${API}/api/products/my`, {
            headers,
          }),
          fetch(
            `${API}/api/orders/producer/incoming`,
            {
              headers,
            }
          ),
          fetch(
            `${API}/api/stripe/connect/status`,
            {
              headers,
            }
          ),
        ]);

        const shopData = shopResponse.ok
          ? await shopResponse.json()
          : null;

        const productsData = productsResponse.ok
          ? await productsResponse.json()
          : [];

        const ordersData = ordersResponse.ok
          ? await ordersResponse.json()
          : [];

        const stripeData = stripeResponse.ok
          ? await stripeResponse.json()
          : null;

        setShop(shopData);

        setProducts(
          Array.isArray(productsData)
            ? productsData
            : []
        );

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );

        setStripe(stripeData);
      } catch (error) {
        console.error(
          'Unable to load vendor dashboard:',
          error
        );

        setShop(null);
        setProducts([]);
        setOrders([]);
        setStripe(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API, token]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleRefresh() {
    setRefreshing(true);

    await loadDashboard({
      showLoading: false,
    });
  }

  async function startStripe() {
    if (startingStripe) {
      return;
    }

    setStartingStripe(true);

    try {
      const response = await fetch(
        `${API}/api/stripe/connect/onboard`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to start Stripe onboarding.'
        );
      }

      if (data?.onboarding_url) {
        await Linking.openURL(
          data.onboarding_url
        );

        return;
      }

      Alert.alert(
        'Stripe',
        data?.message ||
          'Stripe is already set up.'
      );
    } catch (error) {
      console.error(
        'Unable to start Stripe onboarding:',
        error
      );

      Alert.alert(
        'Stripe setup',
        error?.message ||
          'Unable to start onboarding.'
      );
    } finally {
      setStartingStripe(false);
    }
  }

  const dashboardData = useMemo(() => {
    const pendingOrders = orders.filter(
      (order) => order.status === 'pending'
    );

    const activeProducts = products.filter(
      (product) => product.is_active
    );

    const lowStockProducts = products.filter(
      (product) =>
        product.is_active &&
        Number(product.quantity_available || 0) <= 5
    );

    const openOrderValue = orders
      .filter((order) =>
        [
          'pending',
          'confirmed',
          'processing',
          'ready',
          'ready_for_pickup',
          'out_for_delivery',
        ].includes(order.status)
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    return {
      pendingCount: pendingOrders.length,
      activeCount: activeProducts.length,
      lowStockCount: lowStockProducts.length,
      openOrderValue,
    };
  }, [orders, products]);

  const firstName =
    user?.full_name?.split(' ')?.[0] ||
    user?.name?.split(' ')?.[0] ||
    'there';

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.cream}
        />

        <SafeAreaView style={styles.loadingState}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="storefront-outline"
              size={30}
              color={COLORS.forest}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={COLORS.forest}
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingTitle}>
            Loading your dashboard
          </Text>

          <Text style={styles.loadingMessage}>
            Gathering your store, products, and
            incoming orders.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

if (!shop) {
  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cream}
      />

      <SafeAreaView style={styles.emptyState}>
        <EmptyState
          image={IMAGE_ASSETS.backgrounds.vendorEmpty}
          title="Set up your vendor store"
          message="Create your storefront so customers can discover your products and place orders."
          buttonTitle="Set Up Store"
          onPress={() =>
            navigation.navigate('VendorStoreSetup')
          }
        />
      </SafeAreaView>
    </View>
  );
}
    const heroImage =
      IMAGE_ASSETS.backgrounds.vendorDashboard;

    return (
      <ImageBackground
        source={IMAGE_ASSETS.backgrounds.vendorProfile}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.forestDark}
          />

      <SafeAreaView
        edges={['left', 'right']}
        style={styles.root}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.forest}
              colors={[COLORS.forest]}
            />
          }
        >
          <View style={styles.hero}>
            <Image
              source={heroImage}
              resizeMode="cover"
              style={styles.heroImage}
            />

            <View style={styles.heroOverlay} />

            <SafeAreaView
              edges={['top']}
              style={styles.heroSafeArea}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.vendorBadge}>
                  <Ionicons
                    name="storefront-outline"
                    size={15}
                    color={COLORS.forest}
                  />

                  <Text
                    style={styles.vendorBadgeText}
                  >
                    Vendor Dashboard
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.profileButton}
                  onPress={() =>
                    navigation.navigate(
                      'VendorProfile'
                    )
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={21}
                    color={COLORS.brown}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.heroCopy}>
                <Text style={styles.greeting}>
                  Welcome back, {firstName}
                </Text>

                <Text
                  numberOfLines={2}
                  style={styles.shopName}
                >
                  {shop.shop_name}
                </Text>

                <View style={styles.storeStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      shop.admin_approved
                        ? styles.statusDotLive
                        : styles.statusDotPending,
                    ]}
                  />

                  <Text style={styles.storeStatus}>
                    {shop.admin_approved
                      ? 'Your store is live'
                      : 'Your store is pending approval'}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              icon="receipt-outline"
              value={dashboardData.pendingCount}
              label="Pending Orders"
            />

            <StatCard
              icon="cube-outline"
              value={dashboardData.activeCount}
              label="Active Products"
            />

            <StatCard
              icon="cash-outline"
              value={`$${dashboardData.openOrderValue.toFixed(
                0
              )}`}
              label="Open Value"
            />
          </View>

          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  Manage your business
                </Text>

                <Text style={styles.sectionTitle}>
                  Quick actions
                </Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <QuickAction
                icon="add-circle-outline"
                title="Add Product"
                subtitle="Create a new listing"
                onPress={() =>
                  navigation.navigate(
                    'VendorAddProduct'
                  )
                }
            />
              <QuickAction
                icon="receipt-outline"
                title="View Orders"
                subtitle="Manage customer orders"
                onPress={() =>
                  navigation.navigate(
                    'VendorOrders'
                  )
                }
              />
            </View>

            <DashboardCard
              icon="pulse-outline"
              title="Store Health"
            >
              <HealthRow
                ok={Boolean(shop.admin_approved)}
                title="Platform approval"
                subtitle={
                  shop.admin_approved
                    ? 'Your store is visible to customers.'
                    : 'Your storefront is waiting for approval.'
                }
              />

              <HealthRow
                ok={Boolean(
                  stripe?.onboarding_complete
                )}
                title="Stripe payouts"
                subtitle={
                  stripe?.onboarding_complete
                    ? 'Your account is ready to receive payouts.'
                    : 'Complete Stripe setup to receive payments.'
                }
              />

              <HealthRow
                ok={
                  dashboardData.lowStockCount === 0
                }
                warning={
                  dashboardData.lowStockCount > 0
                }
                title="Inventory levels"
                subtitle={
                  dashboardData.lowStockCount > 0
                    ? `${dashboardData.lowStockCount} product${
                        dashboardData.lowStockCount ===
                        1
                          ? ''
                          : 's'
                      } running low.`
                    : 'No active products are running low.'
                }
              />

              {!stripe?.onboarding_complete && (
                <AppButton
                  title={
                    startingStripe
                      ? 'Opening Stripe...'
                      : 'Set Up Stripe'
                  }
                  disabled={startingStripe}
                  onPress={startStripe}
                  style={styles.stripeButton}
                />
              )}
            </DashboardCard>

            <DashboardCard
              icon="receipt-outline"
              title="Recent Orders"
              action="View All"
              onAction={() =>
                navigation.navigate('VendorOrders')
              }
            >
              {orders.length ? (
                orders
                  .slice(0, 4)
                  .map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                    />
                  ))
              ) : (
                <CardEmptyState
                  icon="receipt-outline"
                  message="Incoming orders will appear here after customers make a purchase."
                />
              )}
            </DashboardCard>

            <DashboardCard
              icon="cube-outline"
              title="Inventory"
              action="Manage"
              onAction={() =>
                navigation.navigate(
                  'VendorProducts'
                )
              }
            >
              {products.length ? (
                products
                  .slice(0, 5)
                  .map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                    />
                  ))
              ) : (
                <CardEmptyState
                  icon="basket-outline"
                  message="Add your first product to begin selling through the marketplace."
                />
              )}
            </DashboardCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  </ImageBackground>
);
}

function StatCard({
  icon,
  value,
  label,
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.forest}
        />
      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.statValue}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={styles.quickAction}
      onPress={onPress}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons
          name={icon}
          size={25}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.quickActionCopy}>
        <Text style={styles.quickActionTitle}>
          {title}
        </Text>

        <Text style={styles.quickActionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={COLORS.forest}
      />
    </TouchableOpacity>
  );
}

function DashboardCard({
  icon,
  title,
  action,
  onAction,
  children,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardIcon}>
            <Ionicons
              name={icon}
              size={19}
              color={COLORS.forest}
            />
          </View>

          <Text style={styles.cardTitle}>
            {title}
          </Text>
        </View>

        {action && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onAction}
          >
            <Text style={styles.cardAction}>
              {action}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  );
}

function HealthRow({
  ok,
  warning = false,
  title,
  subtitle,
}) {
  return (
    <View style={styles.healthRow}>
      <View
        style={[
          styles.healthIcon,
          ok && styles.healthIconComplete,
          warning && styles.healthIconWarning,
        ]}
      >
        <Ionicons
          name={
            ok
              ? 'checkmark'
              : warning
                ? 'alert-outline'
                : 'time-outline'
          }
          size={17}
          color={
            ok
              ? COLORS.white
              : warning
                ? COLORS.brown
                : COLORS.forest
          }
        />
      </View>

      <View style={styles.healthCopy}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function OrderRow({ order }) {
  const customerName =
    order.shopper_name ||
    order.customer_name ||
    'Customer';

  const fulfillmentType =
    order.fulfillment_type || 'pickup';

  return (
    <View style={styles.dataRow}>
      <View style={styles.rowIcon}>
        <Ionicons
          name="bag-handle-outline"
          size={19}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.dataRowCopy}>
        <Text
          numberOfLines={1}
          style={styles.rowTitle}
        >
          Order #{order.id}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.rowSubtitle}
        >
          {customerName} · {fulfillmentType}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>
          ${Number(order.total || 0).toFixed(2)}
        </Text>

        <Text style={styles.rowStatus}>
          {order.status || 'pending'}
        </Text>
      </View>
    </View>
  );
}

function ProductRow({ product }) {
  const quantity = Number(
    product.quantity_available || 0
  );

  const lowStock =
    product.is_active && quantity <= 5;

  return (
    <View style={styles.dataRow}>
      <View style={styles.rowIcon}>
        <Ionicons
          name="cube-outline"
          size={19}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.dataRowCopy}>
        <Text
          numberOfLines={1}
          style={styles.rowTitle}
        >
          {product.name}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.rowSubtitle}
        >
          {quantity} available · $
          {Number(product.price || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <Text
          style={[
            styles.productStatus,
            !product.is_active &&
              styles.productStatusHidden,
            lowStock &&
              styles.productStatusWarning,
          ]}
        >
          {!product.is_active
            ? 'Hidden'
            : lowStock
              ? 'Low stock'
              : 'Active'}
        </Text>
      </View>
    </View>
  );
}

function CardEmptyState({
  icon,
  message,
}) {
  return (
    <View style={styles.cardEmptyState}>
      <View style={styles.cardEmptyIcon}>
        <Ionicons
          name={icon}
          size={23}
          color={COLORS.forest}
        />
      </View>

      <Text style={styles.cardEmptyText}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundImage: {
    opacity: 0.42,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(250,247,240,0.58)',
  },

  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 130,
  },

  loadingState: {
    flex: 1,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  loadingIndicator: {
    marginTop: 22,
  },

  loadingTitle: {
    marginTop: 15,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forestDark,
  },

  loadingMessage: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  emptyState: {
    flex: 1,
    padding: LAYOUT.screenPadding,
    justifyContent: 'center',
  },

  hero: {
    height: 330,
    overflow: 'hidden',
    backgroundColor: COLORS.forestDark,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,30,20,0.28)',
  },

  heroSafeArea: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
  },

  heroTopRow: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vendorBadge: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  vendorBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: COLORS.forest,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  heroCopy: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 45,
  },

  greeting: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.cream,
  },

  shopName: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 39,
    lineHeight: 45,
    color: COLORS.warmWhite,
  },

  storeStatusRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },

  statusDotLive: {
    backgroundColor: COLORS.success,
  },

  statusDotPending: {
    backgroundColor: COLORS.gold,
  },

  storeStatus: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.cream,
  },

  statsRow: {
    marginTop: -31,
    paddingHorizontal: LAYOUT.screenPadding,
    flexDirection: 'row',
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 122,
    paddingHorizontal: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.card,
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  statValue: {
    marginTop: 7,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forest,
  },

  statLabel: {
    marginTop: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  content: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 27,
  },

  sectionHeader: {
    marginBottom: 13,
  },

  sectionEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 27,
    color: COLORS.forestDark,
  },

  quickActions: {
    gap: 11,
  },

  quickAction: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  quickActionCopy: {
    flex: 1,
    marginHorizontal: 13,
  },

  quickActionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forestDark,
  },

  quickActionSubtitle: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.brownSoft,
  },

  card: {
    marginTop: 18,
    padding: 17,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.96)',
    ...SHADOWS.soft,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardIcon: {
    width: 37,
    height: 37,
    marginRight: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.forestDark,
  },

  cardAction: {
    paddingVertical: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.sage,
  },

  cardBody: {
    marginTop: 5,
  },

  healthRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  healthIcon: {
    width: 35,
    height: 35,
    marginRight: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  healthIconComplete: {
    backgroundColor: COLORS.success,
  },

  healthIconWarning: {
    backgroundColor: COLORS.gold,
  },

  healthCopy: {
    flex: 1,
  },

  stripeButton: {
    marginTop: 16,
  },

  dataRow: {
    minHeight: 70,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  rowIcon: {
    width: 38,
    height: 38,
    marginRight: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },

  dataRowCopy: {
    flex: 1,
    paddingRight: 8,
  },

  rowTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forestDark,
  },

  rowSubtitle: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'capitalize',
    color: COLORS.brownSoft,
  },

  rowRight: {
    alignItems: 'flex-end',
  },

  rowAmount: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forest,
  },

  rowStatus: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 10,
    textTransform: 'capitalize',
    color: COLORS.brownSoft,
  },

  productStatus: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.forest,
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  productStatusHidden: {
    color: COLORS.brownSoft,
    backgroundColor: COLORS.cream,
  },

  productStatusWarning: {
    color: COLORS.brown,
    backgroundColor: 'rgba(212,160,23,0.18)',
  },

  cardEmptyState: {
    paddingHorizontal: 13,
    paddingVertical: 25,
    alignItems: 'center',
  },

  cardEmptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  cardEmptyText: {
    marginTop: 11,
    maxWidth: 260,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },
});