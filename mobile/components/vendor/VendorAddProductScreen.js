import React, { useState } from 'react';

import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS,
  FONTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

import ProductBasicsCard from '../../components/vendor/ProductBasicsCard';
import PricingInventoryCard from '../../components/vendor/PricingInventoryCard';
import ProductImagesCard from '../../components/vendor/ProductImagesCard';
import FulfillmentCard from '../../components/vendor/FulfillmentCard';
import ProductDetailsCard from '../../components/vendor/ProductDetailsCard';
import ComplianceCard from '../../components/vendor/ComplianceCard';
import ProductPreviewCard from '../../components/vendor/ProductPreviewCard';

import useVendorProduct from '../../hooks/useVendorProduct';
import { pickImage } from '../../services/uploadService';

const STEPS = [
  'Basics',
  'Pricing',
  'Images',
  'Fulfillment',
  'Details',
  'Compliance',
  'Preview',
];

export default function VendorAddProductScreen({
  API,
  token,
  navigation,
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const {
    product,
    update,
    reset,
  } = useVendorProduct();

  async function addImage(index) {
    try {
      const asset = await pickImage();

      if (!asset?.uri) {
        return;
      }

      const nextImages = [...(product.images || [])];

      nextImages[index] = asset.uri;

      update('images', nextImages);
    } catch (error) {
      Alert.alert(
        'Unable to select image',
        error?.message || 'Please try again.'
      );
    }
  }

  function removeImage(index) {
    const nextImages = [...(product.images || [])];

    nextImages.splice(index, 1);

    update('images', nextImages);
  }

  function validateBasics() {
    if (!product.name?.trim()) {
      Alert.alert(
        'Product name required',
        'Enter a name for this product.'
      );

      setStep(0);

      return false;
    }

    if (!product.category) {
      Alert.alert(
        'Category required',
        'Choose the category that best fits this product.'
      );

      setStep(0);

      return false;
    }

    return true;
  }

  function validatePricing() {
    const numericPrice = Number(product.price);
    const numericQuantity = Number(product.quantity);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        'Valid price required',
        'Enter a price greater than zero.'
      );

      setStep(1);

      return false;
    }

    if (
      product.quantity !== '' &&
      (
        !Number.isFinite(numericQuantity) ||
        numericQuantity < 0
      )
    ) {
      Alert.alert(
        'Valid quantity required',
        'Quantity cannot be negative.'
      );

      setStep(1);

      return false;
    }

    return true;
  }

  function validateFulfillment() {
    if (
      !product.pickup &&
      !product.delivery &&
      !product.shipping
    ) {
      Alert.alert(
        'Fulfillment required',
        'Select pickup, delivery, or shipping.'
      );

      setStep(3);

      return false;
    }

    return true;
  }

  function validateCompliance() {
    if (
      !product.certifyAccurate ||
      !product.noMedicalClaims ||
      !product.acceptMarketplaceRules
    ) {
      Alert.alert(
        'Acknowledgments required',
        'Complete all required marketplace acknowledgments before publishing.'
      );

      setStep(5);

      return false;
    }

    return true;
  }

  function validateForPublish() {
    return (
      validateBasics() &&
      validatePricing() &&
      validateFulfillment() &&
      validateCompliance()
    );
  }

function buildApiPayload({ publish }) {
  return {
    name: product.name.trim(),

    description:
      product.description?.trim() ||
      product.shortDescription?.trim() ||
      '',

    category: product.category,

    price: Number(product.price),

    unit:
      product.unit?.trim() ||
      'each',

    quantity_available:
      Number(product.quantity || 0),

    is_active:
      publish
        ? Boolean(product.active)
        : false,
  };
}
  async function submitProduct({
    publish,
  }) {
    if (saving) {
      return;
    }

    if (
      publish &&
      !validateForPublish()
    ) {
      return;
    }

    if (
      !publish &&
      !validateBasics()
    ) {
      return;
    }

setSaving(true);

const controller = new AbortController();

const timeoutId = setTimeout(() => {
  controller.abort();
}, 15000);

try {
  console.log(
    'Submitting product:',
    buildApiPayload({ publish })
  );

  const response = await fetch(
    `${API}/api/products`,
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(
        buildApiPayload({ publish })
      ),

      signal: controller.signal,
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  console.log(
    'Product response:',
    response.status,
    data
  );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `Unable to save product (${response.status}).`
    );
  }

  Alert.alert(
    publish
      ? 'Product published'
      : 'Draft saved',

    publish
      ? 'Your product was added to your storefront.'
      : 'Your product was saved as a hidden draft.',

    [
      {
        text: 'Done',

        onPress: () => {
          reset();
          navigation.goBack();
        },
      },
    ]
  );
} catch (error) {
  const message =
    error?.name === 'AbortError'
      ? 'The product request timed out. Confirm that your backend is running and try again.'
      : error?.message || 'Please try again.';

  Alert.alert(
    publish
      ? 'Unable to publish product'
      : 'Unable to save draft',

    message
  );
} finally {
  clearTimeout(timeoutId);
  setSaving(false);
}
} // closes submitProduct

function next() {
    if (
      step === 0 &&
      !validateBasics()
    ) {
      return;
    }

    if (
      step === 1 &&
      !validatePricing()
    ) {
      return;
    }

    if (
      step === 3 &&
      !validateFulfillment()
    ) {
      return;
    }

    if (
      step <
      STEPS.length - 1
    ) {
      setStep(
        (current) =>
          current + 1
      );
    }
  }

  function previous() {
    if (step > 0) {
      setStep(
        (current) =>
          current - 1
      );
    }
  }

  function renderCurrentStep() {
    switch (step) {
      case 0:
        return (
          <ProductBasicsCard
            values={product}
            onChange={update}
          />
        );

      case 1:
        return (
          <PricingInventoryCard
            values={product}
            onChange={update}
          />
        );

      case 2:
        return (
          <ProductImagesCard
            values={product}
            onAddImage={addImage}
            onRemoveImage={removeImage}
          />
        );

      case 3:
        return (
          <FulfillmentCard
            values={product}
            onChange={update}
          />
        );

      case 4:
        return (
          <ProductDetailsCard
            values={product}
            onChange={update}
          />
        );

      case 5:
        return (
          <ComplianceCard
            values={product}
            onChange={update}
          />
        );

      default:
        return (
          <ProductPreviewCard
            values={product}
          />
        );
    }
  }
    return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cream}
      />

      <SafeAreaView
        edges={["top", "left", "right"]}
        style={styles.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>

            <View style={styles.headerCopy}>

              <Text style={styles.eyebrow}>
                Inventory
              </Text>

              <Text style={styles.title}>
                Add Product
              </Text>

              <Text style={styles.subtitle}>
                Build a complete marketplace listing for your store.
              </Text>

            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.steps}
          >

            {STEPS.map((label, index) => {

              const active = index === step;
              const complete = index < step;

              return (

                <TouchableOpacity
                  key={label}
                  activeOpacity={0.85}
                  onPress={() => setStep(index)}
                  style={[
                    styles.step,
                    active && styles.stepActive,
                    complete && styles.stepComplete,
                  ]}
                >

                  <Text
                    style={[
                      styles.stepNumber,
                      (active || complete) &&
                        styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>

                  <Text
                    style={[
                      styles.stepText,
                      (active || complete) &&
                        styles.stepTextActive,
                    ]}
                  >
                    {label}
                  </Text>

                </TouchableOpacity>

              );

            })}

          </ScrollView>

          <View style={styles.body}>
            {renderCurrentStep()}
          </View>

          <View style={styles.footer}>

            <View style={styles.footerTopRow}>

              {step > 0 ? (

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={previous}
                >
                  <Text style={styles.secondaryText}>
                    Previous
                  </Text>
                </TouchableOpacity>

              ) : (
                <View />
              )}

              <TouchableOpacity
                style={styles.draftButton}
                onPress={() =>
                  submitProduct({
                    publish: false,
                  })
                }
              >
                <Text style={styles.draftText}>
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </Text>
              </TouchableOpacity>

            </View>

            {step === STEPS.length - 1 ? (

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saving &&
                    styles.buttonDisabled,
                ]}
                onPress={() =>
                  submitProduct({
                    publish: true,
                  })
                }
              >
                <Text style={styles.primaryText}>
                  {saving
                    ? "Publishing..."
                    : "Publish Product"}
                </Text>
              </TouchableOpacity>

            ) : (

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={next}
              >
                <Text style={styles.primaryText}>
                  Continue to {STEPS[step + 1]}
                </Text>
              </TouchableOpacity>

            )}

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

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
    paddingRight: 18,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: COLORS.sage,
  },

  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 34,
    color: COLORS.forestDark,
  },

  subtitle: {
    marginTop: 6,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.brownSoft,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.warmWhite,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  closeText: {
    fontSize: 28,
    color: COLORS.forestDark,
    fontFamily: FONTS.bodyBold,
    lineHeight: 30,
  },

  steps: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 20,
    alignItems: "center",
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepActive: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },

  stepComplete: {
    backgroundColor: "#EAF5EA",
    borderColor: COLORS.sage,
  },

  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forestDark,
    backgroundColor: COLORS.cream,
  },

  stepNumberActive: {
    backgroundColor: COLORS.white,
    color: COLORS.forestDark,
  },

  stepText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forestDark,
  },

  stepTextActive: {
    color: COLORS.white,
  },

  body: {
    paddingHorizontal: LAYOUT.screenPadding,
  },

  footer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 24,
    paddingBottom: 30,
  },

  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  secondaryButton: {
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryText: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forestDark,
    fontSize: 14,
  },

  draftButton: {
    paddingHorizontal: 18,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },

  draftText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.sage,
  },

  primaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.forest,
    ...SHADOWS.medium,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.white,
  },

});