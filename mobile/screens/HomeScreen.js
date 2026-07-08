import React, { useMemo, useState } from 'react';
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
import SearchBar from '../components/home/SearchBar';
import CategoryCarousel from '../components/home/CategoryCarousel';
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
}) {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const firstName = useMemo(() => {
    if (!user?.full_name) return 'Samantha';
    return user.full_name.split(' ')[0];
  }, [user]);

  const locationLabel = 'Near you';

  function handleSearchSubmit() {
    navigation.navigate('Search', {
      initialQuery: search,
    });
  }

  function handleCategoryPress(category) {
    navigation.navigate('Search', {
      category: category?.key || category?.title,
    });
  }

  function handleRefresh() {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }

  return (
    <ImageBackground
      source={require('../assets/backgrounds/bg_home.jpg')}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.forest}
              />
            }
          >
            <HeroBanner
              firstName={firstName}
              deliveryAddress={locationLabel}
              onNotificationPress={() => navigation.navigate('Profile')}
              onPromoPress={() => navigation.navigate('Search')}
            />

            <SearchBar
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              location={locationLabel}
              onPress={() => navigation.navigate('Search')}
              onFilterPress={() => navigation.navigate('Search')}
            />

            <CategoryCarousel
              onCategoryPress={handleCategoryPress}
              onViewAllPress={() => navigation.navigate('Search')}
            />

            <FeaturedProducers navigation={navigation} />

            <SeasonalProducts navigation={navigation} />

            <CommunitySpotlight
              onPress={() => navigation.navigate('Search')}
            />

            <BecomeProducerCard
              onPress={() => navigation.navigate('Auth')}
            />

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundImage: {
    opacity: 0.28,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(247,242,232,0.91)',
  },

  safeArea: {
    ...COMMON_STYLES.safeArea,
    backgroundColor: 'transparent',
  },

  content: {
    paddingBottom: 135,
  },

  bottomSpacer: {
    height: SPACING.xxxl,
  },
});