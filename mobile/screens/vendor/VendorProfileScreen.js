import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function VendorProfileScreen({
  API,
  token,
  user,
  setToken,
  setUser,
  navigation,
}) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStore = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/producers/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setShop(null);
        return;
      }

      setShop(data);
    } catch (error) {
      console.error(
        'Unable to load vendor store:',
        error
      );

      setShop(null);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  function logout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setToken(null);
            setUser(null);
          },
        },
      ]
    );
  }

  function openStoreSetup() {
    navigation.navigate('VendorStoreSetup');
  }

  function openEditStore() {
    navigation.navigate('VendorEditStore', {
      shop,
    });
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.cream}
        />

        <SafeAreaView style={styles.center}>
          <ActivityIndicator
            color={COLORS.forest}
            size="large"
          />

          <Text style={styles.loading}>
            Loading Store...
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

        <SafeAreaView style={styles.empty}>
          <EmptyState
            image={IMAGE_ASSETS.vendor.storefront}
            title="Store setup required"
            message="Create your storefront so customers can begin shopping."
            buttonTitle="Store Setup"
            onPress={openStoreSetup}
          />

          <AppButton
            title="Sign Out"
            variant="outline"
            onPress={logout}
            style={styles.emptySignOutButton}
          />
        </SafeAreaView>
      </View>
    );
  }

  const heroImage = shop.profile_image_url
    ? {
        uri: shop.profile_image_url,
      }
    : IMAGE_ASSETS.vendor.storefront;

  const locationText = [
    shop.city,
    shop.state,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.forestDark}
      />

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.root}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.hero}>
            <Image
              source={heroImage}
              resizeMode="cover"
              style={styles.heroImage}
            />

            <View style={styles.overlay} />

            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>
                Vendor Store
              </Text>

              <Text
                numberOfLines={2}
                style={styles.title}
              >
                {shop.shop_name ||
                  'Your Store'}
              </Text>

              <Text style={styles.location}>
                {locationText || 'Local Vendor'}
              </Text>

              <View style={styles.storeStatusRow}>
                <View
                  style={[
                    styles.storeStatusDot,
                    shop.admin_approved
                      ? styles.storeStatusDotLive
                      : styles.storeStatusDotPending,
                  ]}
                />

                <Text style={styles.storeStatusText}>
                  {shop.admin_approved
                    ? 'Live on From Our Place'
                    : 'Pending platform approval'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              About Your Store
            </Text>

            <Text style={styles.body}>
              {shop.description ||
                'Tell shoppers about your farm, market, or local business.'}
            </Text>

            {!!shop.bio && (
              <>
                <Text style={styles.sectionLabel}>
                  Meet the Maker
                </Text>

                <Text style={styles.bioText}>
                  {shop.bio}
                </Text>
              </>
            )}

            <View style={styles.stats}>
              <Info
                label="Pickup"
                value={
                  shop.fulfillment_pickup
                    ? 'Enabled'
                    : 'Off'
                }
              />

              <Info
                label="Delivery"
                value={
                  shop.fulfillment_delivery
                    ? 'Enabled'
                    : 'Off'
                }
              />

              <Info
                label="Shipping"
                value={
                  shop.fulfillment_shipping
                    ? 'Enabled'
                    : 'Off'
                }
              />
            </View>

            <AppButton
              title="Edit Store"
              onPress={openEditStore}
              style={styles.editStoreButton}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Owner Account
            </Text>

            <Text style={styles.body}>
              {user?.full_name || 'Vendor'}
            </Text>

            <Text style={styles.email}>
              {user?.email ||
                'Vendor account'}
            </Text>

            <AppButton
              title="Sign Out"
              variant="outline"
              onPress={logout}
              style={styles.signOutButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Info({
  label,
  value,
}) {
  const enabled = value === 'Enabled';

  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          !enabled &&
            styles.infoValueOff,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: {
    marginTop: 16,
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: LAYOUT.screenPadding,
  },

  emptySignOutButton: {
    marginTop: 18,
  },

  scroll: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 120,
  },

  hero: {
    height: 300,
    marginTop: 14,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.forestDark,
    ...SHADOWS.card,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,48,30,0.38)',
  },

  heroContent: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 24,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.cream,
  },

  title: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color: COLORS.warmWhite,
  },

  location: {
    marginTop: 6,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.cream,
  },

  storeStatusRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  storeStatusDot: {
    width: 8,
    height: 8,
    marginRight: 7,
    borderRadius: 4,
  },

  storeStatusDotLive: {
    backgroundColor: COLORS.success,
  },

  storeStatusDotPending: {
    backgroundColor: COLORS.gold,
  },

  storeStatusText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.cream,
  },

  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.forestDark,
  },

  body: {
    marginTop: 10,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.brown,
  },

  sectionLabel: {
    marginTop: 18,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  bioText: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.brown,
  },

  email: {
    marginTop: 6,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.brownSoft,
  },

  stats: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },

  info: {
    flex: 1,
    minHeight: 74,
    padding: 11,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },

  infoLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.brownSoft,
  },

  infoValue: {
    marginTop: 5,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  infoValueOff: {
    color: COLORS.brownSoft,
  },

  editStoreButton: {
    marginTop: 18,
  },

  signOutButton: {
    marginTop: 20,
  },
});