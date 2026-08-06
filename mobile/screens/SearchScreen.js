import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Image,
  ImageBackground,
  Keyboard,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { CATEGORIES } from '../constants/categories';

import {
  COLORS,
  FONTS,
  SHADOWS,
  COMMON_STYLES,
} from '../constants/theme';

const CATEGORY_DETAILS = {
  Produce: {
    subtitle: 'Fresh fruits & vegetables',
    icon: 'leaf-outline',
    iconFamily: 'ionicons',
  },
  Meat: {
    subtitle: 'Premium local cuts',
    icon: 'food-steak',
    iconFamily: 'material',
  },
  Bakery: {
    subtitle: 'Breads, pastries & baked goods',
    icon: 'bread-slice-outline',
    iconFamily: 'material',
  },
  'Eggs & Dairy': {
    subtitle: 'Milk, cheese, eggs & more',
    icon: 'egg-outline',
    iconFamily: 'material',
  },
  Herbs: {
    subtitle: 'Fresh herbs & seasonings',
    icon: 'sprout-outline',
    iconFamily: 'material',
  },
  Candles: {
    subtitle: 'Hand-poured artisan candles',
    icon: 'candle',
    iconFamily: 'material',
  },
  Jewelry: {
    subtitle: 'Handmade artisan jewelry',
    icon: 'diamond-stone',
    iconFamily: 'material',
  },
  Clothing: {
    subtitle: 'Locally made apparel',
    icon: 'tshirt-crew-outline',
    iconFamily: 'material',
  },
  'Coffee & Tea': {
    subtitle: 'Small-batch drinks & blends',
    icon: 'coffee-outline',
    iconFamily: 'material',
  },
  Crafts: {
    subtitle: 'Handcrafted local goods',
    icon: 'palette-outline',
    iconFamily: 'ionicons',
  },
  'Honey & Jams': {
    subtitle: 'Honey, preserves & spreads',
    icon: 'beehive-outline',
    iconFamily: 'material',
  },
  Flowers: {
    subtitle: 'Fresh bouquets & arrangements',
    icon: 'flower-outline',
    iconFamily: 'material',
  },
  Soaps: {
    subtitle: 'Natural soaps & skincare',
    icon: 'shower',
    iconFamily: 'material',
  },
  'Home Living': {
    subtitle: 'Decor, gifts & home goods',
    icon: 'home-outline',
    iconFamily: 'ionicons',
  },
  Pantry: {
    subtitle: 'Local staples & pantry goods',
    icon: 'food-variant',
    iconFamily: 'material',
  },
  Wellness: {
    subtitle: 'Natural wellness products',
    icon: 'heart-outline',
    iconFamily: 'ionicons',
  },
  'Pet Products': {
    subtitle: 'Treats & goods for your pets',
    icon: 'paw-outline',
    iconFamily: 'ionicons',
  },
  Nuts: {
    subtitle: 'Roasted nuts & local snacks',
    icon: 'peanut-outline',
    iconFamily: 'material',
  },
  Sauces: {
    subtitle: 'Small-batch sauces & marinades',
    icon: 'bottle-tonic-outline',
    iconFamily: 'material',
  },
  Spices: {
    subtitle: 'Seasonings & spice blends',
    icon: 'shaker-outline',
    iconFamily: 'material',
  },
  'Essential Oils': {
    subtitle: 'Oils, blends & aromatherapy',
    icon: 'water-outline',
    iconFamily: 'ionicons',
  },
  'Farm & Garden': {
    subtitle: 'Farm, garden & outdoor goods',
    icon: 'barn',
    iconFamily: 'material',
  },
  Plants: {
    subtitle: 'Plants, starts & garden finds',
    icon: 'sprout',
    iconFamily: 'material',
  },
  'Local Makers': {
    subtitle: 'Discover nearby creators',
    icon: 'account-group-outline',
    iconFamily: 'material',
  },
  'Gift Sets': {
    subtitle: 'Curated local gift collections',
    icon: 'gift-outline',
    iconFamily: 'ionicons',
  },
  Seasonal: {
    subtitle: 'Limited seasonal favorites',
    icon: 'weather-sunny',
    iconFamily: 'material',
  },
  Candy: {
    subtitle: 'Sweets, candy & local treats',
    icon: 'candy-outline',
    iconFamily: 'material',
  },
};

export default function SearchScreen({
  API,
  cart,
  navigation,
  route,
}) {
  const initialValue =
    route?.params?.initialQuery ||
    route?.params?.category ||
    '';

  const [query, setQuery] = useState(initialValue);

  const [selectedCategory, setSelectedCategory] = useState(
    route?.params?.category || null
  );

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const categories = useMemo(() => CATEGORIES, []);

  const cartCount = Array.isArray(cart)
    ? cart.reduce(
        (total, item) =>
          total + Number(item?.quantity || 1),
        0
      )
    : 0;

  async function doSearch(
    searchValue = query,
    categoryValue = selectedCategory
  ) {
    const finalQuery = String(searchValue || '').trim();
    const finalCategory = String(categoryValue || '').trim();

    if (!finalQuery && !finalCategory) {
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);

    try {
      const params = [];

      if (finalQuery) {
        params.push(
          `q=${encodeURIComponent(finalQuery)}`
        );
      }

      if (finalCategory) {
        params.push(
          `category=${encodeURIComponent(finalCategory)}`
        );
      }

      params.push('lat=35.4676');
      params.push('lng=-97.5164');

      const response = await fetch(
        `${API}/api/products/search?${params.join('&')}`
      );

      if (!response.ok) {
        throw new Error(
          `Search failed with status ${response.status}`
        );
      }

      const data = await response.json();

      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSelectedCategory(null);
    setResults([]);
    setSearched(false);
    Keyboard.dismiss();
  }

  function handleCategoryPress(category) {
    const categoryValue =
      category?.key ||
      category?.title ||
      '';

    const categoryLabel =
      category?.title ||
      category?.label ||
      '';

    setSelectedCategory(categoryValue);
    setQuery(categoryLabel);

    doSearch(categoryLabel, categoryValue);
  }

  function handleResultPress(item) {
    navigation.navigate('ProductDetail', {
      product: item,
    });
  }

  function handleProducerPress(item) {
    if (!item?.producer_id) {
      return;
    }

    navigation.navigate('Producer', {
      producer: {
        id: item.producer_id,
        shop_name: item.shop_name,
        city: item.city,
        state: item.state,
        avg_rating: item.avg_rating,
        fulfillment_pickup: item.fulfillment_pickup,
        fulfillment_delivery: item.fulfillment_delivery,
        fulfillment_shipping: item.fulfillment_shipping,
      },
    });
  }

  function renderCategoryIcon(item) {
    const detail = CATEGORY_DETAILS[item.title] || {
      icon: 'storefront-outline',
      iconFamily: 'ionicons',
    };

    if (detail.iconFamily === 'material') {
      return (
        <MaterialCommunityIcons
          name={detail.icon}
          size={25}
          color={COLORS.white}
        />
      );
    }

    return (
      <Ionicons
        name={detail.icon}
        size={25}
        color={COLORS.white}
      />
    );
  }

  function renderCategory({ item }) {
    const detail = CATEGORY_DETAILS[item.title] || {
      subtitle: 'Discover local products',
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
      >
        <ImageBackground
          source={item.image}
          resizeMode="cover"
          style={styles.categoryImage}
          imageStyle={styles.categoryImageStyle}
        >
          <View style={styles.categoryOverlay} />

          <View style={styles.categoryContent}>
            <View style={styles.categoryIcon}>
              {renderCategoryIcon(item)}
            </View>

            <View>
              <Text
                numberOfLines={2}
                style={styles.categoryTitle}
              >
                {item.title}
              </Text>

              <Text
                numberOfLines={2}
                style={styles.categorySubtitle}
              >
                {detail.subtitle}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  function renderProductImage(item) {
    const imageUrl =
      item?.image_url ||
      item?.image ||
      item?.photo_url;

    if (
      typeof imageUrl === 'string' &&
      imageUrl.startsWith('http')
    ) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.resultImagePlaceholder}>
        <MaterialCommunityIcons
          name="basket-outline"
          size={28}
          color={COLORS.forest}
        />
      </View>
    );
  }

  function renderResult({ item }) {
    const numericPrice = Number(item?.price);

    const formattedPrice = Number.isFinite(numericPrice)
      ? `$${numericPrice.toFixed(2)}`
      : item?.price || '';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.resultCard}
        onPress={() => handleResultPress(item)}
      >
        {renderProductImage(item)}

        <View style={styles.resultInfo}>
          <Text
            numberOfLines={1}
            style={styles.resultName}
          >
            {item?.name || 'Local product'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleProducerPress(item)}
            disabled={!item?.producer_id}
          >
            <Text
              numberOfLines={1}
              style={styles.resultShop}
            >
              {item?.shop_name || 'Local producer'}
              {item?.city ? ` · ${item.city}` : ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.resultMetaRow}>
            {item?.avg_rating ? (
              <View style={styles.ratingRow}>
                <Ionicons
                  name="star"
                  size={13}
                  color={COLORS.gold}
                />

                <Text style={styles.ratingText}>
                  {Number(item.avg_rating).toFixed(1)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.resultPrice}>
              {formattedPrice}
              {item?.unit ? ` / ${item.unit}` : ''}
            </Text>
          </View>

          <View style={styles.fulfillmentRow}>
            {item?.fulfillment_pickup ? (
              <View style={styles.fulfillmentBadge}>
                <Ionicons
                  name="bag-handle-outline"
                  size={12}
                  color={COLORS.forest}
                />

                <Text style={styles.fulfillmentText}>
                  Pickup
                </Text>
              </View>
            ) : null}

            {item?.fulfillment_delivery ? (
              <View style={styles.fulfillmentBadge}>
                <Ionicons
                  name="car-outline"
                  size={12}
                  color={COLORS.forest}
                />

                <Text style={styles.fulfillmentText}>
                  Delivery
                </Text>
              </View>
            ) : null}

            {item?.fulfillment_shipping ? (
              <View style={styles.fulfillmentBadge}>
                <Ionicons
                  name="cube-outline"
                  size={12}
                  color={COLORS.forest}
                />

                <Text style={styles.fulfillmentText}>
                  Shipping
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.subText}
        />
      </TouchableOpacity>
    );
  }

  const showCategories = !searched && !loading;
  const showResults = searched && !loading;

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_settings.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={COLORS.brown}
              />
            </TouchableOpacity>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={styles.headerTitle}
            >
              Browse All Categories
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons
                name="cart-outline"
                size={29}
                color={COLORS.brown}
              />

              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.searchArea}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={25}
                color={COLORS.brownSoft}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Search categories or products..."
                placeholderTextColor={COLORS.brownSoft}
                value={query}
                onChangeText={(value) => {
                  setQuery(value);

                  if (!value.trim() && searched) {
                    clearSearch();
                  }
                }}
                onSubmitEditing={() => doSearch()}
                returnKeyType="search"
                autoCorrect={false}
              />

              {query.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={clearSearch}
                >
                  <Ionicons
                    name="close-circle"
                    size={23}
                    color={COLORS.brownSoft}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.filterButton}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={COLORS.brown}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {showCategories ? (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderCategory}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              columnWrapperStyle={styles.categoryRow}
            />
          ) : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingIcon}>
                <MaterialCommunityIcons
                  name="basket-outline"
                  size={36}
                  color={COLORS.forest}
                />
              </View>

              <ActivityIndicator
                size="large"
                color={COLORS.gold}
              />

              <Text style={styles.loadingTitle}>
                Finding local favorites
              </Text>

              <Text style={styles.loadingText}>
                Searching nearby products and makers...
              </Text>
            </View>
          ) : null}

          {showResults ? (
            <FlatList
              data={results}
              keyExtractor={(item, index) =>
                String(item?.id || index)
              }
              renderItem={renderResult}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              ListHeaderComponent={
                <View style={styles.resultsHeader}>
                  <View>
                    <Text style={styles.resultsTitle}>
                      Search Results
                    </Text>

                    <Text style={styles.resultsCount}>
                      {results.length}{' '}
                      {results.length === 1
                        ? 'item found'
                        : 'items found'}
                    </Text>
                  </View>

                  {results.length > 0 ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.sortButton}
                    >
                      <Ionicons
                        name="swap-vertical-outline"
                        size={18}
                        color={COLORS.forest}
                      />

                      <Text style={styles.sortText}>
                        Sort
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="search-outline"
                      size={38}
                      color={COLORS.forest}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    We couldn’t find that
                  </Text>

                  <Text style={styles.emptyText}>
                    Try another product, category, vendor,
                    or market.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.browseButton}
                    onPress={clearSearch}
                  >
                    <Text style={styles.browseButtonText}>
                      Browse Categories
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          ) : null}
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
    backgroundColor: 'rgba(247,242,232,0.60)',
  },

  safeArea: {
    ...COMMON_STYLES.safeArea,
    backgroundColor: 'transparent',
  },

  header: {
    minHeight: 82,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.82)',
    ...SHADOWS.soft,
  },

  cartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.82)',
    ...SHADOWS.soft,
  },

  cartBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6E2146',
    borderWidth: 2,
    borderColor: COLORS.cream,
  },

  cartBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 30,
    color: COLORS.brown,
  },

  searchArea: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
  },

  searchBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 17,
    paddingRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(252,250,247,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(111,100,86,0.22)',
    ...SHADOWS.medium,
  },

  searchInput: {
    flex: 1,
    marginLeft: 11,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.brown,
  },

  filterButton: {
    width: 43,
    height: 43,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.14)',
  },

  categoryList: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 115,
  },

  categoryRow: {
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '48.4%',
    height: 172,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: 'rgba(252,250,247,0.84)',
    backgroundColor: COLORS.warmWhite,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  categoryImage: {
    flex: 1,
  },

  categoryImageStyle: {
    borderRadius: 15,
  },

  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,18,7,0.34)',
  },

  categoryContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 13,
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,26,8,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },

  categoryTitle: {
    color: COLORS.white,
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 25,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 5,
    textShadowOffset: {
      width: 0,
      height: 2,
    },
  },

  categorySubtitle: {
    marginTop: 4,
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.70)',
    textShadowRadius: 4,
  },

  loadingContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    width: 76,
    height: 76,
    marginBottom: 16,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.82)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingTitle: {
    marginTop: 18,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.brown,
  },

  loadingText: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.brownSoft,
    textAlign: 'center',
  },

  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 115,
  },

  resultsHeader: {
    paddingTop: 4,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsTitle: {
    fontFamily: FONTS.display,
    fontSize: 29,
    lineHeight: 35,
    color: COLORS.brown,
  },

  resultsCount: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.brownSoft,
  },

  sortButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252,250,247,0.90)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sortText: {
    marginLeft: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forest,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(229,221,208,0.95)',
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  resultImage: {
    width: 82,
    height: 82,
    marginRight: 13,
    borderRadius: 17,
    backgroundColor: COLORS.cream,
  },

  resultImagePlaceholder: {
    width: 82,
    height: 82,
    marginRight: 13,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },

  resultInfo: {
    flex: 1,
    paddingRight: 7,
  },

  resultName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.brown,
    marginBottom: 3,
  },

  resultShop: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.brownSoft,
    marginBottom: 5,
  },

  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },

  ratingText: {
    marginLeft: 3,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brown,
  },

  resultPrice: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.forest,
  },

  fulfillmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  fulfillmentBadge: {
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 13,
    marginRight: 5,
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  fulfillmentText: {
    marginLeft: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.forest,
  },

  emptyCard: {
    marginTop: 36,
    paddingHorizontal: 26,
    paddingVertical: 40,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(252,250,247,0.90)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    marginBottom: 17,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 32,
    color: COLORS.brown,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 10,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.brownSoft,
    textAlign: 'center',
  },

  browseButton: {
    height: 54,
    marginTop: 22,
    paddingHorizontal: 28,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  browseButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },
});