import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Switch,
} from "react-native";

import FormField from "../FormField";

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";

export default function FulfillmentCard({
  values,
  onChange,
}) {
  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        Fulfillment
      </Text>

      <Text style={styles.subtitle}>
        Choose how customers can receive this product.
      </Text>

      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.heading}>
            Pickup Available
          </Text>

          <Text style={styles.description}>
            Customers pick up at your location.
          </Text>
        </View>

        <Switch
          value={values.pickup}
          onValueChange={(v) =>
            onChange("pickup", v)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.heading}>
            Local Delivery
          </Text>

          <Text style={styles.description}>
            Deliver directly to nearby customers.
          </Text>
        </View>

        <Switch
          value={values.delivery}
          onValueChange={(v) =>
            onChange("delivery", v)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      {values.delivery && (
        <>
          <FormField
            label="Delivery Radius (Miles)"
            keyboardType="numeric"
            value={values.deliveryRadius}
            placeholder="10"
            onChangeText={(v) =>
              onChange("deliveryRadius", v)
            }
          />

          <FormField
            label="Delivery Fee"
            keyboardType="decimal-pad"
            value={values.deliveryFee}
            placeholder="5.00"
            onChangeText={(v) =>
              onChange("deliveryFee", v)
            }
          />
        </>
      )}

      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.heading}>
            Shipping
          </Text>

          <Text style={styles.description}>
            Ship anywhere you choose.
          </Text>
        </View>

        <Switch
          value={values.shipping}
          onValueChange={(v) =>
            onChange("shipping", v)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      {values.shipping && (
        <>
          <FormField
            label="Shipping Cost"
            keyboardType="decimal-pad"
            value={values.shippingCost}
            placeholder="8.95"
            onChangeText={(v) =>
              onChange("shippingCost", v)
            }
          />

          <FormField
            label="Estimated Shipping Time"
            value={values.shippingTime}
            placeholder="2-5 Business Days"
            onChangeText={(v) =>
              onChange("shippingTime", v)
            }
          />
        </>
      )}

      <FormField
        label="Pickup Instructions"
        multiline
        numberOfLines={4}
        value={values.pickupInstructions}
        placeholder="Example: Park behind the red barn and ring the bell."
        onChangeText={(v) =>
          onChange(
            "pickupInstructions",
            v
          )
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...SHADOWS.soft,
  },

  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.forestDark,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  text: {
    flex: 1,
    paddingRight: 18,
  },

  heading: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.forestDark,
  },

  description: {
    marginTop: 4,
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
    lineHeight: 20,
  },

});