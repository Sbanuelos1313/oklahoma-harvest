import React from 'react';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
  ImageBackground,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

import { IMAGE_ASSETS } from '../constants/assets';

const ACCOUNT_ITEMS = [
  {
    key: 'orders',
    icon: 'receipt-outline',
    label: 'My Orders',
    description: 'Track purchases and receipts',
  },
  {
    key: 'saved',
    icon: 'heart-outline',
    label: 'Saved Vendors',
    description: 'Favorite shops and makers',
  },
  {
    key: 'location',
    icon: 'location-outline',
    label: 'Location & Radius',
    description: 'Manage local discovery',
  },
  {
    key: 'settings',
    icon: 'settings-outline',
    label: 'Account Settings',
    description: 'Profile, privacy, and preferences',
  },
];

const SUPPORT_ITEMS = [
  {
    key: 'privacy',
    icon: 'shield-checkmark-outline',
    label: 'Privacy Policy',
    description: 'How your information is handled',
  },
  {
    key: 'terms',
    icon: 'document-text-outline',
    label: 'Terms of Use',
    description: 'Marketplace terms and conditions',
  },
  {
    key: 'help',
    icon: 'help-circle-outline',
    label: 'Help & Feedback',
    description: 'Tell us how we can improve',
  },
];

export default function ProfileScreen({
  token,
  user,
  setToken,
  setUser,
  cart,
  navigation,
  API,
}) {
  const isGuest =
    !token || token === 'guest';

  const initials =
    user?.full_name
      ?.split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  function logout() {
    setToken(null);
    setUser(null);
  }

  function deleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated data? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API}/api/users/me`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            } catch {
              // Account will still be logged out.
            }

            logout();
          },
        },
      ]
    );
  }

  function navigateToRoute(routeName) {
    const parentNavigation =
      navigation.getParent();

    if (parentNavigation) {
      parentNavigation.navigate(routeName);
      return;
    }

    navigation.navigate(routeName);
  }

  function handleMenuItem(item) {
    switch (item.key) {
      case 'orders':
        navigation.navigate('Orders');
        break;

      case 'saved':
        navigateToRoute('Favorites');
        break;

      case 'settings':
        navigateToRoute('Settings');
        break;

      case 'location':
        Alert.alert(
          'Coming soon',
          'Location and shopping-radius settings will be connected in a future update.'
        );
        break;

      case 'privacy':
        Linking.openURL(
          'https://from-our-place.chronos-ai.net/static/privacy.html'
        );
        break;

      case 'terms':
        Linking.openURL(
          'https://from-our-place.chronos-ai.net/static/terms.html'
        );
        break;

      case 'help':
        Linking.openURL(
          'https://forms.gle/bUWcVYSsHYb8RQuE6'
        );
        break;

      default:
        break;
    }
  }

  function renderMenuSection(title, items) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <View style={styles.menuCard}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.82}
              style={[
                styles.menuRow,
                index < items.length - 1 &&
                  styles.menuRowBorder,
              ]}
              onPress={() =>
                handleMenuItem(item)
              }
            >
              <View style={styles.menuIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={COLORS.forest}
                />
              </View>

              <View style={styles.menuTextBlock}>
                <Text style={styles.menuLabel}>
                  {item.label}
                </Text>

                <Text style={styles.menuDescription}>
                  {item.description}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.sage}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (isGuest) {
    return (
      <ImageBackground
        source={IMAGE_ASSETS.backgrounds.vendorProfile}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.backgroundOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.guestHeader}>
              <Text style={styles.screenTitle}>
                Your Account
              </Text>
            </View>

            <View style={styles.guestCard}>
              <Image
                source={IMAGE_ASSETS.hero.welcome}
                style={styles.guestImage}
              />

              <View style={styles.guestOverlay} />

              <View style={styles.guestContent}>
                <View style={styles.guestIcon}>
                  <Ionicons
                    name="person-outline"
                    size={36}
                    color={COLORS.forest}
                  />
                </View>

                <Text style={styles.guestTitle}>
                  Create your local profile
                </Text>

                <Text style={styles.guestMessage}>
                  Sign in to save vendors, manage
                  your location, view orders, and
                  build your From Our Place account.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.signInButton}
                  onPress={() =>
                    navigateToRoute('Auth')
                  }
                >
                  <Text
                    style={
                      styles.signInButtonText
                    }
                  >
                    Sign In / Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_settings.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.screenTitle}>
                Your Account
              </Text>

              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.settingsButton}
                onPress={() =>
                  navigateToRoute('Settings')
                }
              >
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={COLORS.brown}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.profileHero}>
              <Image
                source={require('../assets/backgrounds/profile_header.jpg')}
                style={styles.heroImage}
              />

              <View style={styles.heroOverlay} />

              <View style={styles.profileIdentity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={styles.profileName}
                >
                  {user?.full_name ||
                    'From Our Place Customer'}
                </Text>

                <Text
                  numberOfLines={1}
                  style={styles.profileEmail}
                >
                  {user?.email ||
                    'Local marketplace account'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.statCard}
                onPress={() =>
                  navigation.navigate('Orders')
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={23}
                  color={COLORS.forest}
                />

                <Text style={styles.statValue}>
                  Orders
                </Text>

                <Text style={styles.statLabel}>
                  Purchase history
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.statCard}
                onPress={() =>
                  navigateToRoute('Favorites')
                }
              >
                <Ionicons
                  name="heart-outline"
                  size={23}
                  color={COLORS.forest}
                />

                <Text style={styles.statValue}>
                  Saved
                </Text>

                <Text style={styles.statLabel}>
                  Favorite vendors
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.statCard}
                onPress={() =>
                  navigation.navigate('Home')
                }
              >
                <Ionicons
                  name="storefront-outline"
                  size={23}
                  color={COLORS.forest}
                />

                <Text style={styles.statValue}>
                  Local
                </Text>

                <Text style={styles.statLabel}>
                  Marketplace
                </Text>
              </TouchableOpacity>
            </View>

            {renderMenuSection(
              'Account',
              ACCOUNT_ITEMS
            )}

            <View style={styles.producerCard}>
              <ImageBackground
                source={require('../assets/backgrounds/bg_vendor_store.jpg')}
                resizeMode="cover"
                style={styles.producerBackground}
                imageStyle={
                  styles.producerBackgroundImage
                }
              >
                <View
                  style={styles.producerOverlay}
                >
                  <Text
                    style={styles.producerKicker}
                  >
                    For Local Sellers
                  </Text>

                  <Text
                    style={styles.producerTitle}
                  >
                    Ready to share what you make?
                  </Text>

                  <Text
                    style={styles.producerText}
                  >
                    Create a producer profile and
                    bring your products to more
                    nearby customers.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.producerButton}
                    onPress={() =>
                      navigateToRoute('Auth')
                    }
                  >
                    <Text
                      style={
                        styles.producerButtonText
                      }
                    >
                      Become a Producer
                    </Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>

            {renderMenuSection(
              'Support',
              SUPPORT_ITEMS
            )}

            <View style={styles.accountActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.signOutButton}
                onPress={logout}
              >
                <Ionicons
                  name="log-out-outline"
                  size={19}
                  color={COLORS.forest}
                />

                <Text style={styles.signOutText}>
                  Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.deleteButton}
                onPress={deleteAccount}
              >
                <Text style={styles.deleteText}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(247,242,232,0.60)',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 132,
  },

  pageHeader: {
    paddingTop: 14,
    paddingBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  screenTitle: {
    fontFamily: FONTS.display,
    fontSize: 35,
    lineHeight: 41,
    color: COLORS.brown,
  },

  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
    ...SHADOWS.soft,
  },

  profileHero: {
    height: 250,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25,18,12,0.30)',
  },

  profileIdentity: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmWhite,
    borderWidth: 3,
    borderColor: COLORS.gold,
    ...SHADOWS.soft,
  },

  avatarText: {
    fontFamily: FONTS.display,
    fontSize: 30,
    color: COLORS.forest,
  },

  profileName: {
    maxWidth: '92%',
    marginTop: 13,
    fontFamily: FONTS.display,
    fontSize: 23,
    color: COLORS.white,
    textAlign: 'center',
  },

  profileEmail: {
    maxWidth: '92%',
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.cream,
  },

  statsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 104,
    paddingHorizontal: 8,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.94)',
    ...SHADOWS.soft,
  },

  statValue: {
    marginTop: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.brown,
  },

  statLabel: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: COLORS.subText,
  },

  section: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 11,
    fontFamily: FONTS.display,
    fontSize: 25,
    color: COLORS.brown,
  },

  menuCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(252,250,247,0.95)',
    ...SHADOWS.soft,
  },

  menuRow: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  menuIconWrap: {
    width: 43,
    height: 43,
    marginRight: 12,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.11)',
  },

  menuTextBlock: {
    flex: 1,
  },

  menuLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  menuDescription: {
    marginTop: 3,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subText,
  },

  producerCard: {
    height: 250,
    marginTop: 25,
    borderRadius: 26,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },

  producerBackground: {
    flex: 1,
  },

  producerBackgroundImage: {
    borderRadius: 26,
  },

  producerOverlay: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.44)',
  },

  producerKicker: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.cream,
  },

  producerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 22,
    lineHeight: 27,
    color: COLORS.white,
  },

  producerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.cream,
  },

  producerButton: {
    alignSelf: 'flex-start',
    height: 54,
    paddingHorizontal: 28,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  producerButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  accountActions: {
    marginTop: 25,
  },

  signOutButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,250,247,0.92)',
  },

  signOutText: {
    marginLeft: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },

  deleteButton: {
    minHeight: 48,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.danger,
  },

  guestHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  guestCard: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 108,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.warmWhite,
    ...SHADOWS.medium,
  },

  guestImage: {
    width: '100%',
    height: 250,
  },

  guestOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 250,
    backgroundColor: 'rgba(35,69,44,0.20)',
  },

  guestContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.12)',
  },

  guestTitle: {
    marginTop: 17,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.brown,
    textAlign: 'center',
  },

  guestMessage: {
    marginTop: 9,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.subText,
    textAlign: 'center',
  },

  signInButton: {
    height: 54,
    marginTop: 21,
    paddingHorizontal: 28,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },

  signInButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },
});