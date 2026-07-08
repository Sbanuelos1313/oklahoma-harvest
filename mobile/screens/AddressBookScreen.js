import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';
import AddressCard from '../components/AddressCard';
import { COLORS, FONTS, LAYOUT } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function AddressBookScreen({ API, token, user, cart, navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/addresses`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setAddresses([]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.forest} /><Text style={styles.muted}>Loading addresses...</Text></View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item, idx) => String(item.id || idx)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<View style={styles.header}><Text style={styles.eyebrow}>Delivery</Text><Text style={styles.title}>Address book</Text><AppButton title="Add Address Coming Next" onPress={() => Alert.alert('Coming next', 'Address creation will connect to the backend endpoint next.')} style={{ marginTop: 14 }} /></View>}
            ListEmptyComponent={<EmptyState image={IMAGE_ASSETS.hero.checkout} title="No saved addresses" message="Saved addresses will make pickup, delivery, and shipping checkout faster." buttonTitle="Add Address Coming Next" onPress={() => {}} />}
            renderItem={({ item }) => <AddressCard address={item} onEdit={() => Alert.alert('Coming next', 'Edit address will be wired next.')} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: FONTS.body, color: COLORS.brownSoft, marginTop: 10 },
  list: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 118 },
  header: { marginTop: 8, marginBottom: 16 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4 },
});
