import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Ionicons } from '@expo/vector-icons'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'

interface Props {
  latitude: number
  longitude: number
  locationText?: string
  height?: number
  borderRadius?: number
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

export function EventMap({ latitude, longitude, locationText, height = 160, borderRadius = 12 }: Props) {
  function openInMaps() {
    const query = encodeURIComponent(locationText ?? `${latitude},${longitude}`)
    Linking.openURL(`https://maps.google.com/?q=${query}`)
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={openInMaps} style={[styles.container, { height, borderRadius }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        customMapStyle={DARK_MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none"
        liteMode
      >
        <Marker coordinate={{ latitude, longitude }} pinColor={Colors.accent} />
      </MapView>
      <View style={styles.openBtn}>
        <Ionicons name="navigate-outline" size={11} color={Colors.text1} />
        <Text style={styles.openBtnText}>Open in Maps</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
  },
  openBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.text1,
  },
})
