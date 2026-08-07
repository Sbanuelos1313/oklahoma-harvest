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

export default function ComplianceCard({
  values,
  onChange,
}) {
  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        Marketplace Compliance
      </Text>

      <Text style={styles.subtitle}>
        Help keep customers safe and maintain marketplace quality.
      </Text>

      <View style={styles.notice}>

        <Text style={styles.noticeTitle}>
          Seller Certification
        </Text>

        <Text style={styles.noticeBody}>
          By publishing this product you certify that all
          information is accurate and complies with
          applicable federal, state and local regulations.
        </Text>

      </View>

      <View style={styles.row}>

        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            Product Information is Accurate
          </Text>

          <Text style={styles.description}>
            Descriptions and images accurately represent this product.
          </Text>
        </View>

        <Switch
          value={values.certifyAccurate}
          onValueChange={(v)=>
            onChange("certifyAccurate",v)
          }
          trackColor={{
            false:COLORS.border,
            true:COLORS.forest,
          }}
        />

      </View>

      <View style={styles.row}>

        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            No Prohibited Claims
          </Text>

          <Text style={styles.description}>
            I will not make unsupported medical,
            health or legal claims.
          </Text>
        </View>

        <Switch
          value={values.noMedicalClaims}
          onValueChange={(v)=>
            onChange("noMedicalClaims",v)
          }
          trackColor={{
            false:COLORS.border,
            true:COLORS.forest,
          }}
        />

      </View>

      <View style={styles.row}>

        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            Marketplace Policies
          </Text>

          <Text style={styles.description}>
            I agree to follow From Our Place
            marketplace policies.
          </Text>
        </View>

        <Switch
          value={values.acceptMarketplaceRules}
          onValueChange={(v)=>
            onChange("acceptMarketplaceRules",v)
          }
          trackColor={{
            false:COLORS.border,
            true:COLORS.forest,
          }}
        />

      </View>

      <FormField
        label="Business License (Optional)"
        placeholder="License Number"
        value={values.businessLicense}
        onChangeText={(v)=>
          onChange("businessLicense",v)
        }
      />

      <FormField
        label="Permit Number (Optional)"
        placeholder="Food Permit"
        value={values.foodPermit}
        onChangeText={(v)=>
          onChange("foodPermit",v)
        }
      />

      <FormField
        label="Additional Certifications"
        multiline
        numberOfLines={4}
        placeholder="Organic, USDA, Cottage Food, etc."
        value={values.certifications}
        onChangeText={(v)=>
          onChange("certifications",v)
        }
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
marginBottom:20,
fontFamily:FONTS.body,
color:COLORS.brownSoft,
},

notice:{
backgroundColor:"#FFF8E8",
padding:18,
borderRadius:16,
marginBottom:24,
},

noticeTitle:{
fontFamily:FONTS.bodyBold,
fontSize:16,
color:COLORS.forestDark,
marginBottom:8,
},

noticeBody:{
fontFamily:FONTS.body,
lineHeight:22,
color:COLORS.brownSoft,
},

row:{
marginBottom:22,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
},

textBlock:{
flex:1,
paddingRight:16,
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