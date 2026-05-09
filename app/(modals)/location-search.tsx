import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { resolveLocation } from '@/lib/location-callback-store'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? ''

interface Prediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export default function LocationSearch() {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionToken = useRef(Math.random().toString(36).slice(2))

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setPredictions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          input: query,
          key: GOOGLE_PLACES_KEY,
          sessiontoken: sessionToken.current,
          language: 'en',
        })
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`)
        const json = await res.json()
        setPredictions(json.predictions ?? [])
      } catch {
        setPredictions([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [query])

  function handleSelect(item: Prediction) {
    resolveLocation(item.description)
    sessionToken.current = Math.random().toString(36).slice(2)
    router.back()
  }

  function getIcon(types: string[]) {
    if (types.includes('establishment')) return 'storefront-outline'
    if (types.includes('street_address') || types.includes('route')) return 'home-outline'
    return 'location-outline'
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text1} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search location…"
          placeholderTextColor={Colors.text2}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.text2} style={styles.searchIcon} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={12} activeOpacity={0.7} style={styles.searchIcon}>
            <Ionicons name="close-circle" size={18} color={Colors.text2} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="search-outline" size={18} color={Colors.text2} style={styles.searchIcon} />
        )}
      </View>

      {/* Results */}
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.place_id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          query.trim().length >= 2 && !loading ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)} activeOpacity={0.7}>
            <View style={styles.resultIcon}>
              <Ionicons name={getIcon(item.types)} size={16} color={Colors.text2} />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.structured_formatting.main_text}
              </Text>
              <Text style={styles.resultAddress} numberOfLines={1}>
                {item.structured_formatting.secondary_text}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.text2} />
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text1,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    width: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 40,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
  },
  resultAddress: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
})
