<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { CruiseDeparture, StateroomPricing } from '../types/cruise'
import type { SavedCruiseConfig } from '../types/savedCruise'
import cruiseData from '../data/metrics.json'
import { useSavedCruises } from '../composables/useSavedCruises'

const router = useRouter()
const route = useRoute()
const cruises = cruiseData as CruiseDeparture[]
const { addSavedCruise } = useSavedCruises()

const cruiseId = route.query.cruiseId as string
const initialCruise = cruises.find((c) => c.id === cruiseId) ?? cruises[0]
const selectedCruiseId = ref(initialCruise?.id ?? '')
const cruise = computed(() => cruises.find((c) => c.id === selectedCruiseId.value))
const relatedDepartures = computed(() => {
  if (!cruise.value) {
    return [] as CruiseDeparture[]
  }

  return cruises
    .filter((item) => item.itineraryName === cruise.value?.itineraryName)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
})
const sailDateOptions = computed(() =>
  relatedDepartures.value.map((departure) => ({
    value: departure.id,
    title: `${formatDate(departure.startDate)} - ${formatDate(departure.endDate)} (${departure.nights} nights) - ${formatCurrency(basePriceForDeparture(departure))}`,
  })),
)
const queryStateroomTypes = parseStateroomTypes(route.query.stateroomTypes)
const queryAdults = Math.max(parseInt(route.query.adults as string) || 2, 1)
const queryChildren = Math.max(parseInt(route.query.children as string) || 0, 0)

// Editable state for staterooms
interface EditableStateroom {
  stateroomType: keyof StateroomPricing
  adults: number
  children: number
}

const editableStaterooms = ref<EditableStateroom[]>([
  ...buildInitialStaterooms(queryStateroomTypes, queryAdults, queryChildren),
])

const stateroomCount = computed(() => editableStaterooms.value.length)
const totalAdults = computed(() => editableStaterooms.value.reduce((sum, room) => sum + room.adults, 0))
const totalChildren = computed(() => editableStaterooms.value.reduce((sum, room) => sum + room.children, 0))
const guestSummary = computed(
  () => `${stateroomCount.value} staterooms • ${totalAdults.value} Adults, ${totalChildren.value} Children`,
)

const heroImageUrl = computed(() => {
  if (!cruise.value) {
    return '/images/default.jpg'
  }

  const destination = cruise.value.itineraryMap.split('->')[1]?.trim() ?? cruise.value.itineraryName
  return destinationImage(destination)
})

function addStateroom(): void {
  if (editableStaterooms.value.length < 4) {
    editableStaterooms.value.push({ stateroomType: 'interior', adults: 2, children: 0 })
  }
}

function parseStateroomTypes(value: unknown): (keyof StateroomPricing)[] {
  if (typeof value !== 'string') {
    return ['interior']
  }

  try {
    const parsed = JSON.parse(value) as string[]
    const allowed: (keyof StateroomPricing)[] = ['interior', 'oceanview', 'balcony', 'suite']
    const sanitized = parsed.filter((item): item is keyof StateroomPricing =>
      allowed.includes(item as keyof StateroomPricing),
    )
    return sanitized.length > 0 ? sanitized.slice(0, 4) : ['interior']
  } catch {
    return ['interior']
  }
}

function basePriceForDeparture(departure: CruiseDeparture): number {
  return Math.min(
    departure.stateroomPricing.interior,
    departure.stateroomPricing.oceanview,
    departure.stateroomPricing.balcony,
    departure.stateroomPricing.suite,
  )
}

function buildInitialStaterooms(
  types: (keyof StateroomPricing)[],
  adults: number,
  children: number,
): EditableStateroom[] {
  const roomCount = Math.min(Math.max(types.length, 1), 4)
  const initialRooms: EditableStateroom[] = types.slice(0, roomCount).map((stateroomType) => ({
    stateroomType,
    adults: 1,
    children: 0,
  }))

  let remainingAdults = adults - roomCount
  let remainingChildren = children

  while (remainingAdults > 0) {
    let allocated = false
    for (const room of initialRooms) {
      if (room.adults + room.children < 4) {
        room.adults += 1
        remainingAdults -= 1
        allocated = true
        if (remainingAdults <= 0) {
          break
        }
      }
    }
    if (!allocated) {
      break
    }
  }

  while (remainingChildren > 0) {
    let allocated = false
    for (const room of initialRooms) {
      if (room.adults + room.children < 4) {
        room.children += 1
        remainingChildren -= 1
        allocated = true
        if (remainingChildren <= 0) {
          break
        }
      }
    }
    if (!allocated) {
      break
    }
  }

  return initialRooms
}

function removeStateroom(index: number): void {
  if (editableStaterooms.value.length > 1) {
    editableStaterooms.value.splice(index, 1)
  }
}

function incrementAdults(index: number): void {
  const stateroom = editableStaterooms.value[index]
  if (stateroom) {
    const guests = stateroom.adults + stateroom.children
    if (guests < 4) {
      stateroom.adults++
    }
  }
}

function decrementAdults(index: number): void {
  const stateroom = editableStaterooms.value[index]
  if (stateroom && stateroom.adults > 1) {
    stateroom.adults--
  }
}

function incrementChildren(index: number): void {
  const stateroom = editableStaterooms.value[index]
  if (stateroom) {
    const guests = stateroom.adults + stateroom.children
    if (guests < 4) {
      stateroom.children++
    }
  }
}

function decrementChildren(index: number): void {
  const stateroom = editableStaterooms.value[index]
  if (stateroom && stateroom.children > 0) {
    stateroom.children--
  }
}

// Computed pricing
const calculatedPricing = computed(() => {
  let totalPrice = 0
  if (cruise.value && cruise.value.stateroomPricing) {
    editableStaterooms.value.forEach((stateroom) => {
      const price = cruise.value!.stateroomPricing[stateroom.stateroomType] ?? 0
      totalPrice += price
    })
  }

  const totalGuests = editableStaterooms.value.reduce((sum, sr) => sum + sr.adults + sr.children, 0)
  const pricePerStateroom = editableStaterooms.value.length > 0 ? totalPrice / editableStaterooms.value.length : 0
  const pricePerPerson = totalGuests > 0 ? totalPrice / totalGuests : 0

  return {
    totalPrice,
    pricePerStateroom,
    pricePerPerson,
    totalGuests,
  }
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return formatter.format(new Date(date))
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

function formatStateroomLabel(room: EditableStateroom, index: number): string {
  return `Stateroom ${index + 1} - ${stateroomTypeLabel(room.stateroomType)}, ${room.adults} Adult${room.adults !== 1 ? 's' : ''}, ${room.children} Child${room.children !== 1 ? 'ren' : ''}`
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

function goBack(): void {
  router.push('/')
}

function saveCruise(): void {
  if (!cruise.value) {
    return
  }

  const selectedCruise = cruise.value
  const destination = selectedCruise.itineraryMap.split('->')[1]?.trim() ?? selectedCruise.itineraryName

  const savedConfig: SavedCruiseConfig = {
    id: `${selectedCruise.id}-${Date.now()}`,
    cruiseId: selectedCruise.id,
    itineraryName: selectedCruise.itineraryName,
    itineraryMap: selectedCruise.itineraryMap,
    shipName: selectedCruise.shipName,
    startDate: selectedCruise.startDate,
    endDate: selectedCruise.endDate,
    nights: selectedCruise.nights,
    imageUrl: destinationImage(destination),
    staterooms: editableStaterooms.value.map((room) => ({
      adults: room.adults,
      children: room.children,
      stateroomType: room.stateroomType,
    })),
    totalPrice: calculatedPricing.value.totalPrice,
    pricePerStateroom: calculatedPricing.value.pricePerStateroom,
    pricePerPerson: calculatedPricing.value.pricePerPerson,
    savedAt: new Date().toISOString(),
  }

  addSavedCruise(savedConfig)
}

function continueToBooking(): void {
  router.push({
    name: 'booking-flow',
    query: {
      cruiseId: selectedCruiseId.value,
      stateroomTypes: JSON.stringify(editableStaterooms.value.map((sr) => sr.stateroomType)),
      stateroomDetails: JSON.stringify(
        editableStaterooms.value.map((sr) => ({
          stateroomType: sr.stateroomType,
          adults: sr.adults,
          children: sr.children,
        })),
      ),
      adults: editableStaterooms.value.reduce((sum, sr) => sum + sr.adults, 0),
      children: editableStaterooms.value.reduce((sum, sr) => sum + sr.children, 0),
      totalPrice: calculatedPricing.value.totalPrice,
      pricePerStateroom: calculatedPricing.value.pricePerStateroom,
      pricePerPerson: calculatedPricing.value.pricePerPerson,
    },
  })
}
</script>

<template>
  <v-container fluid class="booking-landing-page pa-3 pa-sm-5 pa-md-8">
    <div class="booking-landing-header mb-6">
      <v-btn color="secondary" variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
        Back to Search
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="4" class="booking-content-card">
      <v-img
        v-if="cruise"
        :src="heroImageUrl"
        height="260"
        cover
        class="booking-hero-image"
      >
        <div class="hero-overlay" />
        <div class="hero-copy-wrap">
          <h2 class="text-h4 font-weight-black text-white mb-1">{{ cruise.itineraryName }}</h2>
          <p class="text-body-2 text-white mb-0">{{ cruise.shipName }} • {{ formatDate(cruise.startDate) }} - {{ formatDate(cruise.endDate) }}</p>
        </div>
      </v-img>
      <v-card-text class="pa-5 pa-sm-6">
        <div v-if="cruise" class="mb-8">
          <div class="d-flex align-center flex-wrap ga-2 mb-4">
            <h2 class="text-h6 font-weight-bold mb-0">Cruise Details</h2>
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">Itinerary</div>
                <div class="text-body-1 font-weight-medium">{{ cruise.itineraryName }}</div>
              </div>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">Ship</div>
                <div class="text-body-1 font-weight-medium">{{ cruise.shipName }}</div>
              </div>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">Destinations</div>
                <div class="text-body-1 font-weight-medium">{{ cruise.itineraryMap }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis mb-2">Sail Date</div>
                <v-select
                  v-model="selectedCruiseId"
                  :items="sailDateOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </div>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">Duration</div>
                <div class="text-body-1 font-weight-medium">{{ cruise.nights }} nights</div>
              </div>
            </v-col>
          </v-row>
        </div>

        <div class="mb-8">
          <h2 class="text-h6 font-weight-bold mb-4">Your Selection</h2>
          <v-row>
            <!-- Staterooms Accordion -->
            <v-col cols="12" md="7">
              <v-card variant="outlined" class="pa-2 pa-md-3 guest-panel h-100">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-2">Staterooms</div>
                  <div class="d-flex ga-1">
                    <v-btn
                      icon="mdi-plus"
                      size="x-small"
                      variant="tonal"
                      :disabled="stateroomCount >= 4"
                      @click="addStateroom"
                    />
                  </div>
                </div>

                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="(stateroom, index) in editableStaterooms"
                    :key="index"
                    rounded="lg"
                  >
                    <template #title>
                      <div class="d-flex align-center justify-space-between w-100 ga-3">
                        <div class="room-header-wrap">
                          <span class="font-weight-medium">{{ formatStateroomLabel(stateroom, index) }}</span>
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
                          v-model="stateroom.stateroomType"
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
                            :disabled="stateroom.adults <= 1"
                            @click="decrementAdults(index)"
                          />
                          <strong>{{ stateroom.adults }}</strong>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="tonal"
                            :disabled="stateroom.adults + stateroom.children >= 4"
                            @click="incrementAdults(index)"
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
                            :disabled="stateroom.children <= 0"
                            @click="decrementChildren(index)"
                          />
                          <strong>{{ stateroom.children }}</strong>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="tonal"
                            :disabled="stateroom.adults + stateroom.children >= 4"
                            @click="incrementChildren(index)"
                          />
                        </div>
                      </div>

                      <p class="text-caption text-medium-emphasis mt-2 mb-0">Max 4 guests per stateroom and at least 1 adult.</p>

                      <div class="text-body-2 mt-3 mb-0">
                        <span class="text-medium-emphasis">Price: </span>
                        <span class="font-weight-bold">{{ formatCurrency(cruise && cruise.stateroomPricing ? cruise.stateroomPricing[stateroom.stateroomType] : 0) }}</span>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <p class="text-caption text-medium-emphasis mt-2 mb-0">{{ guestSummary }}</p>
              </v-card>
            </v-col>

            <!-- Pricing Card -->
            <v-col cols="12" md="5">
              <v-card class="pa-4 sticky pricing-card text-right" style="top: 20px">
                <div class="mb-4">
                  <div class="text-body-2 text-medium-emphasis mb-1">Total Price</div>
                  <div class="text-h4 font-weight-bold price-highlight">{{ formatCurrency(calculatedPricing.totalPrice) }}</div>
                </div>
                <div class="mb-2 d-flex align-center justify-end ga-4 flex-wrap">
                  <div class="text-caption text-medium-emphasis">Staterooms: {{ editableStaterooms.length }}</div>
                  <div class="text-caption text-medium-emphasis">Total Guests: {{ calculatedPricing.totalGuests }}</div>
                </div>
                <div class="mb-2">
                  <div class="text-caption text-medium-emphasis">
                    Price per stateroom: {{ formatCurrency(calculatedPricing.pricePerStateroom) }}
                  </div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Price per person: {{ formatCurrency(calculatedPricing.pricePerPerson) }}
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-divider class="mb-6" />

        <div class="d-flex align-center justify-space-between gap-3">
          <v-btn variant="text" color="secondary" @click="goBack">Back</v-btn>
          <div class="d-flex align-center ga-3">
            <v-btn variant="outlined" color="secondary" @click="saveCruise">Save Cruise</v-btn>
            <v-btn color="primary" variant="flat" @click="continueToBooking">Continue</v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.booking-landing-page {
  min-height: 100vh;
  background: #f7f9fc;
}

.booking-landing-header {
  padding: 0;
}

.booking-content-card {
  border: 1px solid rgba(11, 79, 138, 0.12);
  background: rgba(255, 255, 255, 0.97);
  overflow: hidden;
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

.booking-hero-image {
  position: relative;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 53, 89, 0.5);
}

.hero-copy-wrap {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 0.875rem;
}

.pricing-card {
  border: none !important;
  box-shadow: none !important;
  background: transparent;
  color: #1f2937;
}

.pricing-card .text-medium-emphasis {
  color: rgba(31, 41, 55, 0.78) !important;
}

.price-highlight {
  color: #0b4f8a;
}

@media (min-width: 960px) {
  .booking-landing-header {
    padding: 0;
  }
}
</style>
