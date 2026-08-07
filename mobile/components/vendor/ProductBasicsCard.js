import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

import FormField from "../FormField";
import FilterPill from "../FilterPill";

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";

import {
  CATEGORY_ASSETS,
} from "../../constants/assets";

export default function ProductBasicsCard({
  values,
  onChange,
}) {

  console.log(
    "Vendor Categories:",
    CATEGORY_ASSETS.length,
    CATEGORY_ASSETS
  );

  return (

    <View style={styles.card}>

      <Text style={styles.title}>
        Product Information
      </Text>

      <Text style={styles.subtitle}>
        Tell customers about your product.
      </Text>

      <FormField
        label="Product Name"
        placeholder="Fresh Tomatoes"
        value={values.name}
        onChangeText={(text) =>
          onChange("name", text)
        }
      />

      <FormField
        label="Short Description"
        placeholder="A short summary..."
        value={values.shortDescription}
        onChangeText={(text) =>
          onChange("shortDescription", text)
        }
      />

      <FormField
        label="Description"
        placeholder="Tell your story..."
        value={values.description}
        multiline
        numberOfLines={5}
        onChangeText={(text) =>
          onChange("description", text)
        }
      />

      <Text style={styles.section}>
        Category
      </Text>

      <ScrollView
        style={styles.categoryScroll}
        contentContainerStyle={styles.categories}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >

        {CATEGORY_ASSETS
          .filter(category => category.key)
          .map(category => (

            <FilterPill
              key={category.key}
              label={category.label}
              active={
                values.category === category.key
              }
              onPress={() =>
                onChange(
                  "category",
                  category.key
                )
              }
            />

          ))}

      </ScrollView>

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
    marginBottom: 20,
  },

  section: {
    marginTop: 20,
    marginBottom: 10,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.sage,
    textTransform: "uppercase",
  },

  categoryScroll: {
    maxHeight: 250,
  },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 10,
  },

});