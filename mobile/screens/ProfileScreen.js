import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Platform, Linking, ScrollView, Alert } from 'react-native';
import { useFonts } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import AppHeader from '../components/AppHeader';

const C = {
  sage: '#4A6741', darkBrown: '#2A1A08', cream: '#F0E6D3',
  cardBg: '#FAF5ED', rootBg: '#EDE8DC', textMid: '#5C3818',
  textLight: '#9C7A50', feedbackBg: '#4A6741', gold2: '#8C6A30',
};

const MENU_ITEMS = [
  { key: 'orders',   icon: '📋', label: 'My Orders',          screen: 'Orders' },
  { key: 'saved',    icon: '❤️',  label: 'Saved Producers',    screen: null },
  { key: 'location', icon: '📍', label: 'Location & Radius',  screen: null },
  { key: 'notifs',   icon: '🔔', label: 'Notifications',      screen: null },
  { key: 'settings', icon: '⚙️', label: 'Account Settings',   screen: null },
  { key: 'privacy',  icon: '🔒', label: 'Privacy Policy',     screen: null },
  { key: 'terms',    icon: '📄', label: 'Terms of Use',       screen: null },
  { key: 'delete',   icon: '🗑️', label: 'Delete Account',     screen: null },
];

export default function ProfileScreen({ token, user, setToken, setUser, cart, navigation, API }) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, DMSans_400Regular });
  if (!fontsLoaded) return null;

  function doLogout() { setToken(null); setUser(null); }

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
                headers: { 'Authorization': 'Bearer ' + token }
              });
            } catch (e) {
              console.log('Delete account error:', e);
            }
            doLogout();
          }
        }
      ]
    );
  }

  function handleMenuPress(item) {
    switch (item.key) {
      case 'orders':   navigation.navigate('Orders'); break;
      case 'privacy':  Linking.openURL('https://from-our-place.chronos-ai.net/privacy'); break;
      case 'terms':    Linking.openURL('https://from-our-place.chronos-ai.net/terms'); break;
      case 'delete':   doDeleteAccount(); break;
      default: break;
    }
  }

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (!token) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
        <SafeAreaView style={styles.safeArea}>
          <AppHeader user={user} cart={cart} navigation={navigation} />
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Sign in to view your profile</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.getParent().navigate('Auth')}>
              <Text style={styles.btnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <SafeAreaView style={styles.safeArea}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Avatar + name — left aligned */}
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{user?.full_name}</Text>
              <Text style={styles.profileSub}>Shopper Account</Text>
            </View>
          </View>

          {/* Menu rows */}
          <View style={styles.menuSection}>
            {MENU_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuRow}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.75}>
                <View style={[
                  styles.menuIconBox,
                  item.key === 'delete' && { backgroundColor: 'rgba(180,60,30,0.1)' }
                ]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={[
                  styles.menuLabel,
                  item.key === 'delete' && { color: '#B43C1E' }
                ]}>
                  {item.label}
                </Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}

            {/* Sign out row */}
            <TouchableOpacity style={styles.menuRow} onPress={doLogout} activeOpacity={0.75}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(180,60,30,0.08)' }]}>
                <Text style={styles.menuIcon}>🚪</Text>
              </View>
              <Text style={[styles.menuLabel, { color: '#B43C1E' }]}>Sign Out</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>from-our-place.chronos-ai.net · Powered by Chronos AI</Text>
        </ScrollView>
      </SafeAreaView>

      <TouchableOpacity
        style={styles.feedbackButton}
        onPress={() => Linking.openURL('https://forms.gle/bUWcVYSsHYb8RQuE6')}
        activeOpacity={0.85}>
        <Text style={styles.feedbackText}>💬 Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: C.darkBrown, marginBottom: 16, textAlign: 'center' },
  btn: { backgroundColor: C.sage, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { fontFamily: 'DMSans_400Regular', color: 'white', fontWeight: '700', fontSize: 15 },

  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28, paddingTop: 8 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20 },
  profileName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: C.darkBrown },
  profileSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight, marginTop: 2 },

  menuSection: { gap: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 14, padding: 14, gap: 14, shadowColor: '#5A320A', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  menuIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.darkBrown, fontWeight: '600' },
  menuChevron: { fontSize: 20, color: C.textLight },

  footer: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(42,26,8,0.35)', textAlign: 'center', marginTop: 24 },

  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});