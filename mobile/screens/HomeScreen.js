import React, {
  useMemo,
  useState,
} from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  RefreshControl,
  ImageBackground,
} from 'react-native';

import HeroBanner from '../components/home/HeroBanner';
import FeaturedProducers from '../components/home/FeaturedProducers';
import SeasonalProducts from '../components/home/SeasonalProducts';
import CommunitySpotlight from '../components/home/CommunitySpotlight';
import BecomeProducerCard from '../components/home/BecomeProducerCard';

import {
  COLORS,
  SPACING,
  COMMON_STYLES,
} from '../constants/theme';


export default function HomeScreen({
  API,
  token,
  user,
  cart,
  setCart,
  navigation,
  guestMode = false,
  rootNavigation,
}) {
  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const firstName =
    useMemo(() => {
      if (!user?.full_name) {
        return 'Friend';
      }

      return user.full_name
        .split(' ')[0];
    }, [user]);

  const locationLabel =
    'Near you';

  function requireCustomerAuth() {
  if (
    guestMode &&
    rootNavigation
  ) {
    rootNavigation.navigate(
      'Auth',
      {
        mode: 'login',
        role: 'shopper',
      }
    );

    return;
  }

  navigation.navigate(
    'Profile'
  );
}


function handleBecomeProducer() {
  if (
    guestMode &&
    rootNavigation
  ) {
    rootNavigation.navigate(
      'Auth',
      {
        mode: 'register',
        role: 'producer',
      }
    );

    return;
  }

  navigation.navigate(
    'Auth'
  );
}

  // =========================================================
  // REFRESH
  // =========================================================

  function handleRefresh() {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }


  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <ImageBackground
      source={require(
        '../assets/backgrounds/bg_home.jpg'
      )}
      resizeMode="cover"
      style={styles.background}
      imageStyle={
        styles.backgroundImage
      }
    >
      <View
        style={styles.overlay}
      >
        <SafeAreaView
          style={styles.safeArea}
        >
          <StatusBar
            barStyle="dark-content"
          />

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.content
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  handleRefresh
                }
                tintColor={
                  COLORS.forest
                }
              />
            }
          >
            <HeroBanner
              firstName={
                firstName
              }
              deliveryAddress={
                locationLabel
              }
              onNotificationPress={
                requireCustomerAuth
              }
              onPromoPress={() =>
                navigation.navigate(
                  'Search'
                )
              }
            />

            <FeaturedProducers
              navigation={navigation}
              onViewAllPress={() =>
                navigation.navigate(
                  'Search'
                )
              }
              guestMode={guestMode}
              rootNavigation={rootNavigation}
            />

            <SeasonalProducts
              navigation={navigation}
              guestMode={guestMode}
              rootNavigation={rootNavigation}
            />

            <CommunitySpotlight
              onPress={() =>
                navigation.navigate(
                  'Search'
                )
              }
            />

            <BecomeProducerCard
              onPress={
                handleBecomeProducer
              }
            />

            <View
              style={
                styles.bottomSpacer
              }
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}


const styles =
  StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor:
        COLORS.cream,
    },

    backgroundImage: {
      opacity: 1,
    },

    overlay: {
      flex: 1,

      // Brighter than the old 0.92 overlay while
      // still keeping text/cards easy to read.
      backgroundColor:
        'rgba(250,247,240,0.82)',
    },

    safeArea: {
      ...COMMON_STYLES.safeArea,
      backgroundColor:
        'transparent',
    },

    content: {
      paddingBottom: 150,
    },

    bottomSpacer: {
      height:
        SPACING.xxxl,
    },
  });