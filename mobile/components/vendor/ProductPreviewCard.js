import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";

export default function ProductPreviewCard({
  values,
}) {

  const cover =
    values.images?.length
      ? values.images[0]
      : null;

  return (

    <ScrollView
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.card}>

        <Text style={styles.title}>
          Preview Listing
        </Text>

        <Text style={styles.subtitle}>
          This is how customers will see your product.
        </Text>

        <View style={styles.previewCard}>

          {cover ? (

            <Image
              source={{ uri: cover }}
              style={styles.cover}
            />

          ) : (

            <View style={styles.placeholder}>

              <Text style={styles.placeholderText}>
                No Cover Image
              </Text>

            </View>

          )}

          <View style={styles.content}>

            <Text style={styles.productName}>
              {values.name || "Product Name"}
            </Text>

            <Text style={styles.category}>
              {values.category || "Category"}
            </Text>

            <Text style={styles.price}>
              $
              {values.price || "0.00"}

              {" / "}

              {values.unit || "each"}
            </Text>

            <Text style={styles.description}>
              {values.description ||
                "Your product description will appear here."}
            </Text>

            <View style={styles.badges}>

              {values.featured && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Featured
                  </Text>
                </View>
              )}

              {values.seasonal && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Seasonal
                  </Text>
                </View>
              )}

              {values.organic && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Organic
                  </Text>
                </View>
              )}

              {values.nonGmo && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Non-GMO
                  </Text>
                </View>
              )}

            </View>

            <View style={styles.section}>

              <Text style={styles.heading}>
                Fulfillment
              </Text>

              {values.pickup && (
                <Text style={styles.row}>
                  ✔ Pickup Available
                </Text>
              )}

              {values.delivery && (
                <Text style={styles.row}>
                  ✔ Local Delivery
                </Text>
              )}

              {values.shipping && (
                <Text style={styles.row}>
                  ✔ Shipping Available
                </Text>
              )}

            </View>

            {values.ingredients ? (

              <View style={styles.section}>

                <Text style={styles.heading}>
                  Ingredients
                </Text>

                <Text style={styles.text}>
                  {values.ingredients}
                </Text>

              </View>

            ) : null}

            {values.allergens ? (

              <View style={styles.section}>

                <Text style={styles.heading}>
                  Allergens
                </Text>

                <Text style={styles.text}>
                  {values.allergens}
                </Text>

              </View>

            ) : null}

          </View>

        </View>

      </View>

    </ScrollView>

  );

}

const styles = StyleSheet.create({

card:{
padding:20,
backgroundColor:COLORS.warmWhite,
borderRadius:RADIUS.xl,
...SHADOWS.soft,
},

title:{
fontFamily:FONTS.display,
fontSize:30,
color:COLORS.forestDark,
},

subtitle:{
marginTop:6,
marginBottom:24,
fontFamily:FONTS.body,
color:COLORS.brownSoft,
},

previewCard:{
overflow:"hidden",
borderRadius:20,
backgroundColor:COLORS.cream,
},

cover:{
width:"100%",
height:240,
},

placeholder:{
height:240,
alignItems:"center",
justifyContent:"center",
backgroundColor:COLORS.border,
},

placeholderText:{
fontFamily:FONTS.bodyBold,
fontSize:18,
color:COLORS.brownSoft,
},

content:{
padding:20,
},

productName:{
fontFamily:FONTS.display,
fontSize:30,
color:COLORS.forestDark,
},

category:{
marginTop:6,
fontFamily:FONTS.bodyBold,
fontSize:14,
color:COLORS.sage,
textTransform:"uppercase",
},

price:{
marginTop:14,
fontFamily:FONTS.bodyBold,
fontSize:26,
color:COLORS.forest,
},

description:{
marginTop:16,
fontFamily:FONTS.body,
lineHeight:24,
color:COLORS.brownSoft,
},

badges:{
marginTop:18,
flexDirection:"row",
flexWrap:"wrap",
},

badge:{
marginRight:10,
marginBottom:10,
paddingHorizontal:14,
paddingVertical:8,
borderRadius:30,
backgroundColor:COLORS.forest,
},

badgeText:{
fontFamily:FONTS.bodyBold,
fontSize:12,
color:"#fff",
},

section:{
marginTop:24,
},

heading:{
marginBottom:10,
fontFamily:FONTS.bodyBold,
fontSize:16,
color:COLORS.forestDark,
},

row:{
marginBottom:6,
fontFamily:FONTS.body,
color:COLORS.brownSoft,
},

text:{
fontFamily:FONTS.body,
lineHeight:22,
color:COLORS.brownSoft,
},

});