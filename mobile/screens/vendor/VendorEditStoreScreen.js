import React, {
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
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';

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

import {
  IMAGE_ASSETS,
} from '../../constants/assets';


export default function VendorEditStoreScreen({
  API,
  token,
  route,
  navigation,
}) {
  const { shop } = route.params || {};

  const [
    shopName,
    setShopName,
  ] = useState(
    shop?.shop_name || ''
  );

  const [
    description,
    setDescription,
  ] = useState(
    shop?.description || ''
  );

  const [
    bio,
    setBio,
  ] = useState(
    shop?.bio || ''
  );

  const [
    city,
    setCity,
  ] = useState(
    shop?.city || ''
  );

  const [
    zipCode,
    setZipCode,
  ] = useState(
    shop?.zip_code || ''
  );

  const [
    pickup,
    setPickup,
  ] = useState(
    Boolean(
      shop?.fulfillment_pickup
    )
  );

  const [
    delivery,
    setDelivery,
  ] = useState(
    Boolean(
      shop?.fulfillment_delivery
    )
  );

  const [
    shipping,
    setShipping,
  ] = useState(
    Boolean(
      shop?.fulfillment_shipping
    )
  );

  const [
    imageUri,
    setImageUri,
  ] = useState('');

  const [
    currentImageUrl,
    setCurrentImageUrl,
  ] = useState(
    shop?.profile_image_url || ''
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);


  // =========================================================
  // IMAGE
  // =========================================================

  async function chooseImage() {
    try {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access required',
          'Please allow access to your photos to update your storefront image.'
        );

        return;
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            allowsEditing: false,
          });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      setImageUri(
        result.assets[0].uri
      );
    } catch (error) {
      console.error(
        'Unable to select store image:',
        error
      );

      Alert.alert(
        'Unable to select image',
        'Please try again.'
      );
    }
  }


  function removeImage() {
    setImageUri('');
    setCurrentImageUrl('');
  }


  async function uploadImage() {
    if (!imageUri) {
      return currentImageUrl;
    }

    setUploadingImage(true);

    try {
      const fileName =
        imageUri.split('/').pop() ||
        `store-${Date.now()}.jpg`;

      const extension =
        fileName
          .split('.')
          .pop()
          ?.toLowerCase();

      let mime =
        'image/jpeg';

      if (extension === 'png') {
        mime =
          'image/png';
      }

      if (
        extension === 'heic' ||
        extension === 'heif'
      ) {
        mime =
          'image/heic';
      }

      const formData =
        new FormData();

      formData.append(
        'file',
        {
          uri: imageUri,
          name: fileName,
          type: mime,
        }
      );

      /*
        Reuse the same working image uploader
        already used by product images.
      */
      const response =
        await fetch(
          `${API}/api/products/upload-image`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Store image upload failed.'
        );
      }

      return data?.url || '';
    } finally {
      setUploadingImage(false);
    }
  }


  // =========================================================
  // SAVE
  // =========================================================

  async function save() {
    if (!shopName.trim()) {
      Alert.alert(
        'Store name required',
        'Please enter your store name.'
      );

      return;
    }

    if (
      !pickup &&
      !delivery &&
      !shipping
    ) {
      Alert.alert(
        'Fulfillment required',
        'Select at least one fulfillment option.'
      );

      return;
    }

    setLoading(true);

    try {
      let profileImageUrl =
        currentImageUrl;

      if (imageUri) {
        profileImageUrl =
          await uploadImage();
      }

      const response =
        await fetch(
          `${API}/api/producers/me`,
          {
            method: 'PATCH',

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

              state:
                'OK',

              zip_code:
                zipCode.trim(),

              fulfillment_pickup:
                pickup,

              fulfillment_delivery:
                delivery,

              fulfillment_shipping:
                shipping,

              profile_image_url:
                profileImageUrl,
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
            data?.message ||
            'Unable to update store.'
        );
      }

      Alert.alert(
        'Store Updated',
        'Your storefront changes have been saved.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error(
        'Unable to save store:',
        error
      );

      Alert.alert(
        'Unable to save',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }


  // =========================================================
  // DISPLAY IMAGE
  // =========================================================

  const previewImage =
    imageUri
      ? {
          uri: imageUri,
        }
      : currentImageUrl
        ? {
            uri:
              currentImageUrl,
          }
        : IMAGE_ASSETS
            .vendor
            .storefront;


  // =========================================================
  // SCREEN
  // =========================================================

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
        style={styles.safe}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scroll
          }
        >

          {/* ===============================================
              HEADER
          =============================================== */}

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
              Storefront
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Edit Your Store
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Update what shoppers see
              when they visit your
              storefront.
            </Text>
          </View>


          {/* ===============================================
              STORE IMAGE
          =============================================== */}

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="image-outline"
                  size={21}
                  color={
                    COLORS.forest
                  }
                />
              </View>

              <View
                style={
                  styles.sectionCopy
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Store Image
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  This image appears
                  across your vendor
                  storefront.
                </Text>
              </View>
            </View>

            <Image
              source={
                previewImage
              }
              resizeMode="cover"
              style={
                styles.storeImage
              }
            />

            <TouchableOpacity
              activeOpacity={0.82}
              style={
                styles.changeImageButton
              }
              disabled={
                uploadingImage ||
                loading
              }
              onPress={
                chooseImage
              }
            >
              {uploadingImage ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.forest
                  }
                />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={19}
                  color={
                    COLORS.forest
                  }
                />
              )}

              <Text
                style={
                  styles.changeImageText
                }
              >
                {imageUri ||
                currentImageUrl
                  ? 'Change Photo'
                  : 'Choose Photo'}
              </Text>
            </TouchableOpacity>

            {(imageUri ||
              currentImageUrl) && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={
                  styles.removeImageButton
                }
                disabled={
                  uploadingImage ||
                  loading
                }
                onPress={
                  removeImage
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={
                    COLORS.brownSoft
                  }
                />

                <Text
                  style={
                    styles.removeImageText
                  }
                >
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>


          {/* ===============================================
              STORE DETAILS
          =============================================== */}

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="storefront-outline"
                  size={21}
                  color={
                    COLORS.forest
                  }
                />
              </View>

              <View
                style={
                  styles.sectionCopy
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Store Information
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Keep your public
                  storefront information
                  current.
                </Text>
              </View>
            </View>

            <FormField
              label="Store name"
              value={
                shopName
              }
              onChangeText={
                setShopName
              }
              placeholder="Store name"
            />

            <FormField
              label="Description"
              value={
                description
              }
              onChangeText={
                setDescription
              }
              placeholder="What do you sell?"
              multiline
            />

            <FormField
              label="Meet the maker bio"
              value={
                bio
              }
              onChangeText={
                setBio
              }
              placeholder="Tell your story."
              multiline
            />
          </View>


          {/* ===============================================
              LOCATION
          =============================================== */}

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="location-outline"
                  size={21}
                  color={
                    COLORS.forest
                  }
                />
              </View>

              <View
                style={
                  styles.sectionCopy
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Business Location
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Help nearby shoppers
                  discover your store.
                </Text>
              </View>
            </View>

            <FormField
              label="City"
              value={
                city
              }
              onChangeText={
                setCity
              }
              placeholder="City"
            />

            <FormField
              label="ZIP code"
              value={
                zipCode
              }
              onChangeText={
                setZipCode
              }
              placeholder="ZIP code"
              keyboardType="numeric"
            />
          </View>


          {/* ===============================================
              FULFILLMENT
          =============================================== */}

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={21}
                  color={
                    COLORS.forest
                  }
                />
              </View>

              <View
                style={
                  styles.sectionCopy
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Fulfillment
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Choose how customers
                  can receive purchases.
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.label
              }
            >
              Available options
            </Text>

            <View
              style={
                styles.pills
              }
            >
              <FilterPill
                label="Pickup"
                active={
                  pickup
                }
                onPress={() =>
                  setPickup(
                    (current) =>
                      !current
                  )
                }
              />

              <FilterPill
                label="Delivery"
                active={
                  delivery
                }
                onPress={() =>
                  setDelivery(
                    (current) =>
                      !current
                  )
                }
              />

              <FilterPill
                label="Shipping"
                active={
                  shipping
                }
                onPress={() =>
                  setShipping(
                    (current) =>
                      !current
                  )
                }
              />
            </View>
          </View>


          {/* ===============================================
              ACTIONS
          =============================================== */}

          <AppButton
            title={
              uploadingImage
                ? 'Uploading Photo...'
                : loading
                  ? 'Saving Store...'
                  : 'Save Store'
            }
            onPress={
              save
            }
            loading={
              loading ||
              uploadingImage
            }
            disabled={
              loading ||
              uploadingImage
            }
            style={
              styles.saveButton
            }
          />

          <AppButton
            title="Cancel"
            variant="outline"
            disabled={
              loading ||
              uploadingImage
            }
            onPress={() =>
              navigation.goBack()
            }
            style={
              styles.cancelButton
            }
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


// ===========================================================
// STYLES
// ===========================================================

const styles =
  StyleSheet.create({

    root: {
      flex: 1,
      backgroundColor:
        COLORS.cream,
    },

    safe: {
      flex: 1,
    },

    scroll: {
      paddingHorizontal:
        LAYOUT.screenPadding,

      paddingBottom: 70,
    },

    header: {
      paddingTop: 14,
      paddingBottom: 18,
    },

    eyebrow: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 11,

      letterSpacing: 1.2,

      textTransform:
        'uppercase',

      color:
        COLORS.sage,
    },

    title: {
      marginTop: 4,

      fontFamily:
        FONTS.display,

      fontSize: 36,

      lineHeight: 42,

      color:
        COLORS.forestDark,
    },

    subtitle: {
      marginTop: 7,

      fontFamily:
        FONTS.body,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.brownSoft,
    },

    card: {
      marginBottom: 16,

      padding: 18,

      borderRadius:
        RADIUS.xl,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.warmWhite,

      ...SHADOWS.soft,
    },

    sectionHeader: {
      marginBottom: 18,

      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },

    sectionIcon: {
      width: 42,
      height: 42,

      marginRight: 11,

      borderRadius: 16,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(74,103,65,0.10)',
    },

    sectionCopy: {
      flex: 1,
    },

    sectionTitle: {
      fontFamily:
        FONTS.display,

      fontSize: 22,

      color:
        COLORS.forestDark,
    },

    sectionSubtitle: {
      marginTop: 3,

      fontFamily:
        FONTS.body,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.brownSoft,
    },

    storeImage: {
      width: '100%',

      height: 210,

      borderRadius:
        RADIUS.xl,

      backgroundColor:
        COLORS.beige,
    },

    changeImageButton: {
      minHeight: 50,

      marginTop: 12,

      borderRadius:
        RADIUS.lg,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.cream,
    },

    changeImageText: {
      marginLeft: 8,

      fontFamily:
        FONTS.bodyBold,

      fontSize: 13,

      color:
        COLORS.forest,
    },

    removeImageButton: {
      alignSelf:
        'center',

      marginTop: 12,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical: 6,
    },

    removeImageText: {
      marginLeft: 6,

      fontFamily:
        FONTS.bodyBold,

      fontSize: 11,

      color:
        COLORS.brownSoft,
    },

    label: {
      marginTop: 4,

      marginBottom: 10,

      fontFamily:
        FONTS.bodyBold,

      fontSize: 11,

      letterSpacing: 0.8,

      textTransform:
        'uppercase',

      color:
        COLORS.sage,
    },

    pills: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 9,
    },

    saveButton: {
      marginTop: 2,
    },

    cancelButton: {
      marginTop: 10,
    },
  });