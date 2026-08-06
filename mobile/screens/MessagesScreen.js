import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS } from '../constants/assets';

export default function MessagesScreen({ API, token, user, cart, navigation, route }) {
  const { producer } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const path = producer?.id ? `/api/messages?producer_id=${producer.id}` : '/api/messages';
      const res = await fetch(`${API}${path}`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  }

  async function send() {
    if (!body.trim()) return;
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ producer_id: producer?.id, body })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to send message.');
      setBody('');
      load();
    } catch (e) {
      Alert.alert('Message failed', e.message || 'Please try again.');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <SafeAreaView style={styles.safe}>
        <AppHeader user={user} cart={cart} navigation={navigation} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.forest} /><Text style={styles.muted}>Loading messages...</Text></View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item, idx) => String(item.id || idx)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<><Text style={styles.eyebrow}>Messages</Text><Text style={styles.title}>{producer?.shop_name || 'Vendor messages'}</Text></>}
            ListEmptyComponent={<EmptyState image={IMAGE_ASSETS.vendor.default} title="No messages yet" message="Ask a vendor about products, pickup, delivery, or custom market items." />}
            renderItem={({ item }) => (
              <View style={[styles.msg, item.sender_id === user?.id && styles.mine]}>
                <Text style={styles.msgText}>{item.body || item.message}</Text>
                {!!item.created_at && <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>}
              </View>
            )}
            ListFooterComponent={
              <View style={styles.composer}>
                <FormField value={body} onChangeText={setBody} placeholder="Write a message..." multiline />
                <AppButton title="Send Message" onPress={send} style={{ marginTop: 12 }} />
              </View>
            }
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
  msg: { backgroundColor: COLORS.warmWhite, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, ...SHADOWS.soft },
  mine: { backgroundColor: COLORS.sageSoft },
  msgText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, lineHeight: 21 },
  date: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.brownSoft, marginTop: 8 },
  composer: { marginTop: 16 },
});
