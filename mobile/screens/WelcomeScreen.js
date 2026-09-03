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
    if (role === 'shopper') {
      navigation.navigate('GuestMain');
      return;
    }

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
      source={require('../assets/backgrounds/bg_welcome.jpg')}
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
    paddingTop: 10,
    paddingBottom: 18,
  },

  brandBlock: {
    alignSelf: 'center',
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,

    shadowColor: '#F4C96B',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 12,
  },

  brandLogo: {
    width: '110%',
    height: 190,
  },
  
  card: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 28,

    backgroundColor: 'rgba(47,39,22,0.78)',

    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.48)',

    ...SHADOWS.medium,
  },
  
  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#D8C56A',
  },

  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 27,
    lineHeight: 31,
    color: '#FFF8EA',
  },

  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,248,234,0.86)',
  },

  optionList: {
    gap: 6,
  },

  option: {
    minHeight: 66,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(218,194,145,0.92)',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(250,238,208,0.98)',

    ...SHADOWS.soft,
  },
  
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
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
    color: COLORS.forest,
  },

  optionSubtitle: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.brownSoft,
  },

  helperRow: {
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(216,197,106,0.25)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  helperText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,248,234,0.78)',
  },

  feedbackButton: {
    alignSelf: 'flex-end',
    minHeight: 46,
    marginTop: 10,
    paddingHorizontal: 18,
    borderRadius: 23,
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
    marginTop: 10,
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.84)',
  },
});