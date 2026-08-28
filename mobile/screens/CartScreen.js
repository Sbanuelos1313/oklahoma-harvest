import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  TextInput,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useStripe,
} from '@stripe/stripe-react-native';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

import {
  IMAGE_ASSETS,
} from '../constants/assets';


export default function CartScreen({
  API,
  token,
  user,
  cart,
  setCart,
  navigation,
}) {
  // ===================================================
  // FULFILLMENT
  // ===================================================

  const cartFulfillmentType =
    cart?.fulfillment_type ||
    cart?.items?.[0]?.fulfillment_type ||
    null;

  const [
    fulfillmentType,
    setFulfillmentType,
  ] = useState(
    cartFulfillmentType
  );


  /*
   * Determine which fulfillment methods are actually
   * available.
   *
   * The selected fulfillment method from the product
   * page also counts as available because that selection
   * was validated before the product entered the cart.
   */

  const fulfillmentPickup =
    cart?.fulfillment_pickup === true ||
    cartFulfillmentType === 'pickup';

  const fulfillmentDelivery =
    cart?.fulfillment_delivery === true ||
    cartFulfillmentType === 'delivery';

  const fulfillmentShipping =
    cart?.fulfillment_shipping === true ||
    cartFulfillmentType === 'shipping';


  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    streetAddress,
    setStreetAddress,
  ] = useState('');

  const [
    addressLine2,
    setAddressLine2,
  ] = useState('');

  const [
    addressCity,
    setAddressCity,
  ] = useState('');

  const [
    addressState,
    setAddressState,
  ] = useState('');

  const [
    addressZip,
    setAddressZip,
  ] = useState('');

  const [
    deliveryInstructions,
    setDeliveryInstructions,
  ] = useState('');


  // ===================================================
  // STRIPE
  // ===================================================

  const {
    initPaymentSheet,
    presentPaymentSheet,
  } = useStripe();


  // ===================================================
  // KEEP CART + LOCAL FULFILLMENT IN SYNC
  // ===================================================

  useEffect(() => {
    if (
      cartFulfillmentType &&
      cartFulfillmentType !==
        fulfillmentType
    ) {
      setFulfillmentType(
        cartFulfillmentType
      );
    }
  }, [
    cartFulfillmentType,
    fulfillmentType,
  ]);


  // ===================================================
  // TOTALS
  // ===================================================

  const totals = useMemo(() => {
    const subtotal =
      cart?.items?.reduce(
        (sum, item) =>
          sum +
          Number(
            item.price || 0
          ) *
            Number(
              item.quantity || 0
            ),
        0
      ) || 0;

    const tax =
      subtotal *
      Number(
        cart?.tax_rate ||
          0.08375
      );

    const deliveryFee =
      fulfillmentType ===
      'delivery'
        ? Number(
            cart?.delivery_fee ||
              0
          )
        : 0;

    const total =
      subtotal +
      tax +
      deliveryFee;

    return {
      subtotal,
      tax,
      deliveryFee,
      total,
    };
  }, [
    cart,
    fulfillmentType,
  ]);


  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount =
    cart?.items?.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    ) || 0;


  // ===================================================
  // QUANTITY
  // ===================================================

  function updateQuantity(
    index,
    delta
  ) {
    if (
      !cart?.items?.length
    ) {
      return;
    }

    const items =
      cart.items.map(
        (item) => ({
          ...item,
        })
      );

    items[index].quantity +=
      delta;

    if (
      items[index].quantity <=
      0
    ) {
      items.splice(
        index,
        1
      );
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


  // ===================================================
  // REMOVE ITEM
  // ===================================================

  function removeItem(index) {
    if (
      !cart?.items?.length
    ) {
      return;
    }

    const items =
      cart.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
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


  // ===================================================
  // SELECTED FULFILLMENT
  // ===================================================

  function getSelectedFulfillment() {
    /*
     * Only return a fulfillment method that the
     * shopper actually selected.
     *
     * We intentionally DO NOT automatically choose
     * pickup, delivery, or shipping merely because
     * the producer offers it.
     *
     * This allows quick-add products to enter the
     * cart without forcing a fulfillment choice.
     */

    if (fulfillmentType) {
      return fulfillmentType;
    }

    if (cart?.fulfillment_type) {
      return cart.fulfillment_type;
    }

    if (
      cart?.items?.[0]
        ?.fulfillment_type
    ) {
      return cart.items[0]
        .fulfillment_type;
    }

    return null;
  }


  // ===================================================
  // CHECKOUT
  // ===================================================

  async function doCheckout() {
    // =================================================
    // REQUIRE SIGN IN
    // =================================================

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


    // =================================================
    // REQUIRE CART ITEMS
    // =================================================

    if (!cart?.items?.length) {
      Alert.alert(
        'Cart is empty',
        'Add an item before checking out.'
      );

      return;
    }


    // =================================================
    // RESOLVE FULFILLMENT
    // =================================================

    const checkoutFulfillment =
      getSelectedFulfillment();

    if (!checkoutFulfillment) {
      Alert.alert(
        'Choose fulfillment',
        'Please select pickup, delivery, or shipping before continuing to payment.'
      );

      return;
    }


    // =================================================
    // REQUIRE ADDRESS FOR DELIVERY / SHIPPING
    // =================================================

    const requiresAddress =
      checkoutFulfillment ===
        'delivery' ||
      checkoutFulfillment ===
        'shipping';

    if (
      requiresAddress &&
      (
        !streetAddress.trim() ||
        !addressCity.trim() ||
        !addressState.trim() ||
        !addressZip.trim()
      )
    ) {
      Alert.alert(
        'Address required',
        `Please enter a complete ${
          checkoutFulfillment ===
          'delivery'
            ? 'delivery'
            : 'shipping'
        } address before continuing to payment.`
      );

      return;
    }


    // =================================================
    // BUILD FULFILLMENT ADDRESS
    // =================================================

    const fulfillmentAddress =
      requiresAddress
        ? [
            streetAddress.trim(),

            addressLine2.trim(),

            `${addressCity.trim()}, ${addressState.trim()} ${addressZip.trim()}`,

            deliveryInstructions.trim()
              ? `Instructions: ${deliveryInstructions.trim()}`
              : null,
          ]
            .filter(Boolean)
            .join('\n')
        : null;


    // =================================================
    // KEEP STATE + CART SYNCHRONIZED
    // =================================================

    if (
      fulfillmentType !==
      checkoutFulfillment
    ) {
      setFulfillmentType(
        checkoutFulfillment
      );
    }

    if (
      cart?.fulfillment_type !==
      checkoutFulfillment
    ) {
      setCart({
        ...cart,
        fulfillment_type:
          checkoutFulfillment,
      });
    }


    // =================================================
    // BUILD PAYMENT PAYLOAD
    // =================================================

    const paymentPayload = {
      producer_id:
        cart.producer_id,

      fulfillment_type:
        checkoutFulfillment,

      items:
        cart.items.map(
          (item) => ({
            product_id:
              item.product_id ??
              item.id,

            quantity:
              Number(
                item.quantity || 1
              ),
          })
        ),
    };


    // =================================================
    // DEBUG
    // =================================================

    console.log(
      'CHECKOUT FULFILLMENT:',
      checkoutFulfillment
    );

    console.log(
      'PAYMENT PAYLOAD:',
      paymentPayload
    );


    // =================================================
    // BEGIN CHECKOUT
    // =================================================

    setLoading(true);

    try {
      const paymentResponse =
        await fetch(
          `${API}/api/stripe/create-payment-intent`,
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                paymentPayload
              ),
          }
        );

      const paymentData =
        await paymentResponse
          .json()
          .catch(() => null);

      console.log(
        'PAYMENT INTENT RESPONSE:',
        paymentResponse.status,
        JSON.stringify(
          paymentData,
          null,
          2
        )
      );

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData?.detail ||
            'Unable to prepare payment.'
        );
      }

      console.log(
        'SERVER CHECKOUT TOTALS:',
        {
          subtotal:
            paymentData?.subtotal,

          tax:
            paymentData?.tax,

          deliveryFee:
            paymentData
              ?.delivery_fee,

          total:
            paymentData?.total,
        }
      );

      const {
        error:
          initializationError,
      } =
        await initPaymentSheet({
          merchantDisplayName:
            'From Our Place',

          paymentIntentClientSecret:
            paymentData.client_secret,

          returnURL:
            'fromourplace://stripe-redirect',

          style:
            'automatic',
        });

      if (initializationError) {
        throw new Error(
          initializationError.message ||
            'Unable to initialize payment.'
        );
      }

      const {
        error: paymentError,
      } =
        await presentPaymentSheet();

      if (paymentError) {
        if (
          paymentError.code !==
          'Canceled'
        ) {
          throw new Error(
            paymentError.message
          );
        }

        return;
      }

      console.log(
        'PAYMENT INTENT PAYLOAD:',
        JSON.stringify(
          paymentPayload,
          null,
          2
        )
      );


      // =================================================
      // CREATE ORDER AFTER SUCCESSFUL PAYMENT
      // =================================================

      const orderResponse =
        await fetch(
          `${API}/api/orders/from-payment`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,

              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body:
              JSON.stringify({
                producer_id:
                  cart.producer_id,

                items:
                  cart.items.map(
                    (item) => ({
                      product_id:
                        item.product_id ??
                        item.id,

                      quantity:
                        Number(
                          item.quantity ||
                            1
                        ),
                    })
                  ),

                fulfillment_type:
                  checkoutFulfillment,

                delivery_address:
                  fulfillmentAddress,

                payment_intent_id:
                  paymentData
                    .payment_intent_id,
              }),
          }
        );

      const orderData =
        await orderResponse
          .json()
          .catch(() => null);

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.detail ||
            'Your order could not be placed.'
        );
      }

      setCart(null);

      navigation
        .getParent()
        ?.navigate(
          'OrderConfirmation',
          {
            order:
              orderData,

            fulfillmentType:
              checkoutFulfillment,
          }
        );
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


  // ===================================================
  // FULFILLMENT OPTION
  // ===================================================

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
        onPress={() => {
          setFulfillmentType(key);

          setCart({
            ...cart,
            fulfillment_type: key,
          });
        }}
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

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (!cart?.items?.length) {
    return (
      <ImageBackground
        source={IMAGE_ASSETS.backgrounds.checkout}
        resizeMode="cover"
        style={styles.background}
      >
        <View
          style={
            styles.backgroundOverlay
          }
        >
          <SafeAreaView
            style={styles.safeArea}
          >
            <StatusBar
              barStyle="dark-content"
            />

            <View
              style={
                styles.emptyHeader
              }
            >
              <Text
                style={
                  styles.screenTitle
                }
              >
                Your Cart
              </Text>
            </View>

            <View
              style={
                styles.emptyState
              }
            >
              <Image
                source={
                  IMAGE_ASSETS
                    .backgrounds
                    .checkout
                }
                style={
                  styles.emptyImage
                }
              />

              <View
                style={
                  styles
                    .emptyImageOverlay
                }
              />

              <View
                style={
                  styles.emptyContent
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Ionicons
                    name="basket-outline"
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
                  Ready to shop local?
                </Text>

                <Text
                  style={
                    styles.emptyMessage
                  }
                >
                  Add fresh food,
                  handmade goods, gifts,
                  wellness products, and
                  local market finds to
                  your cart.
                </Text>

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
                  <Text
                    style={
                      styles
                        .shopButtonText
                    }
                  >
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

  // ===================================================
  // MAIN CART
  // ===================================================

  return (
    <ImageBackground
      source={IMAGE_ASSETS.backgrounds.checkout}
      resizeMode="cover"
      style={styles.background}
    >
      <View
        style={
          styles.backgroundOverlay
        }
      >
        <SafeAreaView
          style={styles.safeArea}
        >
          <StatusBar
            barStyle="dark-content"
          />

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.scrollContent
            }
          >

            {/* =========================================
                HEADER
            ========================================= */}

            <View
              style={styles.header}
            >
              <View>
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  Checkout
                </Text>

                <Text
                  style={
                    styles.screenTitle
                  }
                >
                  Your Cart
                </Text>

                <Text
                  style={
                    styles.vendorLine
                  }
                >
                  From{' '}
                  {cart.producer_name}
                </Text>
              </View>

              <View
                style={
                  styles.cartCountBadge
                }
              >
                <Ionicons
                  name="bag-outline"
                  size={21}
                  color={
                    COLORS.forest
                  }
                />

                <Text
                  style={
                    styles.cartCountText
                  }
                >
                  {cartCount}
                </Text>
              </View>
            </View>


            {/* =========================================
                FULFILLMENT
            ========================================= */}

            <View
              style={
                styles.fulfillmentCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                How would you like to
                receive your goods?
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                {fulfillmentType
                  ? 'Your selection will apply to this order.'
                  : 'Please choose an available option before continuing to payment.'}
              </Text>

              <View
                style={
                  styles.fulfillmentRow
                }
              >
                {fulfillmentPickup
                  ? renderFulfillmentOption(
                      {
                        key:
                          'pickup',

                        title:
                          'Pickup',

                        subtitle:
                          'Collect from the producer',

                        icon:
                          'bag-handle-outline',
                      }
                    )
                  : null}

                {fulfillmentDelivery
                  ? renderFulfillmentOption(
                      {
                        key:
                          'delivery',

                        title:
                          'Delivery',

                        subtitle:
                          'Delivered to your address',

                        icon:
                          'car-outline',
                      }
                    )
                  : null}

                {fulfillmentShipping
                  ? renderFulfillmentOption(
                      {
                        key:
                          'shipping',

                        title:
                          'Shipping',

                        subtitle:
                          'Shipped when available',

                        icon:
                          'cube-outline',
                      }
                    )
                  : null}
              </View>


              {/* =======================================
                  DELIVERY / SHIPPING ADDRESS
              ======================================= */}

              {(
                fulfillmentType ===
                  'delivery' ||
                fulfillmentType ===
                  'shipping'
              ) && (
                <View
                  style={
                    styles.addressSection
                  }
                >
                  <View
                    style={
                      styles
                        .addressHeadingRow
                    }
                  >
                    <Ionicons
                      name={
                        fulfillmentType ===
                        'delivery'
                          ? 'location-outline'
                          : 'mail-outline'
                      }
                      size={20}
                      color={
                        COLORS.forest
                      }
                    />

                    <Text
                      style={
                        styles.addressTitle
                      }
                    >
                      {fulfillmentType ===
                      'delivery'
                        ? 'Delivery Address'
                        : 'Shipping Address'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.addressHelp
                    }
                  >
                    Enter the address
                    where this order
                    should be{' '}
                    {fulfillmentType ===
                    'delivery'
                      ? 'delivered.'
                      : 'shipped.'}
                  </Text>


                  {/* STREET ADDRESS */}

                  <TextInput
                    value={
                      streetAddress
                    }
                    onChangeText={
                      setStreetAddress
                    }
                    placeholder="Street address *"
                    placeholderTextColor={
                      COLORS.subText
                    }
                    autoComplete="street-address"
                    style={
                      styles.addressInput
                    }
                  />


                  {/* APARTMENT / UNIT */}

                  <TextInput
                    value={
                      addressLine2
                    }
                    onChangeText={
                      setAddressLine2
                    }
                    placeholder="Apartment, suite, unit (optional)"
                    placeholderTextColor={
                      COLORS.subText
                    }
                    style={
                      styles.addressInput
                    }
                  />


                  {/* CITY */}

                  <TextInput
                    value={
                      addressCity
                    }
                    onChangeText={
                      setAddressCity
                    }
                    placeholder="City *"
                    placeholderTextColor={
                      COLORS.subText
                    }
                    style={
                      styles.addressInput
                    }
                  />


                  {/* STATE + ZIP */}

                  <View
                    style={
                      styles.addressRow
                    }
                  >
                    <TextInput
                      value={
                        addressState
                      }
                      onChangeText={
                        setAddressState
                      }
                      placeholder="State *"
                      placeholderTextColor={
                        COLORS.subText
                      }
                      autoCapitalize="characters"
                      maxLength={2}
                      style={[
                        styles.addressInput,
                        styles
                          .addressStateInput,
                      ]}
                    />

                    <TextInput
                      value={
                        addressZip
                      }
                      onChangeText={
                        setAddressZip
                      }
                      placeholder="ZIP code *"
                      placeholderTextColor={
                        COLORS.subText
                      }
                      keyboardType="number-pad"
                      maxLength={10}
                      style={[
                        styles.addressInput,
                        styles
                          .addressZipInput,
                      ]}
                    />
                  </View>


                  {/* DELIVERY INSTRUCTIONS */}

                  {fulfillmentType ===
                    'delivery' && (
                    <TextInput
                      value={
                        deliveryInstructions
                      }
                      onChangeText={
                        setDeliveryInstructions
                      }
                      placeholder="Delivery instructions (optional)"
                      placeholderTextColor={
                        COLORS.subText
                      }
                      multiline
                      textAlignVertical="top"
                      style={[
                        styles.addressInput,
                        styles
                          .instructionsInput,
                      ]}
                    />
                  )}
                </View>
              )}
            </View>


            {/* =========================================
                ITEMS
            ========================================= */}

            <Text
              style={
                styles.itemsHeading
              }
            >
              Your Items
            </Text>

            {cart.items.map(
              (item, index) => {
                const lineTotal =
                  Number(
                    item.price || 0
                  ) *
                  Number(
                    item.quantity || 0
                  );

                return (
                  <View
                    key={`${item.product_id}-${index}`}
                    style={
                      styles.itemCard
                    }
                  >
                    <Image
                      source={
                        item.image_url
                          ? {
                              uri:
                                item.image_url,
                            }
                          : IMAGE_ASSETS
                              .products
                              .default
                      }
                      style={
                        styles.itemImage
                      }
                    />

                    <View
                      style={
                        styles.itemBody
                      }
                    >
                      <View
                        style={
                          styles.itemTopRow
                        }
                      >
                        <View
                          style={
                            styles
                              .itemTextBlock
                          }
                        >
                          <Text
                            numberOfLines={
                              2
                            }
                            style={
                              styles.itemName
                            }
                          >
                            {item.name}
                          </Text>

                          <Text
                            style={
                              styles.itemMeta
                            }
                          >
                            $
                            {Number(
                              item.price ||
                                0
                            ).toFixed(
                              2
                            )}
                            {item.unit
                              ? ` / ${item.unit}`
                              : ''}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.lineTotal
                          }
                        >
                          $
                          {lineTotal.toFixed(
                            2
                          )}
                        </Text>
                      </View>


                      {/* ===============================
                          ITEM ACTIONS
                      =============================== */}

                      <View
                        style={
                          styles.itemFooter
                        }
                      >
                        <View
                          style={
                            styles
                              .quantitySelector
                          }
                        >
                          <TouchableOpacity
                            activeOpacity={
                              0.8
                            }
                            style={
                              styles
                                .quantityButton
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
                              color={
                                COLORS.brown
                              }
                            />
                          </TouchableOpacity>

                          <Text
                            style={
                              styles
                                .quantityText
                            }
                          >
                            {item.quantity}
                          </Text>

                          <TouchableOpacity
                            activeOpacity={
                              0.8
                            }
                            style={
                              styles
                                .quantityButton
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
                              color={
                                COLORS.brown
                              }
                            />
                          </TouchableOpacity>
                        </View>


                        <TouchableOpacity
                          activeOpacity={
                            0.75
                          }
                          style={
                            styles
                              .removeButton
                          }
                          onPress={() =>
                            removeItem(
                              index
                            )
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color={
                              COLORS.danger
                            }
                          />

                          <Text
                            style={
                              styles
                                .removeText
                            }
                          >
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }
            )}


            {/* =========================================
                ORDER SUMMARY
            ========================================= */}

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
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
                value={`$${totals.tax.toFixed(
                  2
                )}`}
              />

              {fulfillmentType ===
                'delivery' && (
                <SummaryRow
                  label="Delivery fee"
                  value={`$${totals.deliveryFee.toFixed(
                    2
                  )}`}
                />
              )}

              <View
                style={
                  styles.divider
                }
              />

              <View
                style={
                  styles.totalRow
                }
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  Total
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  $
                  {totals.total.toFixed(
                    2
                  )}
                </Text>
              </View>


              {/* =======================================
                  PAYMENT BUTTON
              ======================================= */}

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={loading}
                style={[
                  styles.checkoutButton,

                  loading &&
                    styles
                      .checkoutButtonDisabled,
                ]}
                onPress={doCheckout}
              >
                {loading ? (
                  <ActivityIndicator
                    color={
                      COLORS.brown
                    }
                  />
                ) : (
                  <>
                    <Ionicons
                      name="lock-closed-outline"
                      size={19}
                      color={
                        COLORS.brown
                      }
                    />

                    <Text
                      style={
                        styles
                          .checkoutButtonText
                      }
                    >
                      Continue to Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>


              <View
                style={
                  styles.secureRow
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={
                    COLORS.forest
                  }
                />

                <Text
                  style={
                    styles.secureText
                  }
                >
                  Secure payment powered
                  by Stripe
                </Text>
              </View>

              <Text
                style={styles.note}
              >
                The producer has 12 hours
                to confirm your order.
                Unconfirmed orders are
                automatically cancelled
                and refunded.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}


// ===========================================================
// SUMMARY ROW
// ===========================================================

function SummaryRow({
  label,
  value,
}) {
  return (
    <View
      style={styles.summaryRow}
    >
      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.summaryValue
        }
      >
        {value}
      </Text>
    </View>
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
      'rgba(250,247,240,0.68)',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 200,
  },


  // =========================================================
  // HEADER
  // =========================================================

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
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

  screenTitle: {
    marginTop: 3,
    fontFamily:
      FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color:
      COLORS.brown,
  },

  vendorLine: {
    marginTop: 4,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    color:
      COLORS.subText,
  },

  cartCountBadge: {
    minWidth: 48,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 21,
    flexDirection: 'row',
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

  cartCountText: {
    marginLeft: 5,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 13,
    color:
      COLORS.forest,
  },


  // =========================================================
  // FULFILLMENT
  // =========================================================

  fulfillmentCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  sectionTitle: {
    fontFamily:
      FONTS.display,
    fontSize: 22,
    lineHeight: 27,
    color:
      COLORS.brown,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    color:
      COLORS.subText,
  },

  fulfillmentRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },

  fulfillmentOption: {
    flex: 1,
    minHeight: 120,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent:
      'center',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cream,
  },

  fulfillmentOptionActive: {
    borderColor:
      COLORS.forest,
    backgroundColor:
      COLORS.forest,
  },

  fulfillmentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.white,
  },

  fulfillmentIconWrapActive: {
    backgroundColor:
      'rgba(255,255,255,0.16)',
  },

  fulfillmentTitle: {
    marginTop: 8,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.brown,
  },

  fulfillmentTitleActive: {
    color:
      COLORS.white,
  },

  fulfillmentSubtitle: {
    marginTop: 3,
    fontFamily:
      FONTS.body,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color:
      COLORS.subText,
  },

  fulfillmentSubtitleActive: {
    color:
      'rgba(255,255,255,0.78)',
  },


  // =========================================================
  // DELIVERY / SHIPPING ADDRESS
  // =========================================================

  addressSection: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  addressHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  addressTitle: {
    marginLeft: 8,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 15,
    color:
      COLORS.brown,
  },

  addressHelp: {
    marginTop: 6,
    marginBottom: 4,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    color:
      COLORS.subText,
  },

  addressInput: {
    minHeight: 50,
    marginTop: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
    backgroundColor:
      COLORS.white,
    fontFamily:
      FONTS.body,
    fontSize: 14,
    color:
      COLORS.brown,
  },

  addressRow: {
    flexDirection: 'row',
    gap: 10,
  },

  addressStateInput: {
    flex: 0.38,
  },

  addressZipInput: {
    flex: 0.62,
  },

  instructionsInput: {
    minHeight: 82,
    paddingTop: 14,
    paddingBottom: 14,
  },


  // =========================================================
  // ITEMS
  // =========================================================

  itemsHeading: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily:
      FONTS.display,
    fontSize: 23,
    color:
      COLORS.brown,
  },

  itemCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 20,
    flexDirection: 'row',
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  itemImage: {
    width: 92,
    height: 92,
    borderRadius: 15,
    backgroundColor:
      COLORS.cream,
  },

  itemBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent:
      'space-between',
  },

  itemTopRow: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
  },

  itemTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  itemName: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    color:
      COLORS.brown,
  },

  itemMeta: {
    marginTop: 4,
    fontFamily:
      FONTS.body,
    fontSize: 11,
    color:
      COLORS.subText,
  },

  lineTotal: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 14,
    color:
      COLORS.forest,
  },

  itemFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  quantitySelector: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cream,
    overflow: 'hidden',
  },

  quantityButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  quantityText: {
    minWidth: 25,
    textAlign: 'center',
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.brown,
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  removeText: {
    marginLeft: 4,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
    color:
      COLORS.danger,
  },


  // =========================================================
  // SUMMARY
  // =========================================================

  summaryCard: {
    marginTop: 10,
    padding: 18,
    borderRadius: 22,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.soft,
  },

  summaryRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  summaryLabel: {
    fontFamily:
      FONTS.body,
    fontSize: 13,
    color:
      COLORS.subText,
  },

  summaryValue: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 13,
    color:
      COLORS.brown,
  },

  divider: {
    height: 1,
    marginVertical: 16,
    backgroundColor:
      COLORS.border,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  totalLabel: {
    fontFamily:
      FONTS.display,
    fontSize: 21,
    color:
      COLORS.brown,
  },

  totalValue: {
    fontFamily:
      FONTS.display,
    fontSize: 25,
    color:
      COLORS.forest,
  },


  // =========================================================
  // CHECKOUT
  // =========================================================

  checkoutButton: {
    minHeight: 56,
    marginTop: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.gold,
    ...SHADOWS.soft,
  },

  checkoutButtonDisabled: {
    opacity: 0.6,
  },

  checkoutButtonText: {
    marginLeft: 8,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 14,
    color:
      COLORS.brown,
  },

  secureRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  secureText: {
    marginLeft: 6,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    color:
      COLORS.forest,
  },

  note: {
    marginTop: 10,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    color:
      COLORS.subText,
  },


  // =========================================================
  // EMPTY CART
  // =========================================================

  emptyScrollContent: {
    flexGrow: 1,
    paddingBottom: 180,
  },

  emptyHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  emptyState: {
    margin: 20,
    minHeight: 620,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor:
      COLORS.forest,
    ...SHADOWS.soft,
  },

  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  emptyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(27,49,31,0.34)',
  },

  emptyContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.cream,
  },

  emptyTitle: {
    marginTop: 16,
    fontFamily:
      FONTS.display,
    fontSize: 28,
    textAlign: 'center',
    color:
      COLORS.white,
  },

  emptyMessage: {
    marginTop: 9,
    maxWidth: 290,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color:
      'rgba(255,255,255,0.84)',
  },

  shopButton: {
    minWidth: 180,
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 22,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.gold,
  },
  shopButtonText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 13,
    color:
      COLORS.brown,
  },

  });