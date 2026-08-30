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
  const [
    termsAccepted, 
    setTermsAccepted, 
  ] = useState(false);

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

    if (!termsAccepted) {
      Alert.alert(
        'Agreement required',
        'Please agree to the Terms of Use and Privacy Policy before creating your account.'
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
            terms_accepted: termsAccepted,
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
      source={require('../assets/backgrounds/bg_welcome.jpg')}
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
                    onPress={() => {
                      setMode('login');
                      setTermsAccepted(false);
                    }}
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
                    (
                      loading ||
                      (
                        mode === 'register' &&
                        !termsAccepted
                      )
                    ) &&
                      styles.primaryButtonDisabled,
                  ]}
                  disabled={
                    loading ||
                    (
                      mode === 'register' &&
                      !termsAccepted
                    )
                  }
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
                  <View style={styles.legalAgreement}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.checkboxRow}
                      onPress={() =>
                        setTermsAccepted(
                          current => !current
                        )
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          termsAccepted &&
                            styles.checkboxChecked,
                        ]}
                      >
                        {termsAccepted && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={COLORS.white}
                          />
                        )}
                      </View>

                      <Text style={styles.agreementText}>
                        I agree to the{' '}
                        <Text
                          style={styles.legalLink}
                          onPress={openTerms}
                        >
                          Terms of Use
                        </Text>
                        {' '}and{' '}
                        <Text
                          style={styles.legalLink}
                          onPress={openPrivacy}
                        >
                          Privacy Policy
                        </Text>
                        .
                      </Text>
                    </TouchableOpacity>

                    {requestedRole === 'producer' && (
                      <Text style={styles.vendorAgreementNote}>
                        Vendor accounts are also subject to marketplace,
                        listing, fulfillment, cancellation, and seller
                        responsibilities described in the Terms of Use.
                      </Text>
                    )}
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },

  topRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    zIndex: 10,
    elevation: 10,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(47,39,22,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
    ...SHADOWS.soft,
  },

  accessBadge: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(47,39,22,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
    ...SHADOWS.soft,
  },

  accessBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#FFF8EA',
  },

  brandBlock: {
    alignSelf: 'center',
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 10,
    marginBottom: 10,

    shadowColor: '#F4C96B',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 1,
  },

  brandLogo: {
    width: '110%',
    height: 190,
  },

  card: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(47,39,22,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.48)',
    ...SHADOWS.medium,
  },

  segmentedControl: {
    height: 42,
    padding: 4,
    borderRadius: 21,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,248,234,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(216,197,106,0.22)',
  },

  segment: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentActive: {
    backgroundColor: 'rgba(250,238,208,0.98)',
    ...SHADOWS.soft,
  },

  segmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: 'rgba(255,248,234,0.68)',
  },

  segmentTextActive: {
    color: COLORS.forest,
  },

  cardTitle: {
    marginTop: 11,
    fontFamily: FONTS.display,
    fontSize: 25,
    lineHeight: 29,
    color: '#FFF8EA',
  },

  cardSubtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
     color: 'rgba(255,248,234,0.80)',
  },

  field: {
    marginBottom: 9,
  },

  label: {
    marginBottom: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#D8C56A',
  },

  inputShell: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(218,194,145,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,238,208,0.98)',
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.brown,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 1,
    marginBottom: 9,
  },

  forgotText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.forest,
  },

  primaryButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 21,
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

  legalAgreement: {
    marginTop: 16,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkbox: {
    width: 24,
    height: 24,
    marginTop: 1,
    marginRight: 10,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  checkboxChecked: {
    backgroundColor: COLORS.forest,
  },

  agreementText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.brownSoft,
  },

  legalLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.forest,
    textDecorationLine: 'underline',
  },

  vendorAgreementNote: {
    marginTop: 9,
    marginLeft: 34,
    fontFamily: FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.brownSoft,
  },

  dividerRow: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(216,197,106,0.22)',
  },

  dividerText: {
    marginHorizontal: 12,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,248,234,0.65)',
  },

  accessSwitchButton: {
    minHeight: 58,
    paddingHorizontal: 13,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(218,194,145,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,238,208,0.98)',
    ...SHADOWS.soft,
  },

  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,103,65,0.12)',
  },

  switchCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  switchTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.forest,
  },

  switchSubtitle: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.brownSoft,
  },

  footer: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.84)',
  },
});