import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts as useSatisfy, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import CartScreen from './screens/CartScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProducerScreen from './screens/ProducerScreen';
import AuthScreen from './screens/AuthScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import { useState } from 'react';
import { FONTS, COLORS } from './constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const API = 'https://from-our-place-api.onrender.com';
const STRIPE_KEY = 'pk_live_your_key_here';

function HomeTabs({ token, setToken, user, setUser, cart, setCart }) {
  const authProps = { token, setToken, user, setUser, API };
  const cartProps = { cart, setCart };
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FAF5ED',
          borderTopColor: 'rgba(45,26,14,0.12)',
          height: 65, paddingBottom: 10, paddingTop: 6,
        },
        tabBarActiveTintColor: '#4A6741',
        tabBarInactiveTintColor: '#9C7A50',
        tabBarLabelStyle: { fontFamily: FONTS.body, fontSize: 11 },
      }}>
      <Tab.Screen
        name="Home"
        options={{ tabBarLabel: 'Shop', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text> }}>
        {props => <HomeScreen {...props} {...authProps} {...cartProps} />}
      </Tab.Screen>
      <Tab.Screen
        name="Search"
        options={{ tabBarLabel: 'Search', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🔍</Text> }}>
        {props => <SearchScreen {...props} {...authProps} {...cartProps} />}
      </Tab.Screen>
      <Tab.Screen
        name="Cart"
        options={{ tabBarLabel: 'Cart', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🛒</Text> }}>
        {props => <CartScreen {...props} {...authProps} {...cartProps} />}
      </Tab.Screen>
      <Tab.Screen
        name="Orders"
        options={{ tabBarLabel: 'Orders', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📋</Text> }}>
        {props => <OrdersScreen {...props} {...authProps} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text> }}>
        {props => <ProfileScreen {...props} {...authProps} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold, PlayfairDisplay_400Regular,
    DMSans_400Regular, DMSans_700Bold,
  });
  const [satisfyLoaded] = useSatisfy({ Satisfy_400Regular });

  if (!fontsLoaded || !satisfyLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#D4C4A8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4A6741" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_KEY}>
        <StatusBar style="dark" backgroundColor="#D4C4A8" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!token ? (
              <>
                <Stack.Screen name="Welcome">
                  {props => <WelcomeScreen {...props} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {props => <AuthScreen {...props} API={API} setToken={setToken} setUser={setUser} />}
                </Stack.Screen>
              </>
            ) : (
              <>
                <Stack.Screen name="Main">
                  {props => <HomeTabs {...props} token={token} setToken={setToken} user={user} setUser={setUser} cart={cart} setCart={setCart} />}
                </Stack.Screen>
                <Stack.Screen name="Producer">
                  {props => <ProducerScreen {...props} API={API} token={token} cart={cart} setCart={setCart} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </SafeAreaProvider>
  );
}