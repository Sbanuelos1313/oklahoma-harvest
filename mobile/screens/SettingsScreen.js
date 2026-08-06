import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import FormField from '../components/FormField';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';

export default function SettingsScreen({ API, token, user, setUser, cart, navigation }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [zipCode, setZipCode] = useState(user?.zip_code || '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, zip_code: zipCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to save profile.');
      setUser({ ...user, full_name: fullName, email, zip_code: zipCode });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Unable to save', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <FormField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
            <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
            <FormField label="Zip code" value={zipCode} onChangeText={setZipCode} placeholder="Zip code" keyboardType="numeric" />
            <AppButton title="Save Changes" onPress={save} loading={loading} style={{ marginTop: 18 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 8 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
  cardTitle: { fontFamily: FONTS.display, fontSize: 25, color: COLORS.forestDark },
});
