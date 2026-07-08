import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Alert, Share } from 'react-native';
import AppButton from '../components/AppButton';
import QuantitySelector from '../components/QuantitySelector';
import FavoriteButton from '../components/FavoriteButton';
import RatingBadge from '../components/RatingBadge';
import ProductCard from '../components/ProductCard';
import { COLORS, FONTS, LAYOUT, RADIUS, SHADOWS } from '../constants/theme';
import { IMAGE_ASSETS, CATEGORY_ASSETS } from '../constants/assets';

export default function ProductDetailScreen({ route, navigation, cart, setCart }) {
  const { product, producer, relatedProducts = [] } = route.params || {};
  const [qty, setQty] = useState(1);

  const productImage = product?.image_url ? { uri: product.image_url } : IMAGE_ASSETS.products.default;
  const vendorName = producer?.shop_name || product?.shop_name || 'Local Vendor';
  const category = CATEGORY_ASSETS.find(c => c.key === product?.category);
  const total = Number(product?.price || 0) * qty;

  const badges = useMemo(() => {
    const base = [];
    if (product?.category) base.push(category?.label || product.category);
    if (product?.quantity_available !== undefined && product.quantity_available <= 5) base.push('Limited Quantity');
    if (producer?.fulfillment_pickup || product?.fulfillment_pickup) base.push('Pickup Available');
    if (producer?.fulfillment_delivery || product?.fulfillment_delivery) base.push('Delivery Available');
    return base.slice(0, 4);
  }, [product, producer, category]);

  function addToCart() {
    if (!product) return;
    const producerId = producer?.id || product.producer_id;
    if (cart && cart.producer_id !== producerId) {
      Alert.alert('Replace cart?', 'Your cart has items from another vendor. One checkout can include items from one vendor at a time.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: createCart }
      ]);
      return;
    }
    createCart();
  }

  function createCart() {
    const producerId = producer?.id || product.producer_id;
    const newCart = cart
      ? { ...cart, items: [...cart.items] }
      : { producer_id: producerId, producer_name: vendorName, tax_rate: producer?.tax_rate || 0.08375, delivery_fee: producer?.delivery_fee || 0, items: [] };

    const existing = newCart.items.find(i => i.product_id === product.id);
    if (existing) existing.quantity += qty;
    else newCart.items.push({ product_id: product.id, name: product.name, price: product.price, unit: product.unit, quantity: qty, image_url: product.image_url });

    setCart(newCart);
    Alert.alert('Added to cart', `${product.name} was added to your cart.`);
  }

  async function shareProduct() {
    try {
      await Share.share({ message: `Check out ${product?.name || 'this product'} from ${vendorName} on From Our Place.` });
    } catch {}
  }

  if (!product) {
    return <View style={styles.root}><SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.name}>Product unavailable</Text><AppButton title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 16 }} /></View></SafeAreaView></View>;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.forestDark} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Image source={productImage} style={styles.heroImage} />
            <View style={styles.heroOverlay} />
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Image source={IMAGE_ASSETS.icons.back} style={styles.backIcon} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <FavoriteButton />
              <TouchableOpacity style={styles.shareBtn} onPress={shareProduct}><Text style={styles.shareText}>Share</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.badgeRow}>{badges.map(b => <Text key={b} style={styles.badge}>{b}</Text>)}</View>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => producer && navigation.navigate('Producer', { producer })}>
              <Text style={styles.vendor}>by {vendorName}</Text>
            </TouchableOpacity>
            <View style={styles.ratingRow}>
              <RatingBadge rating={producer?.avg_rating || product?.avg_rating || 0} count={producer?.review_count || product?.review_count || 0} />
            </View>

            <View style={styles.priceCard}>
              <View>
                <Text style={styles.price}>${Number(product.price || 0).toFixed(2)}</Text>
                <Text style={styles.unit}>per {product.unit}</Text>
              </View>
              <QuantitySelector quantity={qty} onDecrease={() => setQty(Math.max(1, qty - 1))} onIncrease={() => setQty(qty + 1)} />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>About this item</Text>
              <Text style={styles.description}>{product.description || 'This local product is available from a From Our Place vendor. Add it to your cart for pickup, delivery, or shipping where available.'}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Meet the maker</Text>
              <View style={styles.makerRow}>
                <Image source={producer?.profile_image_url ? { uri: producer.profile_image_url } : IMAGE_ASSETS.vendor.default} style={styles.makerImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.makerName}>{vendorName}</Text>
                  <Text style={styles.makerSub}>{producer?.city || product?.city || 'Local vendor'}{producer?.state ? `, ${producer.state}` : ''}</Text>
                </View>
              </View>
              <Text style={styles.description}>{producer?.bio || producer?.description || 'This vendor is part of the From Our Place marketplace, helping customers discover local goods and community makers.'}</Text>
              {producer && <AppButton title="Visit Store" variant="secondary" onPress={() => navigation.navigate('Producer', { producer })} style={{ marginTop: 14 }} />}
            </View>

            {!!relatedProducts.length && (
              <View>
                <Text style={styles.relatedTitle}>More from this vendor</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
                  {relatedProducts.filter(p => p.id !== product.id).slice(0, 8).map(item => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      onPress={() => navigation.replace('ProductDetail', { product: item, producer, relatedProducts })}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.stickyBar}>
          <View><Text style={styles.stickyLabel}>Total</Text><Text style={styles.stickyPrice}>${total.toFixed(2)}</Text></View>
          <AppButton title="Add to Cart" onPress={addToCart} style={styles.stickyBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.cream}, safe:{flex:1,backgroundColor:COLORS.forestDark}, center:{flex:1,alignItems:'center',justifyContent:'center',padding:LAYOUT.screenPadding}, scroll:{paddingBottom:118},
  hero:{height:390,backgroundColor:COLORS.forestDark}, heroImage:{width:'100%',height:'100%'}, heroOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(23,50,31,0.14)'},
  backBtn:{position:'absolute',top:16,left:18,width:44,height:44,borderRadius:22,backgroundColor:'rgba(250,248,243,0.94)',alignItems:'center',justifyContent:'center'}, backIcon:{width:24,height:24},
  heroActions:{position:'absolute',top:16,right:18,flexDirection:'row',gap:10}, shareBtn:{height:44,borderRadius:22,backgroundColor:'rgba(250,248,243,0.94)',paddingHorizontal:16,alignItems:'center',justifyContent:'center',...SHADOWS.soft}, shareText:{fontFamily:FONTS.bodyBold,color:COLORS.forest,fontSize:13},
  body:{backgroundColor:COLORS.cream,borderTopLeftRadius:32,borderTopRightRadius:32,marginTop:-30,paddingHorizontal:LAYOUT.screenPadding,paddingTop:22,paddingBottom:24},
  badgeRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14}, badge:{fontFamily:FONTS.bodyBold,fontSize:11,color:COLORS.forest,backgroundColor:COLORS.sageSoft,borderRadius:RADIUS.pill,paddingHorizontal:10,paddingVertical:6,overflow:'hidden'},
  name:{fontFamily:FONTS.display,fontSize:36,lineHeight:42,color:COLORS.forestDark}, vendor:{fontFamily:FONTS.bodyBold,fontSize:14,color:COLORS.sage,marginTop:8}, ratingRow:{marginTop:12},
  priceCard:{marginTop:18,backgroundColor:COLORS.warmWhite,borderRadius:RADIUS.xl,borderWidth:1,borderColor:COLORS.border,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',...SHADOWS.soft},
  price:{fontFamily:FONTS.display,fontSize:32,color:COLORS.forest}, unit:{fontFamily:FONTS.bodyBold,fontSize:12,color:COLORS.brownSoft,marginTop:2},
  sectionCard:{marginTop:18,backgroundColor:COLORS.warmWhite,borderRadius:RADIUS.xl,borderWidth:1,borderColor:COLORS.border,padding:18,...SHADOWS.soft}, sectionTitle:{fontFamily:FONTS.display,fontSize:25,color:COLORS.forestDark}, description:{fontFamily:FONTS.body,fontSize:14,lineHeight:22,color:COLORS.brown,marginTop:9},
  makerRow:{flexDirection:'row',alignItems:'center',gap:12,marginTop:14}, makerImage:{width:62,height:62,borderRadius:22,backgroundColor:COLORS.beige}, makerName:{fontFamily:FONTS.bodyBold,fontSize:16,color:COLORS.forestDark}, makerSub:{fontFamily:FONTS.body,fontSize:12,color:COLORS.brownSoft,marginTop:3},
  relatedTitle:{fontFamily:FONTS.display,fontSize:25,color:COLORS.forestDark,marginTop:24,marginBottom:12}, relatedList:{gap:14,paddingRight:18},
  stickyBar:{position:'absolute',left:14,right:14,bottom:12,minHeight:76,borderRadius:28,backgroundColor:COLORS.warmWhite,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,gap:16,...SHADOWS.card},
  stickyLabel:{fontFamily:FONTS.bodyBold,fontSize:11,color:COLORS.brownSoft}, stickyPrice:{fontFamily:FONTS.display,fontSize:25,color:COLORS.forest}, stickyBtn:{flex:1},
});
