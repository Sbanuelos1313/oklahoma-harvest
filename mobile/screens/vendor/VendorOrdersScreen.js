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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';

import {
  COLORS,
  FONTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

import {
  IMAGE_ASSETS,
} from '../../constants/assets';


// ===========================================================
// ORDER FILTERS
// ===========================================================

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
  {
    key: 'cancelled',
    label: 'Cancelled',
  },
];


// ===========================================================
// ORDER ACTIONS
// ===========================================================

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


// ===========================================================
// VENDOR ORDERS SCREEN
// ===========================================================

export default function VendorOrdersScreen({
  API,
  token,
}) {
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
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState(null);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState('all');

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState(null);


  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = useCallback(
    async ({
      showLoading = true,
    } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response =
          await fetch(
            `${API}/api/orders/producer/incoming`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
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
    [
      API,
      token,
    ]
  );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);


  // =========================================================
  // REFRESH
  // =========================================================

  async function handleRefresh() {
    setRefreshing(true);

    await loadOrders({
      showLoading: false,
    });
  }


  // =========================================================
  // EXPAND / COLLAPSE DETAILS
  // =========================================================

  function toggleOrderDetails(
    orderId
  ) {
    setExpandedOrderId(
      (currentOrderId) =>
        currentOrderId === orderId
          ? null
          : orderId
    );
  }


  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  async function updateOrderStatus(
    orderId,
    status
  ) {
    if (updatingOrderId) {
      return;
    }

    setUpdatingOrderId(
      orderId
    );

    try {
      const response =
        await fetch(
          `${API}/api/orders/${orderId}/status`,
          {
            method: 'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to update order.'
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id ===
              orderId
                ? {
                    ...order,
                    status,
                  }
                : order
          )
      );

      // Refresh from the server after an update so
      // cancellation/refund timestamps and any other
      // server-generated fields remain authoritative.
      await loadOrders({
        showLoading: false,
      });
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
      setUpdatingOrderId(
        null
      );
    }
  }


  // =========================================================
  // CONFIRM STATUS UPDATE
  // =========================================================

  function confirmStatusUpdate(
    order,
    action
  ) {
    const isCancellation =
      action.status ===
      'cancelled';

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


  // =========================================================
  // SUMMARY
  // =========================================================

  const orderSummary =
    useMemo(() => {
      const pending =
        orders.filter(
          (order) =>
            order.status ===
            'pending'
        ).length;

      const active =
        orders.filter(
          (order) =>
            [
              'confirmed',
              'ready_for_pickup',
              'out_for_delivery',
            ].includes(
              order.status
            )
        ).length;

      const fulfilled =
        orders.filter(
          (order) =>
            order.status ===
            'fulfilled'
        ).length;

      const cancelled =
        orders.filter(
          (order) =>
            [
              'cancelled',
              'auto_cancelled',
            ].includes(
              order.status
            )
        ).length;

      const openValue =
        orders
          .filter(
            (order) =>
              [
                'pending',
                'confirmed',
                'ready_for_pickup',
                'out_for_delivery',
              ].includes(
                order.status
              )
          )
          .reduce(
            (
              sum,
              order
            ) =>
              sum +
              Number(
                order.total || 0
              ),
            0
          );

      return {
        pending,
        active,
        fulfilled,
        cancelled,
        openValue,
      };
    }, [orders]);


  // =========================================================
  // FILTER ORDERS
  // =========================================================

  const filteredOrders =
    useMemo(() => {
      if (
        selectedFilter ===
        'all'
      ) {
        return orders;
      }

      if (
        selectedFilter ===
        'ready'
      ) {
        return orders.filter(
          (order) =>
            [
              'ready_for_pickup',
              'out_for_delivery',
            ].includes(
              order.status
            )
        );
      }

      if (
        selectedFilter ===
        'cancelled'
      ) {
        return orders.filter(
          (order) =>
            [
              'cancelled',
              'auto_cancelled',
            ].includes(
              order.status
            )
        );
      }

      return orders.filter(
        (order) =>
          order.status ===
          selectedFilter
      );
    }, [
      orders,
      selectedFilter,
    ]);


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <View
        style={
          styles.root
        }
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.cream
          }
        />

        <SafeAreaView
          style={
            styles.loadingState
          }
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <Ionicons
              name="receipt-outline"
              size={30}
              color={
                COLORS.forest
              }
            />
          </View>

          <ActivityIndicator
            color={
              COLORS.forest
            }
            style={
              styles.loadingIndicator
            }
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            Loading orders
          </Text>

          <Text
            style={
              styles.loadingMessage
            }
          >
            Gathering your incoming
            and active customer orders.
          </Text>
        </SafeAreaView>
      </View>
    );
  }


  // =========================================================
  // MAIN SCREEN
  // =========================================================

  return (
    <View
      style={
        styles.root
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.cream
        }
      />

      <SafeAreaView
        edges={[
          'top',
          'left',
          'right',
        ]}
        style={
          styles.root
        }
      >
        <FlatList
          data={
            filteredOrders
          }
          keyExtractor={
            (item) =>
              String(
                item.id
              )
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.list
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
          ListHeaderComponent={
            <OrdersHeader
              summary={
                orderSummary
              }
              selectedFilter={
                selectedFilter
              }
              setSelectedFilter={
                setSelectedFilter
              }
            />
          }
          ListEmptyComponent={
            orders.length ===
            0 ? (
              <View
                style={
                  styles.emptyWrapper
                }
              >
                <EmptyState
                  image={
                    IMAGE_ASSETS
                      .hero
                      .checkout
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
                  setSelectedFilter(
                    'all'
                  )
                }
              />
            )
          }
          renderItem={({
            item,
          }) => (
            <OrderCard
              order={item}
              updating={
                updatingOrderId ===
                item.id
              }
              expanded={
                expandedOrderId ===
                item.id
              }
              onToggleDetails={() =>
                toggleOrderDetails(
                  item.id
                )
              }
              onAction={(
                action
              ) =>
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
// ===========================================================
// ORDERS HEADER
// ===========================================================

function OrdersHeader({
  summary,
  selectedFilter,
  setSelectedFilter,
}) {
  return (
    <View>
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
          Vendor orders
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Incoming Orders
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Confirm purchases,
          prepare fulfillment,
          and keep customers
          updated.
        </Text>
      </View>


      {/* =============================================
          SUMMARY
      ============================================= */}

      <View
        style={
          styles.summaryGrid
        }
      >
        <SummaryCard
          icon="time-outline"
          value={
            summary.pending
          }
          label="Pending"
          warning={
            summary.pending > 0
          }
        />

        <SummaryCard
          icon="bag-handle-outline"
          value={
            summary.active
          }
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


      {/* =============================================
          FILTERS
      ============================================= */}

      <FlatList
        horizontal
        data={
          ORDER_FILTERS
        }
        keyExtractor={
          (item) =>
            item.key
        }
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filterRow
        }
        renderItem={({
          item,
        }) => {
          const selected =
            selectedFilter ===
            item.key;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.filterButton,

                selected &&
                  styles
                    .filterButtonSelected,
              ]}
              onPress={() =>
                setSelectedFilter(
                  item.key
                )
              }
            >
              <Text
                style={[
                  styles.filterText,

                  selected &&
                    styles
                      .filterTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />


      {/* =============================================
          RESULTS HEADER
      ============================================= */}

      <View
        style={
          styles.resultsHeader
        }
      >
        <Text
          style={
            styles.resultsTitle
          }
        >
          Orders
        </Text>

        <Text
          style={
            styles.resultsCount
          }
        >
          {summary.fulfilled}{' '}
          completed
        </Text>
      </View>
    </View>
  );
}


// ===========================================================
// SUMMARY CARD
// ===========================================================

function SummaryCard({
  icon,
  value,
  label,
  warning = false,
}) {
  return (
    <View
      style={
        styles.summaryCard
      }
    >
      <View
        style={[
          styles.summaryIcon,

          warning &&
            styles
              .summaryIconWarning,
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
            styles
              .summaryValueWarning,
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}


// ===========================================================
// ORDER CARD
// ===========================================================

function OrderCard({
  order,
  updating,
  expanded,
  onToggleDetails,
  onAction,
}) {
  const actions =
    NEXT_ACTIONS[
      order.status
    ] || [];

  const hoursRemaining =
    Number(
      order.hours_remaining ||
        0
    );

  const urgent =
    order.status ===
      'pending' &&
    hoursRemaining > 0 &&
    hoursRemaining <= 4;

  const customerName =
    order.shopper_name ||
    order.customer_name ||
    'Customer';

  const fulfillmentType =
    order.fulfillment_type ||
    'pickup';

  const isCancelled =
    [
      'cancelled',
      'auto_cancelled',
    ].includes(
      order.status
    );

  const isCompleted =
    order.status ===
    'fulfilled';


  return (
    <View
      style={
        styles.orderCard
      }
    >

      {/* =============================================
          ORDER HEADER
      ============================================= */}

      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={
            styles.orderIdentity
          }
        >
          <View
            style={
              styles.orderIcon
            }
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={
                COLORS.forest
              }
            />
          </View>

          <View
            style={
              styles.orderTitleCopy
            }
          >
            <Text
              style={
                styles.orderNumber
              }
            >
              Order #{order.id}
            </Text>

            <Text
              numberOfLines={1}
              style={
                styles.customerName
              }
            >
              {customerName}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.total
          }
        >
          $
          {Number(
            order.total || 0
          ).toFixed(2)}
        </Text>
      </View>


      {/* =============================================
          STATUS + FULFILLMENT
      ============================================= */}

      <View
        style={
          styles.statusRow
        }
      >
        <StatusBadge
          status={
            order.status
          }
        />

        <View
          style={
            styles.fulfillmentBadge
          }
        >
          <Ionicons
            name={
              getFulfillmentIcon(
                fulfillmentType
              )
            }
            size={13}
            color={
              COLORS.forest
            }
          />

          <Text
            style={
              styles.fulfillmentText
            }
          >
            {formatLabel(
              fulfillmentType
            )}
          </Text>
        </View>
      </View>


      {/* =============================================
          PENDING CONFIRMATION WINDOW
      ============================================= */}

      {order.status ===
        'pending' &&
        hoursRemaining >
          0 && (
          <View
            style={[
              styles.deadlineBox,

              urgent &&
                styles
                  .deadlineBoxUrgent,
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

            <View
              style={
                styles.deadlineCopy
              }
            >
              <Text
                style={[
                  styles.deadlineTitle,

                  urgent &&
                    styles
                      .deadlineTitleUrgent,
                ]}
              >
                {urgent
                  ? 'Action needed soon'
                  : 'Confirmation window'}
              </Text>

              <Text
                style={
                  styles.deadlineText
                }
              >
                {hoursRemaining.toFixed(
                  1
                )}{' '}
                hours remaining
              </Text>
            </View>
          </View>
        )}


      {/* =============================================
          SUMMARY DETAILS
      ============================================= */}

      <View
        style={
          styles.orderDetails
        }
      >
        <DetailItem
          icon="person-outline"
          label="Customer"
          value={
            customerName
          }
        />

        <DetailItem
          icon={
            getFulfillmentIcon(
              fulfillmentType
            )
          }
          label="Fulfillment"
          value={
            formatLabel(
              fulfillmentType
            )
          }
        />
      </View>


      {/* =============================================
          VIEW DETAILS BUTTON
      ============================================= */}

      <TouchableOpacity
        activeOpacity={0.8}
        style={
          styles.detailsToggle
        }
        onPress={
          onToggleDetails
        }
      >
        <View
          style={
            styles.detailsToggleLeft
          }
        >
          <Ionicons
            name={
              expanded
                ? 'document-text'
                : 'document-text-outline'
            }
            size={18}
            color={
              COLORS.forest
            }
          />

          <Text
            style={
              styles.detailsToggleText
            }
          >
            {expanded
              ? 'Hide Order Details'
              : 'View Order Details'}
          </Text>
        </View>

        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color={
            COLORS.forest
          }
        />
      </TouchableOpacity>


      {/* =============================================
          EXPANDED DETAILS
      ============================================= */}

      {expanded && (
        <OrderDetailsPanel
          order={order}
          customerName={
            customerName
          }
          fulfillmentType={
            fulfillmentType
          }
        />
      )}


      {/* =============================================
          ACTIVE ORDER ACTIONS
      ============================================= */}

      {actions.length >
      0 ? (
        <View
          style={
            styles.actions
          }
        >
          {actions.map(
            (action) => (
              <AppButton
                key={
                  action.status
                }
                title={
                  updating
                    ? 'Updating...'
                    : action.label
                }
                variant={
                  action.variant
                }
                disabled={
                  updating
                }
                onPress={() =>
                  onAction(
                    action
                  )
                }
                style={
                  styles.actionButton
                }
              />
            )
          )}
        </View>
      ) : (
        <View
          style={[
            styles.completeMessage,

            isCancelled &&
              styles
                .cancelledMessage,
          ]}
        >
          <Ionicons
            name={
              isCancelled
                ? 'close-circle-outline'
                : 'checkmark-circle-outline'
            }
            size={19}
            color={
              isCancelled
                ? COLORS.rust
                : COLORS.success
            }
          />

          <Text
            style={[
              styles
                .completeMessageText,

              isCancelled &&
                styles
                  .cancelledMessageText,
            ]}
          >
            {isCancelled
              ? 'This order was cancelled. View details for cancellation information.'
              : isCompleted
                ? 'This order is complete.'
                : 'No additional action is required.'}
          </Text>
        </View>
      )}
    </View>
  );
}


// ===========================================================
// ORDER DETAILS PANEL
// ===========================================================

function OrderDetailsPanel({
  order,
  customerName,
  fulfillmentType,
}) {
  const isDelivery =
    fulfillmentType ===
    'delivery';

  const isShipping =
    fulfillmentType ===
    'shipping';

  const isCancelled =
    [
      'cancelled',
      'auto_cancelled',
    ].includes(
      order.status
    );

  /*
   * We intentionally support a few possible
   * server field names here. The panel will
   * only render information that actually
   * exists on the incoming order object.
   */

  const address =
    order.delivery_address ||
    order.shipping_address ||
    order.fulfillment_address ||
    null;

  const instructions =
    order.delivery_instructions ||
    order.fulfillment_instructions ||
    order.instructions ||
    null;

  const cancellationReason =
    order.cancel_reason ||
    order.cancellation_reason ||
    null;

  const cancelledAt =
    order.cancelled_at ||
    order.canceled_at ||
    null;

  const createdAt =
    order.created_at ||
    order.order_date ||
    null;

  const paymentStatus =
    order.payment_status ||
    null;

  const refundStatus =
    order.refund_status ||
    null;

  const items =
    Array.isArray(
      order.items
    )
      ? order.items
      : [];


  return (
    <View
      style={
        styles.expandedPanel
      }
    >

      {/* =============================================
          ORDER INFORMATION
      ============================================= */}

      <DetailSectionHeader
        icon="receipt-outline"
        title="Order Information"
      />

      <View
        style={
          styles.expandedGrid
        }
      >
        <ExpandedDetailRow
          label="Order"
          value={`#${order.id}`}
        />

        <ExpandedDetailRow
          label="Customer"
          value={
            customerName
          }
        />

        <ExpandedDetailRow
          label="Status"
          value={
            getStatusConfig(
              order.status
            ).label
          }
        />

        <ExpandedDetailRow
          label="Fulfillment"
          value={
            formatLabel(
              fulfillmentType
            )
          }
        />

        {createdAt && (
          <ExpandedDetailRow
            label="Order Placed"
            value={
              formatDateTime(
                createdAt
              )
            }
          />
        )}

        <ExpandedDetailRow
          label="Order Total"
          value={`$${Number(
            order.total || 0
          ).toFixed(2)}`}
          last={
            !paymentStatus
          }
        />

        {paymentStatus && (
          <ExpandedDetailRow
            label="Payment"
            value={
              formatLabel(
                paymentStatus
              )
            }
            last
          />
        )}
      </View>


      {/* =============================================
          DELIVERY / SHIPPING ADDRESS
      ============================================= */}

      {(isDelivery ||
        isShipping) && (
        <View
          style={
            styles.detailSection
          }
        >
          <DetailSectionHeader
            icon={
              isShipping
                ? 'cube-outline'
                : 'location-outline'
            }
            title={
              isShipping
                ? 'Shipping Address'
                : 'Delivery Address'
            }
          />

          {address ? (
            <View
              style={
                styles.addressBox
              }
            >
              <Ionicons
                name="location-outline"
                size={19}
                color={
                  COLORS.forest
                }
              />

              <Text
                selectable
                style={
                  styles.addressText
                }
              >
                {formatAddress(
                  address
                )}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.missingInfoBox
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={
                  COLORS.rust
                }
              />

              <Text
                style={
                  styles.missingInfoText
                }
              >
                No address was
                returned with this
                order.
              </Text>
            </View>
          )}

          {instructions && (
            <View
              style={
                styles.instructionsBox
              }
            >
              <Text
                style={
                  styles.instructionsLabel
                }
              >
                Instructions
              </Text>

              <Text
                style={
                  styles.instructionsText
                }
              >
                {String(
                  instructions
                )}
              </Text>
            </View>
          )}
        </View>
      )}


      {/* =============================================
          ORDER ITEMS
      ============================================= */}

      {items.length >
        0 && (
        <View
          style={
            styles.detailSection
          }
        >
          <DetailSectionHeader
            icon="basket-outline"
            title="Items"
          />

          <View
            style={
              styles.itemsBox
            }
          >
            {items.map(
              (
                item,
                index
              ) => {
                const itemName =
                  item.product_name ||
                  item.name ||
                  `Item ${
                    index + 1
                  }`;

                const quantity =
                  Number(
                    item.quantity ||
                      1
                  );

                const itemPrice =
                  item.unit_price ??
                  item.price ??
                  null;

                return (
                  <View
                    key={
                      item.id ||
                      item.product_id ||
                      index
                    }
                    style={[
                      styles.itemRow,

                      index ===
                        items.length -
                          1 &&
                        styles
                          .itemRowLast,
                    ]}
                  >
                    <View
                      style={
                        styles.itemCopy
                      }
                    >
                      <Text
                        style={
                          styles.itemName
                        }
                      >
                        {itemName}
                      </Text>

                      <Text
                        style={
                          styles.itemQuantity
                        }
                      >
                        Qty: {quantity}
                      </Text>
                    </View>

                    {itemPrice !==
                      null && (
                      <Text
                        style={
                          styles.itemPrice
                        }
                      >
                        $
                        {(
                          Number(
                            itemPrice
                          ) *
                          quantity
                        ).toFixed(
                          2
                        )}
                      </Text>
                    )}
                  </View>
                );
              }
            )}
          </View>
        </View>
      )}


      {/* =============================================
          CANCELLATION INFORMATION
      ============================================= */}

      {isCancelled && (
        <View
          style={
            styles.detailSection
          }
        >
          <DetailSectionHeader
            icon="close-circle-outline"
            title="Cancellation"
            danger
          />

          <View
            style={
              styles.cancellationBox
            }
          >
            <ExpandedDetailRow
              label="Status"
              value={
                order.status ===
                'auto_cancelled'
                  ? 'Automatically Cancelled'
                  : 'Cancelled'
              }
            />

            {cancellationReason && (
              <ExpandedDetailRow
                label="Reason"
                value={
                  formatCancellationReason(
                    cancellationReason
                  )
                }
              />
            )}

            {cancelledAt && (
              <ExpandedDetailRow
                label="Cancelled"
                value={
                  formatDateTime(
                    cancelledAt
                  )
                }
              />
            )}

            {refundStatus && (
              <ExpandedDetailRow
                label="Refund"
                value={
                  formatLabel(
                    refundStatus
                  )
                }
              />
            )}

            {!cancellationReason &&
              !cancelledAt &&
              !refundStatus && (
                <Text
                  style={
                    styles
                      .cancellationFallback
                  }
                >
                  This order was
                  cancelled. Additional
                  cancellation details
                  were not returned by
                  the order service.
                </Text>
              )}
          </View>
        </View>
      )}
    </View>
  );
}
// ===========================================================
// DETAIL SECTION HEADER
// ===========================================================

function DetailSectionHeader({
  icon,
  title,
  danger = false,
}) {
  return (
    <View
      style={
        styles.detailSectionHeader
      }
    >
      <View
        style={[
          styles.detailSectionIcon,

          danger &&
            styles
              .detailSectionIconDanger,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={
            danger
              ? COLORS.rust
              : COLORS.forest
          }
        />
      </View>

      <Text
        style={[
          styles.detailSectionTitle,

          danger &&
            styles
              .detailSectionTitleDanger,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}


// ===========================================================
// EXPANDED DETAIL ROW
// ===========================================================

function ExpandedDetailRow({
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.expandedDetailRow,

        last &&
          styles
            .expandedDetailRowLast,
      ]}
    >
      <Text
        style={
          styles.expandedDetailLabel
        }
      >
        {label}
      </Text>

      <Text
        selectable
        style={
          styles.expandedDetailValue
        }
      >
        {value || '—'}
      </Text>
    </View>
  );
}


// ===========================================================
// STATUS BADGE
// ===========================================================

function StatusBadge({
  status,
}) {
  const config =
    getStatusConfig(
      status
    );

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
            backgroundColor:
              config.color,
          },
        ]}
      />

      <Text
        style={[
          styles.statusText,

          {
            color:
              config.color,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}


// ===========================================================
// SUMMARY DETAIL ITEM
// ===========================================================

function DetailItem({
  icon,
  label,
  value,
}) {
  return (
    <View
      style={
        styles.detailItem
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        <Ionicons
          name={icon}
          size={17}
          color={
            COLORS.forest
          }
        />
      </View>

      <View
        style={
          styles.detailCopy
        }
      >
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}


// ===========================================================
// FILTERED EMPTY STATE
// ===========================================================

function FilteredEmptyState({
  onClear,
}) {
  return (
    <View
      style={
        styles.filteredEmpty
      }
    >
      <View
        style={
          styles.filteredEmptyIcon
        }
      >
        <Ionicons
          name="filter-outline"
          size={27}
          color={
            COLORS.forest
          }
        />
      </View>

      <Text
        style={
          styles.filteredEmptyTitle
        }
      >
        No orders in this view
      </Text>

      <Text
        style={
          styles.filteredEmptyText
        }
      >
        Try another order status or
        return to the complete order
        list.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={
          styles.clearButton
        }
        onPress={
          onClear
        }
      >
        <Text
          style={
            styles.clearButtonText
          }
        >
          View All Orders
        </Text>
      </TouchableOpacity>
    </View>
  );
}


// ===========================================================
// CONFIRMATION MESSAGE
// ===========================================================

function getConfirmationMessage(
  order,
  status
) {
  const orderNumber =
    `Order #${order.id}`;

  switch (status) {
    case 'confirmed':
      return (
        `${orderNumber} will be confirmed ` +
        'and can begin preparation.'
      );

    case 'ready_for_pickup':
      return (
        `${orderNumber} will be marked ` +
        'ready for customer pickup.'
      );

    case 'out_for_delivery':
      return (
        `${orderNumber} will be marked ` +
        'as out for delivery.'
      );

    case 'fulfilled':
      return (
        `${orderNumber} will be marked complete.`
      );

    case 'cancelled':
      return (
        `${orderNumber} will be cancelled. ` +
        'This action should only be used when ' +
        'the order cannot be fulfilled.'
      );

    default:
      return (
        `Update the status of ${orderNumber}?`
      );
  }
}


// ===========================================================
// STATUS CONFIG
// ===========================================================

function getStatusConfig(
  status
) {
  switch (status) {
    case 'pending':
      return {
        label:
          'Pending',

        color:
          COLORS.rust,

        backgroundColor:
          'rgba(166,61,47,0.11)',
      };

    case 'confirmed':
      return {
        label:
          'Confirmed',

        color:
          COLORS.forest,

        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'ready_for_pickup':
      return {
        label:
          'Ready for Pickup',

        color:
          COLORS.sage,

        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'out_for_delivery':
      return {
        label:
          'Out for Delivery',

        color:
          COLORS.forest,

        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'fulfilled':
      return {
        label:
          'Fulfilled',

        color:
          COLORS.success,

        backgroundColor:
          'rgba(74,103,65,0.11)',
      };

    case 'cancelled':
      return {
        label:
          'Cancelled',

        color:
          COLORS.rust,

        backgroundColor:
          'rgba(166,61,47,0.11)',
      };

    case 'auto_cancelled':
      return {
        label:
          'Auto-Cancelled',

        color:
          COLORS.rust,

        backgroundColor:
          'rgba(166,61,47,0.11)',
      };

    default:
      return {
        label:
          formatLabel(
            status
          ),

        color:
          COLORS.brownSoft,

        backgroundColor:
          COLORS.beige,
      };
  }
}


// ===========================================================
// FULFILLMENT ICON
// ===========================================================

function getFulfillmentIcon(
  type
) {
  switch (type) {
    case 'delivery':
      return 'car-outline';

    case 'shipping':
      return 'cube-outline';

    default:
      return 'storefront-outline';
  }
}


// ===========================================================
// FORMAT LABEL
// ===========================================================

function formatLabel(
  value
) {
  if (!value) {
    return '';
  }

  return String(
    value
  )
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


// ===========================================================
// FORMAT DATE / TIME
// ===========================================================

function formatDateTime(
  value
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return date.toLocaleString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}


// ===========================================================
// FORMAT ADDRESS
// ===========================================================

function formatAddress(
  value
) {
  if (!value) {
    return '';
  }

  if (
    typeof value ===
    'string'
  ) {
    return value;
  }

  if (
    typeof value ===
    'object'
  ) {
    return [
      value.street ||
        value.address1 ||
        value.line1,

      value.address2 ||
        value.line2,

      [
        value.city,
        value.state,
        value.zip ||
          value.postal_code,
      ]
        .filter(Boolean)
        .join(' '),

      value.country,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return String(value);
}


// ===========================================================
// FRIENDLY CANCELLATION REASON
// ===========================================================

function formatCancellationReason(
  value
) {
  if (!value) {
    return '';
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized ===
    'cancelled by shopper before producer confirmation'
  ) {
    return (
      'Customer cancelled the order before it was confirmed.'
    );
  }

  if (
    normalized ===
    'producer did not respond within 12 hours'
  ) {
    return (
      'The order was automatically cancelled because it was not confirmed within 12 hours.'
    );
  }

  return String(value);
}


// ===========================================================
// STYLES
// ===========================================================

const styles =
  StyleSheet.create({
      // =========================================================
  // ROOT / LIST
  // =========================================================

  root: {
    flex: 1,
    backgroundColor:
      COLORS.cream,
  },

  list: {
    paddingHorizontal:
      LAYOUT.screenPadding,
    paddingBottom: 125,
  },


  // =========================================================
  // LOADING
  // =========================================================

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
    backgroundColor:
      'rgba(74,103,65,0.11)',
  },

  loadingIndicator: {
    marginTop: 22,
  },

  loadingTitle: {
    marginTop: 15,
    fontFamily:
      FONTS.display,
    fontSize: 25,
    color:
      COLORS.forestDark,
  },

  loadingMessage: {
    marginTop: 7,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // HEADER
  // =========================================================

  header: {
    paddingTop: 14,
  },

  eyebrow: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color:
      COLORS.sage,
  },

  title: {
    marginTop: 4,
    fontFamily:
      FONTS.display,
    fontSize: 36,
    color:
      COLORS.forestDark,
  },

  subtitle: {
    marginTop: 6,
    fontFamily:
      FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // SUMMARY
  // =========================================================

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
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  summaryIconWarning: {
    backgroundColor:
      'rgba(166,61,47,0.10)',
  },

  summaryValue: {
    marginTop: 7,
    fontFamily:
      FONTS.display,
    fontSize: 23,
    color:
      COLORS.forest,
  },

  summaryValueWarning: {
    color:
      COLORS.rust,
  },

  summaryLabel: {
    marginTop: 2,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 9,
    textAlign: 'center',
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // FILTERS
  // =========================================================

  filterRow: {
    paddingTop: 17,
    paddingBottom: 2,
    gap: 8,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius:
      RADIUS.pill,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.warmWhite,
  },

  filterButtonSelected: {
    borderColor:
      COLORS.forest,
    backgroundColor:
      COLORS.forest,
  },

  filterText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.brownSoft,
  },

  filterTextSelected: {
    color:
      COLORS.warmWhite,
  },


  // =========================================================
  // RESULTS
  // =========================================================

  resultsHeader: {
    marginTop: 23,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  resultsTitle: {
    fontFamily:
      FONTS.display,
    fontSize: 25,
    color:
      COLORS.forestDark,
  },

  resultsCount: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // ORDER CARD
  // =========================================================

  orderCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius:
      RADIUS.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
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
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  orderTitleCopy: {
    flex: 1,
  },

  orderNumber: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.sage,
  },

  customerName: {
    marginTop: 3,
    fontFamily:
      FONTS.display,
    fontSize: 22,
    color:
      COLORS.forestDark,
  },

  total: {
    fontFamily:
      FONTS.display,
    fontSize: 23,
    color:
      COLORS.forest,
  },


  // =========================================================
  // STATUS
  // =========================================================

  statusRow: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius:
      RADIUS.pill,
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
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
  },

  fulfillmentBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius:
      RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.beige,
  },

  fulfillmentText: {
    marginLeft: 5,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
    color:
      COLORS.forest,
  },


  // =========================================================
  // CONFIRMATION WINDOW
  // =========================================================

  deadlineBox: {
    marginTop: 14,
    padding: 12,
    borderRadius:
      RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
  },

  deadlineBoxUrgent: {
    backgroundColor:
      'rgba(166,61,47,0.09)',
  },

  deadlineCopy: {
    marginLeft: 10,
  },

  deadlineTitle: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.forest,
  },

  deadlineTitleUrgent: {
    color:
      COLORS.rust,
  },

  deadlineText: {
    marginTop: 2,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // SUMMARY DETAILS
  // =========================================================

  orderDetails: {
    marginTop: 14,
    padding: 12,
    borderRadius:
      RADIUS.lg,
    flexDirection: 'row',
    backgroundColor:
      COLORS.cream,
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
    backgroundColor:
      COLORS.warmWhite,
  },

  detailCopy: {
    flex: 1,
  },

  detailLabel: {
    fontFamily:
      FONTS.body,
    fontSize: 9,
    color:
      COLORS.brownSoft,
  },

  detailValue: {
    marginTop: 2,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
    color:
      COLORS.forestDark,
  },


  // =========================================================
  // VIEW DETAILS BUTTON
  // =========================================================

  detailsToggle: {
    marginTop: 13,
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor:
      COLORS.cream,
  },

  detailsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailsToggleText: {
    marginLeft: 8,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.forest,
  },


  // =========================================================
  // EXPANDED DETAILS
  // =========================================================

  expandedPanel: {
    marginTop: 12,
    padding: 14,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cream,
  },

  detailSection: {
    marginTop: 18,
  },

  detailSectionHeader: {
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailSectionIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  detailSectionIconDanger: {
    backgroundColor:
      'rgba(166,61,47,0.10)',
  },

  detailSectionTitle: {
    marginLeft: 8,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.forestDark,
  },

  detailSectionTitleDanger: {
    color:
      COLORS.rust,
  },

  expandedGrid: {
    overflow: 'hidden',
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
  },

  expandedDetailRow: {
    minHeight: 45,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
    gap: 15,
  },

  expandedDetailRowLast: {
    borderBottomWidth: 0,
  },

  expandedDetailLabel: {
    flex: 0.4,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color:
      COLORS.brownSoft,
  },

  expandedDetailValue: {
    flex: 0.6,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'right',
    color:
      COLORS.forestDark,
  },


  // =========================================================
  // ADDRESS
  // =========================================================

  addressBox: {
    padding: 13,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    backgroundColor:
      COLORS.warmWhite,
  },

  addressText: {
    flex: 1,
    marginLeft: 9,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 18,
    color:
      COLORS.forestDark,
  },

  missingInfoBox: {
    padding: 12,
    borderRadius:
      RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(166,61,47,0.08)',
  },

  missingInfoText: {
    flex: 1,
    marginLeft: 8,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    lineHeight: 16,
    color:
      COLORS.rust,
  },

  instructionsBox: {
    marginTop: 9,
    padding: 12,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
  },

  instructionsLabel: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color:
      COLORS.sage,
  },

  instructionsText: {
    marginTop: 5,
    fontFamily:
      FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    color:
      COLORS.forestDark,
  },


  // =========================================================
  // ITEMS
  // =========================================================

  itemsBox: {
    overflow: 'hidden',
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
  },

  itemRow: {
    minHeight: 55,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  itemRowLast: {
    borderBottomWidth: 0,
  },

  itemCopy: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.forestDark,
  },

  itemQuantity: {
    marginTop: 3,
    fontFamily:
      FONTS.body,
    fontSize: 9,
    color:
      COLORS.brownSoft,
  },

  itemPrice: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.forest,
  },


  // =========================================================
  // CANCELLATION
  // =========================================================

  cancellationBox: {
    overflow: 'hidden',
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      'rgba(166,61,47,0.22)',
    backgroundColor:
      COLORS.warmWhite,
  },

  cancellationFallback: {
    padding: 12,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    lineHeight: 16,
    color:
      COLORS.brownSoft,
  },


  // =========================================================
  // ORDER ACTIONS
  // =========================================================

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


  // =========================================================
  // COMPLETED / CANCELLED MESSAGE
  // =========================================================

  completeMessage: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius:
      RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
  },

  cancelledMessage: {
    backgroundColor:
      'rgba(166,61,47,0.08)',
  },

  completeMessageText: {
    flex: 1,
    marginLeft: 7,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 16,
    color:
      COLORS.success,
  },

  cancelledMessageText: {
    color:
      COLORS.rust,
  },


  // =========================================================
  // EMPTY STATES
  // =========================================================

  emptyWrapper: {
    marginTop: 25,
  },

  filteredEmpty: {
    marginTop: 25,
    paddingHorizontal: 22,
    paddingVertical: 35,
    borderRadius:
      RADIUS.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    backgroundColor:
      COLORS.warmWhite,
  },

  filteredEmptyIcon: {
    width: 57,
    height: 57,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  filteredEmptyTitle: {
    marginTop: 14,
    fontFamily:
      FONTS.display,
    fontSize: 23,
    color:
      COLORS.forestDark,
  },

  filteredEmptyText: {
    marginTop: 7,
    maxWidth: 260,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color:
      COLORS.brownSoft,
  },

  clearButton: {
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.forest,
  },

  clearButtonText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.warmWhite,
  },
});