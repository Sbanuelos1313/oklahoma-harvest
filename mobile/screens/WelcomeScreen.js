import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, SafeAreaView, Platform, Linking, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

const C = {
  rust:       '#B85C2A',
  gold:       '#C9A84C',
  sage:       '#4A6741',
  darkBrown:  '#2A1A08',
  cream:      '#F0E6D3',
  cardBg:     '#FAF5ED',
  rootBg:     '#D4C4A8',
  textMid:    '#5C3818',
  textLight:  '#9C7A50',
  // Web-exact icon bg colors (soft, not saturated)
  shopperBg:  '#C8DCA8',  // soft sage green from web
  producerBg: '#F5C48A',  // soft peach/gold from web
  adminBg:    '#D5C0A0',  // soft tan from web
  feedbackBg: '#4A6741',
  gold2:      '#8C6A30',
};

const CARD_GRADIENT = [C.rust, C.gold, C.sage, C.gold, C.rust];

const ROLES = [
  { key: 'shopper',  label: 'Shop as a Customer', emoji: '🛍️', description: 'Create an account or sign in to shop',   iconBg: C.shopperBg  },
  { key: 'producer', label: 'Sell as a Producer',  emoji: '🌱', description: 'Register your farm or food business',    iconBg: C.producerBg },
  { key: 'admin',    label: 'Admin Panel',          emoji: '⚙️', description: 'Platform management and approvals',      iconBg: C.adminBg    },
];

const TILE_W = 110;
const TILE_H = 110;
const COLS = 4;
const ROWS = 9;

const BotanicalBackground = () => {
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      tiles.push({ key: `${row}-${col}`, x: col * TILE_W, y: row * TILE_H });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#FAF5ED', opacity: 0.55 }} />
      <View style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#D4B888', opacity: 0.3 }} />
      <View style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#9C7840', opacity: 0.25 }} />
      <View style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#C8A050', opacity: 0.12 }} />
      <View style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#8C6A30', opacity: 0.18 }} />

      {tiles.map(({ key, x, y }) => (
        <View key={key} style={{ position: 'absolute', left: x, top: y, width: TILE_W, height: TILE_H }}>
          <View style={{ position: 'absolute', left: 18, top: 28, width: 1.2, height: 77, backgroundColor: '#8C6A20', opacity: 0.3, borderRadius: 1 }} />
          <View style={{ position: 'absolute', left: 15, top: 20, width: 6, height: 16, backgroundColor: '#8C6A20', opacity: 0.28, borderRadius: 3 }} />
          <View style={{ position: 'absolute', left: 9, top: 32, width: 6, height: 14, backgroundColor: '#8C6A20', opacity: 0.22, borderRadius: 3, transform: [{ rotate: '18deg' }] }} />
          <View style={{ position: 'absolute', left: 21, top: 32, width: 6, height: 14, backgroundColor: '#8C6A20', opacity: 0.22, borderRadius: 3, transform: [{ rotate: '-18deg' }] }} />
          <View style={{ position: 'absolute', left: 85, top: 72, width: 1, height: 33, backgroundColor: '#4A6A2A', opacity: 0.22, borderRadius: 1 }} />
          {[0, 45, 90, 135].map((deg, i) => (
            <View key={i} style={{ position: 'absolute', left: 82, top: 62, width: 6, height: 14, backgroundColor: '#C8A870', opacity: 0.25, borderRadius: 3, transform: [{ rotate: `${deg}deg` }] }} />
          ))}
          <View style={{ position: 'absolute', left: 80, top: 67, width: 10, height: 10, backgroundColor: '#B8861A', opacity: 0.25, borderRadius: 5 }} />
          <View style={{ position: 'absolute', left: 47, top: 23, width: 4, height: 9, backgroundColor: '#8C6A20', opacity: 0.18, borderRadius: 2, transform: [{ rotate: '25deg' }] }} />
          <View style={{ position: 'absolute', left: 55, top: 17, width: 3, height: 7, backgroundColor: '#8C6A20', opacity: 0.14, borderRadius: 2, transform: [{ rotate: '-15deg' }] }} />
          <View style={{ position: 'absolute', left: 40, top: 18, width: 3, height: 7, backgroundColor: '#8C6A20', opacity: 0.14, borderRadius: 2, transform: [{ rotate: '38deg' }] }} />
          <View style={{ position: 'absolute', left: 60, top: 34, width: 18, height: 7, backgroundColor: '#4A6A2A', opacity: 0.18, borderRadius: 3, transform: [{ rotate: '-28deg' }] }} />
          <View style={{ position: 'absolute', left: 70, top: 30, width: 14, height: 6, backgroundColor: '#4A6A2A', opacity: 0.15, borderRadius: 3, transform: [{ rotate: '18deg' }] }} />
          <View style={{ position: 'absolute', left: 35, top: 79, width: 5, height: 5, backgroundColor: '#9C7A30', opacity: 0.18, borderRadius: 2.5 }} />
          <View style={{ position: 'absolute', left: 43, top: 74, width: 4, height: 4, backgroundColor: '#9C7A30', opacity: 0.14, borderRadius: 2 }} />
          <View style={{ position: 'absolute', left: 29, top: 73, width: 3, height: 3, backgroundColor: '#9C7A30', opacity: 0.12, borderRadius: 1.5 }} />
          <View style={{ position: 'absolute', left: 98, top: 52, width: 1, height: 36, backgroundColor: '#4A6A2A', opacity: 0.22, borderRadius: 1 }} />
          <View style={{ position: 'absolute', left: 91, top: 60, width: 10, height: 4, backgroundColor: '#4A6A2A', opacity: 0.18, borderRadius: 2, transform: [{ rotate: '-28deg' }] }} />
          <View style={{ position: 'absolute', left: 100, top: 60, width: 10, height: 4, backgroundColor: '#4A6A2A', opacity: 0.18, borderRadius: 2, transform: [{ rotate: '28deg' }] }} />
          <View style={{ position: 'absolute', left: 90, top: 70, width: 9, height: 4, backgroundColor: '#4A6A2A', opacity: 0.15, borderRadius: 2, transform: [{ rotate: '-22deg' }] }} />
          <View style={{ position: 'absolute', left: 101, top: 70, width: 9, height: 4, backgroundColor: '#4A6A2A', opacity: 0.15, borderRadius: 2, transform: [{ rotate: '22deg' }] }} />
          <View style={{ position: 'absolute', left: 52, top: 85, width: 6, height: 6, backgroundColor: '#C8901A', opacity: 0.20, borderRadius: 3 }} />
        </View>
      ))}
    </View>
  );
};

const RoleButton = ({ role, onPress }) => (
  <TouchableOpacity style={styles.roleButton} onPress={() => onPress(role.key)} activeOpacity={0.75}>
    <View style={[styles.roleIconBox, { backgroundColor: role.iconBg }]}>
      <Text style={styles.roleEmoji}>{role.emoji}</Text>
    </View>
    <View style={styles.roleTextBlock}>
      <Text style={styles.roleLabel}>{role.label}</Text>
      <Text style={styles.roleDesc}>{role.description}</Text>
    </View>
    <Text style={styles.roleChevron}>›</Text>
  </TouchableOpacity>
);

export default function WelcomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Satisfy_400Regular,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
  });

  if (!fontsLoaded) return null;

  const handleRoleSelect = (role) => {
    if (role === 'shopper')  navigation.navigate('Auth');
    if (role === 'producer') navigation.navigate('Auth');
    if (role === 'admin')    navigation.navigate('Auth');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <BotanicalBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Logo — no glow, just gold border + shadow */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <Text style={styles.brandName}>From Our Place</Text>
          <Text style={styles.tagline}>FARM TO TABLE MARKETPLACE</Text>

          <View style={styles.card}>
            <LinearGradient
              colors={CARD_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardTopBar}
            />
            <View style={styles.cardInner}>
              <Text style={styles.welcomeTitle}>Welcome!</Text>
              <Text style={styles.welcomeSub}>
                Fresh, local food straight from the source.{'\n'}
                How would you like to continue?
              </Text>

              <RoleButton role={ROLES[0]} onPress={handleRoleSelect} />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <RoleButton role={ROLES[1]} onPress={handleRoleSelect} />
              <View style={{ height: 10 }} />
              <RoleButton role={ROLES[2]} onPress={handleRoleSelect} />
            </View>
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
  scrollContent: { alignItems: 'center', paddingTop: 36, paddingBottom: 110, paddingHorizontal: 20 },

  logoWrapper: { marginBottom: 14 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3, borderColor: C.gold2,
    shadowColor: C.gold2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  logoImage: { width: 90, height: 90, borderRadius: 45 },

  brandName: { fontFamily: 'Satisfy_400Regular', fontSize: 36, color: C.darkBrown, marginBottom: 5, textAlign: 'center' },
  tagline: { fontFamily: 'DMSans_400Regular', fontSize: 11, letterSpacing: 2.5, color: 'rgba(58,32,8,0.55)', textTransform: 'uppercase', marginBottom: 26, textAlign: 'center' },

  card: {
    width: '100%', backgroundColor: C.cardBg, borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#5A320A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10, marginBottom: 16,
  },
  cardTopBar: { height: 4, width: '100%' },
  cardInner: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 28 },

  welcomeTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: C.darkBrown, textAlign: 'center', marginBottom: 6 },
  welcomeSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20, marginBottom: 22 },

  roleButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 15, marginBottom: 9,
    borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)',
  },
  roleIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  roleEmoji: { fontSize: 20 },
  roleTextBlock: { flex: 1 },
  roleLabel: { fontFamily: 'DMSans_400Regular', fontWeight: '700', fontSize: 14, color: C.darkBrown },
  roleDesc: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textLight, marginTop: 2 },
  roleChevron: { fontSize: 20, color: C.textLight, paddingLeft: 8 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(90,50,10,0.08)' },
  dividerText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textLight, marginHorizontal: 10, letterSpacing: 1 },

  footer: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(42,26,8,0.35)', textAlign: 'center', marginTop: 4 },

  feedbackButton: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, right: 18, zIndex: 999,
    backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
  },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});