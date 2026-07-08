import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, ActivityIndicator
} from 'react-native';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorProfileScreen({ API, token, user, setToken, setUser, navigation }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadShop);
    loadShop();
    return unsubscribe;
  }, [navigation]);

  async function loadShop() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/producers/me`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setShop(res.ok ? data : null);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.forest} />
            <Text style={styles.loadingText}>Loading store...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyWrap}>
            <EmptyState
              image={IMAGE_ASSETS.vendor.storefront}
              title="Store setup needed"
              message="Your vendor account exists, but your storefront has not been created yet."
              buttonTitle="Create Store"
              onPress={() => navigation.getParent()?.navigate('VendorStoreSetup')}
            />
            <AppButton title="Sign Out" variant="outline" onPress={logout} style={{ marginTop: 14 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const heroImage = shop.profile_image_url ? { uri: shop.profile_image_url } : IMAGE_ASSETS.vendor.storefront;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image source={heroImage} style={styles.heroImage} />
            <View style={styles.overlay} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>Vendor store</Text>
              <Text style={styles.title}>{shop.shop_name}</Text>
              <Text style={styles.subtitle}>{shop.city || 'Local'}{shop.state ? `, ${shop.state}` : ''}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Public storefront</Text>
            <Text style={styles.bodyText}>{shop.description || 'Add a store description so customers understand what you sell and what makes your business special.'}</Text>

            <View style={styles.infoGrid}>
              <Info label="Pickup" value={shop.fulfillment_pickup ? 'Enabled' : 'Off'} />
              <Info label="Delivery" value={shop.fulfillment_delivery ? 'Enabled' : 'Off'} />
              <Info label="Shipping" value={shop.fulfillment_shipping ? 'Enabled' : 'Off'} />
            </View>

            <AppButton title="Edit Store" onPress={() => navigation.getParent()?.navigate('VendorEditStore', { shop })} style={{ marginTop: 16 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Owner account</Text>
            <Text style={styles.bodyText}>{user?.full_name || 'Vendor'} · {user?.email || 'Vendor account'}</Text>
            <AppButton title="Sign Out" variant="outline" onPress={logout} style={{ marginTop: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  emptyWrap: { flex: 1, padding: LAYOUT.screenPadding, justifyContent: 'center' },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  hero: { height: 280, borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: 14, ...SHADOWS.card },
  heroImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23, 50, 31, 0.36)' },
  heroContent: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.cream },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.warmWhite, marginTop: 6 },
  subtitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.cream, marginTop: 6 },
  card: { marginTop: 18, backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 25, color: COLORS.forestDark },
  bodyText: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 22, color: COLORS.brown, marginTop: 8 },
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  infoItem: { flex: 1, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 12, alignItems: 'center' },
  infoLabel: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.brownSoft },
  infoValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.forest, marginTop: 4 },
});
