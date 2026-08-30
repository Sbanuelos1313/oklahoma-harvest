import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

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

const SEARCH_LIMIT = 25;

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

  const [filtersVisible, setFiltersVisible] = useState(false);

  const [pickupOnly, setPickupOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [shippingOnly, setShippingOnly] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [sortBy, setSortBy] = useState('rating');

  const [zipCode, setZipCode] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(25);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const categories = useMemo(
    () => CATEGORIES,
    []
  );
  const featuredCategories =
  useMemo(
    () =>
      categories.slice(
        0,
        8
      ),
    [categories]
  );

  const cartCount =
    cart?.items?.reduce(
      (total, item) =>
        total + Number(item?.quantity || 0),
      0
    ) || 0;

  async function doSearch(
    searchValue = query,
    categoryValue = selectedCategory,
    options = {}
  ) {
    const finalQuery = String(
      searchValue || ''
    ).trim();

    const finalCategory = String(
      categoryValue || ''
    ).trim();

    const append =
      options.append === true;

    const nextOffset =
      append ? offset : 0;

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
          `category=${encodeURIComponent(
            finalCategory
          )}`
        );
      }

      if (pickupOnly) {
        params.push('pickup=true');
      }

      if (deliveryOnly) {
        params.push('delivery=true');
      }

      if (shippingOnly) {
        params.push('shipping=true');
      }

      if (minPrice.trim() !== '') {
        params.push(
          `min_price=${encodeURIComponent(
            minPrice.trim()
          )}`
        );
      }

      if (maxPrice.trim() !== '') {
        params.push(
          `max_price=${encodeURIComponent(
            maxPrice.trim()
          )}`
        );
      }

      params.push(
        `sort_by=${encodeURIComponent(sortBy)}`
      );

      params.push(
        `limit=${SEARCH_LIMIT}`
      );

      params.push(
        `offset=${nextOffset}`
      );

      const url =
        `${API}/api/products/search?` +
        params.join('&');

      console.log(
        'SEARCH API:',
        url
      );

      const response =
        await fetch(url);

      const data =
        await response
          .json()
          .catch(() => null);

      console.log(
        'SEARCH RESPONSE:',
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          `Search failed with status ${response.status}`
        );
      }

      const incoming =
        Array.isArray(data)
          ? data
          : [];

      if (append) {
        setResults(
          (current) => [
            ...current,
            ...incoming,
          ]
        );
      } else {
        setResults(incoming);
      }

      const updatedOffset =
        nextOffset +
        incoming.length;

      setOffset(updatedOffset);

      setHasMore(
        incoming.length === SEARCH_LIMIT
      );
    } catch (error) {
      console.error(
        'Search error:',
        error
      );

      if (!append) {
        setResults([]);
      }

      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSelectedCategory(null);
    setResults([]);
    setOffset(0);
    setHasMore(false);
    setSearched(false);

    Keyboard.dismiss();
  }

  function clearFilters() {
    setPickupOnly(false);
    setDeliveryOnly(false);
    setShippingOnly(false);

    setMinPrice('');
    setMaxPrice('');

    setSortBy('rating');

    setZipCode('');
    setRadiusMiles(25);
  }

  function applyFilters() {
    setFiltersVisible(false);

    doSearch(
      query,
      selectedCategory
    );
  }

  function loadMore() {
    if (
      loading ||
      !hasMore
    ) {
      return;
    }

    doSearch(
      query,
      selectedCategory,
      {
        append: true,
      }
    );
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

    doSearch(
      categoryLabel,
      categoryValue
    );
  }

  function handleResultPress(item) {
    navigation.navigate(
      'ProductDetail',
      {
        product: item,
      }
    );
  }

  function handleBackPress() {
    if (
      typeof navigation?.canGoBack === 'function' &&
      navigation.canGoBack()
    ) {
      navigation.goBack();
      return;
    }

    if (
      typeof navigation?.jumpTo === 'function'
    ) {
      navigation.jumpTo('Home');
      return;
    }

    navigation.navigate('Home');
  }

  function handleCartPress() {
    if (
      typeof navigation?.jumpTo === 'function'
    ) {
      navigation.jumpTo('Cart');
      return;
    }

    const parent =
      navigation?.getParent?.();

    if (
      typeof parent?.jumpTo === 'function'
    ) {
      parent.jumpTo('Cart');
      return;
    }

    if (
      typeof parent?.navigate === 'function'
    ) {
      parent.navigate('Cart');
      return;
    }
  }

  function handleProducerPress(item) {
    if (!item?.producer_id) {
      return;
    }

    navigation.navigate(
      'Producer',
      {
        producer: {
          id: item.producer_id,
          shop_name: item.shop_name,
          city: item.city,
          state: item.state,
          avg_rating: item.avg_rating,
          fulfillment_pickup:
            item.fulfillment_pickup,
          fulfillment_delivery:
            item.fulfillment_delivery,
          fulfillment_shipping:
            item.fulfillment_shipping,
        },
      }
    );
  }
  function renderCategoryIcon(category) {
    const details =
      CATEGORY_DETAILS[category?.title] || {};

    const iconName =
      details.icon || 'storefront-outline';

    if (details.iconFamily === 'material') {
      return (
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={COLORS.warmWhite}
        />
      );
    }

    return (
      <Ionicons
        name={iconName}
        size={24}
        color={COLORS.warmWhite}
      />
    );
  }

  function renderCategoryCard({
    item,
  }) {
    const details =
      CATEGORY_DETAILS[item?.title] || {};

    const imageSource =
      item?.image ||
      item?.source ||
      item?.asset;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.categoryCard}
        onPress={() =>
          handleCategoryPress(item)
        }
      >
        {imageSource ? (
          <ImageBackground
            source={imageSource}
            style={styles.categoryImage}
            imageStyle={
              styles.categoryImageStyle
            }
          >
            <View
              style={
                styles.categoryOverlay
              }
            >
              <View
                style={
                  styles.categoryIconCircle
                }
              >
                {renderCategoryIcon(item)}
              </View>

              <View
                style={
                  styles.categoryCopy
                }
              >
                <Text
                  numberOfLines={1}
                  style={
                    styles.categoryTitle
                  }
                >
                  {item?.title ||
                    item?.label ||
                    'Local'}
                </Text>

                <Text
                  numberOfLines={2}
                  style={
                    styles.categorySubtitle
                  }
                >
                  {details.subtitle ||
                    'Shop local products'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.warmWhite}
              />
            </View>
          </ImageBackground>
        ) : (
          <View
            style={
              styles.categoryFallback
            }
          >
            <View
              style={
                styles.categoryIconCircle
              }
            >
              {renderCategoryIcon(item)}
            </View>

            <View
              style={
                styles.categoryCopy
              }
            >
              <Text
                style={
                  styles.categoryFallbackTitle
                }
              >
                {item?.title ||
                  item?.label ||
                  'Local'}
              </Text>

              <Text
                style={
                  styles.categoryFallbackSubtitle
                }
              >
                {details.subtitle ||
                  'Shop local products'}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.forest}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  function renderFulfillmentBadges(item) {
       const badges = [];

    if (item?.fulfillment_pickup) {
      badges.push({
        key: 'pickup',
        label: 'Pickup',
        icon: 'bag-handle-outline',
      });
    }

    if (item?.fulfillment_delivery) {
      badges.push({
        key: 'delivery',
        label: 'Delivery',
        icon: 'car-outline',
      });
    }

    if (item?.fulfillment_shipping) {
      badges.push({
        key: 'shipping',
        label: 'Shipping',
        icon: 'cube-outline',
      });
    }

    if (!badges.length) {
      return null;
    }

    return (
      <View style={styles.fulfillmentRow}>
        {badges.map((badge) => (
          <View
            key={badge.key}
            style={styles.fulfillmentBadge}
          >
            <Ionicons
              name={badge.icon}
              size={12}
              color={COLORS.forest}
            />

            <Text style={styles.fulfillmentText}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  function renderProduct({
    item,
  }) {
    const rating =
      Number(item?.avg_rating || 0);

    const price =
      Number(item?.price || 0);

    const imageUrl =
      item?.image_url ||
      item?.imageUrl ||
      null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.resultCard}
        onPress={() =>
          handleResultPress(item)
        }
      >
        <View style={styles.resultImageWrap}>
          {imageUrl ? (
            <Image
              source={{
                uri: imageUrl,
              }}
              style={styles.resultImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.resultImageFallback}>
              <Ionicons
                name="image-outline"
                size={34}
                color={COLORS.sage}
              />

              <Text style={styles.resultImageFallbackText}>
                Local Product
              </Text>
            </View>
          )}
        </View>

        <View style={styles.resultContent}>
          <View style={styles.resultTopRow}>
            <View style={styles.resultTitleWrap}>
              <Text
                numberOfLines={2}
                style={styles.resultName}
              >
                {item?.name ||
                  'Local product'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  handleProducerPress(
                    item
                  )
                }
                disabled={
                  !item?.producer_id
                }
              >
                <Text
                  numberOfLines={1}
                  style={styles.resultShop}
                >
                  {item?.shop_name ||
                    'Local producer'}
                  {item?.city
                    ? ` · ${item.city}`
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.resultPrice}>
              ${price.toFixed(2)}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons
              name={
                rating > 0
                  ? 'star'
                  : 'star-outline'
              }
              size={14}
              color={COLORS.gold}
            />

            <Text style={styles.ratingText}>
              {rating > 0
                ? rating.toFixed(1)
                : 'New'}
            </Text>

            {item?.state ? (
              <>
                <View style={styles.ratingDot} />

                <Text style={styles.resultLocation}>
                  {item?.city
                    ? `${item.city}, ${item.state}`
                    : item.state}
                </Text>
              </>
            ) : null}
          </View>

          {item?.description ? (
            <Text
              numberOfLines={2}
              style={styles.resultDescription}
            >
              {item.description}
            </Text>
          ) : null}

          {renderFulfillmentBadges(
            item
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmptyResults() {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="search-outline"
            size={34}
            color={COLORS.forest}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No local products found
        </Text>

        <Text style={styles.emptyText}>
          Try another search term,
          category, or clear some
          filters.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.emptyClearButton}
          onPress={() => {
            clearFilters();
            clearSearch();
          }}
        >
          <Text style={styles.emptyClearText}>
            Start Over
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeFilterCount =
    Number(Boolean(selectedCategory)) +
    Number(pickupOnly) +
    Number(deliveryOnly) +
    Number(shippingOnly) +
    Number(minPrice.trim() !== '') +
    Number(maxPrice.trim() !== '') +
    Number(sortBy !== 'rating');
  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_settings.jpg')}
      resizeMode="cover"
      style={styles.root}
    >
      <View style={styles.backgroundOverlay}>
        <StatusBar
          barStyle="dark-content"
        />

        <SafeAreaView style={styles.safe}>
          <View style={styles.screenHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerButton}
              onPress={handleBackPress}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={COLORS.brown}
              />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerEyebrow}>
                Marketplace
              </Text>

              <Text
                numberOfLines={1}
                style={styles.headerTitle}
              >
                Discover Local
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cartButton}
              onPress={handleCartPress}
            >
              <Ionicons
                name="bag-outline"
                size={23}
                color={COLORS.brown}
              />

              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99
                      ? '99+'
                      : cartCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
        </View>

        <View style={styles.searchArea}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={21}
              color={COLORS.sage}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products or makers..."
              placeholderTextColor={
                COLORS.brownSoft
              }
              returnKeyType="search"
              style={styles.searchInput}
              onSubmitEditing={() =>
                doSearch()
              }
            />

            {query ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.clearSearchIcon}
                onPress={clearSearch}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={
                    COLORS.brownSoft
                  }
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.filterButton}
            onPress={() =>
              setFiltersVisible(
                true
              )
            }
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={COLORS.brown}
            />

            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {searched ? (
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.resultsEyebrow}>
                Search Results
              </Text>

              <Text style={styles.resultsTitle}>
                {results.length === 1
                  ? '1 local product'
                  : `${results.length} local products`}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={clearSearch}
            >
              <Text style={styles.browseAgainText}>
                Browse
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading &&
        results.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color={COLORS.forest}
            />

            <Text style={styles.loadingText}>
              Finding local
              products...
            </Text>
          </View>
        ) : searched ? (
          <FlatList
            data={results}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.id ??
                  `product-${index}`
              )
            }
            renderItem={renderProduct}
            contentContainerStyle={
              styles.resultsList
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              renderEmptyResults
            }
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={
                    styles.loadMoreButton
                  }
                  onPress={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.forest
                      }
                    />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>
                        Load More Products
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={
                          COLORS.forest
                        }
                      />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.listBottomSpace} />
              )
            }
          />
        ) : (
          <FlatList
            data={featuredCategories}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.key ||
                  item?.title ||
                  index
              )
            }
            renderItem={
              renderCategoryCard
            }
            contentContainerStyle={
              styles.categoryList
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.categoryListHeader}>
                <Text style={styles.categoryListEyebrow}>
                  Shop Local
                </Text>

                <Text style={styles.categoryListTitle}>
                  Popular Categories
                </Text>
                <Text style={styles.categoryListSubtitle}>
                  Start with a popular category
                  or use Filters to browse the
                  full local marketplace.
                </Text>
              </View>
            }
          />
        )}

        <Modal
          visible={filtersVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setFiltersVisible(
              false
            )
          }
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.filterSheet}>
              <View style={styles.filterSheetHandle} />

              <View style={styles.filterHeader}>
                <View>
                  <Text style={styles.filterEyebrow}>
                    Search
                  </Text>

                  <Text style={styles.filterTitle}>
                    Filters
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.modalCloseButton}
                  onPress={() =>
                    setFiltersVisible(
                      false
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color={
                      COLORS.brown
                    }
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.filterScroll
                }
              >
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Category
                  </Text>

                  <Text style={styles.filterSectionText}>
                    Choose a category or leave this
                    open to search the entire marketplace.
                  </Text>

                  <View style={styles.optionWrap}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.optionChip,
                        !selectedCategory &&
                          styles.optionChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedCategory(
                          null
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          !selectedCategory &&
                            styles.optionChipTextSelected,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>

                    {categories.map(
                      (category) => {
                        const categoryValue =
                          category?.key ||
                          category?.title;

                        const categoryLabel =
                          category?.title ||
                          category?.label;

                        const selected =
                          selectedCategory ===
                          categoryValue;

                        return (
                          <TouchableOpacity
                            key={
                              String(
                                categoryValue
                              )
                            }
                            activeOpacity={0.8}
                            style={[
                              styles.optionChip,
                              selected &&
                                styles.optionChipSelected,
                            ]}
                            onPress={() => {
                              setSelectedCategory(
                                categoryValue
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                selected &&
                                  styles.optionChipTextSelected,
                              ]}
                            >
                              {categoryLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Location
                  </Text>

                  <Text style={styles.filterSectionText}>
                    Enter your ZIP code and choose
                    how far you want to shop. Distance
                    filtering will activate when
                    location geocoding is connected.
                  </Text>

                  <View style={styles.zipInputWrap}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={COLORS.forest}
                    />

                    <TextInput
                      style={styles.zipInput}
                      value={zipCode}
                      onChangeText={setZipCode}
                      placeholder="ZIP Code"
                      placeholderTextColor={
                        COLORS.brownSoft
                      }
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>

                  <Text style={styles.filterLabel}>
                    Distance
                  </Text>

                  <View style={styles.optionWrap}>
                    {[5, 10, 25, 50, 100].map(
                      (miles) => {
                        const selected =
                          radiusMiles === miles;

                        return (
                          <TouchableOpacity
                            key={miles}
                            activeOpacity={0.8}
                            style={[
                              styles.optionChip,
                              selected &&
                                styles.optionChipSelected,
                            ]}
                            onPress={() =>
                              setRadiusMiles(
                                miles
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                selected &&
                                  styles.optionChipTextSelected,
                              ]}
                            >
                              {miles} mi
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Fulfillment
                  </Text>

                  <FilterSwitchRow
                    icon="bag-handle-outline"
                    title="Pickup"
                    subtitle="Show vendors offering pickup"
                    value={pickupOnly}
                    onValueChange={
                      setPickupOnly
                    }
                  />

                  <FilterSwitchRow
                    icon="car-outline"
                    title="Delivery"
                    subtitle="Show vendors offering local delivery"
                    value={deliveryOnly}
                    onValueChange={
                      setDeliveryOnly
                    }
                  />

                  <FilterSwitchRow
                    icon="cube-outline"
                    title="Shipping"
                    subtitle="Show vendors offering shipping"
                    value={shippingOnly}
                    onValueChange={
                      setShippingOnly
                    }
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Price
                  </Text>

                  <View style={styles.priceRow}>
                    <View style={styles.priceField}>
                      <Text style={styles.filterLabel}>
                        Minimum
                      </Text>

                      <View style={styles.priceInputWrap}>
                        <Text style={styles.currencySymbol}>
                          $
                        </Text>

                        <TextInput
                          style={styles.priceInput}
                          value={minPrice}
                          onChangeText={
                            setMinPrice
                          }
                          placeholder="0"
                          placeholderTextColor={
                            COLORS.brownSoft
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.priceField}>
                      <Text style={styles.filterLabel}>
                        Maximum
                      </Text>

                      <View style={styles.priceInputWrap}>
                        <Text style={styles.currencySymbol}>
                          $
                        </Text>

                        <TextInput
                          style={styles.priceInput}
                          value={maxPrice}
                          onChangeText={
                            setMaxPrice
                          }
                          placeholder="Any"
                          placeholderTextColor={
                            COLORS.brownSoft
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Sort By
                  </Text>

                  {[
                    {
                      key: 'rating',
                      label: 'Highest Rated',
                    },
                    {
                      key: 'newest',
                      label: 'Newest',
                    },
                    {
                      key: 'price_low',
                      label: 'Price: Low to High',
                    },
                    {
                      key: 'price_high',
                      label: 'Price: High to Low',
                    },
                    {
                      key: 'alphabetical',
                      label: 'Alphabetical',
                    },
                  ].map((option) => {
                    const selected =
                      sortBy === option.key;

                    return (
                      <TouchableOpacity
                        key={option.key}
                        activeOpacity={0.82}
                        style={[
                          styles.sortOption,
                          selected &&
                            styles.sortOptionSelected,
                        ]}
                        onPress={() =>
                          setSortBy(
                            option.key
                          )
                        }
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            selected &&
                              styles.radioOuterSelected,
                          ]}
                        >
                          {selected ? (
                            <View
                              style={
                                styles.radioInner
                              }
                            />
                          ) : null}
                        </View>

                        <Text
                          style={[
                            styles.sortOptionText,
                            selected &&
                              styles.sortOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={
                    styles.clearFiltersButton
                  }
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={
                    styles.applyFiltersButton
                  }
                  onPress={applyFilters}
                >
                  <Text style={styles.applyFiltersText}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  </ImageBackground>
 );
 }

function FilterSwitchRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) {
  function toggle() {
    onValueChange(!value);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.switchRow,
        value &&
          styles.switchRowSelected,
      ]}
      onPress={toggle}
    >
      <View
        style={[
          styles.switchIcon,
          value &&
            styles.switchIconSelected,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            value
              ? COLORS.warmWhite
              : COLORS.forest
          }
        />
      </View>

      <View style={styles.switchCopy}>
        <Text
          style={[
            styles.switchTitle,
            value &&
              styles.switchTitleSelected,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.switchSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        trackColor={{
          false: COLORS.border,
          true: COLORS.sage,
        }}
        thumbColor={
          value
            ? COLORS.forest
            : COLORS.warmWhite
        }
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(247,242,232,0.60)',
  },

  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenHeader: {
    minHeight: 84,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  headerEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  headerTitle: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 25,
    lineHeight: 30,
    textAlign: 'center',
    color: COLORS.brown,
  },

  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 2,
    borderColor: COLORS.cream,
  },

  cartBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.warmWhite,
  },

  searchArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchBar: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    paddingVertical: 0,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.brown,
  },

  clearSearchIcon: {
    marginLeft: 8,
  },

  filterButton: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(201,168,76,0.14)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,76,0.26)',
  },

  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 2,
    borderColor: COLORS.cream,
  },

  filterBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    color: COLORS.warmWhite,
  },
    categoryList: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },

  categoryListHeader: {
    paddingTop: 8,
    paddingBottom: 18,
  },

  categoryListEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  categoryListTitle: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.brown,
  },

  categoryListSubtitle: {
    marginTop: 6,
    maxWidth: 320,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.brownSoft,
  },

  categoryCard: {
    minHeight: 118,
    marginBottom: 14,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  categoryImage: {
    width: '100%',
    minHeight: 118,
    justifyContent: 'flex-end',
  },

  categoryImageStyle: {
    borderRadius: 24,
  },

  categoryOverlay: {
    minHeight: 118,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(44,26,14,0.34)',
  },

  categoryFallback: {
    minHeight: 118,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.30)',
  },

  categoryCopy: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },

  categoryTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    color: COLORS.warmWhite,
  },

  categorySubtitle: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.88)',
  },

  categoryFallbackTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    color: COLORS.brown,
  },

  categoryFallbackSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.brownSoft,
  },

  resultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  resultsEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  resultsTitle: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.brown,
  },

  browseAgainText: {
    paddingBottom: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },

  resultCard: {
    marginBottom: 15,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  resultImageWrap: {
    width: '100%',
    height: 190,
    backgroundColor:
      'rgba(74,103,65,0.07)',
  },

  resultImage: {
    width: '100%',
    height: '100%',
  },

  resultImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultImageFallbackText: {
    marginTop: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.sage,
  },

  resultContent: {
    padding: 16,
  },

  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  resultTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  resultName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.brown,
  },

  resultShop: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
  },

  resultPrice: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.forest,
  },

  ratingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    marginLeft: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.brown,
  },

  ratingDot: {
    width: 3,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },

  resultLocation: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.brownSoft,
  },

  resultDescription: {
    marginTop: 10,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.brownSoft,
  },

  fulfillmentRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  fulfillmentBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(74,103,65,0.14)',
  },

  fulfillmentText: {
    marginLeft: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.forest,
  },

  loadingWrap: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.brownSoft,
  },

  emptyState: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 60,
    alignItems: 'center',
  },

  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
  },

  emptyTitle: {
    marginTop: 18,
    fontFamily: FONTS.display,
    fontSize: 22,
    textAlign: 'center',
    color: COLORS.brown,
  },

  emptyText: {
    marginTop: 8,
    maxWidth: 290,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  emptyClearButton: {
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
  },

  emptyClearText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.warmWhite,
  },

  loadMoreButton: {
    minHeight: 52,
    marginTop: 4,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(74,103,65,0.15)',
  },

  loadMoreText: {
    marginRight: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  listBottomSpace: {
    height: 30,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(44,26,14,0.34)',
  },

  filterSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
  },

  filterSheetHandle: {
    width: 44,
    height: 5,
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },

  filterHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  filterEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  filterTitle: {
    marginTop: 3,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.brown,
  },

  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },

  filterSection: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  filterSectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  filterSectionText: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.brownSoft,
  },

  filterLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  zipInputWrap: {
    minHeight: 52,
    marginTop: 13,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  zipInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.brown,
  },

  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionChipSelected: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },

  optionChipText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.brown,
  },

  optionChipTextSelected: {
    color: COLORS.warmWhite,
  },

  switchRow: {
    minHeight: 68,
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  switchRowSelected: {
    backgroundColor:
      'rgba(74,103,65,0.07)',
  },

  switchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.08)',
  },

  switchIconSelected: {
    backgroundColor: COLORS.forest,
  },

  switchCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  switchTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.brown,
  },

  switchTitleSelected: {
    color: COLORS.forest,
  },

  switchSubtitle: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.brownSoft,
  },

  priceRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 12,
  },

  priceField: {
    flex: 1,
  },

  priceInputWrap: {
    minHeight: 50,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  currencySymbol: {
    marginRight: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.sage,
  },

  priceInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.brown,
  },

  sortOption: {
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 13,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sortOptionSelected: {
    backgroundColor:
      'rgba(74,103,65,0.07)',
    borderColor:
      'rgba(74,103,65,0.22)',
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: COLORS.forest,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.forest,
  },

  sortOptionText: {
    marginLeft: 11,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.brown,
  },

  sortOptionTextSelected: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forest,
  },

  filterActions: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },

  clearFiltersButton: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  clearFiltersText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.brown,
  },

  applyFiltersButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    ...SHADOWS.soft,
  },

  applyFiltersText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.warmWhite,
  },
});