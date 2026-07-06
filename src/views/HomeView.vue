<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import cruiseData from '../data/metrics.json'
import CruiseFilters from '../components/CruiseFilters.vue'
import ResultCard from '../components/ResultCard.vue'
import { useSavedCruises } from '../composables/useSavedCruises'
import type { CruiseDeparture, StateroomPricing } from '../types/cruise'
import type { SavedCruiseConfig } from '../types/savedCruise'

type ViewMode = 'itinerary' | 'date'
type PricingMode = 'person' | 'stateroom'
type SortMode = 'recommended' | 'highestRated' | 'priceLowHigh' | 'priceHighLow' | 'dateEarliest'

type RoomConfig = {
  adults: number
  children: number
  stateroomType: keyof StateroomPricing
}

type QuickViewRoomConfig = RoomConfig & {
  stateroomType: keyof StateroomPricing
}

type ItineraryGroup = {
  itineraryName: string
  itineraryMap: string
  shipName: string
  leadDeparture: CruiseDeparture
  departures: CruiseDeparture[]
}

type PersistedHomeState = {
  searchQuery: string
  appliedSearchQuery: string
  pricingMode: PricingMode
  activeView: ViewMode
  sortMode: SortMode
  selectedMonths: string[]
  selectedShips: string[]
  priceRange: number[]
  nightsRange: number[]
}

const cruises = cruiseData as CruiseDeparture[]
const router = useRouter()
const { mdAndUp } = useDisplay()
const HOME_STATE_STORAGE_KEY = 'cruise-search-home-state-v1'

const minPrice = Math.min(...cruises.map((cruise) => cruise.pricePerPerson))
const maxPrice = Math.max(...cruises.map((cruise) => cruise.pricePerPerson))
const minNights = Math.min(...cruises.map((cruise) => cruise.nights))
const maxNights = Math.max(...cruises.map((cruise) => cruise.nights))

const searchQuery = ref('')
const appliedSearchQuery = ref('')
const pricingMode = ref<PricingMode>('person')
const staterooms = ref<RoomConfig[]>([{ adults: 2, children: 0, stateroomType: 'interior' }])
const selectedMonths = ref<string[]>([])
const selectedShips = ref<string[]>([])
const priceRange = ref<number[]>([minPrice, maxPrice])
const nightsRange = ref<number[]>([minNights, maxNights])
const activeView = ref<ViewMode>('itinerary')
const mobileFiltersOpen = ref(false)
const sortMode = ref<SortMode>('recommended')

const savedIds = ref<string[]>([])
const compareIds = ref<string[]>([])

const quickViewOpen = ref(false)
const quickViewTitle = ref('')
const quickViewCruises = ref<CruiseDeparture[]>([])
const selectedQuickViewDateId = ref('')
const quickViewStaterooms = ref<QuickViewRoomConfig[]>([
  { adults: 2, children: 0, stateroomType: 'interior' },
])
const comparePanelCollapsed = ref(false)
const compareModuleOpen = ref(false)
const { addSavedCruise } = useSavedCruises()

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const monthOptions = computed(() => {
  const monthSet = new Set(cruises.map((cruise) => cruise.startDate.slice(0, 7)))
  return [...monthSet].sort().map((value) => ({
    value,
    label: monthFormatter.format(new Date(`${value}-01`)),
  }))
})

const shipOptions = computed(() => [...new Set(cruises.map((cruise) => cruise.shipName))].sort())
const stateroomCount = computed(() => staterooms.value.length)
const totalAdults = computed(() => staterooms.value.reduce((sum, room) => sum + room.adults, 0))
const totalChildren = computed(() => staterooms.value.reduce((sum, room) => sum + room.children, 0))
const totalGuests = computed(() => totalAdults.value + totalChildren.value)
const guestSummary = computed(
  () => `${stateroomCount.value} staterooms • ${totalAdults.value} Adults, ${totalChildren.value} Children`,
)
const quickViewStateroomCount = computed(() => quickViewStaterooms.value.length)
const quickViewTotalAdults = computed(() => quickViewStaterooms.value.reduce((sum, room) => sum + room.adults, 0))
const quickViewTotalChildren = computed(() => quickViewStaterooms.value.reduce((sum, room) => sum + room.children, 0))
const quickViewTotalGuests = computed(() => quickViewTotalAdults.value + quickViewTotalChildren.value)
const quickViewGuestSummary = computed(
  () => `${quickViewStateroomCount.value} staterooms • ${quickViewTotalAdults.value} Adults, ${quickViewTotalChildren.value} Children`,
)
const pricingLabel = computed(() => (pricingMode.value === 'person' ? 'person' : 'stateroom'))
const resultsCount = computed(() =>
  activeView.value === 'itinerary' ? sortedGroupedByItinerary.value.length : sortedFilteredCruises.value.length,
)

const viewModeLabel = computed(() => (activeView.value === 'itinerary' ? 'Itinerary' : 'Cruise Date'))
const pricingModeLabel = computed(() => (pricingMode.value === 'person' ? 'Per Person' : 'Per Stateroom'))
const sortModeLabel = computed(() => {
  const selected = sortOptions.find((option) => option.value === sortMode.value)
  return selected?.title ?? 'Recommended'
})

const appliedFiltersInline = computed(() => {
  const parts: string[] = []
  const query = appliedSearchQuery.value.trim()
  const [selectedMinPrice = minPrice, selectedMaxPrice = maxPrice] = priceRange.value
  const [selectedMinNights = minNights, selectedMaxNights = maxNights] = nightsRange.value

  if (query.length > 0) {
    parts.push(`Search: ${query}`)
  }

  if (selectedMonths.value.length > 0) {
    const monthLabels = monthOptions.value
      .filter((month) => selectedMonths.value.includes(month.value))
      .map((month) => month.label)
    parts.push(`Months: ${monthLabels.join(', ')}`)
  }

  if (selectedShips.value.length > 0) {
    parts.push(`Ships: ${selectedShips.value.join(', ')}`)
  }

  if (selectedMinPrice !== minPrice || selectedMaxPrice !== maxPrice) {
    parts.push(`Price (per ${pricingLabel.value}): ${formatCurrency(selectedMinPrice)}-${formatCurrency(selectedMaxPrice)}`)
  }

  if (selectedMinNights !== minNights || selectedMaxNights !== maxNights) {
    parts.push(`Nights: ${selectedMinNights}-${selectedMaxNights}`)
  }

  if (parts.length === 0) {
    parts.push('No filters applied')
  }

  return parts.join(' | ')
})

const activeFilterCount = computed(() => {
  let count = 0
  count += selectedMonths.value.length
  count += selectedShips.value.length
  if (priceRange.value[0] !== minPrice || priceRange.value[1] !== maxPrice) count++
  if (nightsRange.value[0] !== minNights || nightsRange.value[1] !== maxNights) count++
  return count
})

const individualFilters = computed(() => {
  const filters: Array<{ type: string; label: string; id?: string }> = []
  
  selectedMonths.value.forEach((monthValue) => {
    const monthLabel = monthOptions.value.find((m) => m.value === monthValue)?.label
    if (monthLabel) {
      filters.push({ type: 'month', label: monthLabel, id: monthValue })
    }
  })
  
  selectedShips.value.forEach((ship) => {
    filters.push({ type: 'ship', label: ship, id: ship })
  })
  
  if (priceRange.value[0] !== minPrice || priceRange.value[1] !== maxPrice) {
    const [minPriceSelected = minPrice, maxPriceSelected = maxPrice] = priceRange.value
    filters.push({
      type: 'price',
      label: `Price: ${formatCurrency(minPriceSelected)}-${formatCurrency(maxPriceSelected)}`
    })
  }
  
  if (nightsRange.value[0] !== minNights || nightsRange.value[1] !== maxNights) {
    const [minNightsSelected = minNights, maxNightsSelected = maxNights] = nightsRange.value
    filters.push({
      type: 'nights',
      label: `Nights: ${minNightsSelected}-${maxNightsSelected}`
    })
  }
  
  return filters
})

function removeFilter(filter: (typeof individualFilters.value)[0]): void {
  if (filter.type === 'month' && filter.id) {
    selectedMonths.value = selectedMonths.value.filter((m) => m !== filter.id)
  } else if (filter.type === 'ship' && filter.id) {
    selectedShips.value = selectedShips.value.filter((s) => s !== filter.id)
  } else if (filter.type === 'price') {
    priceRange.value = [minPrice, maxPrice]
  } else if (filter.type === 'nights') {
    nightsRange.value = [minNights, maxNights]
  }
}

function clearAllFilters(): void {
  selectedMonths.value = []
  selectedShips.value = []
  priceRange.value = [minPrice, maxPrice]
  nightsRange.value = [minNights, maxNights]
}

function clearFilters(): void {
  selectedMonths.value = []
  selectedShips.value = []
  priceRange.value = [minPrice, maxPrice]
  nightsRange.value = [minNights, maxNights]
}

const sortOptions: { title: string; value: SortMode }[] = [
  { title: 'Recommended', value: 'recommended' },
  { title: 'Highest Rated', value: 'highestRated' },
  { title: 'Price: Low to High', value: 'priceLowHigh' },
  { title: 'Price: High to Low', value: 'priceHighLow' },
  { title: 'Date: Earliest First', value: 'dateEarliest' },
]

const filteredCruises = computed(() => {
  const query = appliedSearchQuery.value.trim().toLowerCase()
  const [selectedMinPrice = minPrice, selectedMaxPrice = maxPrice] = priceRange.value
  const [selectedMinNights = minNights, selectedMaxNights = maxNights] = nightsRange.value

  return cruises.filter((cruise) => {
    const cruiseMonth = cruise.startDate.slice(0, 7)
    const matchesQuery =
      query.length === 0 ||
      cruise.itineraryName.toLowerCase().includes(query) ||
      cruise.shipName.toLowerCase().includes(query) ||
      cruise.itineraryMap.toLowerCase().includes(query)

    const matchesMonth =
      selectedMonths.value.length === 0 || selectedMonths.value.includes(cruiseMonth)
    const matchesShip =
      selectedShips.value.length === 0 || selectedShips.value.includes(cruise.shipName)
    // Keep filtering on a fixed per-person basis so pricing view mode does not change results.
    const filterPrice = cruise.pricePerPerson
    const matchesPrice = filterPrice >= selectedMinPrice && filterPrice <= selectedMaxPrice
    const matchesNights =
      cruise.nights >= selectedMinNights && cruise.nights <= selectedMaxNights

    return matchesQuery && matchesMonth && matchesShip && matchesPrice && matchesNights
  })
})

const groupedByItinerary = computed<ItineraryGroup[]>(() => {
  const groups = new Map<string, ItineraryGroup>()

  filteredCruises.value.forEach((cruise) => {
    const current = groups.get(cruise.itineraryName)
    if (current) {
      current.departures.push(cruise)
      return
    }

    groups.set(cruise.itineraryName, {
      itineraryName: cruise.itineraryName,
      itineraryMap: cruise.itineraryMap,
      shipName: cruise.shipName,
      leadDeparture: cruise,
      departures: [cruise],
    })
  })

  return [...groups.values()].sort((a, b) => {
    const aDate = a.departures[0]?.startDate ?? ''
    const bDate = b.departures[0]?.startDate ?? ''
    return aDate.localeCompare(bDate)
  })
})

function cruiseRatingValue(id: string): number {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Number((3.8 + (hash % 12) * 0.1).toFixed(1))
}

function cruiseRating(cruise: CruiseDeparture): number {
  return cruiseRatingValue(cruise.id)
}

function itineraryRating(group: ItineraryGroup): number {
  const total = group.departures.reduce((sum, departure) => sum + cruiseRating(departure), 0)
  return Number((total / group.departures.length).toFixed(1))
}

function compareBySortMode(a: CruiseDeparture, b: CruiseDeparture): number {
  if (sortMode.value === 'highestRated') {
    return cruiseRating(b) - cruiseRating(a)
  }

  if (sortMode.value === 'priceLowHigh') {
    return pricingValue(a) - pricingValue(b)
  }

  if (sortMode.value === 'priceHighLow') {
    return pricingValue(b) - pricingValue(a)
  }

  if (sortMode.value === 'dateEarliest') {
    return a.startDate.localeCompare(b.startDate)
  }

  const aSaved = savedIds.value.includes(a.id)
  const bSaved = savedIds.value.includes(b.id)
  if (aSaved !== bSaved) {
    return aSaved ? -1 : 1
  }

  const ratingDiff = cruiseRating(b) - cruiseRating(a)
  if (ratingDiff !== 0) {
    return ratingDiff
  }

  return pricingValue(a) - pricingValue(b)
}

const sortedFilteredCruises = computed(() => [...filteredCruises.value].sort(compareBySortMode))

const sortedGroupedByItinerary = computed(() => {
  const groups = [...groupedByItinerary.value].map((group) => ({
    ...group,
    departures: [...group.departures].sort(compareBySortMode),
  }))

  return groups.sort((a, b) => {
    if (sortMode.value === 'highestRated') {
      return itineraryRating(b) - itineraryRating(a)
    }

    if (sortMode.value === 'priceLowHigh') {
      return minPriceInItineraryGroup(a) - minPriceInItineraryGroup(b)
    }

    if (sortMode.value === 'priceHighLow') {
      return minPriceInItineraryGroup(b) - minPriceInItineraryGroup(a)
    }

    if (sortMode.value === 'dateEarliest') {
      const aDate = a.departures[0]?.startDate ?? ''
      const bDate = b.departures[0]?.startDate ?? ''
      return aDate.localeCompare(bDate)
    }

    const aSaved = a.departures.some((departure) => savedIds.value.includes(departure.id))
    const bSaved = b.departures.some((departure) => savedIds.value.includes(departure.id))
    if (aSaved !== bSaved) {
      return aSaved ? -1 : 1
    }

    const ratingDiff = itineraryRating(b) - itineraryRating(a)
    if (ratingDiff !== 0) {
      return ratingDiff
    }

    return minPriceInItineraryGroup(a) - minPriceInItineraryGroup(b)
  })
})

const compareCruises = computed(() =>
  cruises.filter((cruise) => compareIds.value.includes(cruise.id)).sort((a, b) => a.startDate.localeCompare(b.startDate)),
)

const shipHighlights: Record<string, string[]> = {
  'Intrepid Aurora': ['Skyline pool deck', 'Mediterranean chef table', 'Open-air cinema'],
  'Intrepid Solstice': ['Family splash zone', 'Tropical juice bar', 'Sunset terrace lounges'],
  'Intrepid Northwind': ['Panorama observation lounge', 'Glacier-view spa', 'Naturalist talks'],
  'Intrepid Meridian': ['Nordic thermal suite', 'Fjord-view dining room', 'Live acoustic nights'],
  'Intrepid Horizon': ['Rooftop pickleball', 'Coastal tasting kitchen', 'Ocean promenade track'],
  'Intrepid Atlas': ['Transatlantic library', 'Grand ballroom', 'Planetarium dome shows'],
}

const quickViewSelectedCruise = computed(() => {
  if (selectedQuickViewDateId.value.length > 0) {
    const selected = quickViewCruises.value.find((item) => item.id === selectedQuickViewDateId.value)
    if (selected) {
      return selected
    }
  }

  return quickViewCruises.value[0]
})

const quickViewDestinations = computed(() => {
  if (!quickViewSelectedCruise.value) {
    return []
  }

  return quickViewSelectedCruise.value.itineraryMap.split('->').map((item) => item.trim())
})

const quickViewShipHighlights = computed(() => {
  if (!quickViewSelectedCruise.value) {
    return []
  }

  return shipHighlights[quickViewSelectedCruise.value.shipName] ?? ['Signature dining', 'Live entertainment', 'Wellness centre']
})

const quickViewSelectionSaved = computed(() => {
  if (!quickViewSelectedCruise.value) {
    return false
  }

  return savedIds.value.includes(quickViewSelectedCruise.value.id)
})

const quickViewSelectionCompared = computed(() => {
  if (!quickViewSelectedCruise.value) {
    return false
  }

  return compareIds.value.includes(quickViewSelectedCruise.value.id)
})

const guestCalculatorTotal = computed(() => {
  if (!quickViewSelectedCruise.value) {
    return 0
  }

  return quickViewStaterooms.value.reduce((sum, room) => {
    const cruise = quickViewSelectedCruise.value!
    const roomGuests = room.adults + room.children
    const extraAdults = Math.max(room.adults - 2, 0)
    const extraChildren = room.children
    const roomTotal =
      cruise.totalBasePrice +
      cruise.pricePerPerson * extraAdults * 0.85 +
      cruise.pricePerPerson * extraChildren * 0.6 +
      (roomGuests < 2 ? cruise.pricePerPerson * 0.5 : 0)

    return sum + roomTotal
  }, 0)
})

const guestCalculatorPerGuest = computed(() =>
  Math.round(guestCalculatorTotal.value / Math.max(quickViewTotalGuests.value, 1)),
)

const guestCalculatorPerStateroom = computed(() =>
  Math.round(guestCalculatorTotal.value / Math.max(quickViewStateroomCount.value, 1)),
)

function totalCruisePrice(cruise: CruiseDeparture): number {
  return staterooms.value.reduce((sum, room) => {
    const roomGuests = room.adults + room.children
    const extraAdults = Math.max(room.adults - 2, 0)
    const extraChildren = room.children
    const roomTotal =
      cruise.totalBasePrice +
      cruise.pricePerPerson * extraAdults * 0.85 +
      cruise.pricePerPerson * extraChildren * 0.6 +
      (roomGuests < 2 ? cruise.pricePerPerson * 0.5 : 0)

    return sum + roomTotal
  }, 0)
}

function pricingValue(cruise: CruiseDeparture): number {
  const total = totalCruisePrice(cruise)
  if (pricingMode.value === 'stateroom') {
    return Math.round(total / stateroomCount.value)
  }

  return Math.round(total / totalGuests.value)
}

function minPriceInItineraryGroup(group: ItineraryGroup): number {
  const prices = group.departures.map((departure) => pricingValue(departure))
  return Math.min(...prices)
}

function addStateroom(): void {
  if (staterooms.value.length >= 4) {
    return
  }

  staterooms.value.push({ adults: 2, children: 0, stateroomType: 'interior' })
}

function removeStateroom(index: number): void {
  if (staterooms.value.length > 1) {
    staterooms.value.splice(index, 1)
  }
}

function incrementAdults(index: number): void {
  const room = staterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults + room.children < 4) {
    room.adults += 1
  }
}

function decrementAdults(index: number): void {
  const room = staterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults > 1) {
    room.adults -= 1
  }
}

function incrementChildren(index: number): void {
  const room = staterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults + room.children < 4) {
    room.children += 1
  }
}

function decrementChildren(index: number): void {
  const room = staterooms.value[index]
  if (!room) {
    return
  }

  if (room.children > 0) {
    room.children -= 1
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(date))
}

function stateroomTypeLabel(type: keyof StateroomPricing): string {
  const labels: Record<keyof StateroomPricing, string> = {
    interior: 'Interior',
    oceanview: 'Oceanview',
    balcony: 'Balcony',
    suite: 'Suite',
  }

  return labels[type]
}

function formatStateroomLabel(room: RoomConfig, index: number): string {
  return `Stateroom ${index + 1} - ${stateroomTypeLabel(room.stateroomType)}, ${room.adults} Adult${room.adults !== 1 ? 's' : ''}, ${room.children} Child${room.children !== 1 ? 'ren' : ''}`
}

function toggleSaved(id: string): void {
  savedIds.value = savedIds.value.includes(id)
    ? savedIds.value.filter((item) => item !== id)
    : [...savedIds.value, id]
}

function toggleCompare(id: string): void {
  if (compareIds.value.includes(id)) {
    compareIds.value = compareIds.value.filter((item) => item !== id)
    return
  }

  if (compareIds.value.length >= 4) {
    compareIds.value = [...compareIds.value.slice(1), id]
    return
  }

  compareIds.value = [...compareIds.value, id]
}

watch(compareIds, (nextIds) => {
  if (nextIds.length > 0) {
    comparePanelCollapsed.value = false
  }
})

function openQuickView(cruiseSet: CruiseDeparture[], title: string): void {
  quickViewCruises.value = cruiseSet
  quickViewTitle.value = title
  selectedQuickViewDateId.value = cruiseSet[0]?.id ?? ''
  quickViewStaterooms.value = staterooms.value.map((room) => ({
    adults: room.adults,
    children: room.children,
    stateroomType: 'interior',
  }))
  quickViewOpen.value = true
}

function addQuickViewStateroom(): void {
  if (quickViewStaterooms.value.length >= 4) {
    return
  }

  quickViewStaterooms.value.push({ adults: 2, children: 0, stateroomType: 'interior' })
}

function removeQuickViewStateroom(index: number): void {
  if (quickViewStaterooms.value.length > 1) {
    quickViewStaterooms.value.splice(index, 1)
  }
}

function incrementQuickViewAdults(index: number): void {
  const room = quickViewStaterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults + room.children < 4) {
    room.adults += 1
  }
}

function decrementQuickViewAdults(index: number): void {
  const room = quickViewStaterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults > 1) {
    room.adults -= 1
  }
}

function incrementQuickViewChildren(index: number): void {
  const room = quickViewStaterooms.value[index]
  if (!room) {
    return
  }

  if (room.adults + room.children < 4) {
    room.children += 1
  }
}

function decrementQuickViewChildren(index: number): void {
  const room = quickViewStaterooms.value[index]
  if (!room) {
    return
  }

  if (room.children > 0) {
    room.children -= 1
  }
}

function toggleQuickViewSaved(): void {
  if (!quickViewSelectedCruise.value) {
    return
  }

  toggleSaved(quickViewSelectedCruise.value.id)
}

function toggleQuickViewCompare(): void {
  if (!quickViewSelectedCruise.value) {
    return
  }

  toggleCompare(quickViewSelectedCruise.value.id)
}

function saveQuickViewCruise(): void {
  if (!quickViewSelectedCruise.value) {
    return
  }

  const cruise = quickViewSelectedCruise.value
  const destination = cruise.itineraryMap.split('->')[1]?.trim() ?? cruise.itineraryName

  const savedConfig: SavedCruiseConfig = {
    id: `${cruise.id}-${Date.now()}`,
    cruiseId: cruise.id,
    itineraryName: cruise.itineraryName,
    itineraryMap: cruise.itineraryMap,
    shipName: cruise.shipName,
    startDate: cruise.startDate,
    endDate: cruise.endDate,
    nights: cruise.nights,
    imageUrl: destinationImage(destination),
    staterooms: quickViewStaterooms.value.map((room) => ({
      adults: room.adults,
      children: room.children,
      stateroomType: room.stateroomType,
    })),
    totalPrice: guestCalculatorTotal.value,
    pricePerStateroom: guestCalculatorPerStateroom.value,
    pricePerPerson: guestCalculatorPerGuest.value,
    savedAt: new Date().toISOString(),
  }

  addSavedCruise(savedConfig)

  if (!savedIds.value.includes(cruise.id)) {
    savedIds.value = [...savedIds.value, cruise.id]
  }
}

function destinationImage(destination: string): string {
  const value = destination.toLowerCase()

  const openSourcePhotos = {
    mediterranean: '/images/mediterranean.jpg',
    caribbean: '/images/caribbean.jpg',
    alaska: '/images/alaska.jpg',
    nordic: '/images/nordic.jpg',
    pacific: '/images/pacific.jpg',
    transatlantic: '/images/transatlantic.jpg',
    default: '/images/default.jpg',
  }

  if (value.includes('barcelona') || value.includes('marseille') || value.includes('mediterranean')) {
    return openSourcePhotos.mediterranean
  }

  if (value.includes('miami') || value.includes('nassau') || value.includes('cozumel') || value.includes('caribbean')) {
    return openSourcePhotos.caribbean
  }

  if (value.includes('juneau') || value.includes('skagway') || value.includes('ketchikan') || value.includes('alaska')) {
    return openSourcePhotos.alaska
  }

  if (value.includes('bergen') || value.includes('geiranger') || value.includes('oslo') || value.includes('nordic')) {
    return openSourcePhotos.nordic
  }

  if (value.includes('vancouver') || value.includes('san francisco') || value.includes('los angeles') || value.includes('pacific')) {
    return openSourcePhotos.pacific
  }

  if (value.includes('lisbon') || value.includes('azores') || value.includes('bermuda') || value.includes('new york') || value.includes('transatlantic')) {
    return openSourcePhotos.transatlantic
  }

  return openSourcePhotos.default
}

function openCompareModule(): void {
  compareModuleOpen.value = true
}

function closeComparePanel(): void {
  comparePanelCollapsed.value = true
}

function expandComparePanel(): void {
  comparePanelCollapsed.value = false
}

function performSearch(): void {
  appliedSearchQuery.value = searchQuery.value
}

function goToBookingLanding(): void {
  if (!quickViewSelectedCruise.value) {
    return
  }

  saveHomeState()

  router.push({
    name: 'booking-landing',
    query: {
      cruiseId: quickViewSelectedCruise.value.id,
      stateroomTypes: JSON.stringify(quickViewStaterooms.value.map((r) => r.stateroomType)),
      adults: quickViewTotalAdults.value,
      children: quickViewTotalChildren.value,
      totalPrice: guestCalculatorTotal.value,
      pricePerStateroom: guestCalculatorPerStateroom.value,
      pricePerPerson: guestCalculatorPerGuest.value,
    },
  })
}

function bookCruiseFromCard(cruise: CruiseDeparture): void {
  // Directly navigate to booking landing with default stateroom configuration
  saveHomeState()

  router.push({
    name: 'booking-landing',
    query: {
      cruiseId: cruise.id,
      stateroomTypes: JSON.stringify(['interior']),
      adults: 2,
      children: 0,
      totalPrice: cruise.stateroomPricing.interior,
      pricePerStateroom: cruise.stateroomPricing.interior,
      pricePerPerson: cruise.pricePerPerson,
    },
  })
}

function clearCompareSelections(): void {
  compareIds.value = []
  comparePanelCollapsed.value = true
}

const compareRows = computed(() => [
  {
    label: 'Itinerary',
    values: compareCruises.value.map((cruise) => cruise.itineraryName),
  },
  {
    label: 'Ship',
    values: compareCruises.value.map((cruise) => cruise.shipName),
  },
  {
    label: 'Dates',
    values: compareCruises.value.map((cruise) => `${formatDate(cruise.startDate)} - ${formatDate(cruise.endDate)}`),
  },
  {
    label: 'Nights',
    values: compareCruises.value.map((cruise) => `${cruise.nights}`),
  },
  {
    label: `Price per ${pricingLabel.value}`,
    values: compareCruises.value.map((cruise) => formatCurrency(pricingValue(cruise))),
  },
  {
    label: 'Map',
    values: compareCruises.value.map((cruise) => cruise.itineraryMap),
  },
])

function saveHomeState(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state: PersistedHomeState = {
    searchQuery: searchQuery.value,
    appliedSearchQuery: appliedSearchQuery.value,
    pricingMode: pricingMode.value,
    activeView: activeView.value,
    sortMode: sortMode.value,
    selectedMonths: [...selectedMonths.value],
    selectedShips: [...selectedShips.value],
    priceRange: [...priceRange.value],
    nightsRange: [...nightsRange.value],
  }

  window.sessionStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(state))
}

function restoreHomeState(): void {
  if (typeof window === 'undefined') {
    return
  }

  const raw = window.sessionStorage.getItem(HOME_STATE_STORAGE_KEY)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedHomeState>

    if (typeof parsed.searchQuery === 'string') {
      searchQuery.value = parsed.searchQuery
    }

    if (typeof parsed.appliedSearchQuery === 'string') {
      appliedSearchQuery.value = parsed.appliedSearchQuery
    }

    if (parsed.pricingMode === 'person' || parsed.pricingMode === 'stateroom') {
      pricingMode.value = parsed.pricingMode
    }

    if (parsed.activeView === 'itinerary' || parsed.activeView === 'date') {
      activeView.value = parsed.activeView
    }

    if (
      parsed.sortMode === 'recommended' ||
      parsed.sortMode === 'highestRated' ||
      parsed.sortMode === 'priceLowHigh' ||
      parsed.sortMode === 'priceHighLow'
    ) {
      sortMode.value = parsed.sortMode
    }

    if (Array.isArray(parsed.selectedMonths)) {
      selectedMonths.value = parsed.selectedMonths.filter((month): month is string => typeof month === 'string')
    }

    if (Array.isArray(parsed.selectedShips)) {
      selectedShips.value = parsed.selectedShips.filter((ship): ship is string => typeof ship === 'string')
    }

    if (
      Array.isArray(parsed.priceRange) &&
      parsed.priceRange.length === 2 &&
      parsed.priceRange.every((value) => typeof value === 'number')
    ) {
      const [restoredMinPrice = minPrice, restoredMaxPrice = maxPrice] = parsed.priceRange
      priceRange.value = [restoredMinPrice, restoredMaxPrice]
    }

    if (
      Array.isArray(parsed.nightsRange) &&
      parsed.nightsRange.length === 2 &&
      parsed.nightsRange.every((value) => typeof value === 'number')
    ) {
      const [restoredMinNights = minNights, restoredMaxNights = maxNights] = parsed.nightsRange
      nightsRange.value = [restoredMinNights, restoredMaxNights]
    }
  } catch {
    // Ignore invalid persisted state
  }
}

onMounted(() => {
  restoreHomeState()
})

watch(
  [
    searchQuery,
    appliedSearchQuery,
    pricingMode,
    activeView,
    sortMode,
    selectedMonths,
    selectedShips,
    priceRange,
    nightsRange,
  ],
  () => {
    saveHomeState()
  },
  { deep: true },
)
</script>

<template>
  <v-container fluid class="pa-3 pa-sm-5 pa-md-8 cruise-page">
    <v-card class="hero-card mb-5 mb-md-6" rounded="xl" elevation="0">
      <v-card-text class="py-7 py-md-9 px-4 px-sm-5 px-md-9">
        <h1 class="text-h4 text-md-h3 font-weight-black mb-2 hero-title">Find your perfect Intrepid voyage</h1>
        <v-row class="align-center mt-1" dense>
          <v-col cols="12" md="7">
            <div class="d-flex ga-2 align-center">
              <v-text-field
                v-model="searchQuery"
                label="Search itineraries, ships, destinations"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                hide-details
                density="comfortable"
                bg-color="white"
                class="flex-grow-1"
              />
              <v-btn
                color="primary"
                prepend-icon="mdi-magnify"
                variant="flat"
                size="large"
                @click="performSearch"
              >
                Search
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="5">
            <v-card variant="outlined" class="pa-2 pa-md-3 guest-panel h-100">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-2">Staterooms</div>
                <div class="d-flex ga-1">
                  <v-btn icon="mdi-plus" size="x-small" variant="tonal" :disabled="stateroomCount >= 4" @click="addStateroom" />
                </div>
              </div>

              <v-expansion-panels variant="accordion">
                <v-expansion-panel v-for="(room, index) in staterooms" :key="index" rounded="lg">
                  <template #title>
                    <div class="d-flex align-center justify-space-between w-100 ga-3">
                      <div class="room-header-wrap">
                        <span class="font-weight-medium">{{ formatStateroomLabel(room, index) }}</span>
                      </div>
                      <v-btn
                        icon="mdi-trash-can-outline"
                        size="x-small"
                        variant="text"
                        color="secondary"
                        :disabled="stateroomCount <= 1"
                        :aria-label="`Remove stateroom ${index + 1}`"
                        @click.stop="removeStateroom(index)"
                      />
                    </div>
                  </template>
                  <v-expansion-panel-text>
                    <div class="mb-3">
                      <div class="text-body-2 font-weight-medium mb-2">Type</div>
                      <v-select
                        v-model="room.stateroomType"
                        :items="[
                          { title: 'Interior', value: 'interior' },
                          { title: 'Oceanview', value: 'oceanview' },
                          { title: 'Balcony', value: 'balcony' },
                          { title: 'Suite', value: 'suite' },
                        ]"
                        density="compact"
                        variant="outlined"
                      />
                    </div>

                    <div class="d-flex justify-space-between align-center mb-3">
                      <div>
                        <div class="text-body-2 font-weight-medium">Adults</div>
                        <div class="text-caption text-medium-emphasis">Ages 18+</div>
                      </div>
                      <div class="d-flex align-center ga-2">
                        <v-btn icon="mdi-minus" size="x-small" variant="tonal" @click="decrementAdults(index)" />
                        <strong>{{ room.adults }}</strong>
                        <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="incrementAdults(index)" />
                      </div>
                    </div>

                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-body-2 font-weight-medium">Children</div>
                        <div class="text-caption text-medium-emphasis">Under 18</div>
                      </div>
                      <div class="d-flex align-center ga-2">
                        <v-btn icon="mdi-minus" size="x-small" variant="tonal" @click="decrementChildren(index)" />
                        <strong>{{ room.children }}</strong>
                        <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="incrementChildren(index)" />
                      </div>
                    </div>
                    <p class="text-caption text-medium-emphasis mt-2 mb-0">Max 4 guests per stateroom and at least 1 adult.</p>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <p class="text-caption text-medium-emphasis mt-2 mb-0">{{ guestSummary }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="align-start">
      <v-col cols="12" md="3">
        <v-card v-if="mdAndUp" rounded="xl" class="sticky-filters filters-shell surface-card" elevation="2">
          <v-card-title class="py-4">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-tune-variant" color="primary" />
              Filters
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <CruiseFilters
              v-model:selected-months="selectedMonths"
              v-model:selected-ships="selectedShips"
              v-model:price-range="priceRange"
              v-model:nights-range="nightsRange"
              :month-options="monthOptions"
              :ship-options="shipOptions"
              :min-price="minPrice"
              :max-price="maxPrice"
              :min-nights="minNights"
              :max-nights="maxNights"
              :pricing-mode="pricingMode"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card rounded="xl" elevation="2" class="toolbar-shell mb-4 surface-card">
          <v-card-text class="py-3 px-3 px-sm-4 px-md-5 d-flex flex-wrap align-center ga-2 ga-sm-3">
          <div v-if="!mdAndUp" class="w-100">
            <v-btn
              color="secondary"
              prepend-icon="mdi-filter-variant"
              rounded="pill"
              class="w-100"
              @click="mobileFiltersOpen = true"
            >
              Filters <span v-if="activeFilterCount > 0">({{ activeFilterCount }})</span>
            </v-btn>
          </div>

          <div class="control-group">
            <span class="control-label">View by</span>
            <v-select
              v-model="activeView"
              :items="[
                { title: 'Itinerary', value: 'itinerary' },
                { title: 'Cruise Date', value: 'date' },
              ]"
              variant="outlined"
              density="compact"
              hide-details
              class="control-select"
            />
          </div>

          <div class="control-group">
            <span class="control-label">Pricing by</span>
            <v-select
              v-model="pricingMode"
              :items="[
                { title: 'Per Stateroom', value: 'stateroom' },
                { title: 'Per Person', value: 'person' },
              ]"
              variant="outlined"
              density="compact"
              hide-details
              class="control-select"
            />
          </div>

          <div class="control-group sort-control">
            <span class="control-label">Sort by</span>
            <v-select
              v-model="sortMode"
              :items="sortOptions"
              variant="outlined"
              density="compact"
              hide-details
              class="sort-select"
            />
          </div>
          </v-card-text>
        </v-card>

        <div class="results-header mb-3">
          <p class="text-overline mb-1 section-kicker">Search Results</p>
          <h2 class="text-h6 mb-3">
            Cruises matching your search ({{ resultsCount }})
          </h2>
          <div v-if="activeFilterCount > 0" class="d-flex flex-wrap ga-2 align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">Filters selected:</span>
            <v-chip
              v-for="filter in individualFilters"
              :key="`${filter.type}-${filter.id}`"
              closable
              color="secondary"
              variant="flat"
              size="small"
              @click:close="removeFilter(filter)"
            >
              {{ filter.label }}
            </v-chip>
            <v-btn
              size="x-small"
              variant="text"
              color="secondary"
              class="px-1"
              @click="clearAllFilters"
            >
              Clear filters
            </v-btn>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-2">No filters applied</div>
        </div>

        <v-row v-if="activeView === 'itinerary'">
          <v-col v-for="group in sortedGroupedByItinerary" :key="group.itineraryName" cols="12">
            <ResultCard
              mode="itinerary"
              :cruise="group.departures[0] ?? group.leadDeparture"
              :departures="group.departures"
              :image-url="destinationImage(group.leadDeparture.itineraryMap.split('->')[1]?.trim() ?? group.leadDeparture.itineraryName)"
              :is-saved="savedIds.includes(group.leadDeparture.id)"
              :is-compared="compareIds.includes(group.leadDeparture.id)"
              :display-price="minPriceInItineraryGroup(group)"
              :price-label="pricingLabel"
              :review-rating="itineraryRating(group)"
              :departure-prices="Object.fromEntries(group.departures.map((item) => [item.id, pricingValue(item)]))"
              @save="toggleSaved"
              @compare="toggleCompare"
              @quickview="openQuickView"
              @book="bookCruiseFromCard"
            />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="cruise in sortedFilteredCruises" :key="cruise.id" cols="12" sm="6">
            <ResultCard
              mode="date"
              :cruise="cruise"
              :image-url="destinationImage(cruise.itineraryMap.split('->')[1]?.trim() ?? cruise.itineraryName)"
              :is-saved="savedIds.includes(cruise.id)"
              :is-compared="compareIds.includes(cruise.id)"
              :display-price="pricingValue(cruise)"
              :price-label="pricingLabel"
              :review-rating="cruiseRating(cruise)"
              @save="toggleSaved"
              @compare="toggleCompare"
              @quickview="openQuickView"
              @book="bookCruiseFromCard"
            />
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <div v-if="compareIds.length > 0" class="compare-dock" :class="{ collapsed: comparePanelCollapsed }">
      <v-card class="compare-panel surface-card" rounded="xl" elevation="6">
        <v-card-title class="d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-compare" color="secondary" />
            <span>Compare cruises ({{ compareCruises.length }}/4)</span>
          </div>
          <div class="d-flex align-center ga-2">
            <v-btn
              size="small"
              variant="text"
              @click="comparePanelCollapsed ? expandComparePanel() : closeComparePanel()"
            >
              {{ comparePanelCollapsed ? 'Expand' : 'Collapse' }}
            </v-btn>
            <v-btn size="small" color="primary" variant="flat" :disabled="compareCruises.length < 2" @click="openCompareModule">
              Compare
            </v-btn>
          </div>
        </v-card-title>

        <div v-show="!comparePanelCollapsed">
          <v-divider />
          <v-card-text class="py-3">
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="cruise in compareCruises"
                :key="cruise.id"
                color="secondary"
                variant="tonal"
                closable
                @click:close="toggleCompare(cruise.id)"
              >
                {{ cruise.itineraryName }}
              </v-chip>
            </div>
            <div class="mt-3">
              <v-btn size="small" variant="text" color="secondary" @click="clearCompareSelections">
                Clear all
              </v-btn>
            </div>
          </v-card-text>
        </div>
      </v-card>
    </div>

    <v-dialog v-model="mobileFiltersOpen" fullscreen>
      <v-card class="mobile-filter-shell">
        <v-toolbar color="white" elevation="0">
          <v-toolbar-title>Filters <span v-if="activeFilterCount > 0" class="text-subtitle-2">({{ activeFilterCount }} selected)</span></v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="mobileFiltersOpen = false" />
        </v-toolbar>
        <v-card-text class="pa-0">
          <CruiseFilters
            v-model:selected-months="selectedMonths"
            v-model:selected-ships="selectedShips"
            v-model:price-range="priceRange"
            v-model:nights-range="nightsRange"
            :month-options="monthOptions"
            :ship-options="shipOptions"
            :min-price="minPrice"
            :max-price="maxPrice"
            :min-nights="minNights"
            :max-nights="maxNights"
            :pricing-mode="pricingMode"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="quickViewOpen" max-width="900">
      <v-card rounded="xl" class="quick-view-shell surface-card">
        <v-card-title class="d-flex align-center justify-space-between quickview-titlebar">
          <div>
            <p class="text-overline mb-0 text-medium-emphasis">Quick View</p>
            <span>{{ quickViewTitle }}</span>
          </div>
          <div class="d-flex align-center ga-2">
            <v-btn
              icon
              variant="tonal"
              size="small"
              :color="quickViewSelectionSaved ? 'secondary' : 'default'"
              :aria-label="quickViewSelectionSaved ? 'Remove from favorites' : 'Save to favorites'"
              @click="toggleQuickViewSaved"
            >
              <v-icon :icon="quickViewSelectionSaved ? 'mdi-heart' : 'mdi-heart-outline'" />
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              :prepend-icon="quickViewSelectionCompared ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
              :color="quickViewSelectionCompared ? 'secondary' : 'default'"
              @click="toggleQuickViewCompare"
            >
              Compare
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="quickViewOpen = false" />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 pa-sm-5">
          <v-row class="quickview-grid">
            <v-col cols="12" md="7">
              <h3 class="text-subtitle-1 font-weight-bold mb-3">Cruise itinerary</h3>
              <v-sheet rounded="lg" class="pa-4 mb-4 itinerary-summary section-surface">
                <p class="text-body-2 mb-2"><strong>Route:</strong> {{ quickViewSelectedCruise?.itineraryMap }}</p>
                <p class="text-body-2 mb-0">
                  <strong>Ship:</strong> {{ quickViewSelectedCruise?.shipName }}
                  <span class="mx-1">•</span>
                  <strong>Nights:</strong> {{ quickViewSelectedCruise?.nights }}
                </p>
              </v-sheet>

              <h4 class="text-subtitle-2 font-weight-bold mb-2">Ship highlights</h4>
              <v-list density="compact" class="mb-4 bg-transparent section-surface" rounded="lg">
                <v-list-item
                  v-for="highlight in quickViewShipHighlights"
                  :key="highlight"
                  :title="highlight"
                  prepend-icon="mdi-star-four-points"
                />
              </v-list>

              <h4 class="text-subtitle-2 font-weight-bold mb-2">Highlighted destinations</h4>
              <v-row>
                <v-col v-for="destination in quickViewDestinations" :key="destination" cols="12" sm="6">
                  <v-card rounded="lg" elevation="1" class="destination-card section-surface">
                    <v-img :src="destinationImage(destination)" height="120" cover />
                    <v-card-text class="py-2 px-3 text-body-2 font-weight-medium">{{ destination }}</v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <v-col cols="12" md="5">
              <v-sheet rounded="lg" class="pa-4 calculator-shell section-surface">
                <v-select
                  v-model="selectedQuickViewDateId"
                  label="Cruise date"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :items="quickViewCruises.map((item) => ({ title: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`, value: item.id }))"
                />

                <div class="d-flex align-center justify-space-between mb-3 ga-2 flex-wrap">
                  <h3 class="text-subtitle-1 font-weight-bold mb-0">Staterooms</h3>
                  <v-btn
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-plus"
                    :disabled="quickViewStateroomCount >= 4"
                    @click="addQuickViewStateroom"
                  >
                    Add a stateroom
                  </v-btn>
                </div>

                <v-expansion-panels variant="accordion" class="mb-3">
                  <v-expansion-panel
                    v-for="(room, index) in quickViewStaterooms"
                    :key="`quick-room-${index}`"
                    rounded="lg"
                  >
                    <template #title>
                      <div class="d-flex align-center justify-space-between w-100 ga-3">
                        <div class="room-header-wrap">
                          <span class="font-weight-medium">{{ formatStateroomLabel(room, index) }}</span>
                        </div>
                        <v-btn
                          icon="mdi-trash-can-outline"
                          size="x-small"
                          variant="text"
                          color="secondary"
                          :disabled="quickViewStateroomCount <= 1"
                          :aria-label="`Remove quickview stateroom ${index + 1}`"
                          @click.stop="removeQuickViewStateroom(index)"
                        />
                      </div>
                    </template>
                    <v-expansion-panel-text>
                      <div class="mb-3">
                        <div class="text-body-2 font-weight-medium mb-2">Type</div>
                        <v-select
                          v-model="room.stateroomType"
                          :items="[
                            { title: 'Interior', value: 'interior' },
                            { title: 'Oceanview', value: 'oceanview' },
                            { title: 'Balcony', value: 'balcony' },
                            { title: 'Suite', value: 'suite' },
                          ]"
                          density="compact"
                          variant="outlined"
                        />
                      </div>
                      <div class="d-flex justify-space-between align-center mb-3">
                        <div>
                          <div class="text-body-2 font-weight-medium">Adults</div>
                          <div class="text-caption text-medium-emphasis">Ages 18+</div>
                        </div>
                        <div class="d-flex align-center ga-2">
                          <v-btn
                            icon="mdi-minus"
                            size="x-small"
                            variant="tonal"
                            @click="decrementQuickViewAdults(index)"
                          />
                          <strong>{{ room.adults }}</strong>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="tonal"
                            @click="incrementQuickViewAdults(index)"
                          />
                        </div>
                      </div>

                      <div class="d-flex justify-space-between align-center">
                        <div>
                          <div class="text-body-2 font-weight-medium">Children</div>
                          <div class="text-caption text-medium-emphasis">Under 18</div>
                        </div>
                        <div class="d-flex align-center ga-2">
                          <v-btn
                            icon="mdi-minus"
                            size="x-small"
                            variant="tonal"
                            @click="decrementQuickViewChildren(index)"
                          />
                          <strong>{{ room.children }}</strong>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="tonal"
                            @click="incrementQuickViewChildren(index)"
                          />
                        </div>
                      </div>
                      <p class="text-caption text-medium-emphasis mt-2 mb-0">Max 4 guests per stateroom and at least 1 adult.</p>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <div class="quickview-pricing mt-4">
                  <div class="text-body-2 text-medium-emphasis mb-1">Estimated total</div>
                  <div class="text-h4 font-weight-bold mb-2">{{ formatCurrency(guestCalculatorTotal) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Price per stateroom: {{ formatCurrency(guestCalculatorPerStateroom) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Price per person: {{ formatCurrency(guestCalculatorPerGuest) }}
                  </div>
                </div>

                <v-btn
                  :color="quickViewSelectionSaved ? 'secondary' : 'default'"
                  :variant="quickViewSelectionSaved ? 'flat' : 'tonal'"
                  :prepend-icon="quickViewSelectionSaved ? 'mdi-heart' : 'mdi-heart-outline'"
                  :aria-label="quickViewSelectionSaved ? 'Remove cruise from saved' : 'Save cruise'"
                  class="mt-4"
                  block
                  @click="quickViewSelectionSaved ? toggleQuickViewSaved() : saveQuickViewCruise()"
                >
                  {{ quickViewSelectionSaved ? 'Saved cruise' : 'Save cruise' }}
                </v-btn>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end px-4 pb-4 px-sm-5 pb-sm-5">
          <v-btn variant="text" @click="quickViewOpen = false">Close</v-btn>
          <v-btn color="primary" variant="flat" @click="goToBookingLanding">Book now</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="compareModuleOpen" max-width="1100">
      <v-card rounded="xl" class="surface-card">
        <v-card-title class="d-flex align-center justify-space-between quickview-titlebar">
          <div>
            <p class="text-overline mb-0 text-medium-emphasis">Compare</p>
            <span>Side-by-side cruise comparison</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="compareModuleOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Aspect</th>
                <th v-for="cruise in compareCruises" :key="cruise.id">{{ cruise.itineraryName }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compareRows" :key="row.label">
                <td class="font-weight-medium">{{ row.label }}</td>
                <td v-for="(value, index) in row.values" :key="`${row.label}-${index}`">{{ value }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.cruise-page {
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
}

.hero-card {
  background: linear-gradient(145deg, #ffffff 0%, #eef6ff 100%);
  border: 1px solid #d3e3f3;
  box-shadow: 0 10px 28px rgba(22, 67, 110, 0.1);
  color: #13395f;
}

.hero-copy {
  color: #3e6287 !important;
  line-height: 1.5;
}

.hero-title {
  letter-spacing: 0.01em;
  color: #123c66;
}

.sticky-filters {
  position: sticky;
  top: 88px;
}

.filters-shell,
.toolbar-shell,
.pricing-shell,
.compare-shell,
.itinerary-card,
.cruise-date-card,
.quick-view-shell {
  border: 1px solid #d8e5f1;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(19, 67, 108, 0.05);
}

.surface-card {
  border: 1px solid #cfdfee;
  box-shadow: 0 10px 22px rgba(24, 79, 126, 0.08);
}

.guest-panel {
  border-color: #cfdfee !important;
  background: #ffffff;
  box-shadow: none !important;
}

.guest-panel :deep(.v-expansion-panel-title) {
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.guest-panel :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px 12px 12px;
}

.section-kicker {
  letter-spacing: 0.08em;
}

.toolbar-shell {
  background: #ffffff;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-select {
  min-width: 150px;
}

.sort-control {
  margin-left: auto;
}

.sort-select {
  min-width: 210px;
}

.control-label {
  font-size: 0.8rem;
  color: #2b557f;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.results-header {
  border-top: 1px solid #d6e3f0;
  padding-top: 14px;
}

.results-filters-inline {
  font-size: 0.78rem;
  font-weight: 500;
  color: #4a6279;
}

.results-filters-chip {
  margin-top: 8px;
}

.quickview-titlebar {
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7fd 100%);
}

.quickview-grid {
  align-items: start;
}

.section-surface {
  border: 1px solid #dce8f4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.itinerary-summary {
  background: linear-gradient(180deg, #fbfdff 0%, #f2f7fd 100%);
}

.destination-card {
  overflow: hidden;
}

.quickview-pricing {
  text-align: right;
}

.route-copy {
  color: #28557f;
}

.compact-meta {
  line-height: 1.45;
}

.card-actions {
  min-width: 315px;
}

.itinerary-expansion {
  border: 1px solid #dee8f3;
  border-radius: 12px;
  overflow: hidden;
}

.departure-chip {
  background: #f6faff;
  border: 1px solid #dce8f4;
}

.card-title {
  color: #103a61;
}

.mobile-filter-shell {
  background: linear-gradient(180deg, #f9fcff 0%, #f1f6fc 100%);
}

.calculator-shell {
  background: #f5f9ff;
  border: 1px solid #d5e4f3;
}

.room-header-wrap {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.compare-panel {
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}

.compare-dock {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 12px;
  z-index: 30;
}

.compare-dock.collapsed {
  max-height: 78px;
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 1.65rem !important;
    line-height: 1.2;
  }

  .control-group {
    width: 100%;
  }

  .sort-control {
    margin-left: 0;
  }

  .control-group :deep(.v-field) {
    margin-left: auto;
    width: 100%;
  }

  .sort-control :deep(.v-field) {
    width: 100%;
  }

  .results-header h2 {
    font-size: 1.1rem;
  }
}
</style>
