const { withAndroidManifest } = require('@expo/config-plugins')

module.exports = function withGoogleMapsKey(config, { apiKey }) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application[0]
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = []
    }
    // Remove existing entry if present to avoid duplicates
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      (item) => item.$?.['android:name'] !== 'com.google.android.geo.API_KEY',
    )
    mainApplication['meta-data'].push({
      $: { 'android:name': 'com.google.android.geo.API_KEY', 'android:value': apiKey },
    })
    return modConfig
  })
}
