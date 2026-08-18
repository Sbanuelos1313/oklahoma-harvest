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
  Switch,
  ActivityIndicator,
} from 'react-native';

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
  CATEGORY_ASSETS,
} from '../../constants/assets';
export default function VendorEditProductScreen({
  API,
  token,
  route,
  navigation,
}) {
  const { product } = route.params || {};

  const [name, setName] = useState(product?.name || '');

  const [description, setDescription] =
    useState(product?.description || '');

  const [category, setCategory] =
    useState(product?.category || 'other');

  const [price, setPrice] =
    useState(String(product?.price || ''));

  const [unit, setUnit] =
    useState(product?.unit || 'each');

  const [quantity, setQuantity] =
    useState(
      String(
        product?.quantity_available ?? ''
      )
    );

  const [imageUri, setImageUri] =
    useState('');

  const [currentImageUrl, setCurrentImageUrl] =
    useState(product?.image_url || '');

  const [isActive, setIsActive] =
    useState(product?.is_active ?? true);

  const [loading, setLoading] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  function inventoryStatus() {
    const qty = Number(quantity || 0);

    if (qty <= 0) {
      return {
        color: '#D64545',
        label: 'Out of Stock',
      };
    }

    if (qty <= 5) {
      return {
        color: '#E69500',
        label: 'Low Stock',
      };
    }

    return {
      color: '#2E8B57',
      label: 'Healthy Stock',
    };
  }

  async function chooseImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access required',
          'Please allow access to your photos.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
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
    } catch (err) {
      console.error(err);

      Alert.alert(
        'Unable to select image'
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
        `product-${Date.now()}.jpg`;

      const extension =
        fileName
          .split('.')
          .pop()
          ?.toLowerCase();

      let mime = 'image/jpeg';

      if (extension === 'png') {
        mime = 'image/png';
      }

      if (
        extension === 'heic' ||
        extension === 'heif'
      ) {
        mime = 'image/heic';
      }

      const formData =
        new FormData();

      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: mime,
      });

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
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Image upload failed.'
        );
      }

      return data.url;
    } finally {
      setUploadingImage(false);
    }
  }

    async function save() {
    if (!product?.id) {
      Alert.alert(
        'Error',
        'Unable to locate this product.'
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        'Missing Product Name',
        'Please enter a product name.'
      );
      return;
    }

    if (!price || Number(price) <= 0) {
      Alert.alert(
        'Invalid Price',
        'Please enter a valid price.'
      );
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    setLoading(true);

    try {
      let imageUrl = currentImageUrl;

      if (imageUri) {
        imageUrl = await uploadImage();
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        unit,
        quantity_available: Number(quantity || 0),
        image_url: imageUrl,
        is_active: isActive,
      };

      console.log(
        'UPDATE PRODUCT',
        payload
      );

      const response = await fetch(
        `${API}/api/products/${product.id}`,
        {
          method: 'PATCH',

          headers: {
            Accept: 'application/json',
            Authorization:
              `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(payload),

          signal: controller.signal,
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      console.log(
        'UPDATE RESPONSE',
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to update product.'
        );
      }

      Alert.alert(
        'Product Updated',
        'Your changes have been saved.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error(err);

      if (
        err.name === 'AbortError'
      ) {
        Alert.alert(
          'Request Timed Out',
          'The server took too long to respond.'
        );
      } else {
        Alert.alert(
          'Update Failed',
          err.message ||
            'Please try again.'
        );
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  function deleteProduct() {
    Alert.alert(
      'Delete Product',
      `Delete "${name}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              setLoading(true);

              const response =
                await fetch(
                  `${API}/api/products/${product.id}`,
                  {
                    method: 'DELETE',

                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                    },
                  }
                );

              const data =
                await response
                  .json()
                  .catch(() => null);

              if (!response.ok) {
                throw new Error(
                  data?.detail ||
                    'Unable to delete product.'
                );
              }

              Alert.alert(
                'Deleted',
                'The product has been removed.',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      navigation.goBack(),
                  },
                ]
              );
            } catch (err) {
              Alert.alert(
                'Delete Failed',
                err.message
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  function toggleVisibility() {
    setIsActive(!isActive);
  }

  const stockStatus =
    inventoryStatus();

    const displayImage = imageUri
    ? { uri: imageUri }
    : currentImageUrl
    ? { uri: currentImageUrl }
    : null;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cream}
      />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>
                Inventory
              </Text>

              <Text style={styles.title}>
                Edit product
              </Text>

              <Text style={styles.subtitle}>
                Update your product details, pricing,
                inventory, photo, and visibility.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.closeButton}
              disabled={loading || uploadingImage}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="close"
                size={24}
                color={COLORS.forestDark}
              />
            </TouchableOpacity>
          </View>

          {/* PRODUCT PHOTO */}
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>
              Product photo
            </Text>

            <Text style={styles.sectionTitle}>
              Listing image
            </Text>

            <Text style={styles.sectionDescription}>
              This is the image customers will see while
              browsing your product.
            </Text>

            {displayImage ? (
              <View style={styles.imageCard}>
                <Image
                  source={displayImage}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />

                <View style={styles.imageActions}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.imageActionButton}
                    disabled={
                      loading ||
                      uploadingImage
                    }
                    onPress={chooseImage}
                  >
                    <Ionicons
                      name="images-outline"
                      size={18}
                      color={COLORS.forest}
                    />

                    <Text
                      style={
                        styles.imageActionButtonText
                      }
                    >
                      Replace Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.removeImageButton}
                    disabled={
                      loading ||
                      uploadingImage
                    }
                    onPress={removeImage}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.rust}
                    />

                    <Text
                      style={
                        styles.removeImageButtonText
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
                style={styles.addImageButton}
                disabled={
                  loading ||
                  uploadingImage
                }
                onPress={chooseImage}
              >
                <View style={styles.addImageIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={COLORS.forest}
                  />
                </View>

                <Text style={styles.addImageTitle}>
                  Add Product Photo
                </Text>

                <Text
                  style={
                    styles.addImageDescription
                  }
                >
                  Choose an image from your photo library.
                </Text>
              </TouchableOpacity>
            )}

            {uploadingImage ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.forest}
                />

                <Text style={styles.uploadingText}>
                  Uploading your new photo...
                </Text>
              </View>
            ) : null}
          </View>

          {/* PRODUCT INFORMATION */}
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>
              Product information
            </Text>

            <Text style={styles.sectionTitle}>
              Details
            </Text>

            <Text style={styles.sectionDescription}>
              Keep your listing accurate so customers know
              exactly what they are purchasing.
            </Text>

            <FormField
              label="Product name"
              value={name}
              onChangeText={setName}
              placeholder="Product name"
            />

            <FormField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the item, ingredients, materials, or story."
              multiline
            />

            <Text style={styles.label}>
              Category
            </Text>

            <View style={styles.pills}>
              {CATEGORY_ASSETS
                .filter((item) => item.key)
                .map((item) => (
                  <FilterPill
                    key={item.key}
                    label={item.label}
                    active={
                      category === item.key
                    }
                    onPress={() =>
                      setCategory(item.key)
                    }
                  />
                ))}
            </View>
          </View>

          {/* PRICING + INVENTORY */}
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>
              Pricing & inventory
            </Text>

            <Text style={styles.sectionTitle}>
              Availability
            </Text>

            <Text style={styles.sectionDescription}>
              Update your price, selling unit, and current
              inventory.
            </Text>

            <FormField
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <FormField
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              placeholder="each, lb, jar, bunch..."
            />

            <FormField
              label="Quantity available"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
            />

            <View style={styles.stockCard}>
              <View
                style={[
                  styles.stockIconWrap,
                  {
                    backgroundColor:
                      `${stockStatus.color}18`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    Number(quantity || 0) <= 0
                      ? 'alert-circle-outline'
                      : Number(quantity || 0) <= 5
                      ? 'warning-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={25}
                  color={stockStatus.color}
                />
              </View>

              <View style={styles.stockCopy}>
                <Text style={styles.stockLabel}>
                  Inventory status
                </Text>

                <Text
                  style={[
                    styles.stockStatus,
                    {
                      color:
                        stockStatus.color,
                    },
                  ]}
                >
                  {stockStatus.label}
                </Text>
              </View>

              <View style={styles.stockQuantity}>
                <Text
                  style={
                    styles.stockQuantityValue
                  }
                >
                  {Number(quantity || 0)}
                </Text>

                <Text
                  style={
                    styles.stockQuantityLabel
                  }
                >
                  available
                </Text>
              </View>
            </View>
          </View>

          {/* VISIBILITY */}
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>
              Visibility
            </Text>

            <Text style={styles.sectionTitle}>
              Customer availability
            </Text>

            <View style={styles.visibilityCard}>
              <View style={styles.visibilityIcon}>
                <Ionicons
                  name={
                    isActive
                      ? 'eye-outline'
                      : 'eye-off-outline'
                  }
                  size={24}
                  color={
                    isActive
                      ? COLORS.forest
                      : COLORS.brownSoft
                  }
                />
              </View>

              <View style={styles.visibilityCopy}>
                <Text
                  style={styles.visibilityTitle}
                >
                  {isActive
                    ? 'Visible to Customers'
                    : 'Hidden from Customers'}
                </Text>

                <Text
                  style={
                    styles.visibilityDescription
                  }
                >
                  {isActive
                    ? 'Customers can discover and purchase this product.'
                    : 'This product will stay in your inventory but will not appear to shoppers.'}
                </Text>
              </View>

              <Switch
                value={isActive}
                onValueChange={toggleVisibility}
                disabled={
                  loading ||
                  uploadingImage
                }
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.sage,
                }}
                thumbColor={
                  isActive
                    ? COLORS.forest
                    : COLORS.warmWhite
                }
              />
            </View>
          </View>

          {/* PREVIEW */}
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>
              Preview
            </Text>

            <Text style={styles.sectionTitle}>
              Customer view
            </Text>

            <View style={styles.previewCard}>
              {displayImage ? (
                <Image
                  source={displayImage}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={
                    styles.previewImagePlaceholder
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={38}
                    color={COLORS.sage}
                  />
                </View>
              )}

              <View style={styles.previewBody}>
                <Text
                  numberOfLines={2}
                  style={styles.previewName}
                >
                  {name.trim() ||
                    'Product name'}
                </Text>

                <Text
                  style={
                    styles.previewCategory
                  }
                >
                  {CATEGORY_ASSETS.find(
                    (item) =>
                      item.key === category
                  )?.label ||
                    category ||
                    'Category'}
                </Text>

                <View style={styles.previewBottom}>
                  <Text
                    style={styles.previewPrice}
                  >
                    $
                    {Number(
                      price || 0
                    ).toFixed(2)}
                  </Text>

                  <Text
                    style={styles.previewUnit}
                  >
                    / {unit || 'each'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionsCard}>
            <AppButton
              title={
                uploadingImage
                  ? 'Uploading Photo...'
                  : loading
                  ? 'Saving Changes...'
                  : 'Save Changes'
              }
              loading={
                loading ||
                uploadingImage
              }
              disabled={
                loading ||
                uploadingImage
              }
              onPress={save}
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
              style={styles.cancelButton}
            />

            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.deleteButton}
              disabled={
                loading ||
                uploadingImage
              }
              onPress={deleteProduct}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={COLORS.rust}
              />

              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Delete Product
              </Text>
            </TouchableOpacity>

            <Text style={styles.deleteNote}>
              Deleting a product permanently removes it
              from your inventory and storefront.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  safe: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginBottom: 16,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 14,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color: COLORS.forestDark,
  },

  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.brownSoft,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  sectionEyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  sectionTitle: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 31,
    color: COLORS.forestDark,
  },

  sectionDescription: {
    marginTop: 6,
    marginBottom: 16,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.brownSoft,
  },

  label: {
    marginTop: 16,
    marginBottom: 9,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },

  imageCard: {
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },

  imagePreview: {
    width: '100%',
    height: 245,
    backgroundColor: COLORS.beige,
  },

  imageActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },

  imageActionButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.warmWhite,
  },

  imageActionButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forest,
  },

  removeImageButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.warmWhite,
  },

  removeImageButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.rust,
  },

  addImageButton: {
    minHeight: 165,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: COLORS.cream,
  },

  addImageIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  addImageTitle: {
    marginTop: 12,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.forestDark,
  },

  addImageDescription: {
    marginTop: 5,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },

  uploadingRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  uploadingText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.brownSoft,
  },

  stockCard: {
    marginTop: 16,
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  stockIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stockCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },

  stockLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.brownSoft,
  },

  stockStatus: {
    marginTop: 3,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },

  stockQuantity: {
    minWidth: 62,
    alignItems: 'flex-end',
  },

  stockQuantityValue: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.forestDark,
  },

  stockQuantityLabel: {
    marginTop: 1,
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.brownSoft,
  },

  visibilityCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  visibilityIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
  },

  visibilityCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },

  visibilityTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forestDark,
  },

  visibilityDescription: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.brownSoft,
  },

  previewCard: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },

  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.beige,
  },

  previewImagePlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.beige,
  },

  previewBody: {
    padding: 15,
  },

  previewName: {
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 29,
    color: COLORS.forestDark,
  },

  previewCategory: {
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
    color: COLORS.sage,
  },

  previewBottom: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  previewPrice: {
    fontFamily: FONTS.display,
    fontSize: 27,
    color: COLORS.forest,
  },

  previewUnit: {
    marginLeft: 4,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.brownSoft,
  },

  actionsCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.soft,
  },

  cancelButton: {
    marginTop: 10,
  },

  deleteButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(166,61,47,0.30)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(166,61,47,0.06)',
  },

  deleteButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.rust,
  },

  deleteNote: {
    marginTop: 8,
    paddingHorizontal: 10,
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    color: COLORS.brownSoft,
  },
});