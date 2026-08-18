import React, { useState } from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

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
  CATEGORY_ASSETS,
} from '../../constants/assets';

export default function VendorAddProductScreen({
  API,
  token,
  navigation,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('each');
  const [quantity, setQuantity] = useState('');

  const [imageUri, setImageUri] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);

  async function chooseImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Please allow photo access so you can add a product image.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
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
        'IMAGE PICKER ERROR:',
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
  }

  async function uploadImage() {
    if (!imageUri) {
      return '';
    }

    setUploadingImage(true);

    try {
      const rawFileName =
        imageUri.split('/').pop() ||
        `product-${Date.now()}.jpg`;

      const cleanFileName =
        rawFileName.split('?')[0];

      const extension =
        cleanFileName
          .split('.')
          .pop()
          ?.toLowerCase() || 'jpg';

      let mimeType = 'image/jpeg';

      if (extension === 'png') {
        mimeType = 'image/png';
      } else if (
        extension === 'heic' ||
        extension === 'heif'
      ) {
        mimeType = 'image/heic';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      }

      const formData =
        new FormData();

      formData.append(
        'file',
        {
          uri: imageUri,
          name: cleanFileName,
          type: mimeType,
        }
      );

      console.log(
        'Uploading product image...'
      );

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

      console.log(
        'IMAGE UPLOAD RESPONSE:',
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to upload product image (${response.status}).`
        );
      }

      if (!data?.url) {
        throw new Error(
          'The image uploaded, but the server did not return an image URL.'
        );
      }

      return data.url;
    } finally {
      setUploadingImage(false);
    }
  }

  async function save() {
    if (
      !name?.trim() ||
      !price?.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please enter a product name and price.'
      );

      return;
    }

    if (!category) {
      Alert.alert(
        'Category required',
        'Please choose a category.'
      );

      return;
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a price greater than zero.'
      );

      return;
    }

    const numericQuantity =
      Number(quantity || 0);

    if (
      !Number.isFinite(
        numericQuantity
      ) ||
      numericQuantity < 0
    ) {
      Alert.alert(
        'Invalid quantity',
        'Quantity cannot be negative.'
      );

      return;
    }

    if (!token) {
      Alert.alert(
        'Session expired',
        'Your vendor login session is missing. Please sign out and sign back in.'
      );

      return;
    }

    if (
      loading ||
      uploadingImage
    ) {
      return;
    }

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(() => {
        controller.abort();
      }, 30000);

    setLoading(true);

    try {
      let uploadedImageUrl =
        '';

      if (imageUri) {
        uploadedImageUrl =
          await uploadImage();
      }

      const payload = {
        name: name.trim(),

        description:
          description?.trim() ||
          '',

        category:
          category ||
          'other',

        price:
          numericPrice,

        unit:
          unit?.trim() ||
          'each',

        quantity_available:
          numericQuantity,

        image_url:
          uploadedImageUrl,

        tags: [],
      };

      console.log(
        'ADD PRODUCT API:',
        `${API}/api/products/`
      );

      console.log(
        'TOKEN PRESENT:',
        Boolean(token)
      );

      console.log(
        'PRODUCT PAYLOAD:',
        payload
      );

      const res =
        await fetch(
          `${API}/api/products/`,
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
                payload
              ),

            signal:
              controller.signal,
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      console.log(
        'ADD PRODUCT RESPONSE:',
        res.status,
        data
      );

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to create product (${res.status}).`
        );
      }

      Alert.alert(
        'Product added',
        'Your product was added to your storefront.',
        [
          {
            text: 'Done',

            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error(
        'ADD PRODUCT ERROR:',
        error
      );

      if (
        error?.name ===
        'AbortError'
      ) {
        Alert.alert(
          'Request timed out',
          'The product request did not receive a response within 30 seconds.'
        );
      } else {
        Alert.alert(
          'Unable to add product',
          error?.message ||
            'Please try again.'
        );
      }
    } finally {
      clearTimeout(
        timeoutId
      );

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
          <View
            style={
              styles.headerRow
            }
          >
            <View
              style={
                styles.headerCopy
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                Inventory
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Add product
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Create a polished product listing for customers to browse and buy.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.closeButton
              }
              onPress={() =>
                navigation.goBack()
              }
              disabled={
                loading ||
                uploadingImage
              }
            >
              <Text
                style={
                  styles.closeText
                }
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.card
            }
          >
            <FormField
              label="Product name"
              value={name}
              onChangeText={
                setName
              }
              placeholder="Example: Handmade Soy Candle"
            />

            <FormField
              label="Description"
              value={
                description
              }
              onChangeText={
                setDescription
              }
              placeholder="Describe the item, materials, ingredients, or story."
              multiline
            />

            <Text
              style={
                styles.label
              }
            >
              Category
            </Text>

            <View
              style={
                styles.pills
              }
            >
              {CATEGORY_ASSETS
                .filter(
                  (item) =>
                    item.key
                )
                .map(
                  (item) => (
                    <FilterPill
                      key={
                        item.key
                      }
                      label={
                        item.label
                      }
                      active={
                        category ===
                        item.key
                      }
                      onPress={() =>
                        setCategory(
                          item.key
                        )
                      }
                    />
                  )
                )}
            </View>

            <FormField
              label="Price"
              value={price}
              onChangeText={
                setPrice
              }
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <FormField
              label="Unit"
              value={unit}
              onChangeText={
                setUnit
              }
              placeholder="each, lb, jar, bunch..."
            />

            <FormField
              label="Quantity available"
              value={
                quantity
              }
              onChangeText={
                setQuantity
              }
              placeholder="0"
              keyboardType="numeric"
            />

            <Text
              style={
                styles.label
              }
            >
              Product photo
            </Text>

            {imageUri ? (
              <View
                style={
                  styles.imageCard
                }
              >
                <Image
                  source={{
                    uri: imageUri,
                  }}
                  style={
                    styles.imagePreview
                  }
                  resizeMode="cover"
                />

                <View
                  style={
                    styles.imageActions
                  }
                >
                  <TouchableOpacity
                    activeOpacity={
                      0.82
                    }
                    style={
                      styles.imageButton
                    }
                    onPress={
                      chooseImage
                    }
                    disabled={
                      loading ||
                      uploadingImage
                    }
                  >
                    <Text
                      style={
                        styles.imageButtonText
                      }
                    >
                      Change Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={
                      0.82
                    }
                    style={
                      styles.removeButton
                    }
                    onPress={
                      removeImage
                    }
                    disabled={
                      loading ||
                      uploadingImage
                    }
                  >
                    <Text
                      style={
                        styles.removeButtonText
                      }
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.84}
                style={
                  styles.addImageButton
                }
                onPress={
                  chooseImage
                }
                disabled={
                  loading ||
                  uploadingImage
                }
              >
                <Text
                  style={
                    styles.addImageIcon
                  }
                >
                  +
                </Text>

                <Text
                  style={
                    styles.addImageTitle
                  }
                >
                  Add Product Photo
                </Text>

                <Text
                  style={
                    styles.addImageSubtitle
                  }
                >
                  Choose an image from your photo library.
                </Text>
              </TouchableOpacity>
            )}

            <AppButton
              title={
                uploadingImage
                  ? 'Uploading Photo...'
                  : loading
                  ? 'Adding Product...'
                  : 'Add Product'
              }
              onPress={save}
              loading={
                loading ||
                uploadingImage
              }
              style={{
                marginTop: 22,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.cancelButton
              }
              onPress={() =>
                navigation.goBack()
              }
              disabled={
                loading ||
                uploadingImage
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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

      paddingBottom:
        118,
    },

    headerRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      paddingTop: 14,
    },

    headerCopy: {
      flex: 1,
      paddingRight: 16,
    },

    eyebrow: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 12,

      letterSpacing:
        1.2,

      textTransform:
        'uppercase',

      color:
        COLORS.sage,

      marginTop: 4,
    },

    title: {
      fontFamily:
        FONTS.display,

      fontSize: 34,

      color:
        COLORS.forestDark,

      marginTop: 4,
    },

    subtitle: {
      fontFamily:
        FONTS.body,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.brownSoft,

      marginTop: 6,

      marginBottom: 18,
    },

    closeButton: {
      width: 42,

      height: 42,

      borderRadius: 21,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.warmWhite,

      ...SHADOWS.soft,
    },

    closeText: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 28,

      lineHeight: 30,

      color:
        COLORS.forestDark,
    },

    card: {
      backgroundColor:
        COLORS.warmWhite,

      borderRadius:
        RADIUS.xl,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 18,

      ...SHADOWS.soft,
    },

    label: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 12,

      color:
        COLORS.sage,

      marginTop: 14,

      marginBottom: 8,

      letterSpacing:
        0.5,

      textTransform:
        'uppercase',
    },

    pills: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 8,

      marginBottom: 4,
    },

    addImageButton: {
      minHeight: 150,

      borderWidth: 1,

      borderStyle:
        'dashed',

      borderColor:
        COLORS.sage,

      borderRadius:
        RADIUS.xl,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 20,

      backgroundColor:
        COLORS.cream,
    },

    addImageIcon: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 34,

      lineHeight: 38,

      color:
        COLORS.forest,
    },

    addImageTitle: {
      marginTop: 4,

      fontFamily:
        FONTS.bodyBold,

      fontSize: 15,

      color:
        COLORS.forestDark,
    },

    addImageSubtitle: {
      marginTop: 5,

      fontFamily:
        FONTS.body,

      fontSize: 13,

      lineHeight: 18,

      textAlign:
        'center',

      color:
        COLORS.brownSoft,
    },

    imageCard: {
      borderRadius:
        RADIUS.xl,

      overflow:
        'hidden',

      backgroundColor:
        COLORS.cream,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    imagePreview: {
      width: '100%',

      height: 240,

      backgroundColor:
        COLORS.beige,
    },

    imageActions: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      padding: 12,

      gap: 10,
    },

    imageButton: {
      flex: 1,

      minHeight: 44,

      borderRadius: 22,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.sage,

      backgroundColor:
        COLORS.warmWhite,
    },

    imageButtonText: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 13,

      color:
        COLORS.forest,
    },

    removeButton: {
      minHeight: 44,

      paddingHorizontal:
        18,

      borderRadius: 22,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    removeButtonText: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 13,

      color:
        COLORS.rust ||
        '#A63D2F',
    },

    cancelButton: {
      minHeight: 48,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 8,
    },

    cancelText: {
      fontFamily:
        FONTS.bodyBold,

      fontSize: 14,

      color:
        COLORS.brownSoft,
    },
  });