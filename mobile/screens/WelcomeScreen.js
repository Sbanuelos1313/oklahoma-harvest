import React from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';
const OPTIONS = [
  {
    key: 'shopper',
    title: 'Shop as a Customer',
    subtitle: 'Discover fresh food and local goods',
    icon: 'basket-outline',
    accent: 'rgba(74,103,65,0.12)',
  },
  {
    key: 'producer',
    title: 'Sell as a Producer',
    subtitle: 'Manage your store and reach customers',
    icon: 'storefront-outline',
    accent: 'rgba(201,168,76,0.18)',
  },
  {
    key: 'admin',
    title: 'Administrator',
    subtitle: 'Platform management and approvals',
    icon: 'settings-outline',
    accent: 'rgba(87,71,55,0.10)',
  },
];

function AccessOption({ option, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.option}
      onPress={() => onPress(option.key)}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: option.accent,
          },
        ]}
      >
        <Ionicons
          name={option.icon}
          size={23}
          color={COLORS.forest}
        />
      </View>

      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>
          {option.title}
        </Text>

        <Text style={styles.optionSubtitle}>
          {option.subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color={COLORS.forest}
      />
    </TouchableOpacity>
  );
}

export default function WelcomeScreen({ navigation }) {
  function handleSelect(role) {
    navigation.navigate('Auth', {
      mode: 'login',
      role,
    });
  }

  function openFeedback() {
    Linking.openURL(
      'https://forms.gle/bUWcVYSsHYb8RQuE6'
    ).catch((error) => {
      console.error('Unable to open feedback form:', error);
    });
  }

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_app_login.jpg')}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.brandBlock}>
              <Image
                source={require('../assets/logo/from-our-place-transparent.png')}
                resizeMode="contain"
                style={styles.brandLogo}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>
                Welcome
              </Text>

              <Text style={styles.title}>
                Local goods, closer to home.
              </Text>

              <Text style={styles.subtitle}>
                Choose how you would like to continue.
              </Text>

              <View style={styles.optionList}>
                {OPTIONS.map((option) => (
                  <AccessOption
                    key={option.key}
                    option={option}
                    onPress={handleSelect}
                  />
                ))}
              </View>

              <View style={styles.helperRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={COLORS.forest}
                />

                <Text style={styles.helperText}>
                  Secure access for shoppers, producers,
                  and administrators.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.feedbackButton}
              onPress={openFeedback}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={COLORS.white}
              />

              <Text style={styles.feedbackText}>
                Feedback
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              From Our Place · Powered by Chronos AI
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18,12,7,0.28)',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
  },

  brandBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: 12,
    paddingTop: 4,
  },

  brandLogo: {
    width: '84%',
    height: 138,
    tintColor: '#FFFFFF',
  },

  card: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 21,
    borderRadius: 30,
    backgroundColor: 'rgba(252,250,247,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    ...SHADOWS.medium,
  },

  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.forest,
  },

  title: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 29,
    lineHeight: 35,
    color: COLORS.brown,
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 18,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subText,
  },

  optionList: {
    gap: 10,
  },

  option: {
    minHeight: 74,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },

  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionCopy: {
    flex: 1,
    marginHorizontal: 13,
  },

  optionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.brown,
  },

  optionSubtitle: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.subText,
  },

  helperRow: {
    marginTop: 16,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  helperText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.subText,
  },

  feedbackButton: {
    alignSelf: 'flex-end',
    minHeight: 48,
    marginTop: 15,
    paddingHorizontal: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.forest,
    ...SHADOWS.medium,
  },

  feedbackText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.white,
  },

  footer: {
    marginTop: 15,
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.84)',
  },
});