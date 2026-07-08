import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../../constants/theme';
import { IMAGE_ASSETS } from '../../constants/assets';

export default function VendorDashboardScreen({ API, token, user, navigation }) {
  const [shop,setShop]=useState(null), [products,setProducts]=useState([]), [orders,setOrders]=useState([]), [stripe,setStripe]=useState(null), [loading,setLoading]=useState(true);
  useEffect(()=>{ load(); },[]);
  async function load(){
    setLoading(true);
    try{
      const h={Authorization:'Bearer '+token};
      const [s,p,o,st]=await Promise.all([
        fetch(`${API}/api/producers/me`,{headers:h}),
        fetch(`${API}/api/products/my`,{headers:h}),
        fetch(`${API}/api/orders/producer/incoming`,{headers:h}),
        fetch(`${API}/api/stripe/connect/status`,{headers:h})
      ]);
      setShop(s.ok ? await s.json() : null);
      const pd=await p.json(), od=await o.json(), sd=await st.json();
      setProducts(Array.isArray(pd)?pd:[]); setOrders(Array.isArray(od)?od:[]); setStripe(sd);
    }catch{ setShop(null); setProducts([]); setOrders([]); }
    setLoading(false);
  }
  async function startStripe(){
    try{
      const res=await fetch(`${API}/api/stripe/connect/onboard`,{method:'POST',headers:{Authorization:'Bearer '+token}});
      const data=await res.json();
      if(data?.onboarding_url) Linking.openURL(data.onboarding_url);
      else Alert.alert('Stripe', data?.message || 'Stripe is already set up.');
    }catch{ Alert.alert('Stripe', 'Unable to start onboarding.'); }
  }
  if(loading) return <View style={styles.root}><SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.forest}/><Text style={styles.muted}>Loading vendor dashboard...</Text></SafeAreaView></View>;
  if(!shop) return <View style={styles.root}><SafeAreaView style={styles.empty}><EmptyState image={IMAGE_ASSETS.vendor.storefront} title="Set up your vendor store" message="Create your storefront so customers can discover and buy from you." buttonTitle="Store Setup Coming Next" onPress={()=>{}} /></SafeAreaView></View>;
  const pending=orders.filter(o=>o.status==='pending').length, active=products.filter(p=>p.is_active).length, total=orders.reduce((s,o)=>s+Number(o.total||0),0);
  const img=shop.profile_image_url?{uri:shop.profile_image_url}:IMAGE_ASSETS.vendor.storefront;
  return <View style={styles.root}><StatusBar barStyle="light-content" backgroundColor={COLORS.forestDark}/><SafeAreaView style={styles.root}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}><Image source={img} style={styles.heroImg}/><View style={styles.overlay}/><View style={styles.heroCopy}><Text style={styles.eyebrow}>Vendor dashboard</Text><Text style={styles.titleLight}>{shop.shop_name}</Text><Text style={styles.heroSub}>{shop.admin_approved?'Live on From Our Place':'Pending approval'}</Text></View></View>
      <View style={styles.stats}><Stat value={pending} label="Pending"/><Stat value={active} label="Products"/><Stat value={`$${total.toFixed(0)}`} label="Open Value"/></View>
      <Card title="Store health">
        <Health ok={shop.admin_approved} title="Admin approval" sub={shop.admin_approved?'Your store is visible to customers.':'Waiting on platform approval.'}/>
        <Health ok={stripe?.onboarding_complete} title="Stripe payouts" sub={stripe?.onboarding_complete?'Payouts are enabled.':'Complete onboarding to receive payments.'}/>
        {!stripe?.onboarding_complete && <AppButton title="Set Up Stripe" onPress={startStripe} style={{marginTop:14}}/>}
      </Card>
      <Card title="Recent orders" action="View all" onAction={()=>navigation.navigate('VendorOrders')}>
        {orders.slice(0,4).map(o=><Row key={o.id} left={`Order #${o.id}`} sub={`${o.shopper_name} · ${o.fulfillment_type}`} right={`$${Number(o.total||0).toFixed(2)}`} small={o.status}/>)}
        {!orders.length && <Text style={styles.muted}>Orders will appear here after customers purchase.</Text>}
      </Card>
      <Card title="Inventory" action="Manage" onAction={()=>navigation.navigate('VendorProducts')}>
        {products.slice(0,5).map(p=><Row key={p.id} left={p.name} sub={`${p.quantity_available} available · $${Number(p.price||0).toFixed(2)}`} right={p.is_active?'Active':'Hidden'}/>)}
        {!products.length && <Text style={styles.muted}>Add products to begin selling.</Text>}
      </Card>
    </ScrollView>
  </SafeAreaView></View>;
}
function Stat({value,label}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function Card({title,children,action,onAction}){return <View style={styles.card}><View style={styles.cardHead}><Text style={styles.cardTitle}>{title}</Text>{action&&<TouchableOpacity onPress={onAction}><Text style={styles.link}>{action}</Text></TouchableOpacity>}</View>{children}</View>}
function Health({ok,title,sub}){return <View style={styles.health}><View style={[styles.dot,ok&&styles.dotOk]}/><View style={{flex:1}}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{sub}</Text></View></View>}
function Row({left,sub,right,small}){return <View style={styles.row}><View style={{flex:1}}><Text style={styles.rowTitle}>{left}</Text><Text style={styles.rowSub}>{sub}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.rowRight}>{right}</Text>{small&&<Text style={styles.rowSmall}>{small}</Text>}</View></View>}
const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.cream}, center:{flex:1,alignItems:'center',justifyContent:'center'}, empty:{flex:1,padding:LAYOUT.screenPadding,justifyContent:'center'}, muted:{fontFamily:FONTS.body,color:COLORS.brownSoft,marginTop:10}, scroll:{paddingBottom:118},
  hero:{height:310,backgroundColor:COLORS.forestDark}, heroImg:{width:'100%',height:'100%'}, overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(23,50,31,.42)'}, heroCopy:{position:'absolute',left:22,right:22,bottom:28}, eyebrow:{fontFamily:FONTS.bodyBold,fontSize:12,color:COLORS.cream,letterSpacing:1.2,textTransform:'uppercase'}, titleLight:{fontFamily:FONTS.display,fontSize:39,lineHeight:45,color:COLORS.warmWhite,marginTop:6}, heroSub:{fontFamily:FONTS.bodyBold,fontSize:14,color:COLORS.cream,marginTop:8},
  stats:{marginTop:-30,paddingHorizontal:LAYOUT.screenPadding,flexDirection:'row',gap:10}, stat:{flex:1,backgroundColor:COLORS.warmWhite,borderRadius:RADIUS.xl,borderWidth:1,borderColor:COLORS.border,padding:14,alignItems:'center',...SHADOWS.card}, statValue:{fontFamily:FONTS.display,fontSize:27,color:COLORS.forest}, statLabel:{fontFamily:FONTS.bodyBold,fontSize:11,color:COLORS.brownSoft,textAlign:'center'},
  card:{marginHorizontal:LAYOUT.screenPadding,marginTop:18,backgroundColor:COLORS.warmWhite,borderRadius:RADIUS.xl,borderWidth:1,borderColor:COLORS.border,padding:16,...SHADOWS.soft}, cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, cardTitle:{fontFamily:FONTS.display,fontSize:24,color:COLORS.forestDark}, link:{fontFamily:FONTS.bodyBold,color:COLORS.sage,fontSize:13},
  health:{flexDirection:'row',gap:12,alignItems:'center',marginTop:14}, dot:{width:14,height:14,borderRadius:7,backgroundColor:COLORS.gold}, dotOk:{backgroundColor:COLORS.success}, row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:13,borderBottomWidth:1,borderBottomColor:COLORS.border}, rowTitle:{fontFamily:FONTS.bodyBold,fontSize:14,color:COLORS.forestDark}, rowSub:{fontFamily:FONTS.body,fontSize:12,color:COLORS.brownSoft,marginTop:3,textTransform:'capitalize'}, rowRight:{fontFamily:FONTS.bodyBold,fontSize:14,color:COLORS.forest}, rowSmall:{fontFamily:FONTS.body,fontSize:11,color:COLORS.brownSoft,marginTop:3,textTransform:'capitalize'}
});
