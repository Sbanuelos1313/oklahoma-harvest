// App.js
// From Our Place V2 full route wiring through Pass 10.

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts as useSatisfy, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useState } from 'react';

import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import CartScreen from './screens/CartScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import LeaveReviewScreen from './screens/LeaveReviewScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProducerScreen from './screens/ProducerScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import WelcomeScreen from './screens/WelcomeScreen';

import VendorDashboardScreen from './screens/vendor/VendorDashboardScreen';
import VendorProductsScreen from './screens/vendor/VendorProductsScreen';
import VendorOrdersScreen from './screens/vendor/VendorOrdersScreen';
import VendorProfileScreen from './screens/vendor/VendorProfileScreen';
import VendorStoreSetupScreen from './screens/vendor/VendorStoreSetupScreen';
import VendorAddProductScreen from './screens/vendor/VendorAddProductScreen';
import VendorEditProductScreen from './screens/vendor/VendorEditProductScreen';
import VendorEditStoreScreen from './screens/vendor/VendorEditStoreScreen';

import { COLORS, FONTS, SHADOWS } from './constants/theme';
import { IMAGE_ASSETS } from './constants/assets';

const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

const API = 'https://from-our-place.chronos-ai.net';

const STRIPE_KEY = 'pk_live_your_key_here';

function TabIcon({ source, focused }) {
  return (
    <View style={{
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused  ? 'rgba(74,103,65,0.14)'  : 'transparent',
    }}>
      <Image source={source} style={{ width: 24, height: 24, opacity: focused ? 1 : 0.62 }} resizeMode="contain" />
    </View>
  );
}

const tabScreenOptions = {
  headerShown: false,

  tabBarStyle: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(252,250,247,0.97)',
    borderTopWidth: 0,
    paddingBottom: 10,
    paddingTop: 8,
    ...SHADOWS.medium,
  },

  tabBarActiveTintColor: COLORS.forest,
  tabBarInactiveTintColor: COLORS.brownSoft,

  tabBarLabelStyle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
};

function CustomerTabs({ token, setToken, user, setUser, cart, setCart }) {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Shop', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.home} /> }}>
        {props => <HomeScreen {...props} API={API} token={token} user={user} cart={cart} setCart={setCart} />}
      </Tab.Screen>

      <Tab.Screen name="Search" options={{ tabBarLabel: 'Discover', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.search} /> }}>
        {props => <SearchScreen {...props} API={API} token={token} user={user} cart={cart} setCart={setCart} />}
      </Tab.Screen>

      <Tab.Screen name="Cart" options={{ tabBarLabel: 'Cart', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.cart} /> }}>
        {props => <CartScreen {...props} API={API} token={token} user={user} cart={cart} setCart={setCart} />}
      </Tab.Screen>

      <Tab.Screen name="Orders" options={{ tabBarLabel: 'Orders', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.orders} /> }}>
        {props => <OrdersScreen {...props} API={API} token={token} user={user} cart={cart} />}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.profile} /> }}>
        {props => <ProfileScreen {...props} API={API} token={token} setToken={setToken} user={user} setUser={setUser} cart={cart} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function VendorTabs({ token, setToken, user, setUser }) {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="VendorDashboard" options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.home} /> }}>
        {props => <VendorDashboardScreen {...props} API={API} token={token} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="VendorProducts" options={{ tabBarLabel: 'Products', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.vendor} /> }}>
        {props => <VendorProductsScreen {...props} API={API} token={token} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="VendorOrders" options={{ tabBarLabel: 'Orders', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.orders} /> }}>
        {props => <VendorOrdersScreen {...props} API={API} token={token} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="VendorProfile" options={{ tabBarLabel: 'Store', tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={IMAGE_ASSETS.icons.profile} /> }}>
        {props => <VendorProfileScreen {...props} API={API} token={token} user={user} setToken={setToken} setUser={setUser} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,
    DMSans_400Regular,
    DMSans_700Bold,
  });
  const [satisfyLoaded] = useSatisfy({ Satisfy_400Regular });

  if (!fontsLoaded || !satisfyLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.forest} />
      </View>
    );
  }

  const isVendor = user?.role === 'producer';

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_KEY}>
        <StatusBar style="dark" backgroundColor={COLORS.cream} />
<NavigationContainer>
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Welcome">
      {props => (
        <WelcomeScreen
          {...props}
        />
      )}
    </Stack.Screen>

    <Stack.Screen name="Auth">
      {props => (
        <AuthScreen
          {...props}
          API={API}
          setToken={setToken}
          setUser={setUser}
        />
      )}
    </Stack.Screen>

    {token && isVendor && (
      <>
        <Stack.Screen name="VendorMain">
          {props => (
            <VendorTabs
              {...props}
              token={token}
              setToken={setToken}
              user={user}
              setUser={setUser}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VendorStoreSetup">
          {props => (
            <VendorStoreSetupScreen
              {...props}
              API={API}
              token={token}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VendorAddProduct">
          {props => (
            <VendorAddProductScreen
              {...props}
              API={API}
              token={token}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VendorEditProduct">
          {props => (
            <VendorEditProductScreen
              {...props}
              API={API}
              token={token}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VendorEditStore">
          {props => (
            <VendorEditStoreScreen
              {...props}
              API={API}
              token={token}
            />
          )}
        </Stack.Screen>
      </>
    )}

    {token && !isVendor && (
      <>
        <Stack.Screen name="Main">
          {props => (
            <CustomerTabs
              {...props}
              token={token}
              setToken={setToken}
              user={user}
              setUser={setUser}
              cart={cart}
              setCart={setCart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Producer">
          {props => (
            <ProducerScreen
              {...props}
              API={API}
              token={token}
              cart={cart}
              setCart={setCart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProductDetail">
          {props => (
            <ProductDetailScreen
              {...props}
              cart={cart}
              setCart={setCart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="OrderConfirmation">
          {props => (
            <OrderConfirmationScreen
              {...props}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="OrderDetail">
          {props => (
            <OrderDetailScreen
              {...props}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="LeaveReview">
          {props => (
            <LeaveReviewScreen
              {...props}
              API={API}
              token={token}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Favorites">
          {props => (
            <FavoritesScreen
              {...props}
              API={API}
              token={token}
              user={user}
              cart={cart}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Settings">
          {props => (
            <SettingsScreen
              {...props}
              API={API}
              token={token}
              user={user}
              setUser={setUser}
              cart={cart}
            />
          )}
        </Stack.Screen>
      </>
    )}
  </Stack.Navigator>
</NavigationContainer>
    </StripeProvider>
    </SafeAreaProvider>
  );
}
