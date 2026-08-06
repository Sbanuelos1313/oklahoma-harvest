import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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

const ORDER_FILTERS = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
  },
  {
    key: 'ready',
    label: 'Ready',
  },
  {
    key: 'fulfilled',
    label: 'Completed',
  },
];

const NEXT_ACTIONS = {
  pending: [
    {
      label: 'Confirm Order',
      status: 'confirmed',
      variant: 'primary',
      icon: 'checkmark-circle-outline',
    },
    {
      label: 'Cancel',
      status: 'cancelled',
      variant: 'outline',
      icon: 'close-circle-outline',
    },
  ],

  confirmed: [
    {
      label: 'Ready for Pickup',
      status: 'ready_for_pickup',
      variant: 'primary',
      icon: 'bag-check-outline',
    },
    {
      label: 'Out for Delivery',
      status: 'out_for_delivery',
      variant: 'secondary',
      icon: 'car-outline',
    },
  ],

  ready_for_pickup: [
    {
      label: 'Mark Fulfilled',
      status: 'fulfilled',
      variant: 'primary',
      icon: 'checkmark-done-outline',
    },
  ],

  out_for_delivery: [
    {
      label: 'Mark Fulfilled',
      status: 'fulfilled',
      variant: 'primary',
      icon: 'checkmark-done-outline',
    },
  ],
};

export default function VendorOrdersScreen({
  API,
  token,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);
  const [selectedFilter, setSelectedFilter] =
    useState('all');

  const loadOrders = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${API}/api/orders/producer/incoming`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load orders.'
          );
        }

        setOrders(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          'Unable to load vendor orders:',
          error
        );

        setOrders([]);

        if (!showLoading) {
          Alert.alert(
            'Unable to refresh',
            error?.message ||
              'Please try again.'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API, token]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleRefresh() {
    setRefreshing(true);

    await loadOrders({
      showLoading: false,
    });
  }

  async function updateOrderStatus(
    orderId,
    status
  ) {
    if (updatingOrderId) {
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      const response = await fetch(
        `${API}/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to update order.'
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order
        )
      );
    } catch (error) {
      console.error(
        'Unable to update order:',
        error
      );

      Alert.alert(
        'Order update failed',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function confirmStatusUpdate(
    order,
    action
  ) {
    const isCancellation =
      action.status === 'cancelled';

    Alert.alert(
      isCancellation
        ? 'Cancel this order?'
        : action.label,
      getConfirmationMessage(
        order,
        action.status
      ),
      [
        {
          text: 'Go Back',
          style: 'cancel',
        },
        {
          text: isCancellation
            ? 'Cancel Order'
            : 'Continue',
          style: isCancellation
            ? 'destructive'
            : 'default',
          onPress: () =>
            updateOrderStatus(
              order.id,
              action.status
            ),
        },
      ]
    );
  }

  const orderSummary = useMemo(() => {
    const pending = orders.filter(
      (order) => order.status === 'pending'
    ).length;

    const active = orders.filter((order) =>
      [
        'confirmed',
        'ready_for_pickup',
        'out_for_delivery',
      ].includes(order.status)
    ).length;

    const fulfilled = orders.filter(
      (order) => order.status === 'fulfilled'
    ).length;

    const openValue = orders
      .filter((order) =>
        [
          'pending',
          'confirmed',
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
      pending,
      active,
      fulfilled,
      openValue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') {
      return orders;
    }

    if (selectedFilter === 'ready') {
      return orders.filter((order) =>
        [
          'ready_for_pickup',
          'out_for_delivery',
        ].includes(order.status)
      );
    }

    return orders.filter(
      (order) =>
        order.status === selectedFilter
    );
  }, [orders, selectedFilter]);

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
              name="receipt-outline"
              size={30}
              color={COLORS.forest}
            />
          </View>

          <ActivityIndicator
            color={COLORS.forest}
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingTitle}>
            Loading orders
          </Text>

          <Text style={styles.loadingMessage}>
            Gathering your incoming and active
            customer orders.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cream}
      />

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.root}
      >
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) =>
            String(item.id)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.forest}
              colors={[COLORS.forest]}
            />
          }
          ListHeaderComponent={
            <OrdersHeader
              summary={orderSummary}
              selectedFilter={selectedFilter}
              setSelectedFilter={
                setSelectedFilter
              }
            />
          }
          ListEmptyComponent={
            orders.length === 0 ? (
              <View style={styles.emptyWrapper}>
                <EmptyState
                  image={
                    IMAGE_ASSETS.hero.checkout
                  }
                  title="No orders yet"
                  message="Customer orders will appear here once purchases are made."
                  buttonTitle="Refresh"
                  onPress={() =>
                    loadOrders()
                  }
                />
              </View>
            ) : (
              <FilteredEmptyState
                onClear={() =>
                  setSelectedFilter('all')
                }
              />
            )
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              updating={
                updatingOrderId === item.id
              }
              onAction={(action) =>
                confirmStatusUpdate(
                  item,
                  action
                )
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function OrdersHeader({
  summary,
  selectedFilter,
  setSelectedFilter,
}) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          Vendor orders
        </Text>

        <Text style={styles.title}>
          Incoming Orders
        </Text>

        <Text style={styles.subtitle}>
          Confirm purchases, prepare fulfillment,
          and keep customers updated.
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard
          icon="time-outline"
          value={summary.pending}
          label="Pending"
          warning={summary.pending > 0}
        />

        <SummaryCard
          icon="bag-handle-outline"
          value={summary.active}
          label="Active"
        />

        <SummaryCard
          icon="cash-outline"
          value={`$${summary.openValue.toFixed(
            0
          )}`}
          label="Open Value"
        />
      </View>

      <FlatList
        horizontal
        data={ORDER_FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const selected =
            selectedFilter === item.key;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.filterButton,
                selected &&
                  styles.filterButtonSelected,
              ]}
              onPress={() =>
                setSelectedFilter(item.key)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  selected &&
                    styles.filterTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          Orders
        </Text>

        <Text style={styles.resultsCount}>
          {summary.fulfilled} completed
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  warning = false,
}) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          warning && styles.summaryIconWarning,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            warning
              ? COLORS.rust
              : COLORS.forest
          }
        />
      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.summaryValue,
          warning &&
            styles.summaryValueWarning,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function OrderCard({
  order,
  updating,
  onAction,
}) {
  const actions =
    NEXT_ACTIONS[order.status] || [];

  const hoursRemaining = Number(
    order.hours_remaining || 0
  );

  const urgent =
    order.status === 'pending' &&
    hoursRemaining > 0 &&
    hoursRemaining <= 4;

  const customerName =
    order.shopper_name ||
    order.customer_name ||
    'Customer';

  const fulfillmentType =
    order.fulfillment_type || 'pickup';

  return (
    <View style={styles.orderCard}>
      <View style={styles.cardTop}>
        <View style={styles.orderIdentity}>
          <View style={styles.orderIcon}>
            <Ionicons
              name="receipt-outline"
              size={20}
              color={COLORS.forest}
            />
          </View>

          <View style={styles.orderTitleCopy}>
            <Text style={styles.orderNumber}>
              Order #{order.id}
            </Text>

            <Text
              numberOfLines={1}
              style={styles.customerName}
            >
              {customerName}
            </Text>
          </View>
        </View>

        <Text style={styles.total}>
          ${Number(order.total || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <StatusBadge
          status={order.status}
        />

        <View style={styles.fulfillmentBadge}>
          <Ionicons
            name={getFulfillmentIcon(
              fulfillmentType
            )}
            size={13}
            color={COLORS.forest}
          />

          <Text
            style={styles.fulfillmentText}
          >
            {formatLabel(fulfillmentType)}
          </Text>
        </View>
      </View>

      {order.status === 'pending' &&
        hoursRemaining > 0 && (
          <View
            style={[
              styles.deadlineBox,
              urgent &&
                styles.deadlineBoxUrgent,
            ]}
          >
            <Ionicons
              name={
                urgent
                  ? 'alert-circle-outline'
                  : 'time-outline'
              }
              size={18}
              color={
                urgent
                  ? COLORS.rust
                  : COLORS.forest
              }
            />

            <View style={styles.deadlineCopy}>
              <Text
                style={[
                  styles.deadlineTitle,
                  urgent &&
                    styles.deadlineTitleUrgent,
                ]}
              >
                {urgent
                  ? 'Action needed soon'
                  : 'Confirmation window'}
              </Text>

              <Text
                style={styles.deadlineText}
              >
                {hoursRemaining.toFixed(1)} hours
                remaining
              </Text>
            </View>
          </View>
        )}

      <View style={styles.orderDetails}>
        <DetailItem
          icon="person-outline"
          label="Customer"
          value={customerName}
        />

        <DetailItem
          icon={getFulfillmentIcon(
            fulfillmentType
          )}
          label="Fulfillment"
          value={formatLabel(
            fulfillmentType
          )}
        />
      </View>

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <AppButton
              key={action.status}
              title={
                updating
                  ? 'Updating...'
                  : action.label
              }
              variant={action.variant}
              disabled={updating}
              onPress={() => onAction(action)}
              style={styles.actionButton}
            />
          ))}
        </View>
      ) : (
        <View style={styles.completeMessage}>
          <Ionicons
            name={
              order.status === 'cancelled'
                ? 'close-circle-outline'
                : 'checkmark-circle-outline'
            }
            size={19}
            color={
              order.status === 'cancelled'
                ? COLORS.rust
                : COLORS.success
            }
          />

          <Text
            style={[
              styles.completeMessageText,
              order.status === 'cancelled' &&
                styles.cancelledMessageText,
            ]}
          >
            {order.status === 'cancelled'
              ? 'This order was cancelled.'
              : 'This order is complete.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            config.backgroundColor,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: config.color,
          },
        ]}
      />

      <Text
        style={[
          styles.statusText,
          {
            color: config.color,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.detailValue}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function FilteredEmptyState({ onClear }) {
  return (
    <View style={styles.filteredEmpty}>
      <View style={styles.filteredEmptyIcon}>
        <Ionicons
          name="filter-outline"
          size={27}
          color={COLORS.forest}
        />
      </View>

      <Text style={styles.filteredEmptyTitle}>
        No orders in this view
      </Text>

      <Text style={styles.filteredEmptyText}>
        Try another order status or return to the
        complete order list.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.clearButtonText}>
          View All Orders
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function getConfirmationMessage(
  order,
  status
) {
  const orderNumber = `Order #${order.id}`;

  switch (status) {
    case 'confirmed':
      return `${orderNumber} will be confirmed and can begin preparation.`;

    case 'ready_for_pickup':
      return `${orderNumber} will be marked ready for customer pickup.`;

    case 'out_for_delivery':
      return `${orderNumber} will be marked as out for delivery.`;

    case 'fulfilled':
      return `${orderNumber} will be marked complete.`;

    case 'cancelled':
      return `${orderNumber} will be cancelled. This action should only be used when the order cannot be fulfilled.`;

    default:
      return `Update the status of ${orderNumber}?`;
  }
}

function getStatusConfig(status) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        color: COLORS.rust,
        backgroundColor:
          'rgba(166,61,47,0.11)',
      };

    case 'confirmed':
      return {
        label: 'Confirmed',
        color: COLORS.forest,
        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'ready_for_pickup':
      return {
        label: 'Ready for Pickup',
        color: COLORS.sage,
        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        color: COLORS.forest,
        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'fulfilled':
      return {
        label: 'Fulfilled',
        color: COLORS.success,
        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'cancelled':
      return {
        label: 'Cancelled',
        color: COLORS.rust,
        backgroundColor:
          'rgba(166,61,47,0.11)',
      };

    default:
      return {
        label: formatLabel(status),
        color: COLORS.brownSoft,
        backgroundColor: COLORS.beige,
      };
  }
}

function getFulfillmentIcon(type) {
  switch (type) {
    case 'delivery':
      return 'car-outline';

    case 'shipping':
      return 'cube-outline';

    default:
      return 'storefront-outline';
  }
}

function formatLabel(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  list: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 125,
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

  header: {
    paddingTop: 14,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.forestDark,
  },

  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.brownSoft,
  },

  summaryGrid: {
    marginTop: 19,
    flexDirection: 'row',
    gap: 9,
  },

  summaryCard: {
    flex: 1,
    minHeight: 105,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  summaryIconWarning: {
    backgroundColor: 'rgba(166,61,47,0.10)',
  },

  summaryValue: {
    marginTop: 7,
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.forest,
  },

  summaryValueWarning: {
    color: COLORS.rust,
  },

  summaryLabel: {
    marginTop: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  filterRow: {
    paddingTop: 17,
    paddingBottom: 2,
    gap: 8,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  filterButtonSelected: {
    borderColor: COLORS.forest,
    backgroundColor: COLORS.forest,
  },

  filterText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.brownSoft,
  },

  filterTextSelected: {
    color: COLORS.warmWhite,
  },

  resultsHeader: {
    marginTop: 23,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsTitle: {
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forestDark,
  },

  resultsCount: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.brownSoft,
  },

  orderCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  orderIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  orderIcon: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  orderTitleCopy: {
    flex: 1,
  },

  orderNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.sage,
  },

  customerName: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.forestDark,
  },

  total: {
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.forest,
  },

  statusRow: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
  },

  statusText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
  },

  fulfillmentBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beige,
  },

  fulfillmentText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.forest,
  },

  deadlineBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,103,65,0.08)',
  },

  deadlineBoxUrgent: {
    backgroundColor: 'rgba(166,61,47,0.09)',
  },

  deadlineCopy: {
    marginLeft: 10,
  },

  deadlineTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
  },

  deadlineTitleUrgent: {
    color: COLORS.rust,
  },

  deadlineText: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.brownSoft,
  },

  orderDetails: {
    marginTop: 14,
    padding: 12,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    backgroundColor: COLORS.cream,
  },

  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  detailCopy: {
    flex: 1,
  },

  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.brownSoft,
  },

  detailValue: {
    marginTop: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.forestDark,
  },

  actions: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  actionButton: {
    flex: 1,
    minWidth: 135,
    minHeight: 45,
  },

  completeMessage: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.08)',
  },

  completeMessageText: {
    marginLeft: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.success,
  },

  cancelledMessageText: {
    color: COLORS.rust,
  },

  emptyWrapper: {
    marginTop: 25,
  },

  filteredEmpty: {
    marginTop: 25,
    paddingHorizontal: 22,
    paddingVertical: 35,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  filteredEmptyIcon: {
    width: 57,
    height: 57,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  filteredEmptyTitle: {
    marginTop: 14,
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.forestDark,
  },

  filteredEmptyText: {
    marginTop: 7,
    maxWidth: 260,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  clearButton: {
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.forest,
  },

  clearButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.warmWhite,
  },
});