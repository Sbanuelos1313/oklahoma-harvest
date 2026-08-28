// constants/assets.js
// From Our Place asset registry.
// React Native needs static require() paths.

export const IMAGE_ASSETS = {
  logo: {
    appLogo: require('../assets/logo/from-our-place-logo.png'),
    icon: require('../assets/logo/icon.png'),
  },

  hero: {
    welcome: require('../assets/hero/welcome_hero.jpg'),
    home: require('../assets/hero/home_hero.jpg'),
    vendor: require('../assets/hero/vendor_hero.jpg'),
    checkout: require('../assets/hero/checkout_hero.jpg'),
  },

  backgrounds: {
    login: require('../assets/backgrounds/bg_app_login.jpg'),

    checkout: require(
      '../assets/backgrounds/bg_checkout.jpg'
    ),

    vendorDashboard: require(
      '../assets/backgrounds/bg_vendor_dashboard.jpg'
    ),

    vendorOrders: require(
      '../assets/backgrounds/bg_vendor_orders.jpg'
    ),

    vendorProfile: require(
      '../assets/backgrounds/bg_vendor_profile.jpg'
    ),

    vendorEmpty: require(
      '../assets/backgrounds/bg_vendor_empty.jpg'
    ),
  },
  
  categories: {
    produce: require('../assets/categories/cat_produce.jpg'),
    meat: require('../assets/categories/cat_meat.jpg'),
    bakery: require('../assets/categories/cat_bakery.jpg'),
    eggs_dairy: require('../assets/categories/cat_eggs_dairy.jpg'),
    eggs: require('../assets/categories/cat_eggs.jpg'),
    herbs: require('../assets/categories/cat_herbs.jpg'),
    candles: require('../assets/categories/cat_candles.jpg'),
    jewelry: require('../assets/categories/cat_jewelry.jpg'),
    clothing: require('../assets/categories/cat_clothing.jpg'),
    coffee_tea: require('../assets/categories/cat_coffee_tea.jpg'),
    crafts: require('../assets/categories/cat_crafts.jpg'),
    honey_jams: require('../assets/categories/cat_honey_jams.jpg'),
    jams: require('../assets/categories/cat_jams.jpg'),
    flowers: require('../assets/categories/cat_flowers.jpg'),
    microgreens: require('../assets/categories/cat_microgreens.jpg'),
    fruit: require('../assets/categories/cat_fruit.jpg'),
    soaps: require('../assets/categories/cat_soaps.jpg'),
    home_living: require('../assets/categories/cat_home_living.jpg'),
    pantry: require('../assets/categories/cat_pantry.jpg'),
    pet_products: require('../assets/categories/cat_pet_products.jpg'),
    nuts: require('../assets/categories/cat_nuts.jpg'),
    sauces: require('../assets/categories/cat_sauces.jpg'),
    spices: require('../assets/categories/cat_spices.jpg'),
    essential_oils: require('../assets/categories/cat_essential_oils.jpg'),
    farm_garden: require('../assets/categories/cat_barn.jpg'),
    plants: require('../assets/categories/cat_plants.jpg'),
    plants_flowers: require('../assets/categories/cat_plants_flowers.jpg'),
    local_makers: require('../assets/categories/cat_local_makers.jpg'),
    gifts: require('../assets/categories/cat_gifts.jpg'),
    tinctures_remedies: require('../assets/categories/cat_tinctures_remedies.jpg'),
    wellness: require('../assets/categories/cat_wellness.jpg'),
    seasonal: require('../assets/categories/cat_seasonal.jpg'),
    other: require('../assets/categories/cat_other.jpg'),
    candy: require('../assets/categories/cat_candy.jpg'),
  },

  icons: {
    home: require('../assets/icons/home.png'),
    search: require('../assets/icons/search.png'),
    cart: require('../assets/icons/cart.png'),
    orders: require('../assets/icons/orders.png'),
    profile: require('../assets/icons/profile.png'),
    vendor: require('../assets/icons/vendor.png'),
    heart: require('../assets/icons/heart.png'),
    location: require('../assets/icons/location.png'),
    settings: require('../assets/icons/settings.png'),
    logout: require('../assets/icons/logout.png'),
    pickup: require('../assets/icons/pickup.png'),
    delivery: require('../assets/icons/delivery.png'),
    shipping: require('../assets/icons/shipping.png'),
    back: require('../assets/icons/back.png'),
    close: require('../assets/icons/close.png'),
  },

  vendor: {
    default: require('../assets/vendor/vendor_default.jpg'),
    storefront: require('../assets/vendor/storefront_default.jpg'),
  },

  products: {
    default: require('../assets/products/product_default.jpg'),
  },
};

export const CATEGORY_ASSETS = [
  { key: null, label: 'All Categories', image: IMAGE_ASSETS.categories.produce },
  { key: 'produce', label: 'Produce', image: IMAGE_ASSETS.categories.produce },
  { key: 'meat', label: 'Meat', image: IMAGE_ASSETS.categories.meat },
  { key: 'baked', label: 'Bakery', image: IMAGE_ASSETS.categories.bakery },
  { key: 'eggs_dairy', label: 'Eggs & Dairy', image: IMAGE_ASSETS.categories.eggs_dairy },
  { key: 'eggs', label: 'Eggs', image: IMAGE_ASSETS.categories.eggs },
  { key: 'herbs', label: 'Herbs', image: IMAGE_ASSETS.categories.herbs },
  { key: 'candles', label: 'Candles', image: IMAGE_ASSETS.categories.candles },
  { key: 'jewelry', label: 'Jewelry', image: IMAGE_ASSETS.categories.jewelry },
  { key: 'clothing', label: 'Clothing', image: IMAGE_ASSETS.categories.clothing },
  { key: 'coffee_tea', label: 'Coffee & Tea', image: IMAGE_ASSETS.categories.coffee_tea },
  { key: 'crafts', label: 'Crafts', image: IMAGE_ASSETS.categories.crafts },
  { key: 'honey', label: 'Honey & Jams', image: IMAGE_ASSETS.categories.honey_jams },
  { key: 'jams', label: 'Jams', image: IMAGE_ASSETS.categories.jams },
  { key: 'flowers', label: 'Flowers', image: IMAGE_ASSETS.categories.flowers },
  { key: 'microgreens', label: 'Microgreens', image: IMAGE_ASSETS.categories.microgreens },
  { key: 'fruit', label: 'Fruit', image: IMAGE_ASSETS.categories.fruit },
  { key: 'soaps', label: 'Soaps', image: IMAGE_ASSETS.categories.soaps },
  { key: 'home_living', label: 'Home Living', image: IMAGE_ASSETS.categories.home_living },
  { key: 'pantry', label: 'Pantry', image: IMAGE_ASSETS.categories.pantry },
  { key: 'pet_products', label: 'Pet Products', image: IMAGE_ASSETS.categories.pet_products },
  { key: 'nuts', label: 'Nuts', image: IMAGE_ASSETS.categories.nuts },
  { key: 'sauces', label: 'Sauces', image: IMAGE_ASSETS.categories.sauces },
  { key: 'spices', label: 'Spices', image: IMAGE_ASSETS.categories.spices },
  { key: 'essential_oils', label: 'Essential Oils', image: IMAGE_ASSETS.categories.essential_oils },
  { key: 'farm_garden', label: 'Farm & Garden', image: IMAGE_ASSETS.categories.farm_garden },
  { key: 'plants', label: 'Plants', image: IMAGE_ASSETS.categories.plants },
  { key: 'plants_flowers', label: 'Plants & Flowers', image: IMAGE_ASSETS.categories.plants_flowers },
  { key: 'local_makers', label: 'Local Makers', image: IMAGE_ASSETS.categories.local_makers },
  { key: 'gifts', label: 'Gift Sets', image: IMAGE_ASSETS.categories.gifts },
  { key: 'tinctures_remedies', label: 'Tinctures & Remedies', image: IMAGE_ASSETS.categories.tinctures_remedies },
  { key: 'wellness', label: 'Wellness', image: IMAGE_ASSETS.categories.wellness },
  { key: 'seasonal', label: 'Seasonal', image: IMAGE_ASSETS.categories.seasonal },
  { key: 'other', label: 'Other', image: IMAGE_ASSETS.categories.other },
  { key: 'candy', label: 'Candy', image: IMAGE_ASSETS.categories.candy },

];

export const FEATURED_CATEGORY_ASSETS = CATEGORY_ASSETS.filter(item => item.key).slice(0, 8);