// =======================================================
// From Our Place Design System
// Single source of truth for the entire application.
// =======================================================

export const COLORS = {
  // Primary Brand
  forest: '#4A6741',
  forestDark: '#395033',
  sage: '#708D62',
  gold: '#C9A84C',

  // Backgrounds
  cream: '#F7F2E8',
  warmWhite: '#FCFAF7',
  white: '#FFFFFF',

  // Text
  brown: '#2A1A08',
  brownSoft: '#6F6456',
  text: '#2A1A08',
  subText: '#7A736A',

  // UI
  border: '#E5DDD0',
  divider: '#EFE7DA',
  shadow: '#000000',

  // Status
  success: '#5B8C5A',
  warning: '#E2A73B',
  danger: '#C44C4C',

  // Overlay
  overlay: 'rgba(0,0,0,0.32)',

  // Misc
  transparent: 'transparent',
};

export const FONTS = {
  display: 'PlayfairDisplay_700Bold',
  displayRegular: 'PlayfairDisplay_400Regular',

  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',

  script: 'Satisfy_400Regular',
};

export const FONT_SIZES = {
  hero: 38,
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 18,

  bodyLarge: 17,
  body: 15,
  bodySmall: 13,

  caption: 12,
  tiny: 10,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 36,

  pill: 999,
  circle: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  medium: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },

  heavy: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  hero: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.hero,
    color: COLORS.white,
    lineHeight: 44,
  },

  h1: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.h1,
    color: COLORS.brown,
    lineHeight: 38,
  },

  h2: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.h2,
    color: COLORS.brown,
    lineHeight: 32,
  },

  h3: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.h3,
    color: COLORS.brown,
    lineHeight: 28,
  },

  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
  },

  bodyBold: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
  },

  small: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.subText,
    lineHeight: 20,
  },

  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.caption,
    color: COLORS.subText,
    lineHeight: 16,
  },

  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.caption,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};

export const LAYOUT = {
  screenPadding: 20,
  sectionSpacing: 32,
  cardSpacing: 16,

  bottomTabHeight: 82,

  heroHeight: 290,

  categoryCard: 120,
  productCard: 170,
  producerCard: 260,
};

export const COMMON_STYLES = {
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  card: {
    backgroundColor: COLORS.warmWhite,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },

  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },

  buttonPrimary: {
    backgroundColor: COLORS.forest,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonSecondary: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
};