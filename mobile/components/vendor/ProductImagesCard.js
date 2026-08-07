import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";

const SLOT_COUNT = 5;

export default function ProductImagesCard({
  values,
  onAddImage,
  onRemoveImage,
}) {
  const images = values.images || [];

  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        Product Images
      </Text>

      <Text style={styles.subtitle}>
        The first image becomes your product cover photo.
      </Text>

      <View style={styles.grid}>

        {Array.from({ length: SLOT_COUNT }).map((_, index) => {

          const image = images[index];

          return (
            <TouchableOpacity
              key={index}
              style={styles.slot}
              activeOpacity={0.85}
              onPress={() => onAddImage(index)}
            >

              {image ? (
                <>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                  />

                  <TouchableOpacity
                    style={styles.remove}
                    onPress={() =>
                      onRemoveImage(index)
                    }
                  >
                    <Text style={styles.removeText}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.plus}>
                    +
                  </Text>

                  <Text style={styles.placeholder}>
                    Add Image
                  </Text>
                </>
              )}

            </TouchableOpacity>
          );

        })}

      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>
          Image Tips
        </Text>

        <Text style={styles.tip}>
          • First image becomes the cover image.
        </Text>

        <Text style={styles.tip}>
          • Use bright natural lighting.
        </Text>

        <Text style={styles.tip}>
          • Square images look best.
        </Text>

        <Text style={styles.tip}>
          • Show multiple angles.
        </Text>

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
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  slot: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: COLORS.cream,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  plus: {
    fontSize: 42,
    color: COLORS.forest,
    fontFamily: FONTS.display,
  },

  placeholder: {
    marginTop: 8,
    fontFamily: FONTS.bodyBold,
    color: COLORS.brownSoft,
  },

  remove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  tipBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F7F3EA",
  },

  tipTitle: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.forestDark,
    marginBottom: 10,
  },

  tip: {
    fontFamily: FONTS.body,
    color: COLORS.brownSoft,
    marginBottom: 6,
  },

});