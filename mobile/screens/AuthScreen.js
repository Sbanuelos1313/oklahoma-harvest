import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../constants/theme';

export default function AuthScreen({
  API,
  setToken,
  setUser,
  navigation,
  route,
}) {
  const requestedRole =
    route?.params?.role || 'shopper';

  const initialMode =
    route?.params?.mode === 'register'
      ? 'register'
      : 'login';

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.mode === 'register') {
      setMode('register');
    }

    if (route?.params?.mode === 'login') {
      setMode('login');
    }
  }, [route?.params?.mode]);

  async function parseResponse(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function getRoleLabel() {
    if (requestedRole === 'producer') {
      return 'Producer Access';
    }

    if (requestedRole === 'admin') {
      return 'Administrator Access';
    }

    return 'Customer Access';
  }

  function getRoleIcon() {
    if (requestedRole === 'producer') {
      return 'storefront-outline';
    }

    if (requestedRole === 'admin') {
      return 'settings-outline';
    }

    return 'basket-outline';
  }

  async function handleLogin() {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert(
        'Missing information',
        'Enter your email and password.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/users/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        Alert.alert(
          'Unable to sign in',
          data?.detail ||
            data?.message ||
            'Please check your information and try again.'
        );
        return;
      }

const authToken =
  data?.token ||
  data?.access_token ||
  data?.accessToken;

const returnedUser =
  data?.user || {};

const returnedRole =
  data?.role ||
  returnedUser?.role ||
  'shopper';

if (!authToken) {
  console.log('Login response:', data);

  Alert.alert(
    'Sign-in response error',
    'The server accepted the login but did not return an access token.'
  );

  return;
}

if (
  requestedRole !== 'shopper' &&
  returnedRole !== requestedRole
) {
  Alert.alert(
    'Incorrect portal',
    `This account is registered as ${returnedRole}. Please use the correct access option.`
  );

  return;
}

const authenticatedUser = {
  id:
    data?.user_id ||
    returnedUser?.id,
  role: returnedRole,
  full_name:
    data?.full_name ||
    returnedUser?.full_name ||
    returnedUser?.name ||
    '',
  email:
    data?.email ||
    returnedUser?.email ||
    normalizedEmail,
};

setUser(authenticatedUser);
setToken(authToken);

requestAnimationFrame(() => {
  navigation.reset({
    index: 0,
    routes: [
      {
        name:
          returnedRole === 'producer'
            ? 'VendorMain'
            : 'Main',
      },
    ],
  });
});      
    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        'Connection error',
        'We could not reach the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    const normalizedName = fullName.trim();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Complete your name, email, and password.'
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Use at least 8 characters.'
      );
      return;
    }

    if (requestedRole === 'admin') {
      Alert.alert(
        'Administrator accounts',
        'Administrator access must be created by an existing platform administrator.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/users/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: normalizedName,
            email: normalizedEmail,
            password,
            role: requestedRole,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        Alert.alert(
          'Unable to create account',
          data?.detail ||
            data?.message ||
            'Please review your information and try again.'
        );
        return;
      }

const authToken =
  data?.token ||
  data?.access_token ||
  data?.accessToken;

const returnedUser =
  data?.user || {};

const returnedRole =
  data?.role ||
  returnedUser?.role ||
  requestedRole;

if (!authToken) {
  console.log('Registration response:', data);

  Alert.alert(
    'Account created',
    'Your account was created, but the server did not return a login token. Please sign in.'
  );

  setMode('login');
  return;
}

setUser({
  id:
    data?.user_id ||
    returnedUser?.id,
  role: returnedRole,
  full_name:
    data?.full_name ||
    returnedUser?.full_name ||
    returnedUser?.name ||
    normalizedName,
  email:
    data?.email ||
    returnedUser?.email ||
    normalizedEmail,
});

setToken(authToken);

requestAnimationFrame(() => {
  navigation.reset({
    index: 0,
    routes: [
      {
        name:
          returnedRole === 'producer'
            ? 'VendorMain'
            : 'Main',
      },
    ],
  });
});      
    } catch (error) {
      console.error('Registration error:', error);

      Alert.alert(
        'Connection error',
        'We could not reach the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    if (mode === 'login') {
      handleLogin();
      return;
    }

    handleRegister();
  }

  function openPrivacy() {
    Linking.openURL(
      'https://from-our-place.chronos-ai.net/privacy'
    ).catch((error) => {
      console.error('Unable to open privacy policy:', error);
    });
  }

  function openTerms() {
    Linking.openURL(
      'https://from-our-place.chronos-ai.net/terms'
    ).catch((error) => {
      console.error('Unable to open terms:', error);
    });
  }

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_app_login.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />

          <KeyboardAvoidingView
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }
            style={styles.keyboardView}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.topRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons
                    name="chevron-back"
                    size={25}
                    color={COLORS.brown}
                  />
                </TouchableOpacity>

                <View style={styles.accessBadge}>
                  <Ionicons
                    name={getRoleIcon()}
                    size={15}
                    color={COLORS.forest}
                  />

                  <Text style={styles.accessBadgeText}>
                    {getRoleLabel()}
                  </Text>
                </View>
              </View>

              <View style={styles.brandBlock}>
                <Image
                  source={require('../assets/logo/from-our-place-transparent.png')}
                  resizeMode="contain"
                  style={styles.brandLogo}
                />
              </View>

              <View style={styles.card}>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.segment,
                      mode === 'login' &&
                        styles.segmentActive,
                    ]}
                    onPress={() => setMode('login')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        mode === 'login' &&
                          styles.segmentTextActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.segment,
                      mode === 'register' &&
                        styles.segmentActive,
                    ]}
                    onPress={() => setMode('register')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        mode === 'register' &&
                          styles.segmentTextActive,
                      ]}
                    >
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardTitle}>
                  {mode === 'login'
                    ? 'Welcome back'
                    : requestedRole === 'producer'
                      ? 'Create your producer account'
                      : 'Create your account'}
                </Text>

                <Text style={styles.cardSubtitle}>
                  {mode === 'login'
                    ? 'Enter your information to continue.'
                    : requestedRole === 'producer'
                      ? 'Join the marketplace and begin setting up your local business.'
                      : 'Join the marketplace and discover local goods near you.'}
                </Text>

                {mode === 'register' && (
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Full name
                    </Text>

                    <View style={styles.inputShell}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={COLORS.forest}
                      />

                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Your full name"
                        placeholderTextColor={
                          COLORS.subText
                        }
                        autoCapitalize="words"
                        style={styles.input}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Email
                  </Text>

                  <View style={styles.inputShell}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.forest}
                    />

                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={
                        COLORS.subText
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Password
                  </Text>

                  <View style={styles.inputShell}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.forest}
                    />

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={
                        COLORS.subText
                      }
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.input}
                    />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={21}
                        color={COLORS.forest}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {mode === 'login' && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.forgotButton}
                    onPress={() =>
                      Alert.alert(
                        'Password reset',
                        'Password reset support will be connected next.'
                      )
                    }
                  >
                    <Text style={styles.forgotText}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[
                    styles.primaryButton,
                    loading &&
                      styles.primaryButtonDisabled,
                  ]}
                  disabled={loading}
                  onPress={submit}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading
                      ? 'Please wait...'
                      : mode === 'login'
                        ? 'Sign In'
                        : 'Create Account'}
                  </Text>

                  {!loading && (
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.white}
                    />
                  )}
                </TouchableOpacity>

                {mode === 'register' ? (
                  <View style={styles.legalRow}>
                    <Text style={styles.legalText}>
                      By creating an account, you agree
                      to our{' '}
                    </Text>

                    <TouchableOpacity onPress={openPrivacy}>
                      <Text style={styles.legalLink}>
                        Privacy Policy
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.legalText}>
                      {' '}and{' '}
                    </Text>

                    <TouchableOpacity onPress={openTerms}>
                      <Text style={styles.legalLink}>
                        Terms of Use
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.dividerRow}>
                      <View style={styles.divider} />

                      <Text style={styles.dividerText}>
                        or
                      </Text>

                      <View style={styles.divider} />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.84}
                      style={styles.accessSwitchButton}
                      onPress={() =>
                        navigation.navigate('Welcome')
                      }
                    >
                      <View style={styles.switchIcon}>
                        <Ionicons
                          name="swap-horizontal-outline"
                          size={21}
                          color={COLORS.forest}
                        />
                      </View>

                      <View style={styles.switchCopy}>
                        <Text style={styles.switchTitle}>
                          Use a different portal
                        </Text>

                        <Text style={styles.switchSubtitle}>
                          Return to access options
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={21}
                        color={COLORS.forest}
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={styles.footer}>
                From Our Place · Powered by Chronos AI
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
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

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  topRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...SHADOWS.soft,
  },

  accessBadge: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.94)',
    ...SHADOWS.soft,
  },

  accessBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.forest,
  },

  brandBlock: {
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  brandLogo: {
    width: '84%',
    height: 128,
    tintColor: '#FFFFFF',
  },

  card: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(252,250,247,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    ...SHADOWS.medium,
  },

  segmentedControl: {
    height: 50,
    padding: 5,
    borderRadius: 25,
    flexDirection: 'row',
    backgroundColor: 'rgba(74,103,65,0.08)',
  },

  segment: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },

  segmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.subText,
  },

  segmentTextActive: {
    color: COLORS.forest,
  },

  cardTitle: {
    marginTop: 20,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.brown,
  },

  cardSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subText,
  },

  field: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.brown,
  },

  inputShell: {
    minHeight: 56,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },

  input: {
    flex: 1,
    marginLeft: 11,
    paddingVertical: 14,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.brown,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    marginBottom: 16,
  },

  forgotText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  primaryButton: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: COLORS.forest,
    ...SHADOWS.medium,
  },

  primaryButtonDisabled: {
    opacity: 0.62,
  },

  primaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.white,
  },

  legalRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  legalText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.subText,
  },

  legalLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.forest,
  },

  dividerRow: {
    marginVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },

  dividerText: {
    marginHorizontal: 12,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.subText,
  },

  accessSwitchButton: {
    minHeight: 68,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },

  switchIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.10)',
  },

  switchCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  switchTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.brown,
  },

  switchSubtitle: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subText,
  },

  footer: {
    marginTop: 16,
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.84)',
  },
});