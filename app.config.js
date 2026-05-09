const IS_DEV = process.env.APP_VARIANT === 'development'

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: IS_DEV ? 'Tizzle (Dev)' : 'Tizzle',
  slug: 'tizzle',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'tizzle',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.tizzle',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundImage: './assets/images/adaptive-icon-background.png',
    },
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: 'pan',
    package: 'app.tizzle',
    permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        dark: {
          backgroundColor: '#000000',
          image: './assets/images/splash-icon.png',
        },
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
      },
    ],
    'expo-web-browser',
    'expo-font',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: 'Tizzle needs camera access to scan ticket QR codes.',
      },
    ],
    '@react-native-community/datetimepicker',
    ['./plugins/withGoogleMapsKey', { apiKey: process.env.GOOGLE_MAPS_API_KEY }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {},
  },
}
