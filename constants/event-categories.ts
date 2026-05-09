export const EVENT_CATEGORIES = [
  { label: 'Tech & AI', icon: '🤖' },
  { label: 'Climate & Sustainability', icon: '🌿' },
  { label: 'Health & Wellness', icon: '🧘' },
  { label: 'Food & Drink', icon: '🍜' },
  { label: 'Arts & Culture', icon: '🎨' },
  { label: 'Music', icon: '🎵' },
  { label: 'Community', icon: '🤝' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Business & Professional', icon: '💼' },
  { label: 'Education', icon: '📚' },
] as const

export type EventCategoryLabel = (typeof EVENT_CATEGORIES)[number]['label']
