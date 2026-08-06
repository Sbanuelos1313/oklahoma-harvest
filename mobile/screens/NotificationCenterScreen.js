import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function NotificationCenterScreen({ API, token, user, cart, navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.forest} /><Text style={styles.muted}>Loading notifications...</Text></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, idx) => String(item.id || idx)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<><Text style={styles.eyebrow}>Updates</Text><Text style={styles.title}>Notifications</Text></>}
            ListEmptyComponent={<EmptyState image={IMAGE_ASSETS.hero.home} title="No notifications yet" message="Order updates, vendor messages, and marketplace announcements will appear here." buttonTitle="Back to Home" onPress={() => navigation.navigate('Main', { screen: 'Home' })} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.itemTitle}>{item.title || 'Marketplace update'}</Text>
                  <StatusBadge status={item.read ? 'fulfilled' : 'pending'} label={item.read ? 'Read' : 'New'} />
                </View>
                <Text style={styles.body}>{item.body || item.message || 'You have a From Our Place update.'}</Text>
                {!!item.created_at && <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>}
              </View>
            )}
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
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.sage, marginTop: 8 },
  title: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.forestDark, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, ...SHADOWS.soft },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.forestDark },
  body: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.brown, marginTop: 8 },
  date: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.brownSoft, marginTop: 10 },
});
