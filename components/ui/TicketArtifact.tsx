import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'

interface TicketArtifactProps {
  eventTitle: string
  eventDate: string
  location: string
  registrationPda: string
  style?: ViewStyle
  children?: React.ReactNode
}

export function TicketArtifact({
  eventTitle,
  eventDate,
  location,
  registrationPda,
  style,
  children,
}: TicketArtifactProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topSection}>
        <Text style={styles.label}>TIZZLE TICKET</Text>
        <Text style={styles.title} numberOfLines={2}>
          {eventTitle}
        </Text>
        <Text style={styles.meta}>{eventDate}</Text>
        <Text style={styles.meta}>{location}</Text>
      </View>
      <View style={styles.perforation}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.pda} numberOfLines={1} ellipsizeMode="middle">
          {registrationPda}
        </Text>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    overflow: 'hidden',
  },
  topSection: {
    padding: 20,
    gap: 6,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.accent,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: -0.03,
    marginTop: 4,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
  perforation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border2,
    paddingVertical: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
  },
  bottomSection: {
    padding: 20,
    gap: 12,
  },
  pda: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
  },
})
