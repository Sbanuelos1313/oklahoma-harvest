import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
  FONTS,
  SHADOWS,
} from '../../constants/theme';


export default function AdminDashboardScreen({
  API,
  token,
  user,
  setToken,
  setUser,
  navigation,
}) {
  const [
    pendingProducers,
    setPendingProducers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionProducerId,
    setActionProducerId,
  ] = useState(null);


  // ============================================================
  // API HELPER
  // ============================================================

  async function parseResponse(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }


  // ============================================================
  // LOAD PENDING PRODUCERS
  // ============================================================

  const loadPendingProducers =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!token) {
          setPendingProducers([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (!silent) {
          setLoading(true);
        }

        try {
          const response = await fetch(
            `${API}/api/producers/admin/pending`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  'application/json',
              },
            }
          );

          const data =
            await parseResponse(response);

          if (!response.ok) {
            throw new Error(
              data?.detail ||
                data?.message ||
                'Unable to load pending producers.'
            );
          }

          setPendingProducers(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (error) {
          console.error(
            'Admin pending producers error:',
            error
          );

          if (!silent) {
            Alert.alert(
              'Unable to load producers',
              error?.message ||
                'Please try again.'
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        API,
        token,
      ]
    );


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadPendingProducers();
  }, [loadPendingProducers]);


  // ============================================================
  // REFRESH
  // ============================================================

  function handleRefresh() {
    setRefreshing(true);

    loadPendingProducers({
      silent: true,
    });
  }


  // ============================================================
  // APPROVE PRODUCER
  // ============================================================

  async function approveProducer(
    producer
  ) {
    if (
      !producer?.id ||
      actionProducerId
    ) {
      return;
    }

    setActionProducerId(
      producer.id
    );

    try {
      const response = await fetch(
        `${API}/api/producers/admin/${producer.id}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
          },
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to approve producer.'
        );
      }

      setPendingProducers(
        current =>
          current.filter(
            item =>
              item.id !==
              producer.id
          )
      );

      Alert.alert(
        'Producer approved',
        data?.message ||
          `${producer.shop_name} is now approved.`
      );
    } catch (error) {
      console.error(
        'Approve producer error:',
        error
      );

      Alert.alert(
        'Approval failed',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setActionProducerId(null);
    }
  }


  function confirmApprove(
    producer
  ) {
    Alert.alert(
      'Approve producer?',
      `${producer?.shop_name || 'This producer'} will become available to shoppers.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () =>
            approveProducer(
              producer
            ),
        },
      ]
    );
  }


  // ============================================================
  // SUSPEND / DECLINE PENDING PRODUCER
  // ============================================================

  async function suspendProducer(
    producer
  ) {
    if (
      !producer?.id ||
      actionProducerId
    ) {
      return;
    }

    setActionProducerId(
      producer.id
    );

    try {
      const response = await fetch(
        `${API}/api/producers/admin/${producer.id}/suspend`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
          },
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Unable to suspend producer.'
        );
      }

      setPendingProducers(
        current =>
          current.filter(
            item =>
              item.id !==
              producer.id
          )
      );

      Alert.alert(
        'Producer suspended',
        data?.message ||
          `${producer.shop_name} has been suspended.`
      );
    } catch (error) {
      console.error(
        'Suspend producer error:',
        error
      );

      Alert.alert(
        'Unable to suspend producer',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setActionProducerId(null);
    }
  }


  function confirmSuspend(
    producer
  ) {
    Alert.alert(
      'Suspend producer?',
      `${producer?.shop_name || 'This producer'} will not be visible in the marketplace.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () =>
            suspendProducer(
              producer
            ),
        },
      ]
    );
  }


  // ============================================================
  // LOG OUT
  // ============================================================

  function handleLogout() {
    Alert.alert(
      'Sign out?',
      'You will return to the From Our Place welcome screen.',
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

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Welcome',
                },
              ],
            });
          },
        },
      ]
    );
  }


  // ============================================================
  // DATE
  // ============================================================

  function formatDate(
    value
  ) {
    if (!value) {
      return 'Not available';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Not available';
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


  // ============================================================
  // PRODUCER CARD
  // ============================================================

  function renderProducerCard(
    producer
  ) {
    const isWorking =
      actionProducerId ===
      producer.id;

    const location = [
      producer?.city,
      producer?.state,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <View
        key={producer.id}
        style={
          styles.producerCard
        }
      >
        <View
          style={
            styles.producerTopRow
          }
        >
          <View
            style={
              styles.producerIcon
            }
          >
            <Ionicons
              name="storefront-outline"
              size={22}
              color={
                COLORS.forest
              }
            />
          </View>

          <View
            style={
              styles.producerHeading
            }
          >
            <Text
              style={
                styles.shopName
              }
            >
              {producer?.shop_name ||
                'Unnamed Producer'}
            </Text>

            <Text
              style={
                styles.ownerName
              }
            >
              {producer?.full_name ||
                'Producer'}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.detailList
          }
        >
          <View
            style={
              styles.detailRow
            }
          >
            <Ionicons
              name="mail-outline"
              size={16}
              color={
                COLORS.forest
              }
            />

            <Text
              style={
                styles.detailText
              }
              numberOfLines={1}
            >
              {producer?.email ||
                'No email available'}
            </Text>
          </View>

          <View
            style={
              styles.detailRow
            }
          >
            <Ionicons
              name="location-outline"
              size={16}
              color={
                COLORS.forest
              }
            />

            <Text
              style={
                styles.detailText
              }
            >
              {location ||
                'Location not provided'}
            </Text>
          </View>

          <View
            style={
              styles.detailRow
            }
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={
                COLORS.forest
              }
            />

            <Text
              style={
                styles.detailText
              }
            >
              Submitted{' '}
              {formatDate(
                producer?.created_at
              )}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.actionRow
          }
        >
          <TouchableOpacity
            activeOpacity={0.84}
            disabled={isWorking}
            style={[
              styles.secondaryButton,
              isWorking &&
                styles.buttonDisabled,
            ]}
            onPress={() =>
              confirmSuspend(
                producer
              )
            }
          >
            <Ionicons
              name="close-outline"
              size={19}
              color={
                COLORS.brown
              }
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Suspend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isWorking}
            style={[
              styles.approveButton,
              isWorking &&
                styles.buttonDisabled,
            ]}
            onPress={() =>
              confirmApprove(
                producer
              )
            }
          >
            {isWorking ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.white
                }
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-outline"
                  size={20}
                  color={
                    COLORS.white
                  }
                />

                <Text
                  style={
                    styles.approveButtonText
                  }
                >
                  Approve
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <ImageBackground
      source={require('../../assets/backgrounds/bg_welcome.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View
        style={
          styles.backgroundOverlay
        }
      >
        <SafeAreaView
          style={
            styles.safeArea
          }
        >
          <StatusBar
            barStyle="light-content"
          />

          <ScrollView
            showsVerticalScrollIndicator={
              false
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
            contentContainerStyle={
              styles.content
            }
          >
            <View
              style={
                styles.topRow
              }
            >
              <View
                style={
                  styles.adminBadge
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#D8C56A"
                />

                <Text
                  style={
                    styles.adminBadgeText
                  }
                >
                  Administrator
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={
                  styles.logoutButton
                }
                onPress={
                  handleLogout
                }
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#FFF8EA"
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.brandBlock
              }
            >
              <Image
                source={require('../../assets/logo/from-our-place-transparent.png')}
                resizeMode="contain"
                style={
                  styles.brandLogo
                }
                pointerEvents="none"
              />
            </View>

            <View
              style={
                styles.heroCard
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                MARKETPLACE ADMINISTRATION
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Admin Dashboard
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Review producer applications and manage marketplace access.
              </Text>

              <View
                style={
                  styles.summaryRow
                }
              >
                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={21}
                    color={
                      COLORS.forest
                    }
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.summaryNumber
                    }
                  >
                    {
                      pendingProducers.length
                    }
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Pending producer
                    {
                      pendingProducers.length ===
                      1
                        ? ''
                        : 's'
                    }
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  PRODUCER ACCESS
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Pending Approvals
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={
                  styles.refreshButton
                }
                onPress={
                  handleRefresh
                }
                disabled={
                  refreshing
                }
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={
                    COLORS.forest
                  }
                />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <ActivityIndicator
                  color={
                    COLORS.forest
                  }
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading producer applications...
                </Text>
              </View>
            ) : pendingProducers.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={30}
                    color={
                      COLORS.forest
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  You're all caught up
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  There are no producer applications waiting for approval.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.producerList
                }
              >
                {pendingProducers.map(
                  renderProducerCard
                )}
              </View>
            )}

            <Text
              style={
                styles.footer
              }
            >
              From Our Place · Powered by Chronos AI
            </Text>
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
    },

    backgroundOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(18,12,7,0.38)',
    },

    safeArea: {
      flex: 1,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 28,
    },

    topRow: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      zIndex: 10,
      elevation: 10,
    },

    adminBadge: {
      minHeight: 34,
      paddingHorizontal: 13,
      borderRadius: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor:
        'rgba(47,39,22,0.82)',
      borderWidth: 1,
      borderColor:
        'rgba(201,168,76,0.48)',
      ...SHADOWS.soft,
    },

    adminBadgeText: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 11,
      color: '#FFF8EA',
    },

    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(47,39,22,0.82)',
      borderWidth: 1,
      borderColor:
        'rgba(201,168,76,0.48)',
      ...SHADOWS.soft,
    },

    brandBlock: {
      alignSelf: 'center',
      width: '100%',
      height: 135,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 6,

      shadowColor: '#F4C96B',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.85,
      shadowRadius: 28,
      elevation: 1,
    },

    brandLogo: {
      width: '108%',
      height: 170,
    },

    heroCard: {
      padding: 18,
      borderRadius: 26,
      backgroundColor:
        'rgba(47,39,22,0.84)',
      borderWidth: 1,
      borderColor:
        'rgba(201,168,76,0.48)',
      ...SHADOWS.medium,
    },

    eyebrow: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 10,
      letterSpacing: 1.4,
      color: '#D8C56A',
    },

    title: {
      marginTop: 4,
      fontFamily:
        FONTS.display,
      fontSize: 28,
      lineHeight: 33,
      color: '#FFF8EA',
    },

    subtitle: {
      marginTop: 5,
      fontFamily:
        FONTS.body,
      fontSize: 12,
      lineHeight: 18,
      color:
        'rgba(255,248,234,0.80)',
    },

    summaryRow: {
      marginTop: 16,
      padding: 13,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        'rgba(250,238,208,0.98)',
      borderWidth: 1,
      borderColor:
        'rgba(218,194,145,0.92)',
    },

    summaryIcon: {
      width: 44,
      height: 44,
      marginRight: 12,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(74,103,65,0.12)',
    },

    summaryNumber: {
      fontFamily:
        FONTS.display,
      fontSize: 24,
      lineHeight: 26,
      color:
        COLORS.forest,
    },

    summaryLabel: {
      marginTop: 1,
      fontFamily:
        FONTS.body,
      fontSize: 11,
      color:
        COLORS.brownSoft,
    },

    sectionHeader: {
      marginTop: 20,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    sectionEyebrow: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 9,
      letterSpacing: 1.2,
      color: '#F4D77F',
    },

    sectionTitle: {
      marginTop: 2,
      fontFamily:
        FONTS.display,
      fontSize: 22,
      color: '#FFF8EA',
    },

    refreshButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(250,238,208,0.96)',
      borderWidth: 1,
      borderColor:
        'rgba(218,194,145,0.92)',
      ...SHADOWS.soft,
    },

    loadingCard: {
      minHeight: 145,
      padding: 20,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(250,247,240,0.96)',
      ...SHADOWS.soft,
    },

    loadingText: {
      marginTop: 10,
      fontFamily:
        FONTS.body,
      fontSize: 12,
      color:
        COLORS.brownSoft,
    },

    emptyCard: {
      paddingHorizontal: 20,
      paddingVertical: 28,
      borderRadius: 22,
      alignItems: 'center',
      backgroundColor:
        'rgba(250,247,240,0.96)',
      ...SHADOWS.soft,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(74,103,65,0.12)',
    },

    emptyTitle: {
      marginTop: 12,
      fontFamily:
        FONTS.display,
      fontSize: 20,
      color:
        COLORS.forest,
    },

    emptyText: {
      marginTop: 5,
      maxWidth: 260,
      fontFamily:
        FONTS.body,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      color:
        COLORS.brownSoft,
    },

    producerList: {
      gap: 10,
    },

    producerCard: {
      padding: 15,
      borderRadius: 22,
      backgroundColor:
        'rgba(250,247,240,0.97)',
      borderWidth: 1,
      borderColor:
        'rgba(218,194,145,0.88)',
      ...SHADOWS.soft,
    },

    producerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    producerIcon: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(74,103,65,0.12)',
    },

    producerHeading: {
      flex: 1,
      marginLeft: 12,
    },

    shopName: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 15,
      color:
        COLORS.forest,
    },

    ownerName: {
      marginTop: 2,
      fontFamily:
        FONTS.body,
      fontSize: 12,
      color:
        COLORS.brownSoft,
    },

    detailList: {
      marginTop: 13,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor:
        'rgba(87,71,55,0.10)',
      gap: 7,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    detailText: {
      flex: 1,
      fontFamily:
        FONTS.body,
      fontSize: 11,
      lineHeight: 16,
      color:
        COLORS.brownSoft,
    },

    actionRow: {
      marginTop: 14,
      flexDirection: 'row',
      gap: 9,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor:
        'rgba(238,227,207,0.92)',
      borderWidth: 1,
      borderColor:
        'rgba(87,71,55,0.18)',
    },

    secondaryButtonText: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 12,
      color:
        COLORS.brown,
    },

    approveButton: {
      flex: 1.25,
      minHeight: 46,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor:
        COLORS.forest,
      ...SHADOWS.soft,
    },

    approveButtonText: {
      fontFamily:
        FONTS.bodyBold,
      fontSize: 13,
      color:
        COLORS.white,
    },

    buttonDisabled: {
      opacity: 0.58,
    },

    footer: {
      marginTop: 20,
      fontFamily:
        FONTS.body,
      fontSize: 10,
      textAlign: 'center',
      color:
        'rgba(255,255,255,0.82)',
    },
  });