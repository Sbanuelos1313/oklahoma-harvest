import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const SCREEN_PADDING = 20;

const PRODUCT_CARD_WIDTH =
  (width - SCREEN_PADDING * 2 - CARD_GAP) / 2;

export default function ProducerScreen({
  route,
  navigation,
  API,
  token,
  cart,
  setCart,
  guestMode = false,
}) {
  const { producer } = route?.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [producer?.id]);

  async function loadProducts() {
    if (!producer?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/products/producer/${producer.id}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Producer products failed with ${response.status}`
        );
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Producer products error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const producerName =
    producer?.shop_name ||
    producer?.name ||
    'Local Producer';

  const producerLocation = useMemo(() => {
    const parts = [
      producer?.city,
      producer?.state,
    ].filter(Boolean);

    return parts.length
      ? parts.join(', ')
      : 'Local marketplace vendor';
  }, [producer]);

  const producerImage = producer?.profile_image_url
    ? { uri: producer.profile_image_url }
    : IMAGE_ASSETS.vendor.default;

  const storefrontImage = producer?.cover_image_urle_url
    ? { uri: producer.cover_image_url }
    : IMAGE_ASSETS.backgrounds.vendorOrders;

  function requireCustomerAuth() {
    if (!guestMode) {
      return false;
    }

    navigation.navigate(
      'Auth',
      {
        mode: 'login',
        role: 'shopper',
      }
    );

    return true;
  }

  function createOrUpdateCart(product) {
  const producerId =
    producer?.id ||
    product?.producer_id;

  const nextCart = cart
    ? {
        ...cart,

        fulfillment_pickup:
          producer?.fulfillment_pickup === true,

        fulfillment_delivery:
          producer?.fulfillment_delivery === true,

        fulfillment_shipping:
          producer?.fulfillment_shipping === true,

        items:
          Array.isArray(cart.items)
            ? cart.items.map(
                (item) => ({
                  ...item,
                })
              )
            : [],
      }
    : {
        producer_id:
          producerId,

        producer_name:
          producerName,

        tax_rate:
          producer?.tax_rate ||
          0.08375,

        delivery_fee:
          producer?.delivery_fee ||
          0,

        fulfillment_pickup:
          producer?.fulfillment_pickup === true,

        fulfillment_delivery:
          producer?.fulfillment_delivery === true,

        fulfillment_shipping:
          producer?.fulfillment_shipping === true,

        /*
         * Quick-add intentionally does not
         * preselect a fulfillment method.
         *
         * The shopper will choose it in Cart.
         */
        fulfillment_type:
          null,

        items: [],
      };

  const existingItem =
    nextCart.items.find(
      (item) =>
        item.product_id ===
        product.id
    );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    nextCart.items.push({
      product_id:
        product.id,

      name:
        product.name,

      price:
        Number(
          product.price || 0
        ),

      unit:
        product.unit,

      quantity:
        1,

      image_url:
        product.image_url,

      /*
       * No item-level fulfillment selection
       * when using the producer-page + button.
       */
      fulfillment_type:
        null,
    });
  }

  setCart(nextCart);

  Alert.alert(
    'Added to cart',
    `${product.name} was added to your cart.`,
    [
      {
        text:
          'Keep Shopping',
        style:
          'cancel',
      },

      {
        text:
          'View Cart',

        onPress: () =>
          navigation.navigate(
            'Main',
            {
              screen:
                'Cart',
            }
          ),
      },
    ]
  );
}

  function addToCart(product) {
      if (requireCustomerAuth()) {
        return;
      }
    const producerId =
      producer?.id ||
      product?.producer_id;

    if (
      cart?.producer_id &&
      producerId &&
      cart.producer_id !== producerId
    ) {
      Alert.alert(
        'Replace cart?',
        'Your cart contains items from another producer. One checkout can include items from one producer at a time.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              setCart(null);

              setTimeout(() => {
                createOrUpdateCart(product);
              }, 0);
            },
          },
        ]
      );

      return;
    }

    createOrUpdateCart(product);
  }

  function openProduct(product) {
    if (guestMode) {
      navigation.navigate(
        'GuestProductDetail',
        {
          product,
          producer,
          relatedProducts:
            products,
        }
      );

      return;
    }

    navigation.navigate(
      'ProductDetail',
      {
        product,
        producer,
        relatedProducts:
          products,
      }
    );
  }

  function renderProduct({ item }) {
    const imageSource =
      typeof item?.image_url === 'string' && item.image_url
        ? { uri: item.image_url }
        : IMAGE_ASSETS.products.default;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.productCard}
        onPress={() => openProduct(item)}
      >
        <Image
          source={imageSource}
          resizeMode="cover"
          style={styles.productImage}
        />

        <View style={styles.productContent}>
          <Text
            numberOfLines={2}
            style={styles.productName}
          >
            {item.name}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.productUnit}
          >
            {item.unit
              ? `per ${item.unit}`
              : 'Local item'}
          </Text>

          <View style={styles.productBottomRow}>
            <Text style={styles.productPrice}>
              ${Number(item.price || 0).toFixed(2)}
            </Text>

            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.addButton}
              onPress={(event) => {
                event.stopPropagation?.();
                addToCart(item);
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.brown}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderHeader() {
    return (
      <View>
        <View style={styles.hero}>
          <ImageBackground
            source={storefrontImage}
            resizeMode="cover"
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroTopRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.headerIconButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="chevron-back"
                  size={26}
                  color={COLORS.brown}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.headerIconButton}
                onPress={() => {
                  if (requireCustomerAuth()) {
                    return;
                  }

                  navigation.navigate(
                    'Main',
                    {
                      screen:
                        'Cart',
                    }
                  );
                }}
              >
                <Ionicons
                  name="bag-outline"
                  size={23}
                  color={COLORS.brown}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.heroIdentity}>
              <Image
                source={producerImage}
                style={styles.producerAvatar}
              />

              <View style={styles.heroTextBlock}>
                <Text
                  numberOfLines={2}
                  style={styles.producerName}
                >
                  {producerName}
                </Text>

                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color={COLORS.white}
                  />

                  <Text style={styles.locationText}>
                    {producerLocation}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.infoPanel}>
          <View style={styles.actionRow}>
            <View style={styles.badgeRow}>
              {Number(producer?.avg_rating || 0) > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={COLORS.brown}
                  />

                  <Text style={styles.ratingText}>
                    {Number(
                      producer.avg_rating
                    ).toFixed(1)}
                  </Text>
                </View>
              )}

              {producer?.fulfillment_pickup && (
                <View style={styles.infoBadge}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={14}
                    color={COLORS.forest}
                  />

                  <Text style={styles.infoBadgeText}>
                    Pickup
                  </Text>
                </View>
              )}

              {producer?.fulfillment_delivery && (
                <View style={styles.infoBadge}>
                  <Ionicons
                    name="car-outline"
                    size={14}
                    color={COLORS.forest}
                  />

                  <Text style={styles.infoBadgeText}>
                    Delivery
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.followButton,
                following && styles.followButtonActive,
              ]}
              onPress={() => {
                if (requireCustomerAuth()) {
                  return;
                }

                setFollowing(
                  (current) => !current
                );
              }}
            >
              <Ionicons
                name={
                  following
                    ? 'checkmark'
                    : 'add'
                }
                size={17}
                color={
                  following
                    ? COLORS.white
                    : COLORS.forest
                }
              />

              <Text
                style={[
                  styles.followButtonText,
                  following && styles.followButtonTextActive,
                ]}
              >
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.aboutHeading}>
            About this producer
          </Text>

          <Text style={styles.aboutText}>
            {producer?.bio ||
              producer?.description ||
              `${producerName} is part of the From Our Place community, connecting local products with nearby customers.`}
          </Text>

          <View style={styles.quickInfoRow}>
            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={22}
                color={COLORS.forest}
              />

              <Text style={styles.quickInfoValue}>
                {products.length}
              </Text>

              <Text style={styles.quickInfoLabel}>
                Products
              </Text>
            </View>

            <View style={styles.quickInfoCard}>
              <Ionicons
                name="location-outline"
                size={22}
                color={COLORS.forest}
              />

              <Text
                numberOfLines={1}
                style={styles.quickInfoValueSmall}
              >
                {producer?.city || 'Local'}
              </Text>

              <Text style={styles.quickInfoLabel}>
                Location
              </Text>
            </View>

            <View style={styles.quickInfoCard}>
              <Ionicons
                name="time-outline"
                size={22}
                color={COLORS.forest}
              />

              <Text style={styles.quickInfoValueSmall}>
                Open
              </Text>

              <Text style={styles.quickInfoLabel}>
                Marketplace
              </Text>
            </View>
          </View>

          <View style={styles.productsHeader}>
            <View>
              <Text style={styles.productsHeading}>
                Available Products
              </Text>

              <Text style={styles.productsSubheading}>
                Shop directly from {producerName}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.filterButton}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={COLORS.forest}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!producer) {
    return (
      <ImageBackground
        source={require('../assets/backgrounds/bg_settings.jpg')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="store-off-outline"
                size={48}
                color={COLORS.forest}
              />

              <Text style={styles.emptyTitle}>
                Producer unavailable
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.emptyButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.emptyButtonText}>
                  Go Back
                </Text>
              </TouchableOpacity>
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

          <FlatList
            data={products}
            keyExtractor={(item, index) =>
              String(item?.id || index)
            }
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.gold}
                  />

                  <Text style={styles.loadingText}>
                    Loading local products...
                  </Text>
                </View>
              ) : (
                <View style={styles.noProductsState}>
                  <MaterialCommunityIcons
                    name="basket-outline"
                    size={42}
                    color={COLORS.forest}
                  />

                  <Text style={styles.noProductsTitle}>
                    No products listed yet
                  </Text>

                  <Text style={styles.noProductsText}>
                    Check back soon for new local finds.
                  </Text>
                </View>
              )
            }
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(247,242,232,0.58)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  listContent: {
    paddingBottom: 130,
  },

  hero: {
    marginHorizontal: 14,
    marginTop: 8,
    height: 300,
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  heroImage: {
    flex: 1,
  },

  heroImageStyle: {
    borderRadius: 30,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25,15,6,0.33)',
  },

  heroTopRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
    ...SHADOWS.soft,
  },

  heroIdentity: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  producerAvatar: {
    width: 82,
    height: 82,
    marginRight: 15,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.cream,
  },

  heroTextBlock: {
    flex: 1,
  },

  producerName: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 35,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
  },

  locationRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.white,
  },

  infoPanel: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'rgba(247,242,232,0.96)',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingRight: 10,
  },

  ratingBadge: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
  },

  ratingText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brown,
  },

  infoBadge: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  infoBadgeText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
  },

  followButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  followButtonActive: {
    backgroundColor: COLORS.forest,
  },

  followButtonText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  followButtonTextActive: {
    color: COLORS.white,
  },

  aboutHeading: {
    marginTop: 22,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.brown,
  },

  aboutText: {
    marginTop: 9,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.brown,
  },

  quickInfoRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },

  quickInfoCard: {
    flex: 1,
    minHeight: 94,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  quickInfoValue: {
    marginTop: 5,
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.brown,
  },

  quickInfoValueSmall: {
    marginTop: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.brown,
  },

  quickInfoLabel: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.subText,
    textAlign: 'center',
  },

  productsHeader: {
    marginTop: 25,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productsHeading: {
    fontFamily: FONTS.display,
    fontSize: 27,
    color: COLORS.brown,
  },

  productsSubheading: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.subText,
  },

  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  productRow: {
    paddingHorizontal: SCREEN_PADDING,
    justifyContent: 'space-between',
  },

  productCard: {
    width: PRODUCT_CARD_WIDTH,
    marginBottom: 14,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(252,250,247,0.95)',
    ...SHADOWS.soft,
  },

  productImage: {
    width: '100%',
    height: 126,
    backgroundColor: COLORS.cream,
  },

  productContent: {
    padding: 12,
  },

  productName: {
    minHeight: 38,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.brown,
  },

  productUnit: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subText,
  },

  productBottomRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productPrice: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.forest,
  },

  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  loadingState: {
    paddingTop: 46,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 14,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.subText,
  },

  noProductsState: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 42,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(252,250,247,0.90)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  noProductsTitle: {
    marginTop: 14,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.brown,
  },

  noProductsText: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.subText,
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 17,
    fontFamily: FONTS.display,
    fontSize: 27,
    color: COLORS.brown,
  },

  emptyButton: {
    height: 52,
    marginTop: 22,
    paddingHorizontal: 28,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  emptyButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});