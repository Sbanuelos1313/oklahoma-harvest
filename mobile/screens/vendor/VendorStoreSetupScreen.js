import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import FilterPill from '../../components/FilterPill';

import {
  COLORS,
  FONTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

export default function VendorStoreSetupScreen({
  API,
  token,
  navigation,
}) {
  const [shopName, setShopName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [bio, setBio] =
    useState('');

  const [city, setCity] =
    useState('');

  const [zipCode, setZipCode] =
    useState('');

  const [pickup, setPickup] =
    useState(true);

  const [delivery, setDelivery] =
    useState(false);

  const [shipping, setShipping] =
    useState(false);

  const [serviceRadius, setServiceRadius] =
    useState('25');

  const [deliveryFee, setDeliveryFee] =
    useState('0');

  const [loading, setLoading] =
    useState(false);

  const completion = useMemo(() => {
    const requiredFields = [
      shopName.trim(),
      description.trim(),
      city.trim(),
      zipCode.trim(),
    ];

    const completedFields =
      requiredFields.filter(Boolean).length;

    return Math.round(
      (completedFields /
        requiredFields.length) *
        100
    );
  }, [
    shopName,
    description,
    city,
    zipCode,
  ]);

  function validateForm() {
    if (!shopName.trim()) {
      Alert.alert(
        'Store name required',
        'Enter the public name of your store.'
      );

      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        'Description required',
        'Add a short description explaining what your store sells.'
      );

      return false;
    }

    if (!city.trim()) {
      Alert.alert(
        'City required',
        'Enter the city where your business is located.'
      );

      return false;
    }

    if (!zipCode.trim()) {
      Alert.alert(
        'ZIP code required',
        'Enter your business ZIP code.'
      );

      return false;
    }

    if (
      !pickup &&
      !delivery &&
      !shipping
    ) {
      Alert.alert(
        'Fulfillment required',
        'Select at least one way customers can receive their purchases.'
      );

      return false;
    }

    const numericRadius =
      Number(serviceRadius);

    if (
      delivery &&
      (
        !Number.isFinite(numericRadius) ||
        numericRadius <= 0
      )
    ) {
      Alert.alert(
        'Delivery radius required',
        'Enter a valid delivery radius in miles.'
      );

      return false;
    }

    return true;
  }

  async function createStore() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/producers/setup`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            shop_name:
              shopName.trim(),

            description:
              description.trim(),

            bio:
              bio.trim(),

            city:
              city.trim(),

            state: 'OK',

            zip_code:
              zipCode.trim(),

            fulfillment_pickup:
              pickup,

            fulfillment_delivery:
              delivery,

            fulfillment_shipping:
              shipping,

            service_radius_miles:
              delivery
                ? Number(
                    serviceRadius || 25
                  )
                : 0,

            delivery_fee:
              delivery
                ? Number(
                    deliveryFee || 0
                  )
                : 0,

            tax_rate: 0.08375,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to create store.'
        );
      }

Alert.alert(
  'Store created',
  'Your storefront has been created and submitted for approval.',
  [
    {
      text: 'Continue',
      onPress: () => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'VendorMain',
            },
          ],
        });
      },
    },
  ]
);
    } catch (error) {
      console.error(
        'Store setup failed:',
        error
      );

      Alert.alert(
        'Store setup failed',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
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
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <View style={styles.header}>
              <Text style={styles.eyebrow}>
                Vendor setup
              </Text>

              <Text style={styles.title}>
                Create Your Store
              </Text>

              <Text style={styles.subtitle}>
                Build the storefront customers
                will see when they discover your
                products.
              </Text>
            </View>

            <View
              style={
                styles.progressCard
              }
            >
              <View
                style={
                  styles.progressTopRow
                }
              >
                <View
                  style={
                    styles.progressIcon
                  }
                >
                  <Ionicons
                    name="storefront-outline"
                    size={22}
                    color={COLORS.forest}
                  />
                </View>

                <View
                  style={
                    styles.progressCopy
                  }
                >
                  <Text
                    style={
                      styles.progressTitle
                    }
                  >
                    Store profile
                  </Text>

                  <Text
                    style={
                      styles.progressText
                    }
                  >
                    {completion}% complete
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.progressTrack
                }
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        `${completion}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="storefront-outline"
                title="Store Information"
                subtitle="Tell shoppers who you are and what you offer."
              />

              <FormField
                label="Store name"
                value={shopName}
                onChangeText={
                  setShopName
                }
                placeholder="Example: Prairie Rose Market"
                autoCapitalize="words"
              />

              <FormField
                label="Short description"
                value={description}
                onChangeText={
                  setDescription
                }
                placeholder="What products do you sell?"
                multiline
              />

              <FormField
                label="Meet the maker bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell customers about your business, farm, craft, or story."
                multiline
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="location-outline"
                title="Business Location"
                subtitle="Your general location helps customers find nearby producers."
              />

              <FormField
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="City"
                autoCapitalize="words"
              />

              <FormField
                label="State"
                value="Oklahoma"
                editable={false}
                placeholder="Oklahoma"
              />

              <FormField
                label="ZIP code"
                value={zipCode}
                onChangeText={
                  setZipCode
                }
                placeholder="73101"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="bag-handle-outline"
                title="Fulfillment"
                subtitle="Choose how customers can receive their purchases."
              />

              <Text style={styles.label}>
                Available options
              </Text>

              <View style={styles.pills}>
                <FilterPill
                  label="Pickup"
                  active={pickup}
                  onPress={() =>
                    setPickup(
                      (current) =>
                        !current
                    )
                  }
                />

                <FilterPill
                  label="Delivery"
                  active={delivery}
                  onPress={() =>
                    setDelivery(
                      (current) =>
                        !current
                    )
                  }
                />

                <FilterPill
                  label="Shipping"
                  active={shipping}
                  onPress={() =>
                    setShipping(
                      (current) =>
                        !current
                    )
                  }
                />
              </View>

              {delivery && (
                <View
                  style={
                    styles.deliveryFields
                  }
                >
                  <FormField
                    label="Delivery radius"
                    value={serviceRadius}
                    onChangeText={
                      setServiceRadius
                    }
                    placeholder="25"
                    keyboardType="numeric"
                    suffix="miles"
                  />

                  <FormField
                    label="Delivery fee"
                    value={deliveryFee}
                    onChangeText={
                      setDeliveryFee
                    }
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    prefix="$"
                  />
                </View>
              )}

              <View style={styles.helperBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={COLORS.forest}
                />

                <Text
                  style={
                    styles.helperText
                  }
                >
                  You can update fulfillment,
                  hours, delivery settings, and
                  store images after setup.
                </Text>
              </View>
            </View>

            <AppButton
              title={
                loading
                  ? 'Creating Store...'
                  : 'Create Store'
              }
              loading={loading}
              disabled={loading}
              onPress={createStore}
              style={
                styles.primaryButton
              }
            />

            <AppButton
              title="Cancel"
              variant="outline"
              disabled={loading}
              onPress={() =>
                navigation.goBack()
              }
              style={
                styles.cancelButton
              }
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.sectionCopy}>
        <Text
          style={styles.sectionTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  safeArea: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal:
      LAYOUT.screenPadding,
    paddingBottom: 60,
  },

  header: {
    paddingTop: 14,
    paddingBottom: 18,
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
    lineHeight: 42,
    color: COLORS.forestDark,
  },

  subtitle: {
    marginTop: 7,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.brownSoft,
  },

  progressCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  progressCopy: {
    flex: 1,
  },

  progressTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forestDark,
  },

  progressText: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.brownSoft,
  },

  progressTrack: {
    height: 8,
    marginTop: 14,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.beige,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.forest,
  },

  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  sectionHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sectionIcon: {
    width: 41,
    height: 41,
    marginRight: 11,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(74,103,65,0.10)',
  },

  sectionCopy: {
    flex: 1,
  },

  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.forestDark,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.brownSoft,
  },

  label: {
    marginTop: 4,
    marginBottom: 10,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  deliveryFields: {
    marginTop: 16,
  },

  helperBox: {
    marginTop: 17,
    padding: 14,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor:
      'rgba(74,103,65,0.08)',
  },

  helperText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.brownSoft,
  },

  primaryButton: {
    marginTop: 2,
  },

  cancelButton: {
    marginTop: 10,
  },
});