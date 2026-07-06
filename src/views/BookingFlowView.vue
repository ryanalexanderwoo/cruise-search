<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { CruiseDeparture, StateroomPricing } from '../types/cruise'
import cruiseData from '../data/metrics.json'
import { destinationImageFromItineraryMap } from '../utils/destinationImage'

const router = useRouter()
const route = useRoute()

type StateroomType = keyof StateroomPricing

const cruiseId = route.query.cruiseId as string
const stateroomTypes = route.query.stateroomTypes
  ? (JSON.parse(route.query.stateroomTypes as string) as StateroomType[])
  : (['interior'] as StateroomType[])
const adults = parseInt(route.query.adults as string) || 0
const children = parseInt(route.query.children as string) || 0
const totalPrice = parseInt(route.query.totalPrice as string) || 0
const pricePerStateroom = parseInt(route.query.pricePerStateroom as string) || 0
const pricePerPerson = parseInt(route.query.pricePerPerson as string) || 0

const cruise = (cruiseData as CruiseDeparture[]).find((c) => c.id === cruiseId)

interface BookingStateroom {
  stateroomType: StateroomType
  adults: number
  children: number
}

interface CabinOption {
  id: string
  label: string
  price: number
  description: string
  imageUrl: string
}

const stateroomTypeLabels: Record<StateroomType, string> = {
  interior: 'Interior',
  oceanview: 'Oceanview',
  balcony: 'Balcony',
  suite: 'Suite',
}

const cabinTypeImages: Record<StateroomType, string> = {
  interior: '/images/cabin-interior.svg',
  oceanview: '/images/cabin-oceanview.svg',
  balcony: '/images/cabin-balcony.svg',
  suite: '/images/cabin-suite.svg',
}

const cabinVariantsByType: Record<StateroomType, Array<{ key: string; label: string; price: number }>> = {
  interior: [
    { key: 'standard', label: 'Standard', price: 0 },
    { key: 'premium', label: 'Premium', price: 150 },
    { key: 'spacious', label: 'Spacious', price: 300 },
  ],
  oceanview: [
    { key: 'standard', label: 'Standard', price: 0 },
    { key: 'premium', label: 'Premium with Balcony', price: 300 },
  ],
  balcony: [
    { key: 'standard', label: 'Standard', price: 0 },
    { key: 'deluxe', label: 'Deluxe', price: 300 },
    { key: 'grand', label: 'Grand', price: 600 },
  ],
  suite: [
    { key: 'grand', label: 'Grand', price: 0 },
    { key: 'penthouse', label: 'Penthouse', price: 500 },
  ],
}

function parseStateroomDetails(
  detailsValue: unknown,
  fallbackTypes: StateroomType[],
  totalAdults: number,
  totalChildren: number,
): BookingStateroom[] {
  const allowedTypes: StateroomType[] = ['interior', 'oceanview', 'balcony', 'suite']

  if (typeof detailsValue === 'string') {
    try {
      const parsed = JSON.parse(detailsValue) as Array<{ stateroomType?: string; adults?: number; children?: number }>
      const sanitized = parsed
        .map((room) => {
          if (!room || !room.stateroomType || !allowedTypes.includes(room.stateroomType as StateroomType)) {
            return null
          }

          return {
            stateroomType: room.stateroomType as StateroomType,
            adults: Math.max(Number(room.adults) || 0, 0),
            children: Math.max(Number(room.children) || 0, 0),
          }
        })
        .filter((room): room is BookingStateroom => room !== null)

      if (sanitized.length > 0) {
        return sanitized
      }
    } catch {
      // Fallback to stateroomTypes query parsing below
    }
  }

  const sanitizedTypes = fallbackTypes.filter((type): type is StateroomType => allowedTypes.includes(type))
  const roomTypes: StateroomType[] = sanitizedTypes.length > 0 ? sanitizedTypes : ['interior']
  const roomCount = roomTypes.length
  const initialRooms: BookingStateroom[] = roomTypes.map((type) => ({ stateroomType: type, adults: 1, children: 0 }))

  let remainingAdults = Math.max(totalAdults - roomCount, 0)
  let remainingChildren = Math.max(totalChildren, 0)

  while (remainingAdults > 0 || remainingChildren > 0) {
    let changed = false

    for (const room of initialRooms) {
      const roomGuests = room.adults + room.children

      if (roomGuests < 4 && remainingAdults > 0) {
        room.adults += 1
        remainingAdults -= 1
        changed = true
      }

      if (room.adults + room.children < 4 && remainingChildren > 0) {
        room.children += 1
        remainingChildren -= 1
        changed = true
      }

      if (remainingAdults <= 0 && remainingChildren <= 0) {
        break
      }
    }

    if (!changed) {
      break
    }
  }

  return initialRooms
}

const bookingStaterooms = parseStateroomDetails(route.query.stateroomDetails, stateroomTypes, adults, children)

function cabinDescription(stateroomType: StateroomType, variantLabel: string): string {
  const typeDescriptionMap: Record<StateroomType, string> = {
    interior: 'Smart layout and cozy design for value-focused cruising.',
    oceanview: 'Natural light and sea-facing views for a brighter stay.',
    balcony: 'Private outdoor space to unwind between destinations.',
    suite: 'Premium space with upgraded comfort and exclusive touches.',
  }

  return `${variantLabel} option. ${typeDescriptionMap[stateroomType]}`
}

function getCabinOptionsForType(stateroomType: StateroomType): CabinOption[] {
  return cabinVariantsByType[stateroomType].map((variant) => ({
    id: `${stateroomType}-${variant.key}`,
    label: `${stateroomTypeLabels[stateroomType]} - ${variant.label}`,
    price: variant.price,
    description: cabinDescription(stateroomType, variant.label),
    imageUrl: cabinTypeImages[stateroomType],
  }))
}

const currentStep = ref(1)
const selectedCabinTypes = ref<string[]>(
  bookingStaterooms.map((room) => getCabinOptionsForType(room.stateroomType)[0]?.id ?? ''),
)
const selectedAddOns = ref<string[]>([])
const isCompleting = ref(false)

const cabinStepCount = bookingStaterooms.length
const addOnsStepValue = cabinStepCount + 1
const reviewStepValue = cabinStepCount + 2
const totalStepCount = reviewStepValue

const bookingSteps = computed(() => [
  ...bookingStaterooms.map((room, index) => `${stateroomTypeLabels[room.stateroomType]} Cabin ${index + 1}`),
  'Add-ons',
  'Review & Confirm',
])
const mobileStepProgress = computed(() => (currentStep.value / totalStepCount) * 100)
const currentStepLabel = computed(() => bookingSteps.value[currentStep.value - 1] ?? '')
const cabinUpgradeCost = computed(() =>
  bookingStaterooms.reduce((sum, room, index) => {
    const selectedId = selectedCabinTypes.value[index]
    const selectedOption = getCabinOptionsForType(room.stateroomType).find((opt) => opt.id === selectedId)
    return sum + (selectedOption?.price ?? 0)
  }, 0),
)
const addOnCost = computed(() =>
  selectedAddOns.value.reduce((sum, id) => {
    const addOn = addOnOptions.find((opt) => opt.id === id)
    return sum + (addOn?.price || 0)
  }, 0),
)
const totalGuests = computed(() => Math.max(adults + children, 0))
const cruiseImageUrl = computed(() => {
  if (!cruise) {
    return '/images/default.jpg'
  }

  return destinationImageFromItineraryMap(cruise.itineraryMap, cruise.itineraryName)
})
const runningTotalPrice = computed(() => totalPrice + cabinUpgradeCost.value + addOnCost.value)
const runningPricePerStateroom = computed(() => (cabinStepCount > 0 ? runningTotalPrice.value / cabinStepCount : 0))
const runningPricePerPerson = computed(() => (totalGuests.value > 0 ? runningTotalPrice.value / totalGuests.value : 0))

const addOnOptions = [
  { id: 'beverage', label: 'Beverage Package', price: 200 },
  { id: 'speciality', label: 'Speciality Dining', price: 150 },
  { id: 'wifi', label: 'Internet Package', price: 100 },
  { id: 'excursions', label: 'Shore Excursions Bundle', price: 300 },
]

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function nextStep(event?: Event): void {
  if (currentStep.value < totalStepCount) {
    const clickedButton = event?.currentTarget as HTMLElement | null
    clickedButton?.blur()

    const activeElement = document.activeElement as HTMLElement | null
    activeElement?.blur()
    currentStep.value++
    scrollStepToTop()
  }
}

function previousStep(event?: Event): void {
  if (currentStep.value > 1) {
    const clickedButton = event?.currentTarget as HTMLElement | null
    clickedButton?.blur()

    const activeElement = document.activeElement as HTMLElement | null
    activeElement?.blur()
    currentStep.value--
    scrollStepToTop()
  }
}

function scrollStepToTop(): void {
  nextTick(() => {
    const main = document.querySelector('.v-main') as HTMLElement | null
    const scrollingElement = document.scrollingElement as HTMLElement | null

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    main?.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    // One delayed pass after step transition paint.
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      main?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, 40)
  })
}

function goBackToBookingLanding(): void {
  router.push({
    name: 'booking-landing',
    query: {
      cruiseId,
      stateroomTypes: route.query.stateroomTypes,
      stateroomDetails: route.query.stateroomDetails,
      adults: route.query.adults,
      children: route.query.children,
      totalPrice: route.query.totalPrice,
      pricePerStateroom: route.query.pricePerStateroom,
      pricePerPerson: route.query.pricePerPerson,
    },
  })
}

function completeBooking(): void {
  if (isCompleting.value) {
    return
  }

  isCompleting.value = true

  window.setTimeout(() => {
    const bookingReference = `booking-${Date.now()}`

    router.push({
      name: 'booking-confirmed',
      query: {
        bookingReference,
        cruiseId,
        adults,
        children,
        totalPrice: runningTotalPrice.value,
        pricePerStateroom: Math.round(runningPricePerStateroom.value),
        pricePerPerson: Math.round(runningPricePerPerson.value),
      },
    })
  }, 3000)
}

function goBack(): void {
  router.push('/')
}

function cancelBooking(): void {
  router.push('/')
}

function selectedCabinLabel(room: BookingStateroom, index: number): string {
  const selectedId = selectedCabinTypes.value[index]
  const selectedOption = getCabinOptionsForType(room.stateroomType).find((opt) => opt.id === selectedId)
  return selectedOption?.label ?? 'Not selected'
}

function selectCabin(index: number, optionId: string): void {
  selectedCabinTypes.value[index] = optionId
}

function isCabinSelected(index: number, optionId: string): boolean {
  return selectedCabinTypes.value[index] === optionId
}
</script>

<template>
  <v-container fluid class="booking-flow-page pa-3 pa-sm-5 pa-md-8">
    <v-overlay
      :model-value="isCompleting"
      class="booking-complete-overlay"
      persistent
      scrim="rgba(11, 79, 138, 0.45)"
    >
      <div class="d-flex flex-column align-center ga-4 text-center">
        <v-progress-circular indeterminate color="white" size="64" width="6" />
        <div class="text-h6 text-white font-weight-bold">Confirming your booking...</div>
      </div>
    </v-overlay>

    <div class="booking-landing-header mb-6">
      <v-btn color="secondary" variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
        Back to Search
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="4" class="booking-flow-card">
      <v-card-text class="pa-5 pa-sm-6">

        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-5">
          <h2 class="text-h6 font-weight-bold mb-0">Plan Your Cruise Experience</h2>
        </div>

        <div class="step-progress-mobile mb-5">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">Step {{ currentStep }} of {{ totalStepCount }}</span>
            <span class="text-caption font-weight-medium">{{ currentStepLabel }}</span>
          </div>
          <v-progress-linear
            :model-value="mobileStepProgress"
            color="secondary"
            height="8"
            rounded
          />
        </div>

        <v-stepper v-model="currentStep" class="mb-6">
          <v-stepper-header class="stepper-header-desktop">
            <template v-for="(_, index) in bookingStaterooms" :key="`cabin-step-${index}`">
              <v-stepper-item
                :complete="currentStep > index + 1"
                :value="index + 1"
                :title="`Cabin ${index + 1}`"
              />
              <v-divider />
            </template>
            <v-stepper-item :complete="currentStep > addOnsStepValue" :value="addOnsStepValue" title="Add-ons" />
            <v-divider />
            <v-stepper-item :value="reviewStepValue" title="Review & Confirm" />
          </v-stepper-header>

          <v-stepper-window>
            <!-- Cabin Selection Steps -->
            <v-stepper-window-item
              v-for="(stateroom, index) in bookingStaterooms"
              :key="`cabin-step-content-${index}`"
              :value="index + 1"
            >
              <div class="pa-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-2">Select Cabin Type</h3>
                <div class="mb-4">
                  <div class="text-body-2 text-medium-emphasis">Stateroom {{ index + 1 }} of {{ cabinStepCount }}</div>
                  <div class="text-body-1 font-weight-medium">{{ stateroomTypeLabels[stateroom.stateroomType] }} Stateroom</div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ stateroom.adults }} Adults, {{ stateroom.children }} Children
                  </div>
                </div>
                <div class="cabin-option-grid">
                  <v-card
                    v-for="option in getCabinOptionsForType(stateroom.stateroomType)"
                    :key="option.id"
                    variant="flat"
                    class="cabin-option-card"
                    :class="{ 'cabin-option-card--selected': isCabinSelected(index, option.id) }"
                    @click="selectCabin(index, option.id)"
                  >
                    <v-img :src="option.imageUrl" height="140" cover class="cabin-option-image" />
                    <v-card-text>
                      <div class="d-flex justify-space-between align-start ga-3 mb-2">
                        <div class="text-body-1 font-weight-medium">{{ option.label }}</div>
                        <div class="text-body-2 font-weight-bold">
                          {{ option.price > 0 ? `+${formatCurrency(option.price)}` : 'Included' }}
                        </div>
                      </div>
                      <p class="text-body-2 text-medium-emphasis mb-0">{{ option.description }}</p>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </v-stepper-window-item>

            <!-- Add-ons Step -->
            <v-stepper-window-item :value="addOnsStepValue">
              <div class="pa-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-4">Select Add-ons</h3>
                <div class="mb-4">
                  <v-checkbox
                    v-for="addOn in addOnOptions"
                    :key="addOn.id"
                    v-model="selectedAddOns"
                    :value="addOn.id"
                    class="mb-2"
                  >
                    <template #label>
                      <div class="d-flex justify-space-between w-100 ga-4">
                        <span>{{ addOn.label }}</span>
                        <span class="text-medium-emphasis">{{ formatCurrency(addOn.price) }}</span>
                      </div>
                    </template>
                  </v-checkbox>
                </div>
                <v-divider class="my-4" />
                <div class="text-body-2">
                  <span class="text-medium-emphasis">Add-ons Total: </span>
                  <span class="font-weight-bold">{{ formatCurrency(addOnCost) }}</span>
                </div>
              </div>
            </v-stepper-window-item>

            <!-- Review & Confirm Step -->
            <v-stepper-window-item :value="reviewStepValue">
              <div class="pa-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-4">Review Your Booking</h3>
                <v-img :src="cruiseImageUrl" height="220" cover rounded="lg" class="mb-4 review-cruise-image" />
                <v-row class="mb-6">
                  <v-col cols="12" md="6">
                    <div class="mb-3">
                      <div class="text-body-2 text-medium-emphasis">Cruise</div>
                      <div class="text-body-1 font-weight-medium">{{ cruise?.itineraryName }}</div>
                    </div>
                    <div class="mb-3">
                      <div class="text-body-2 text-medium-emphasis">Sail Date</div>
                      <div class="text-body-1 font-weight-medium">
                        {{ cruise ? `${formatDate(cruise.startDate)} – ${formatDate(cruise.endDate)} (${cruise.nights} nights)` : '—' }}
                      </div>
                    </div>
                    <div class="mb-3">
                      <div class="text-body-2 text-medium-emphasis">Guests</div>
                      <div class="text-body-1 font-weight-medium">{{ adults }} Adults, {{ children }} Children</div>
                    </div>
                    <div class="mb-3">
                      <div class="text-body-2 text-medium-emphasis">Selected Cabin Types</div>
                      <div
                        v-for="(stateroom, index) in bookingStaterooms"
                        :key="`review-cabin-${index}`"
                        class="text-body-1 font-weight-medium"
                      >
                        Stateroom {{ index + 1 }}: {{ selectedCabinLabel(stateroom, index) }}
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div>
                      <div class="mb-4">
                        <div class="text-body-2 text-medium-emphasis mb-1">Cruise Total</div>
                        <div class="text-h6 font-weight-bold">{{ formatCurrency(totalPrice) }}</div>
                      </div>
                      <div class="mb-4">
                        <div class="text-body-2 text-medium-emphasis mb-1">Cabin Upgrades</div>
                        <div class="text-h6 font-weight-bold">{{ formatCurrency(cabinUpgradeCost) }}</div>
                      </div>
                      <div class="mb-4">
                        <div class="text-body-2 text-medium-emphasis mb-1">Add-ons</div>
                        <div class="text-h6 font-weight-bold">{{ formatCurrency(addOnCost) }}</div>
                      </div>
                      <v-divider class="my-3" />
                      <div>
                        <div class="text-body-2 text-medium-emphasis mb-1">Grand Total</div>
                        <div class="text-h5 font-weight-bold total-highlight">
                          {{ formatCurrency(runningTotalPrice) }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>

        <div v-if="currentStep !== reviewStepValue" class="d-flex justify-end mb-6">
          <v-card class="pa-4 pricing-card text-right running-price-card">
            <div class="mb-4">
              <div class="text-body-2 text-medium-emphasis mb-1">Total Price</div>
              <div class="text-h4 font-weight-bold price-highlight">{{ formatCurrency(runningTotalPrice) }}</div>
            </div>
            <div class="mb-2 d-flex align-center justify-end ga-4 flex-wrap">
              <div class="text-caption text-medium-emphasis">Staterooms: {{ cabinStepCount }}</div>
              <div class="text-caption text-medium-emphasis">Total Guests: {{ totalGuests }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Base cruise: {{ formatCurrency(totalPrice) }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Cabin upgrades: {{ formatCurrency(cabinUpgradeCost) }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Add-ons: {{ formatCurrency(addOnCost) }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Price per stateroom: {{ formatCurrency(runningPricePerStateroom) }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Price per person: {{ formatCurrency(runningPricePerPerson) }}</div>
            </div>
          </v-card>
        </div>

        <v-divider class="mb-6" />

        <div class="d-flex align-center justify-space-between">
          <v-btn
            variant="text"
            color="secondary"
            @click="goBackToBookingLanding"
          >
            Back
          </v-btn>
          <div class="d-flex ga-3">
            <v-btn variant="text" color="secondary" @click="cancelBooking">Cancel</v-btn>
            <v-btn
              v-if="currentStep < totalStepCount"
              color="primary"
              variant="flat"
              @click="nextStep($event)"
            >
              Next
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              @click="completeBooking"
            >
              Complete Booking
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.booking-flow-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 9% 14%, rgba(230, 126, 34, 0.2), transparent 34%),
    radial-gradient(circle at 88% 10%, rgba(11, 79, 138, 0.18), transparent 31%),
    linear-gradient(180deg, #eef6fc 0%, #f6fafe 58%, #ffffff 100%);
}

.booking-complete-overlay {
  backdrop-filter: blur(2px);
}

.booking-flow-header {
  background: linear-gradient(125deg, #0b4f8a 0%, #164675 46%, #e67e22 100%);
  border-radius: 20px;
  padding: 1rem 1.25rem;
  box-shadow: 0 14px 34px rgba(11, 79, 138, 0.24);
}

.booking-flow-card {
  border: 1px solid rgba(11, 79, 138, 0.12);
  background: rgba(255, 255, 255, 0.97);
}

.cabin-option-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cabin-option-card {
  border: 1px solid rgba(11, 79, 138, 0.2);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.cabin-option-card:hover {
  border-color: rgba(11, 79, 138, 0.45);
  box-shadow: 0 8px 16px rgba(11, 79, 138, 0.12);
  transform: translateY(-1px);
}

.cabin-option-card--selected {
  border: 2px solid #0b4f8a;
  box-shadow: 0 10px 18px rgba(11, 79, 138, 0.16);
}

.cabin-option-image {
  border-bottom: 1px solid rgba(11, 79, 138, 0.1);
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

.running-price-card {
  width: 100%;
  max-width: 420px;
}

.step-progress-mobile {
  display: none;
}

.total-highlight {
  color: #e67e22;
}

.review-cruise-image {
  border: 1px solid rgba(11, 79, 138, 0.14);
}

@media (max-width: 959px) {
  .step-progress-mobile {
    display: block;
  }

  .stepper-header-desktop {
    display: none;
  }
}

@media (min-width: 960px) {
  .booking-flow-header {
    padding: 1.25rem 1.5rem;
  }
}
</style>
