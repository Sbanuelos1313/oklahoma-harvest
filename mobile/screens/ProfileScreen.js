import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView, Alert, Linking
} from 'react-native';

import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';

import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

const MENU_ITEMS = [
  { key: 'orders', icon: IMAGE_ASSETS.icons.orders, label: 'My Orders', sub: 'Track purchases and receipts' },
  { key: 'saved', icon: IMAGE_ASSETS.icons.heart, label: 'Saved Vendors', sub: 'Favorite shops and makers' },
  { key: 'location', icon: IMAGE_ASSETS.icons.location, label: 'Location & Radius', sub: 'Manage local discovery' },
  { key: 'settings', icon: IMAGE_ASSETS.icons.settings, label: 'Account Settings', sub: 'Profile, privacy, and preferences' },
];

export default function ProfileScreen({ token, user, setToken, setUser, cart, navigation, API }) {
  function doLogout() {
    setToken(null);
    setUser(null);
  }

  function doDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all your data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API}/api/users/me`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
              });
            } catch {}
            doLogout();
          }
        }
      ]
    );
  }

  function handleMenuPress(item) {
    switch (item.key) {
      case 'orders':
        navigation.navigate('Orders');
        break;
      case 'saved':
        navigation.getParent()?.navigate('Favorites') || navigation.navigate('Favorites');
        break;
      case 'location':
        Alert.alert('Coming soon', 'Location and radius settings will be connected in the next update.');
        break;
      case 'settings':
        navigation.getParent()?.navigate('Settings') || navigation.navigate('Settings');
        break;
      default:
        break;
    }
  }

  if (!token || token === 'guest') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
        <SafeAreaView style={styles.safe}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.emptyWrap}>
            <EmptyState
              image={IMAGE_ASSETS.hero.welcome}
              title="Create your local profile"
              message="Sign in to save vendors, view orders, manage your location, and build your From Our Place account."
              buttonTitle="Sign In / Create Account"
              onPress={() => navigation.getParent()?.navigate('Auth') || navigation.navigate('Auth')}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHero}>
            <Image source={IMAGE_ASSETS.hero.vendor} style={styles.heroImage} />
            <View style={styles.heroOverlay} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{user?.full_name || 'From Our Place Customer'}</Text>
            <Text style={styles.email}>{user?.email || 'Local marketplace account'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Local</Text>
              <Text style={styles.statLabel}>Marketplace</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Saved</Text>
              <Text style={styles.statLabel}>Vendors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Orders</Text>
              <Text style={styles.statLabel}>History</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Account</Text>

          {MENU_ITEMS.map(item => (
            <TouchableOpacity key={item.key} style={styles.menuRow} onPress={() => handleMenuPress(item)}>
              <Image source={item.icon} style={styles.menuIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuRow} onPress={() => Linking.openURL('https://from-our-place.chronos-ai.net/static/privacy.html')}>
            <Image source={IMAGE_ASSETS.icons.settings} style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Privacy Policy</Text>
              <Text style={styles.menuSub}>How your information is handled</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => Linking.openURL('https://from-our-place.chronos-ai.net/static/terms.html')}>
            <Image source={IMAGE_ASSETS.icons.settings} style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Terms of Use</Text>
              <Text style={styles.menuSub}>Marketplace terms and conditions</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.actionBlock}>
            <AppButton title="Sign Out" variant="outline" onPress={doLogout} />
            <TouchableOpacity style={styles.deleteBtn} onPress={doDeleteAccount}>
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  emptyWrap: { flex: 1, padding: LAYOUT.screenPadding, justifyContent: 'center' },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  profileHero: {
    height: 260,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.card,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23, 50, 31, 0.38)' },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  avatarText: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.forest },
  name: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.warmWhite, marginTop: 12 },
  email: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.cream, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  statValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.forest },
  statLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.brownSoft, marginTop: 3 },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.forestDark, marginTop: 24, marginBottom: 12 },
  menuRow: {
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.soft,
  },
  menuIcon: { width: 34, height: 34 },
  menuLabel: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.forestDark },
  menuSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brownSoft, marginTop: 2 },
  chevron: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.sage },
  actionBlock: { marginTop: 14, gap: 12 },
  deleteBtn: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.danger },
});
