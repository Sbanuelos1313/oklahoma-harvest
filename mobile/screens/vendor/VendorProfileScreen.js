import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';

import {
  COLORS,
  FONTS,
  LAYOUT,
  RADIUS,
  SHADOWS,
} from '../../constants/theme';

import { IMAGE_ASSETS } from '../../constants/assets';


export default function VendorProfileScreen({
  API,
  token,
  user,
  setToken,
  setUser,
  navigation,
}) {
  const [
    shop,
    setShop,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(false);


  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  const loadReviews = useCallback(
    async (producerId) => {
      if (!producerId) {
        setReviews([]);
        return;
      }

      setReviewsLoading(true);

      try {
        const response = await fetch(
          `${API}/api/reviews/producer/${producerId}?limit=20`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          console.error(
            'Unable to load vendor reviews:',
            data
          );

          setReviews([]);
          return;
        }

        setReviews(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'Unable to load vendor reviews:',
          error
        );

        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    },
    [
      API,
      token,
    ]
  );


  // =========================================================
  // LOAD STORE
  // =========================================================

  const loadStore = useCallback(
    async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API}/api/producers/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          setShop(null);
          setReviews([]);
          return;
        }

        setShop(data);

        if (data?.id) {
          await loadReviews(
            data.id
          );
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error(
          'Unable to load vendor store:',
          error
        );

        setShop(null);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    [
      API,
      token,
      loadReviews,
    ]
  );

    useFocusEffect(
    useCallback(() => {
      loadStore();
    }, [loadStore])
  );

  // =========================================================
  // ACTIONS
  // =========================================================

  function logout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setToken(null);
            setUser(null);
          },
        },
      ]
    );
  }


  function openStoreSetup() {
    navigation.navigate(
      'VendorStoreSetup'
    );
  }


  function openEditStore() {
    navigation.navigate(
      'VendorEditStore',
      {
        shop,
      }
    );
  }


  // =========================================================
  // REVIEW SUMMARY
  // =========================================================

  const reviewSummary = useMemo(
    () => {
      if (!reviews.length) {
        return {
          average: 0,
          count: 0,
        };
      }

      const total = reviews.reduce(
        (
          sum,
          review
        ) =>
          sum +
          Number(
            review?.rating || 0
          ),
        0
      );

      return {
        average:
          total /
          reviews.length,

        count:
          reviews.length,
      };
    },
    [reviews]
  );


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.cream
          }
        />

        <SafeAreaView
          style={styles.center}
        >
          <ActivityIndicator
            color={COLORS.forest}
            size="large"
          />

          <Text style={styles.loading}>
            Loading Store...
          </Text>
        </SafeAreaView>
      </View>
    );
  }


  // =========================================================
  // NO STORE
  // =========================================================

  if (!shop) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.cream
          }
        />

        <SafeAreaView
          style={styles.empty}
        >
          <EmptyState
            image={
              IMAGE_ASSETS
                .vendor
                .storefront
            }
            title="Store setup required"
            message={
              'Create your storefront so customers can begin shopping.'
            }
            buttonTitle="Store Setup"
            onPress={
              openStoreSetup
            }
          />

          <AppButton
            title="Sign Out"
            variant="outline"
            onPress={logout}
            style={
              styles
                .emptySignOutButton
            }
          />
        </SafeAreaView>
      </View>
    );
  }


  // =========================================================
  // DISPLAY VALUES
  // =========================================================

  const heroImage =
    shop.profile_image_url
      ? {
          uri:
            shop.profile_image_url,
        }
      : IMAGE_ASSETS
          .vendor
          .storefront;


  const locationText = [
    shop.city,
    shop.state,
  ]
    .filter(Boolean)
    .join(', ');


  const displayedAverage =
    Number(
      shop.avg_rating
    ) > 0
      ? Number(
          shop.avg_rating
        )
      : reviewSummary.average;


  const displayedCount =
    Number(
      shop.review_count
    ) > 0
      ? Number(
          shop.review_count
        )
      : reviewSummary.count;


  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.forestDark
        }
      />

      <SafeAreaView
        edges={[
          'top',
          'left',
          'right',
        ]}
        style={styles.root}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scroll
          }
        >

          {/* =================================================
              STORE HERO
          ================================================= */}

          <View style={styles.hero}>
            <Image
              source={heroImage}
              resizeMode="cover"
              style={styles.heroImage}
            />

            <View
              style={styles.overlay}
            />

            <View
              style={
                styles.heroContent
              }
            >
              <Text
                style={styles.eyebrow}
              >
                Vendor Store
              </Text>

              <Text
                numberOfLines={2}
                style={styles.title}
              >
                {shop.shop_name ||
                  'Your Store'}
              </Text>

              <Text
                style={
                  styles.location
                }
              >
                {locationText ||
                  'Local Vendor'}
              </Text>

              <View
                style={
                  styles
                    .storeStatusRow
                }
              >
                <View
                  style={[
                    styles
                      .storeStatusDot,

                    shop.admin_approved
                      ? styles
                          .storeStatusDotLive
                      : styles
                          .storeStatusDotPending,
                  ]}
                />

                <Text
                  style={
                    styles
                      .storeStatusText
                  }
                >
                  {shop.admin_approved
                    ? 'Live on From Our Place'
                    : 'Pending platform approval'}
                </Text>
              </View>
            </View>
          </View>


          {/* =================================================
              STORE INFORMATION
          ================================================= */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              About Your Store
            </Text>

            <Text style={styles.body}>
              {shop.description ||
                'Tell shoppers about your farm, market, or local business.'}
            </Text>

            {!!shop.bio && (
              <>
                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  Meet the Maker
                </Text>

                <Text
                  style={
                    styles.bioText
                  }
                >
                  {shop.bio}
                </Text>
              </>
            )}

            <View style={styles.stats}>
              <Info
                label="Pickup"
                value={
                  shop.fulfillment_pickup
                    ? 'Enabled'
                    : 'Off'
                }
              />

              <Info
                label="Delivery"
                value={
                  shop.fulfillment_delivery
                    ? 'Enabled'
                    : 'Off'
                }
              />

              <Info
                label="Shipping"
                value={
                  shop.fulfillment_shipping
                    ? 'Enabled'
                    : 'Off'
                }
              />
            </View>

            <AppButton
              title="Edit Store"
              onPress={
                openEditStore
              }
              style={
                styles
                  .editStoreButton
              }
            />
          </View>


          {/* =================================================
              CUSTOMER REVIEWS
          ================================================= */}

          <View style={styles.card}>
            <View
              style={
                styles
                  .reviewHeaderRow
              }
            >
              <View
                style={
                  styles
                    .reviewHeaderText
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Customer Reviews
                </Text>

                <Text
                  style={
                    styles
                      .reviewSubtitle
                  }
                >
                  Feedback from
                  completed orders
                </Text>
              </View>

              {displayedCount > 0 && (
                <View
                  style={
                    styles
                      .ratingSummary
                  }
                >
                  <Ionicons
                    name="star"
                    size={18}
                    color={
                      COLORS.gold
                    }
                  />

                  <Text
                    style={
                      styles
                        .ratingSummaryValue
                    }
                  >
                    {displayedAverage
                      .toFixed(1)}
                  </Text>
                </View>
              )}
            </View>


            {displayedCount > 0 && (
              <View
                style={
                  styles
                    .reviewCountRow
                }
              >
                <Text
                  style={
                    styles
                      .reviewCountText
                  }
                >
                  {displayedCount}{' '}
                  {displayedCount === 1
                    ? 'review'
                    : 'reviews'}
                </Text>
              </View>
            )}


            {reviewsLoading ? (
              <View
                style={
                  styles
                    .reviewsLoading
                }
              >
                <ActivityIndicator
                  color={
                    COLORS.forest
                  }
                />

                <Text
                  style={
                    styles
                      .reviewsLoadingText
                  }
                >
                  Loading reviews...
                </Text>
              </View>
            ) : reviews.length ? (
              <View
                style={
                  styles.reviewList
                }
              >
                {reviews.map(
                  (
                    review,
                    index
                  ) => (
                    <ReviewCard
                      key={
                        review?.id ||
                        `${review?.created_at}-${index}`
                      }
                      review={
                        review
                      }
                      isLast={
                        index ===
                        reviews.length - 1
                      }
                    />
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles
                    .noReviewsCard
                }
              >
                <View
                  style={
                    styles
                      .noReviewsIcon
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color={
                      COLORS.forest
                    }
                  />
                </View>

                <Text
                  style={
                    styles
                      .noReviewsTitle
                  }
                >
                  No reviews yet
                </Text>

                <Text
                  style={
                    styles
                      .noReviewsText
                  }
                >
                  Customer reviews will
                  appear here after
                  completed orders.
                </Text>
              </View>
            )}
          </View>


          {/* =================================================
              OWNER ACCOUNT
          ================================================= */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              Owner Account
            </Text>

            <Text style={styles.body}>
              {user?.full_name ||
                'Vendor'}
            </Text>

            <Text style={styles.email}>
              {user?.email ||
                'Vendor account'}
            </Text>

            <AppButton
              title="Sign Out"
              variant="outline"
              onPress={logout}
              style={
                styles
                  .signOutButton
              }
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


// ===========================================================
// FULFILLMENT INFO CARD
// ===========================================================

function Info({
  label,
  value,
}) {
  const enabled =
    value === 'Enabled';

  return (
    <View style={styles.info}>
      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,

          !enabled &&
            styles.infoValueOff,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}


// ===========================================================
// REVIEW CARD
// ===========================================================

function ReviewCard({
  review,
  isLast,
}) {
  const rating = Math.max(
    0,
    Math.min(
      5,
      Number(
        review?.rating || 0
      )
    )
  );


  const shopperName =
    review?.shopper_name ||
    'Customer';


  const createdDate =
    formatReviewDate(
      review?.created_at
    );


  return (
    <View
      style={[
        styles.reviewCard,

        !isLast &&
          styles.reviewCardBorder,
      ]}
    >
      <View
        style={
          styles.reviewTopRow
        }
      >
        <View
          style={
            styles.starRow
          }
        >
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            star => (
              <Ionicons
                key={star}
                name={
                  star <= rating
                    ? 'star'
                    : 'star-outline'
                }
                size={17}
                color={
                  COLORS.gold
                }
                style={
                  styles.starIcon
                }
              />
            )
          )}
        </View>

        <Text
          style={
            styles.reviewDate
          }
        >
          {createdDate}
        </Text>
      </View>

      {!!review?.comment && (
        <Text
          style={
            styles.reviewComment
          }
        >
          {review.comment}
        </Text>
      )}

      <View
        style={
          styles.reviewerRow
        }
      >
        <View
          style={
            styles
              .reviewerAvatar
          }
        >
          <Ionicons
            name="person-outline"
            size={15}
            color={
              COLORS.forest
            }
          />
        </View>

        <Text
          style={
            styles
              .reviewerName
          }
        >
          {shopperName}
        </Text>
      </View>
    </View>
  );
}


// ===========================================================
// DATE FORMATTER
// ===========================================================

function formatReviewDate(
  value
) {
  if (!value) {
    return '';
  }

  const date = new Date(
    value
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}


// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      COLORS.cream,
  },


  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
  },


  loading: {
    marginTop: 16,
    fontFamily:
      FONTS.body,
    color:
      COLORS.brownSoft,
  },


  empty: {
    flex: 1,
    justifyContent:
      'center',
    padding:
      LAYOUT.screenPadding,
  },


  emptySignOutButton: {
    marginTop: 18,
  },


  scroll: {
    paddingHorizontal:
      LAYOUT.screenPadding,
    paddingBottom: 120,
  },


  hero: {
    height: 300,
    marginTop: 14,
    borderRadius:
      RADIUS.xl,
    overflow: 'hidden',
    backgroundColor:
      COLORS.forestDark,
    ...SHADOWS.card,
  },


  heroImage: {
    width: '100%',
    height: '100%',
  },


  overlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      'rgba(22,48,30,0.38)',
  },


  heroContent: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 24,
  },


  eyebrow: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform:
      'uppercase',
    color:
      COLORS.cream,
  },


  title: {
    marginTop: 6,
    fontFamily:
      FONTS.display,
    fontSize: 34,
    lineHeight: 40,
    color:
      COLORS.warmWhite,
  },


  location: {
    marginTop: 6,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 13,
    color:
      COLORS.cream,
  },


  storeStatusRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },


  storeStatusDot: {
    width: 8,
    height: 8,
    marginRight: 7,
    borderRadius: 4,
  },


  storeStatusDotLive: {
    backgroundColor:
      COLORS.success,
  },


  storeStatusDotPending: {
    backgroundColor:
      COLORS.gold,
  },


  storeStatusText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.cream,
  },


  card: {
    marginTop: 18,
    padding: 18,
    borderRadius:
      RADIUS.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.warmWhite,
    ...SHADOWS.soft,
  },


  cardTitle: {
    fontFamily:
      FONTS.display,
    fontSize: 25,
    color:
      COLORS.forestDark,
  },


  body: {
    marginTop: 10,
    fontFamily:
      FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color:
      COLORS.brown,
  },


  sectionLabel: {
    marginTop: 18,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform:
      'uppercase',
    color:
      COLORS.sage,
  },


  bioText: {
    marginTop: 7,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    lineHeight: 21,
    color:
      COLORS.brown,
  },


  email: {
    marginTop: 6,
    fontFamily:
      FONTS.body,
    fontSize: 13,
    color:
      COLORS.brownSoft,
  },


  stats: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },


  info: {
    flex: 1,
    minHeight: 74,
    padding: 11,
    borderRadius:
      RADIUS.lg,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cream,
  },


  infoLabel: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 10,
    color:
      COLORS.brownSoft,
  },


  infoValue: {
    marginTop: 5,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 12,
    color:
      COLORS.forest,
  },


  infoValueOff: {
    color:
      COLORS.brownSoft,
  },


  editStoreButton: {
    marginTop: 18,
  },


  // =========================================================
  // REVIEWS
  // =========================================================

  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
  },


  reviewHeaderText: {
    flex: 1,
    paddingRight: 12,
  },


  reviewSubtitle: {
    marginTop: 4,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    color:
      COLORS.brownSoft,
  },


  ratingSummary: {
    minWidth: 72,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cream,
  },


  ratingSummaryValue: {
    marginLeft: 6,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 16,
    color:
      COLORS.forestDark,
  },


  reviewCountRow: {
    marginTop: 12,
  },


  reviewCountText: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.sage,
  },


  reviewsLoading: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent:
      'center',
  },


  reviewsLoadingText: {
    marginTop: 10,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    color:
      COLORS.brownSoft,
  },


  reviewList: {
    marginTop: 12,
  },


  reviewCard: {
    paddingVertical: 17,
  },


  reviewCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },


  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },


  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  starIcon: {
    marginRight: 2,
  },


  reviewDate: {
    marginLeft: 10,
    fontFamily:
      FONTS.body,
    fontSize: 10,
    color:
      COLORS.brownSoft,
  },


  reviewComment: {
    marginTop: 11,
    fontFamily:
      FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color:
      COLORS.brown,
  },


  reviewerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },


  reviewerAvatar: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent:
      'center',

    backgroundColor:
      'rgba(74,103,65,0.10)',
  },


  reviewerName: {
    fontFamily:
      FONTS.bodyBold,
    fontSize: 11,
    color:
      COLORS.forest,
  },


  noReviewsCard: {
    marginTop: 18,
    paddingVertical: 25,
    paddingHorizontal: 18,
    borderRadius:
      RADIUS.lg,
    alignItems: 'center',
    backgroundColor:
      COLORS.cream,
  },


  noReviewsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent:
      'center',

    backgroundColor:
      'rgba(74,103,65,0.10)',
  },


  noReviewsTitle: {
    marginTop: 11,
    fontFamily:
      FONTS.bodyBold,
    fontSize: 14,
    color:
      COLORS.forestDark,
  },


  noReviewsText: {
    marginTop: 5,
    maxWidth: 250,
    fontFamily:
      FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color:
      COLORS.brownSoft,
  },


  signOutButton: {
    marginTop: 20,
  },
});