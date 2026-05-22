import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

const C = {
  darkBrown: '#2A1A08', sage: '#4A6741', gold2: '#8C6A30',
  cardBg: '#FAF5ED', textLight: '#9C7A50',
};

export default function AppHeader({ user, cart, navigation }) {
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const firstName = user?.full_name?.split(' ')[0] || '';
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '';

  return (
    <View style={styles.header}>
      {/* Logo */}
      <View style={styles.logoCircle}>
        <Image source={require('../assets/icon.png')} style={styles.logoImage} resizeMode="cover" />
      </View>

      {/* Wordmark */}
      <Text style={styles.wordmark}>From Our Place</Text>

      {/* Right side */}
      <View style={styles.right}>
        {/* Cart icon */}
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User pill */}
        {user && (
          <TouchableOpacity style={styles.userPill} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.userPillText}>{firstName}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'transparent',
    gap: 10,
  },
  logoCircle: {
    width: 36, height: 36, borderRadius: 18,
    overflow: 'hidden', borderWidth: 2, borderColor: '#8C6A30',
  },
  logoImage: { width: 32, height: 32, borderRadius: 16 },
  wordmark: {
    flex: 1, fontFamily: 'Satisfy_400Regular',
    fontSize: 18, color: '#2A1A08',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBtn: { position: 'relative', padding: 4 },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#B85C2A', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  userPill: {
    backgroundColor: '#4A6741', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  userPillText: { color: 'white', fontSize: 12, fontWeight: '700', fontFamily: 'DMSans_400Regular' },
});