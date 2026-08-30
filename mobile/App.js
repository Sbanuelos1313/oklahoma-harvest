// App.js
// From Our Place V2
// Customer + Vendor navigation and shared application state.

import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ActivityIndicator,
  Image,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  StripeProvider,
} from '@stripe/stripe-react-native';

import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular,
} from '@expo-google-fonts/playfair-display';

import {
  DMSans_400Regular,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import {
  useFonts as useSatisfy,
  Satisfy_400Regular,
} from '@expo-google-fonts/satisfy';


// =====================================================
// CUSTOMER SCREENS
// =====================================================

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


// =====================================================
// VENDOR SCREENS
// =====================================================

import VendorDashboardScreen from './screens/vendor/VendorDashboardScreen';
import VendorProductsScreen from './screens/vendor/VendorProductsScreen';
import VendorOrdersScreen from './screens/vendor/VendorOrdersScreen';
import VendorProfileScreen from './screens/vendor/VendorProfileScreen';
import VendorStoreSetupScreen from './screens/vendor/VendorStoreSetupScreen';
import VendorAddProductScreen from './screens/vendor/VendorAddProductScreen';
import VendorEditProductScreen from './screens/vendor/VendorEditProductScreen';
import VendorEditStoreScreen from './screens/vendor/VendorEditStoreScreen';

// =====================================================
// ADMIN SCREENS
// =====================================================

import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';

// =====================================================
// THEME / ASSETS
// =====================================================

import {
  COLORS,
  FONTS,
  SHADOWS,
} from './constants/theme';

import {
  IMAGE_ASSETS,
} from './constants/assets';


// =====================================================
// NAVIGATORS
// =====================================================

const Tab =
  createBottomTabNavigator();

const Stack =
  createNativeStackNavigator();


// =====================================================
// CONFIG
// =====================================================

const API =
  'https://from-our-place.chronos-ai.net';

// =====================================================
// TAB ICON
// =====================================================

function TabIcon({
  source,
  focused,
}) {
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,

        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor:
          focused
            ? 'rgba(74,103,65,0.14)'
            : 'transparent',
      }}
    >
      <Image
        source={source}
        resizeMode="contain"
        style={{
          width: 24,
          height: 24,

          opacity:
            focused
              ? 1
              : 0.62,
        }}
      />
    </View>
  );
}


// =====================================================
// SHARED TAB OPTIONS
// =====================================================

const tabScreenOptions = {
  headerShown: false,

  tabBarStyle: {
    position: 'absolute',

    left: 14,
    right: 14,
    bottom: 12,

    height: 72,

    borderRadius: 28,

    backgroundColor:
      'rgba(252,250,247,0.97)',

    borderTopWidth: 0,

    paddingBottom: 10,
    paddingTop: 8,

    ...SHADOWS.medium,
  },

  tabBarActiveTintColor:
    COLORS.forest,

  tabBarInactiveTintColor:
    COLORS.brownSoft,

  tabBarLabelStyle: {
    fontFamily:
      FONTS.bodyBold,

    fontSize: 11,
  },

  // Styling for numeric tab badges.
  tabBarBadgeStyle: {
    minWidth: 18,
    height: 18,

    borderRadius: 9,

    fontFamily:
      FONTS.bodyBold,

    fontSize: 9,

    color: COLORS.warmWhite,

    backgroundColor:
      COLORS.forest,
  },
};


// =====================================================
// CUSTOMER TABS
// =====================================================

function CustomerTabs({
  token,
  setToken,

  user,
  setUser,

  cart,
  setCart,
}) {
  // ---------------------------------------------------
  // LIVE CART COUNT
  // ---------------------------------------------------

  const cartCount =
    cart?.items?.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item?.quantity || 0
        ),
      0
    ) || 0;


  return (
    <Tab.Navigator
      screenOptions={
        tabScreenOptions
      }
    >
      {/* HOME */}

      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel:
            'Shop',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .home
                }
              />
            ),
        }}
      >
        {props => (
          <HomeScreen
            {...props}

            API={API}

            token={token}
            user={user}

            cart={cart}
            setCart={
              setCart
            }
          />
        )}
      </Tab.Screen>


      {/* SEARCH / DISCOVER */}

      <Tab.Screen
        name="Search"
        options={{
          tabBarLabel:
            'Discover',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .search
                }
              />
            ),
        }}
      >
        {props => (
          <SearchScreen
            {...props}

            API={API}

            token={token}
            user={user}

            cart={cart}
            setCart={
              setCart
            }
          />
        )}
      </Tab.Screen>


      {/* CART */}

      <Tab.Screen
        name="Cart"
        options={{
          tabBarLabel:
            'Cart',

          // ---------------------------------------------
          // SHOW LIVE CART QUANTITY ON BOTTOM TAB
          // ---------------------------------------------

          tabBarBadge:
            cartCount > 0
              ? cartCount
              : undefined,

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .cart
                }
              />
            ),
        }}
      >
        {props => (
          <CartScreen
            {...props}

            API={API}

            token={token}
            user={user}

            cart={cart}
            setCart={
              setCart
            }
          />
        )}
      </Tab.Screen>


      {/* ORDERS */}

      <Tab.Screen
        name="Orders"
        options={{
          tabBarLabel:
            'Orders',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .orders
                }
              />
            ),
        }}
      >
        {props => (
          <OrdersScreen
            {...props}

            API={API}

            token={token}
            user={user}

            cart={cart}
          />
        )}
      </Tab.Screen>


      {/* PROFILE */}

      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel:
            'Profile',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .profile
                }
              />
            ),
        }}
      >
        {props => (
          <ProfileScreen
            {...props}

            API={API}

            token={token}
            setToken={
              setToken
            }

            user={user}
            setUser={
              setUser
            }

            cart={cart}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


// =====================================================
// VENDOR TABS
// =====================================================

function VendorTabs({
  token,
  setToken,

  user,
  setUser,
}) {
  return (
    <Tab.Navigator
      screenOptions={
        tabScreenOptions
      }
    >
      {/* DASHBOARD */}

      <Tab.Screen
        name="VendorDashboard"
        options={{
          tabBarLabel:
            'Dashboard',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .home
                }
              />
            ),
        }}
      >
        {props => (
          <VendorDashboardScreen
            {...props}

            API={API}

            token={token}
            user={user}
          />
        )}
      </Tab.Screen>


      {/* PRODUCTS */}

      <Tab.Screen
        name="VendorProducts"
        options={{
          tabBarLabel:
            'Products',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .vendor
                }
              />
            ),
        }}
      >
        {props => (
          <VendorProductsScreen
            {...props}

            API={API}

            token={token}
            user={user}
          />
        )}
      </Tab.Screen>


      {/* ORDERS */}

      <Tab.Screen
        name="VendorOrders"
        options={{
          tabBarLabel:
            'Orders',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .orders
                }
              />
            ),
        }}
      >
        {props => (
          <VendorOrdersScreen
            {...props}

            API={API}

            token={token}
            user={user}
          />
        )}
      </Tab.Screen>


      {/* STORE PROFILE */}

      <Tab.Screen
        name="VendorProfile"
        options={{
          tabBarLabel:
            'Store',

          tabBarIcon:
            ({
              focused,
            }) => (
              <TabIcon
                focused={
                  focused
                }
                source={
                  IMAGE_ASSETS
                    .icons
                    .profile
                }
              />
            ),
        }}
      >
        {props => (
          <VendorProfileScreen
            {...props}

            API={API}

            token={token}
            user={user}

            setToken={
              setToken
            }

            setUser={
              setUser
            }
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


// =====================================================
// APP
// =====================================================

export default function App() {
  const [
    token,
    setToken,
  ] = useState(null);

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    cart,
    setCart,
  ] = useState(null);

  const [
    stripeKey,
    setStripeKey,
  ] = useState(null);

  const [
    stripeConfigError,
    setStripeConfigError,
  ] = useState(null);


  useEffect(() => {
    let mounted = true;

    async function loadStripeConfiguration() {
      try {
        const response = await fetch(
          `${API}/api/stripe/publishable-key`
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load Stripe configuration.'
          );
        }

        if (
          !data?.key ||
          typeof data.key !== 'string'
        ) {
          throw new Error(
            'Stripe publishable key was not returned by the server.'
          );
        }

        if (
          !data.key.startsWith('pk_')
        ) {
          throw new Error(
            'The server returned an invalid Stripe publishable key.'
          );
        }

        if (mounted) {
          console.log(
            'STRIPE MODE:',
            data.key.startsWith('pk_test_')
              ? 'TEST'
              : data.key.startsWith('pk_live_')
                ? 'LIVE'
                : 'UNKNOWN'
          );

  setStripeKey(data.key);
  setStripeConfigError(null);
}
      } catch (error) {
        console.error(
          'STRIPE CONFIG ERROR:',
          error
        );

        if (mounted) {
          setStripeConfigError(
            error?.message ||
              'Unable to initialize Stripe.'
          );
        }
      }
    }

    loadStripeConfiguration();

    return () => {
      mounted = false;
    };
  }, []);

  console.log(
    '================================='
  );

  console.log(
    'TOKEN:',
    token
  );

  console.log(
    'USER:',
    user
  );

  console.log(
    '================================='
  );


  // ===================================================
  // FONTS
  // ===================================================

  const [
    fontsLoaded,
  ] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,

    DMSans_400Regular,
    DMSans_700Bold,
  });

  const [
    satisfyLoaded,
  ] = useSatisfy({
    Satisfy_400Regular,
  });


if (
  !fontsLoaded ||
  !satisfyLoaded ||
  !stripeKey
) {
  if (stripeConfigError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            COLORS.cream,
          alignItems:
            'center',
          justifyContent:
            'center',
          paddingHorizontal: 28,
        }}
      >
        <Text
          style={{
            fontFamily:
              FONTS.bodyBold,
            fontSize: 15,
            textAlign: 'center',
            color:
              COLORS.brown,
          }}
        >
          Payment configuration
          could not be loaded.
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontFamily:
              FONTS.body,
            fontSize: 12,
            lineHeight: 18,
            textAlign: 'center',
            color:
              COLORS.brownSoft,
          }}
        >
          {stripeConfigError}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          COLORS.cream,
        alignItems:
          'center',
        justifyContent:
          'center',
      }}
    >
      <ActivityIndicator
        color={
          COLORS.forest
        }
      />
    </View>
  );
}

  // ===================================================
  // USER TYPE
  // ===================================================

  const isVendor =
    user?.role ===
    'producer';

  const isAdmin =
    user?.role ===
    'admin';

  const isCustomer =
    user?.role ===
    'shopper';

  // ===================================================
  // ROOT NAVIGATION
  // ===================================================

  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={
          stripeKey
        }
      >
        <StatusBar
          style="dark"
          backgroundColor={
            COLORS.cream
          }
        />

        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >

            {/* =========================================
                WELCOME + AUTH
                Only shown when logged out
            ========================================= */}

            {!token && (
              <>
                <Stack.Screen
                  name="Welcome"
                >
                  {props => (
                    <WelcomeScreen
                      {...props}
                    />
                  )}
                </Stack.Screen>


                <Stack.Screen
                  name="Auth"
                >
                  {props => (
                    <AuthScreen
                      {...props}

                      API={API}

                      setToken={
                        setToken
                      }

                      setUser={
                        setUser
                      }
                    />
                  )}
                </Stack.Screen>
              </>
            )}


            {/* =========================================
                VENDOR ROUTES
            ========================================= */}

            {token &&
              isVendor && (
                <>
                  <Stack.Screen
                    name="VendorMain"
                  >
                    {props => (
                      <VendorTabs
                        {...props}

                        token={
                          token
                        }

                        setToken={
                          setToken
                        }

                        user={
                          user
                        }

                        setUser={
                          setUser
                        }
                      />
                    )}
                  </Stack.Screen>


                  <Stack.Screen
                    name="VendorStoreSetup"
                  >
                    {props => (
                      <VendorStoreSetupScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }
                      />
                    )}
                  </Stack.Screen>


                  <Stack.Screen
                    name="VendorAddProduct"
                  >
                    {props => (
                      <VendorAddProductScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }
                      />
                    )}
                  </Stack.Screen>


                  <Stack.Screen
                    name="VendorEditProduct"
                  >
                    {props => (
                      <VendorEditProductScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }
                      />
                    )}
                  </Stack.Screen>


                  <Stack.Screen
                    name="VendorEditStore"
                  >
                    {props => (
                      <VendorEditStoreScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }
                      />
                    )}
                  </Stack.Screen>
                </>
              )}


            {/* =========================================
                ADMIN ROUTES
            ========================================= */}

            {token &&
              isAdmin && (
                <Stack.Screen
                  name="AdminMain"
                >
                  {props => (
                    <AdminDashboardScreen
                      {...props}

                      API={API}

                      token={
                        token
                      }

                      user={
                        user
                      }

                      setToken={
                        setToken
                      }

                      setUser={
                        setUser
                      }
                    />
                  )}
                </Stack.Screen>
              )}


            {/* =========================================
                CUSTOMER ROUTES
            ========================================= */}

            {token &&
              isCustomer && (
                <>
                  {/* MAIN BOTTOM TABS */}

                  <Stack.Screen
                    name="Main"
                  >
                    {props => (
                      <CustomerTabs
                        {...props}

                        token={
                          token
                        }

                        setToken={
                          setToken
                        }

                        user={
                          user
                        }

                        setUser={
                          setUser
                        }

                        cart={
                          cart
                        }

                        setCart={
                          setCart
                        }
                      />
                    )}
                  </Stack.Screen>


                  {/* PRODUCER */}

                  <Stack.Screen
                    name="Producer"
                  >
                    {props => (
                      <ProducerScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }

                        cart={
                          cart
                        }

                        setCart={
                          setCart
                        }
                      />
                    )}
                  </Stack.Screen>


                  {/* PRODUCT DETAIL */}

                  <Stack.Screen
                    name="ProductDetail"
                  >
                    {props => (
                      <ProductDetailScreen
                        {...props}

                        cart={
                          cart
                        }

                        setCart={
                          setCart
                        }
                      />
                    )}
                  </Stack.Screen>


                  {/* ORDER CONFIRMATION */}

                  <Stack.Screen
                    name="OrderConfirmation"
                  >
                    {props => (
                      <OrderConfirmationScreen
                        {...props}
                      />
                    )}
                  </Stack.Screen>


                  {/* ORDER DETAIL */}

                  <Stack.Screen
                    name="OrderDetail"
                  >
                    {props => (
                      <OrderDetailScreen
                        {...props}
                      />
                    )}
                  </Stack.Screen>


                  {/* LEAVE REVIEW */}

                  <Stack.Screen
                    name="LeaveReview"
                  >
                    {props => (
                      <LeaveReviewScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }
                      />
                    )}
                  </Stack.Screen>


                  {/* FAVORITES */}

                  <Stack.Screen
                    name="Favorites"
                  >
                    {props => (
                      <FavoritesScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }

                        user={
                          user
                        }

                        cart={
                          cart
                        }
                      />
                    )}
                  </Stack.Screen>


                  {/* SETTINGS */}

                  <Stack.Screen
                    name="Settings"
                  >
                    {props => (
                      <SettingsScreen
                        {...props}

                        API={API}

                        token={
                          token
                        }

                        user={
                          user
                        }

                        setUser={
                          setUser
                        }

                        cart={
                          cart
                        }
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