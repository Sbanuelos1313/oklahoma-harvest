import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AppButton from '../../components/AppButton';
import FormField from '../../components/FormField';
import ToggleRow from '../../components/ToggleRow';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function VendorHoursScreen({ API, token, route, navigation }) {
  const { shop } = route.params || {};
  const [hours, setHours] = useState(shop?.hours || DAYS.reduce((a, d) => ({ ...a, [d]: { open: true, value: '9:00 AM - 5:00 PM' } }), {}));
  const [vacationMode, setVacationMode] = useState(Boolean(shop?.vacation_mode));
  const [loading, setLoading] = useState(false);

  function updateDay(day, patch) {
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/producers/me`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours, vacation_mode: vacationMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to save hours.');
      Alert.alert('Saved', 'Store availability updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to save', e.message || 'Please try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Availability</Text>
          <Text style={styles.title}>Store hours</Text>
          <View style={styles.card}>
            <ToggleRow title="Vacation mode" subtitle="Temporarily pause new orders while keeping your store visible." value={vacationMode} onValueChange={setVacationMode} />
            {DAYS.map(day => (
              <View key={day} style={styles.dayBlock}>
                <ToggleRow title={day} value={Boolean(hours[day]?.open)} onValueChange={(v) => updateDay(day, { open: v })} />
                {hours[day]?.open && <FormField value={hours[day]?.value || ''} onChangeText={(v) => updateDay(day, { value: v })} placeholder="9:00 AM - 5:00 PM" />}
              </View>
            ))}
            <AppButton title="Save Hours" onPress={save} loading={loading} style={{ marginTop: 18 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 60 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 14 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.soft },
  dayBlock: { marginTop: 4 },
});
