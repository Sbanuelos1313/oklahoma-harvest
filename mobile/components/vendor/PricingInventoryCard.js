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

const UNIT_OPTIONS = [
  "each",
  "lb",
  "oz",
  "kg",
  "dozen",
  "bunch",
  "bundle",
  "jar",
  "bottle",
  "bag",
  "box",
  "basket",
  "gallon",
  "quart",
  "pint",
];

export default function PricingInventoryCard({
  values,
  onChange,
}) {
  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        Pricing & Inventory
      </Text>

      <Text style={styles.subtitle}>
        Manage pricing, inventory and product visibility.
      </Text>

      <FormField
        label="Price"
        keyboardType="decimal-pad"
        placeholder="0.00"
        value={values.price}
        onChangeText={(value) =>
          onChange("price", value)
        }
      />

      <FormField
        label="Unit"
        placeholder="each"
        value={values.unit}
        helperText={`Examples: ${UNIT_OPTIONS.join(", ")}`}
        onChangeText={(value) =>
          onChange("unit", value)
        }
      />

      <FormField
        label="Quantity Available"
        keyboardType="numeric"
        placeholder="0"
        value={values.quantity}
        onChangeText={(value) =>
          onChange("quantity", value)
        }
      />

      <FormField
        label="Low Stock Threshold"
        keyboardType="numeric"
        placeholder="5"
        value={values.lowStock}
        onChangeText={(value) =>
          onChange("lowStock", value)
        }
      />

      <FormField
        label="SKU"
        placeholder="Optional"
        value={values.sku}
        onChangeText={(value) =>
          onChange("sku", value)
        }
      />

      <FormField
        label="UPC / Barcode"
        placeholder="Optional"
        value={values.barcode}
        onChangeText={(value) =>
          onChange("barcode", value)
        }
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>
            Featured Product
          </Text>

          <Text style={styles.toggleSubtitle}>
            Highlight this product throughout the marketplace.
          </Text>
        </View>

        <Switch
          value={values.featured}
          onValueChange={(value) =>
            onChange("featured", value)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>
            Seasonal Product
          </Text>

          <Text style={styles.toggleSubtitle}>
            Mark this as available for a limited season.
          </Text>
        </View>

        <Switch
          value={values.seasonal}
          onValueChange={(value) =>
            onChange("seasonal", value)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>
            Active Listing
          </Text>

          <Text style={styles.toggleSubtitle}>
            Customers can purchase this item.
          </Text>
        </View>

        <Switch
          value={values.active}
          onValueChange={(value) =>
            onChange("active", value)
          }
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

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
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
    marginTop: 6,
    marginBottom: 22,
  },

  toggleRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  toggleText: {
    flex: 1,
    marginRight: 16,
  },

  toggleTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.forestDark,
  },

  toggleSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
    lineHeight: 20,
  },

});