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
  Image,
  ImageBackground,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

import {
  IMAGE_ASSETS,
  CATEGORY_ASSETS,
} from '../../constants/assets';

const FILTERS = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'active',
    label: 'Active',
  },
  {
    key: 'hidden',
    label: 'Hidden',
  },
  {
    key: 'low-stock',
    label: 'Low Stock',
  },
];

export default function VendorProductsScreen({
  API,
  token,
  navigation,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [updatingId, setUpdatingId] =
    useState(null);
  const [searchText, setSearchText] =
    useState('');
  const [selectedFilter, setSelectedFilter] =
    useState('all');

  const loadProducts = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${API}/api/products/my`,
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
              'Unable to load products.'
          );
        }

        setProducts(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          'Unable to load products:',
          error
        );

        setProducts([]);

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
    loadProducts();
  }, [loadProducts]);

  async function handleRefresh() {
    setRefreshing(true);

    await loadProducts({
      showLoading: false,
    });
  }

  async function toggleProduct(product) {
    if (updatingId) {
      return;
    }

    setUpdatingId(product.id);

    try {
      const response = await fetch(
        `${API}/api/products/${product.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: !product.is_active,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to update product.'
        );
      }

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id
            ? {
                ...item,
                is_active: !product.is_active,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Unable to update product:',
        error
      );

      Alert.alert(
        'Unable to update product',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function confirmToggle(product) {
    const action = product.is_active
      ? 'hide'
      : 'activate';

    Alert.alert(
      product.is_active
        ? 'Hide product?'
        : 'Activate product?',
      product.is_active
        ? `${product.name} will no longer be visible to customers.`
        : `${product.name} will become visible to customers.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text:
            action.charAt(0).toUpperCase() +
            action.slice(1),
          onPress: () => toggleProduct(product),
        },
      ]
    );
  }

  function openAddProduct() {
    if (navigation?.navigate) {
      navigation.navigate('VendorAddProduct');
      return;
    }

    Alert.alert(
      'Add Product',
      'The add-product screen will be connected next.'
    );
  }

  function openEditProduct(product) {
    if (navigation?.navigate) {
      navigation.navigate('VendorEditProduct', {
        product,
        productId: product.id,
      });

      return;
    }

    Alert.alert(
      'Edit Product',
      'The edit-product screen will be connected next.'
    );
  }

  const inventorySummary = useMemo(() => {
    const active = products.filter(
      (product) => product.is_active
    ).length;

    const hidden = products.filter(
      (product) => !product.is_active
    ).length;

    const lowStock = products.filter(
      (product) =>
        product.is_active &&
        Number(
          product.quantity_available || 0
        ) <= 5
    ).length;

    return {
      total: products.length,
      active,
      hidden,
      lowStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const quantity = Number(
        product.quantity_available || 0
      );

      const matchesSearch =
        !normalizedSearch ||
        product.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        product.category
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        product.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      let matchesFilter = true;

      if (selectedFilter === 'active') {
        matchesFilter = product.is_active;
      }

      if (selectedFilter === 'hidden') {
        matchesFilter = !product.is_active;
      }

      if (selectedFilter === 'low-stock') {
        matchesFilter =
          product.is_active && quantity <= 5;
      }

      return matchesSearch && matchesFilter;
    });
  }, [
    products,
    searchText,
    selectedFilter,
  ]);

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
              name="cube-outline"
              size={30}
              color={COLORS.forest}
            />
          </View>

          <ActivityIndicator
            color={COLORS.forest}
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingTitle}>
            Loading inventory
          </Text>

          <Text style={styles.loadingMessage}>
            Gathering your products and current
            stock levels.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ImageBackground
      source={IMAGE_ASSETS.backgrounds.vendorProfile}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={styles.root}
        >
          <FlatList
            data={filteredProducts}
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
              <ProductsHeader
                inventorySummary={inventorySummary}
                searchText={searchText}
                setSearchText={setSearchText}
                selectedFilter={selectedFilter}
                setSelectedFilter={
                  setSelectedFilter
                }
                onAddProduct={openAddProduct}
              />
            }
            ListEmptyComponent={
              products.length === 0 ? (
                <View style={styles.emptyWrapper}>
                  <EmptyState
                    image={
                      IMAGE_ASSETS.products.default
                    }
                    title="No products yet"
                    message="Add your first product so customers can begin shopping your goods."
                    buttonTitle="Add Product"
                    onPress={openAddProduct}
                  />
                </View>
              ) : (
                <FilteredEmptyState
                  onClear={() => {
                    setSearchText('');
                    setSelectedFilter('all');
                  }}
                />
              )
            }
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                updating={
                  updatingId === item.id
                }
                onToggle={() =>
                  confirmToggle(item)
                }
                onEdit={() =>
                  openEditProduct(item)
                }
              />
            )}
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
  }

function ProductsHeader({
  inventorySummary,
  searchText,
  setSearchText,
  selectedFilter,
  setSelectedFilter,
  onAddProduct,
}) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              Vendor inventory
            </Text>

            <Text style={styles.title}>
              Products
            </Text>

            <Text style={styles.subtitle}>
              Manage what customers can discover,
              purchase, and pick up.
            </Text>
          </View>
        </View>

        <AppButton
          title="Add Product"
          onPress={onAddProduct}
          style={styles.addProductButton}
        />
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard
          value={inventorySummary.total}
          label="Total"
        />

        <SummaryCard
          value={inventorySummary.active}
          label="Active"
        />

        <SummaryCard
          value={inventorySummary.lowStock}
          label="Low Stock"
          warning={
            inventorySummary.lowStock > 0
          }
        />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.brownSoft}
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search products"
            placeholderTextColor={
              COLORS.brownSoft
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {!!searchText && (
            <TouchableOpacity
              hitSlop={10}
              onPress={() =>
                setSearchText('')
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.brownSoft}
              />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) =>
            item.key
          }
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterRow
          }
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
                  setSelectedFilter(
                    item.key
                  )
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
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          Inventory
        </Text>

        <Text style={styles.resultsCount}>
          {inventorySummary.total}{' '}
          {inventorySummary.total === 1
            ? 'product'
            : 'products'}
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({
  value,
  label,
  warning = false,
}) {
  return (
    <View style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          warning && styles.summaryValueWarning,
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

function getProductImage(product) {
  // Always use the vendor's actual uploaded photo first.
  if (product?.image_url) {
    return {
      uri: product.image_url,
    };
  }

  const rawCategory = String(
    product?.category || ''
  )
    .trim()
    .toLowerCase();

  if (!rawCategory) {
    return IMAGE_ASSETS.products.default;
  }

  // First try an exact category key match.
  const exactMatch = CATEGORY_ASSETS.find(
    (category) =>
      category.key &&
      String(category.key)
        .toLowerCase() === rawCategory
  );

  if (exactMatch?.image) {
    return exactMatch.image;
  }

  // Then try the human-readable category label.
  const labelMatch = CATEGORY_ASSETS.find(
    (category) =>
      category.label &&
      String(category.label)
        .trim()
        .toLowerCase() === rawCategory
  );

  if (labelMatch?.image) {
    return labelMatch.image;
  }

  // Handle a few common naming variations.
  const aliases = {
    bakery: 'baked',
    baked_goods: 'baked',
    'baked goods': 'baked',

    honey_jams: 'honey',
    'honey & jams': 'honey',

    soap: 'soaps',

    candle: 'candles',

    gift: 'gifts',
    'gift sets': 'gifts',

    tinctures: 'tinctures_remedies',
    remedies: 'tinctures_remedies',
    'tinctures & remedies':
      'tinctures_remedies',

    'essential oils': 'essential_oils',

    'farm & garden': 'farm_garden',

    'plants & flowers': 'plants_flowers',

    'local makers': 'local_makers',

    'pet products': 'pet_products',

    'home living': 'home_living',

    'coffee & tea': 'coffee_tea',
  };

  const aliasKey = aliases[rawCategory];

  if (aliasKey) {
    const aliasMatch = CATEGORY_ASSETS.find(
      (category) =>
        category.key === aliasKey
    );

    if (aliasMatch?.image) {
      return aliasMatch.image;
    }
  }

  // Final safety fallback.
  return IMAGE_ASSETS.products.default;
}

function ProductCard({
  product,
  updating,
  onToggle,
  onEdit,
}) {
  const productImage =
    getProductImage(product);

  const quantity = Number(
    product.quantity_available || 0
  );

  const lowStock =
    product.is_active && quantity <= 5;

  return (
    <View style={styles.productCard}>
      <View style={styles.imageSection}>
        <Image
          source={productImage}
          resizeMode="cover"
          style={styles.productImage}
        />

        <View style={styles.imageShade} />

        <View
          style={[
            styles.statusBadge,
            !product.is_active &&
              styles.statusBadgeHidden,
            lowStock &&
              styles.statusBadgeWarning,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              !product.is_active &&
                styles.statusDotHidden,
              lowStock &&
                styles.statusDotWarning,
            ]}
          />

          <Text
            style={[
              styles.statusBadgeText,
              !product.is_active &&
                styles.statusBadgeTextHidden,
              lowStock &&
                styles.statusBadgeTextWarning,
            ]}
          >
            {!product.is_active
              ? 'Hidden'
              : lowStock
                ? 'Low Stock'
                : 'Active'}
          </Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            $
            {Number(
              product.price || 0
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.productBody}>
        <View style={styles.productHeading}>
          <View style={styles.productTitleCopy}>
            <Text
              numberOfLines={2}
              style={styles.productName}
            >
              {product.name}
            </Text>

            <Text style={styles.category}>
              {product.category ||
                'Uncategorized'}
            </Text>
          </View>
        </View>

        {!!product.description && (
          <Text
            numberOfLines={2}
            style={styles.description}
          >
            {product.description}
          </Text>
        )}

        <View style={styles.inventoryRow}>
          <View style={styles.inventoryItem}>
            <Ionicons
              name="layers-outline"
              size={17}
              color={COLORS.forest}
            />

            <View>
              <Text
                style={styles.inventoryLabel}
              >
                Inventory
              </Text>

              <Text
                style={[
                  styles.inventoryValue,
                  lowStock &&
                    styles.inventoryValueWarning,
                ]}
              >
                {quantity} available
              </Text>
            </View>
          </View>

          <View style={styles.inventoryDivider} />

          <View style={styles.inventoryItem}>
            <Ionicons
              name="scale-outline"
              size={17}
              color={COLORS.forest}
            />

            <View>
              <Text
                style={styles.inventoryLabel}
              >
                Unit
              </Text>

              <Text
                style={styles.inventoryValue}
              >
                {product.unit || 'Each'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton
            title={
              updating
                ? 'Updating...'
                : product.is_active
                  ? 'Hide'
                  : 'Activate'
            }
            variant="outline"
            disabled={updating}
            onPress={onToggle}
            style={styles.actionButton}
          />

          <AppButton
            title="Edit"
            variant="secondary"
            onPress={onEdit}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
}

function FilteredEmptyState({ onClear }) {
  return (
    <View style={styles.filteredEmpty}>
      <View style={styles.filteredEmptyIcon}>
        <Ionicons
          name="search-outline"
          size={27}
          color={COLORS.forest}
        />
      </View>

      <Text style={styles.filteredEmptyTitle}>
        No matching products
      </Text>

      <Text style={styles.filteredEmptyText}>
        Try another search or clear your current
        inventory filter.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.clearButtonText}>
          Clear Filters
        </Text>
      </TouchableOpacity>
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

  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  headerCopy: {
    flex: 1,
    paddingRight: 14,
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

  addIconButton: {
    width: 47,
    height: 47,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    ...SHADOWS.soft,
  },

  addProductButton: {
    marginTop: 17,
  },

  summaryRow: {
    marginTop: 19,
    flexDirection: 'row',
    gap: 9,
  },

  summaryCard: {
    flex: 1,
    minHeight: 86,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  summaryValue: {
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forest,
  },

  summaryValueWarning: {
    color: COLORS.rust,
  },

  summaryLabel: {
    marginTop: 3,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.brownSoft,
  },

  searchSection: {
    marginTop: 18,
  },

  searchBox: {
    minHeight: 54,
    paddingHorizontal: 15,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 0,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.forestDark,
  },

  filterRow: {
    paddingTop: 12,
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
    marginTop: 22,
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

  productCard: {
    marginBottom: 17,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  imageSection: {
    height: 190,
    backgroundColor: COLORS.beige,
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23,50,31,0.08)',
  },

  statusBadge: {
    position: 'absolute',
    top: 13,
    left: 13,
    minHeight: 30,
    paddingHorizontal: 11,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252,250,247,0.94)',
  },

  statusBadgeHidden: {
    backgroundColor: 'rgba(245,237,214,0.95)',
  },

  statusBadgeWarning: {
    backgroundColor: 'rgba(253,232,220,0.96)',
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  statusDotHidden: {
    backgroundColor: COLORS.brownSoft,
  },

  statusDotWarning: {
    backgroundColor: COLORS.rust,
  },

  statusBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.forest,
  },

  statusBadgeTextHidden: {
    color: COLORS.brownSoft,
  },

  statusBadgeTextWarning: {
    color: COLORS.rust,
  },

  priceBadge: {
    position: 'absolute',
    right: 13,
    bottom: 13,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(23,50,31,0.90)',
  },

  priceBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.warmWhite,
  },

  productBody: {
    padding: 16,
  },

  productHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  productTitleCopy: {
    flex: 1,
  },

  productName: {
    fontFamily: FONTS.display,
    fontSize: 25,
    lineHeight: 30,
    color: COLORS.forestDark,
  },

  category: {
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
    color: COLORS.sage,
  },

  description: {
    marginTop: 9,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.brown,
  },

  inventoryRow: {
    marginTop: 15,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    backgroundColor: COLORS.cream,
  },

  inventoryItem: {
    flex: 1,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inventoryDivider: {
    width: 1,
    marginHorizontal: 10,
    backgroundColor: COLORS.border,
  },

  inventoryLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.brownSoft,
  },

  inventoryValue: {
    marginTop: 2,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
    color: COLORS.forestDark,
  },

  inventoryValueWarning: {
    color: COLORS.rust,
  },

  actions: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 10,
  },

  actionButton: {
    flex: 1,
    minHeight: 45,
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