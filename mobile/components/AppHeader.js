import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AppHeader({
  user,
  cart,
  navigation,
}) {
  const cartCount =
    cart?.items?.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    ) || 0;

  const firstName =
    user?.full_name
      ?.split(' ')
      ?.filter(Boolean)?.[0] || '';

  function navigateToCustomerTab(screen) {
    const parentNavigation =
      navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate('Main', {
        screen,
      });

      return;
    }

    navigation.navigate('Main', {
      screen,
    });
  }

  return (
    <View style={styles.header}>
      <View style={styles.logoCircle}>
        <Image
          source={require('../assets/icon.png')}
          resizeMode="cover"
          style={styles.logoImage}
        />
      </View>

      <Text style={styles.wordmark}>
        From Our Place
      </Text>

      <View style={styles.right}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.cartBtn}
          onPress={() =>
            navigateToCustomerTab('Cart')
          }
        >
          <Text style={styles.cartIcon}>
            🛒
          </Text>

          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {!!user && (
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.userPill}
            onPress={() =>
              navigateToCustomerTab('Profile')
            }
          >
            <Text style={styles.userPillText}>
              {firstName || 'Account'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },

  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8C6A30',
  },

  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  wordmark: {
    flex: 1,
    fontFamily: 'Satisfy_400Regular',
    fontSize: 18,
    color: '#2A1A08',
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cartBtn: {
    position: 'relative',
    padding: 4,
  },

  cartIcon: {
    fontSize: 22,
  },

  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B85C2A',
  },

  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  userPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#4A6741',
  },

  userPillText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});