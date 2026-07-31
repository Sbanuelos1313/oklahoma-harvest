import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  Share,
  ImageBackground,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';

export default function ProductDetailScreen({
  route,
  navigation,
  cart,
  setCart,
}) {
  const {
    product,
    producer,
    relatedProducts = [],
  } = route?.params || {};

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const vendorName =
    producer?.shop_name ||
    product?.shop_name ||
    'Local Producer';

  const producerId =
    producer?.id ||
    product?.producer_id;

  const productImage = useMemo(() => {
    if (typeof product?.image_url === 'string' && product.image_url) {
      return { uri: product.image_url };
    }

    if (typeof product?.image === 'number') {
      return product.image;
    }

    return IMAGE_ASSETS.products.default;
  }, [product]);

  const unitPrice = Number(product?.price || 0);
  const totalPrice = unitPrice * quantity;

  const fulfillmentOptions = useMemo(() => {
    const options = [];

    if (
      producer?.fulfillment_pickup ||
      product?.fulfillment_pickup
    ) {
      options.push({
        key: 'pickup',
        label: 'Pickup',
        icon: 'bag-handle-outline',
      });
    }

    if (
      producer?.fulfillment_delivery ||
      product?.fulfillment_delivery
    ) {
      options.push({
        key: 'delivery',
        label: 'Delivery',
        icon: 'car-outline',
      });
    }

    if (
      producer?.fulfillment_shipping ||
      product?.fulfillment_shipping
    ) {
      options.push({
        key: 'shipping',
        label: 'Shipping',
        icon: 'cube-outline',
      });
    }

    return options;
  }, [producer, product]);

  function createOrUpdateCart() {
    if (!product || !producerId) {
      Alert.alert(
        'Unable to add item',
        'This product is missing vendor information.'
      );
      return;
    }

    const nextCart = cart
      ? {
          ...cart,
          items: Array.isArray(cart.items)
            ? cart.items.map((item) => ({ ...item }))
            : [],
        }
      : {
          producer_id: producerId,
          producer_name: vendorName,
          tax_rate: producer?.tax_rate || 0.08375,
          delivery_fee: producer?.delivery_fee || 0,
          items: [],
        };

    const existingItem = nextCart.items.find(
      (item) => item.product_id === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      nextCart.items.push({
        product_id: product.id,
        name: product.name,
        price: unitPrice,
        unit: product.unit,
        quantity,
        image_url: product.image_url,
      });
    }

    setCart(nextCart);

    Alert.alert(
      'Added to cart',
      `${product.name} was added to your cart.`
    );
  }

  function addToCart() {
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
                createOrUpdateCart();
              }, 0);
            },
          },
        ]
      );

      return;
    }

    createOrUpdateCart();
  }

  async function shareProduct() {
    try {
      await Share.share({
        message: `Check out ${
          product?.name || 'this local product'
        } from ${vendorName} on From Our Place.`,
      });
    } catch {
      // User canceled or sharing is unavailable.
    }
  }

  function visitProducer() {
    const producerPayload =
      producer ||
      {
        id: product?.producer_id,
        shop_name: product?.shop_name,
        city: product?.city,
        state: product?.state,
        avg_rating: product?.avg_rating,
        fulfillment_pickup: product?.fulfillment_pickup,
        fulfillment_delivery: product?.fulfillment_delivery,
        fulfillment_shipping: product?.fulfillment_shipping,
      };

    navigation.navigate('Producer', {
      producer: producerPayload,
    });
  }

  if (!product) {
    return (
      <ImageBackground
        source={require('../assets/backgrounds/bg_settings.jpg')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.unavailableState}>
              <MaterialCommunityIcons
                name="basket-off-outline"
                size={46}
                color={COLORS.forest}
              />

              <Text style={styles.unavailableTitle}>
                Product unavailable
              </Text>

              <Text style={styles.unavailableText}>
                This product could not be loaded.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.primaryButtonText}>
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.hero}>
              <Image
                source={productImage}
                resizeMode="cover"
                style={styles.heroImage}
              />

              <View style={styles.heroOverlay} />

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.heroIconButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="chevron-back"
                  size={26}
                  color={COLORS.brown}
                />
              </TouchableOpacity>

              <View style={styles.heroActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.heroIconButton}
                  onPress={() => setIsFavorite((current) => !current)}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={23}
                    color={
                      isFavorite
                        ? '#A23A4B'
                        : COLORS.brown
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.heroIconButton}
                  onPress={shareProduct}
                >
                  <Ionicons
                    name="share-outline"
                    size={23}
                    color={COLORS.brown}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contentPanel}>
              <View style={styles.topMetaRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {product.category || 'Local Find'}
                  </Text>
                </View>

                {Number(
                  producer?.avg_rating ||
                  product?.avg_rating ||
                  0
                ) > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={COLORS.brown}
                    />

                    <Text style={styles.ratingBadgeText}>
                      {Number(
                        producer?.avg_rating ||
                        product?.avg_rating
                      ).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.productName}>
                {product.name}
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={visitProducer}
              >
                <Text style={styles.vendorName}>
                  by {vendorName}
                </Text>
              </TouchableOpacity>

              <View style={styles.priceQuantityCard}>
                <View>
                  <Text style={styles.price}>
                    ${unitPrice.toFixed(2)}
                  </Text>

                  <Text style={styles.unit}>
                    {product.unit
                      ? `per ${product.unit}`
                      : 'per item'}
                  </Text>
                </View>

                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.quantityButton}
                    onPress={() =>
                      setQuantity((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={COLORS.brown}
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>
                    {quantity}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.quantityButton}
                    onPress={() =>
                      setQuantity((current) => current + 1)
                    }
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={COLORS.brown}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {fulfillmentOptions.length > 0 && (
                <View style={styles.fulfillmentSection}>
                  <Text style={styles.sectionLabel}>
                    Available fulfillment
                  </Text>

                  <View style={styles.fulfillmentRow}>
                    {fulfillmentOptions.map((option) => (
                      <View
                        key={option.key}
                        style={styles.fulfillmentBadge}
                      >
                        <Ionicons
                          name={option.icon}
                          size={16}
                          color={COLORS.forest}
                        />

                        <Text style={styles.fulfillmentText}>
                          {option.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  About this item
                </Text>

                <Text style={styles.description}>
                  {product.description ||
                    'This product is available from a local From Our Place producer. Availability and fulfillment options may vary.'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.producerCard}
                onPress={visitProducer}
              >
                <Image
                  source={
                    producer?.profile_image_url
                      ? { uri: producer.profile_image_url }
                      : IMAGE_ASSETS.vendor.default
                  }
                  style={styles.producerImage}
                />

                <View style={styles.producerInfo}>
                  <Text style={styles.sectionLabel}>
                    Meet the producer
                  </Text>

                  <Text style={styles.producerName}>
                    {vendorName}
                  </Text>

                  <Text style={styles.producerLocation}>
                    {producer?.city || product?.city || 'Local producer'}
                    {producer?.state
                      ? `, ${producer.state}`
                      : product?.state
                        ? `, ${product.state}`
                        : ''}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={COLORS.forest}
                />
              </TouchableOpacity>

              {Array.isArray(relatedProducts) &&
                relatedProducts.length > 0 && (
                  <View style={styles.relatedSection}>
                    <Text style={styles.relatedHeading}>
                      More from this producer
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.relatedList}
                    >
                      {relatedProducts
                        .filter(
                          (relatedItem) =>
                            relatedItem.id !== product.id
                        )
                        .slice(0, 6)
                        .map((relatedItem) => {
                          const relatedImage =
                            relatedItem.image_url
                              ? { uri: relatedItem.image_url }
                              : IMAGE_ASSETS.products.default;

                          return (
                            <TouchableOpacity
                              key={relatedItem.id}
                              activeOpacity={0.88}
                              style={styles.relatedCard}
                              onPress={() =>
                                navigation.push('ProductDetail', {
                                  product: relatedItem,
                                  producer,
                                  relatedProducts,
                                })
                              }
                            >
                              <Image
                                source={relatedImage}
                                style={styles.relatedImage}
                              />

                              <View style={styles.relatedContent}>
                                <Text
                                  numberOfLines={1}
                                  style={styles.relatedName}
                                >
                                  {relatedItem.name}
                                </Text>

                                <Text style={styles.relatedPrice}>
                                  $
                                  {Number(
                                    relatedItem.price || 0
                                  ).toFixed(2)}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </View>
                )}
            </View>
          </ScrollView>

          <View style={styles.stickyBar}>
            <View>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalPrice}>
                ${totalPrice.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.addToCartButton}
              onPress={addToCart}
            >
              <Ionicons
                name="bag-add-outline"
                size={20}
                color={COLORS.brown}
              />

              <Text style={styles.addToCartText}>
                Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
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

  scrollContent: {
    paddingBottom: 122,
  },

  hero: {
    height: 390,
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.cream,
    ...SHADOWS.medium,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,16,7,0.12)',
  },

  heroIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.91)',
    ...SHADOWS.soft,
  },

  heroActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },

  contentPanel: {
    marginTop: -18,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'rgba(247,242,232,0.96)',
  },

  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  categoryBadge: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.12)',
  },

  categoryBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
    textTransform: 'capitalize',
  },

  ratingBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
  },

  ratingBadgeText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brown,
  },

  productName: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 42,
    color: COLORS.brown,
  },

  vendorName: {
    marginTop: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },

  priceQuantityCard: {
    marginTop: 20,
    padding: 17,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.soft,
  },

  price: {
    fontFamily: FONTS.display,
    fontSize: 31,
    color: COLORS.forest,
  },

  unit: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.subText,
  },

  quantitySelector: {
    height: 46,
    paddingHorizontal: 5,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  quantityText: {
    minWidth: 34,
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.brown,
  },

  fulfillmentSection: {
    marginTop: 20,
  },

  sectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.7,
    color: COLORS.subText,
    textTransform: 'uppercase',
  },

  fulfillmentRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  fulfillmentBadge: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  fulfillmentText: {
    marginLeft: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  sectionCard: {
    marginTop: 20,
    padding: 19,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.brown,
  },

  description: {
    marginTop: 10,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.brown,
  },

  producerCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
  },

  producerImage: {
    width: 64,
    height: 64,
    marginRight: 13,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
  },

  producerInfo: {
    flex: 1,
  },

  producerName: {
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    color: COLORS.brown,
  },

  producerLocation: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.subText,
  },

  relatedSection: {
    marginTop: 25,
  },

  relatedHeading: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.brown,
    marginBottom: 13,
  },

  relatedList: {
    paddingRight: 20,
    gap: 13,
  },

  relatedCard: {
    width: 160,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },

  relatedImage: {
    width: '100%',
    height: 112,
    backgroundColor: COLORS.cream,
  },

  relatedContent: {
    padding: 12,
  },

  relatedName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  relatedPrice: {
    marginTop: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.forest,
  },

  stickyBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 10,
    minHeight: 78,
    paddingHorizontal: 17,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(252,250,247,0.97)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    ...SHADOWS.card,
  },

  totalLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.subText,
  },

  totalPrice: {
    marginTop: 2,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forest,
  },

  addToCartButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  addToCartText: {
    marginLeft: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  unavailableState: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unavailableTitle: {
    marginTop: 18,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.brown,
  },

  unavailableText: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.subText,
  },

  primaryButton: {
    height: 52,
    marginTop: 22,
    paddingHorizontal: 28,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  primaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});