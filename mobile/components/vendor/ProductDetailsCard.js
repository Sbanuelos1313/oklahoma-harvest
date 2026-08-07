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

export default function ProductDetailsCard({
  values,
  onChange,
}) {
  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        Product Details
      </Text>

      <Text style={styles.subtitle}>
        Help customers understand exactly what they're purchasing.
      </Text>

      <FormField
        label="Ingredients"
        multiline
        numberOfLines={3}
        value={values.ingredients}
        placeholder="Organic tomatoes, basil, garlic..."
        onChangeText={(v)=>onChange("ingredients",v)}
      />

      <FormField
        label="Allergens"
        multiline
        numberOfLines={2}
        value={values.allergens}
        placeholder="Tree Nuts, Milk, Wheat..."
        onChangeText={(v)=>onChange("allergens",v)}
      />

      <FormField
        label="Storage Instructions"
        multiline
        numberOfLines={2}
        value={values.storage}
        placeholder="Keep Refrigerated"
        onChangeText={(v)=>onChange("storage",v)}
      />

      <FormField
        label="Harvest Date"
        value={values.harvestDate}
        placeholder="MM/DD/YYYY"
        onChangeText={(v)=>onChange("harvestDate",v)}
      />

      <FormField
        label="Best By Date"
        value={values.bestBy}
        placeholder="MM/DD/YYYY"
        onChangeText={(v)=>onChange("bestBy",v)}
      />

      <FormField
        label="Expiration Date"
        value={values.expiration}
        placeholder="MM/DD/YYYY"
        onChangeText={(v)=>onChange("expiration",v)}
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.heading}>Organic</Text>
          <Text style={styles.description}>
            Certified organic product.
          </Text>
        </View>

        <Switch
          value={values.organic}
          onValueChange={(v)=>onChange("organic",v)}
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.heading}>Non-GMO</Text>
          <Text style={styles.description}>
            Produced without GMO ingredients.
          </Text>
        </View>

        <Switch
          value={values.nonGmo}
          onValueChange={(v)=>onChange("nonGmo",v)}
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.heading}>Refrigerated</Text>
          <Text style={styles.description}>
            Must remain refrigerated.
          </Text>
        </View>

        <Switch
          value={values.refrigerated}
          onValueChange={(v)=>onChange("refrigerated",v)}
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.heading}>Frozen</Text>
          <Text style={styles.description}>
            Ships or stores frozen.
          </Text>
        </View>

        <Switch
          value={values.frozen}
          onValueChange={(v)=>onChange("frozen",v)}
          trackColor={{
            false: COLORS.border,
            true: COLORS.forest,
          }}
        />
      </View>

      <FormField
        label="Additional Notes"
        multiline
        numberOfLines={4}
        value={values.notes}
        placeholder="Anything customers should know..."
        onChangeText={(v)=>onChange("notes",v)}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  card:{
    backgroundColor:COLORS.warmWhite,
    borderRadius:RADIUS.xl,
    padding:20,
    ...SHADOWS.soft,
  },

  title:{
    fontFamily:FONTS.display,
    fontSize:28,
    color:COLORS.forestDark,
  },

  subtitle:{
    marginTop:6,
    marginBottom:22,
    fontFamily:FONTS.body,
    color:COLORS.brownSoft,
  },

  switchRow:{
    marginTop:22,
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
  },

  switchText:{
    flex:1,
    marginRight:16,
  },

  heading:{
    fontFamily:FONTS.bodyBold,
    fontSize:16,
    color:COLORS.forestDark,
  },

  description:{
    marginTop:4,
    fontFamily:FONTS.body,
    color:COLORS.brownSoft,
    lineHeight:20,
  },

});