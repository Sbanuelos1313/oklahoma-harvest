import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar, SafeAreaView, Platform, Linking, Image
} from 'react-native';
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { LinearGradient } from 'expo-linear-gradient';

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
  feedbackBg: '#4A6741',
  gold2:      '#8C6A30',
};

const CARD_GRADIENT = [C.rust, C.gold, C.sage, C.gold, C.rust];

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

export default function AuthScreen({ API, setToken, setUser, navigation }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Satisfy_400Regular,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
  });

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  if (!fontsLoaded) return null;

  async function doLogin() {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.detail || 'Login failed'); setLoading(false); return; }
      if (data.role === 'producer') { Alert.alert('Error', 'Please use the producer portal'); setLoading(false); return; }
      setToken(data.token);
      setUser({ id: data.user_id, role: data.role, full_name: data.full_name });
    } catch { Alert.alert('Error', 'Connection error'); }
    setLoading(false);
  }

  async function doRegister() {
    if (!fullName || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role: 'shopper' })
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.detail || 'Registration failed'); setLoading(false); return; }
      setToken(data.token);
      setUser({ id: data.user_id, role: data.role, full_name: data.full_name });
    } catch { Alert.alert('Error', 'Connection error'); }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.rootBg} />
      <BotanicalBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Wordmark */}
          <Text style={styles.brandName}>From Our Place</Text>
          <Text style={styles.tagline}>FARM TO TABLE MARKETPLACE</Text>

          {/* Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={CARD_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardTopBar}
            />
            <View style={styles.cardInner}>

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, tab === 'login' && styles.tabActive]}
                  onPress={() => setTab('login')}>
                  <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, tab === 'register' && styles.tabActive]}
                  onPress={() => setTab('register')}>
                  <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {tab === 'register' && (
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your full name"
                      placeholderTextColor={C.textLight}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={C.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={C.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordBtn}>
                    <Text style={styles.showPasswordText}>
                      {showPassword ? 'Hide password' : 'Show password'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={tab === 'login' ? doLogin : doRegister}
                  disabled={loading}
                  activeOpacity={0.85}>
                  <Text style={styles.btnText}>
                    {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                {/* Legal links — required by Apple for registration */}
                {tab === 'register' && (
                  <View style={styles.legalRow}>
                    <Text style={styles.legalText}>By creating an account you agree to our </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://from-our-place.chronos-ai.net/privacy')}>
                      <Text style={styles.legalLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalText}> and </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://from-our-place.chronos-ai.net/terms')}>
                      <Text style={styles.legalLink}>Terms of Use</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {tab === 'login' && (
                  <>
                    <TouchableOpacity style={styles.forgotBtn}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.producerRow}
                      onPress={() => {
                        setTab('register');
                        Alert.alert(
                          'Producer Sign Up',
                          'Create your account below. Once registered, our team will upgrade your account to producer status.',
                          [{ text: 'Got it', style: 'default' }]
                        );
                      }}>
                      <Text style={styles.producerText}>Are you a producer? </Text>
                      <Text style={styles.producerLink}>Join here →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
  scrollContent: { alignItems: 'center', paddingTop: 36, paddingBottom: 100, paddingHorizontal: 24 },

  logoWrapper: { marginBottom: 14 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    overflow: 'hidden', borderWidth: 3, borderColor: C.gold2,
    shadowColor: C.gold2, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 10,
  },
  logoImage: { width: 90, height: 90, borderRadius: 45 },

  brandName: { fontFamily: 'Satisfy_400Regular', fontSize: 34, color: C.darkBrown, marginBottom: 4, textAlign: 'center' },
  tagline: { fontFamily: 'DMSans_400Regular', fontSize: 10, letterSpacing: 2.5, color: 'rgba(58,32,8,0.55)', textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' },

  card: {
    width: '100%', backgroundColor: C.cardBg, borderRadius: 26,
    overflow: 'hidden', shadowColor: '#5A320A',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25,
    shadowRadius: 20, elevation: 10, marginBottom: 16,
  },
  cardTopBar: { height: 4, width: '100%' },
  cardInner: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 },

  tabs: { flexDirection: 'row', backgroundColor: 'rgba(90,50,10,0.08)', borderRadius: 14, padding: 4, marginBottom: 22 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontFamily: 'DMSans_400Regular', fontSize: 13, fontWeight: '600', color: C.textLight },
  tabTextActive: { color: C.sage, fontWeight: '700' },

  form: { gap: 16 },
  inputWrap: { gap: 6 },
  inputLabel: { fontFamily: 'DMSans_400Regular', fontSize: 11, fontWeight: '700', color: C.textMid, letterSpacing: 2, textTransform: 'uppercase' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontFamily: 'DMSans_400Regular', fontSize: 15, color: C.darkBrown, borderWidth: 1.5, borderColor: 'rgba(90,50,10,0.1)' },
  showPasswordBtn: { alignSelf: 'flex-end', marginTop: 6 },
  showPasswordText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.sage, fontWeight: '600' },

  btn: { backgroundColor: C.sage, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: 'DMSans_400Regular', fontSize: 15, fontWeight: '700', color: 'white' },

  // Apple required legal links
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 2 },
  legalText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textLight },
  legalLink: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.sage, fontWeight: '600' },

  forgotBtn: { alignItems: 'center', paddingVertical: 4 },
  forgotText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.sage, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(90,50,10,0.08)' },
  dividerText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textLight, marginHorizontal: 10 },

  producerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  producerText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textLight },
  producerLink: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.sage, fontWeight: '700' },

  footer: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(42,26,8,0.35)', textAlign: 'center', marginTop: 4 },

  feedbackButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, right: 18, zIndex: 999, backgroundColor: C.feedbackBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  feedbackText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
});