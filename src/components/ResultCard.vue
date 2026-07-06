<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CruiseDeparture } from '../types/cruise'

const props = withDefaults(
  defineProps<{
    mode: 'itinerary' | 'date'
    cruise: CruiseDeparture
    departures?: CruiseDeparture[]
    imageUrl: string
    isSaved: boolean
    isCompared: boolean
    displayPrice: number
    priceLabel: string
    reviewRating: number
    departurePrices?: Record<string, number>
  }>(),
  {
    departures: () => [],
    departurePrices: () => ({}),
  },
)

const emit = defineEmits<{
  save: [id: string]
  compare: [id: string]
  quickview: [cruiseSet: CruiseDeparture[], title: string]
  book: [cruise: CruiseDeparture]
}>()

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const itineraryCruises = computed(() => {
  if (props.mode === 'itinerary') {
    return props.departures
  }

  return [props.cruise]
})

const earliestDate = computed(() => {
  const dates = itineraryCruises.value.map((item) => item.startDate).sort()
  return dates[0] ?? props.cruise.startDate
})

const latestDate = computed(() => {
  const dates = itineraryCruises.value.map((item) => item.endDate).sort()
  return dates[dates.length - 1] ?? props.cruise.endDate
})

const cardLabel = computed(() => {
  if (props.mode === 'itinerary') {
    return `${itineraryCruises.value.length} sailings`
  }

  return `${props.cruise.nights} nights`
})

const defaultImage = '/images/default.svg'
const safeImageUrl = ref(defaultImage)

watch(
  () => props.imageUrl,
  (next) => {
    safeImageUrl.value = next || defaultImage
  },
  { immediate: true },
)

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

function openQuickView(): void {
  emit('quickview', itineraryCruises.value, props.cruise.itineraryName)
}

function handleImageError(): void {
  if (safeImageUrl.value !== defaultImage) {
    safeImageUrl.value = defaultImage
  }
}
</script>

<template>
  <v-card rounded="xl" class="result-card surface-card fill-height" elevation="2">
    <v-img :src="safeImageUrl" height="190" cover eager class="card-image" @error="handleImageError">
      <div class="image-overlay" />
      <div class="image-chip-wrap">
        <v-chip color="primary" size="small" variant="flat">{{ cruise.shipName }}</v-chip>
        <v-chip color="secondary" size="small" variant="outlined" class="ml-2 card-label-chip">{{ cardLabel }}</v-chip>
      </div>
      <div class="image-actions">
        <v-btn
          icon
          size="small"
          variant="flat"
          :color="isSaved ? 'secondary' : 'white'"
          class="icon-action"
          :aria-label="isSaved ? 'Remove from favorites' : 'Save to favorites'"
          @click.stop="emit('save', cruise.id)"
        >
          <v-icon :icon="isSaved ? 'mdi-heart' : 'mdi-heart-outline'" />
        </v-btn>
        <v-btn
          :prepend-icon="isCompared ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
          size="small"
          variant="flat"
          :color="isCompared ? 'secondary' : 'white'"
          class="compare-action"
          :aria-label="isCompared ? 'Remove from compare' : 'Add to compare'"
          @click.stop="emit('compare', cruise.id)"
        >
          Compare
        </v-btn>
      </div>
    </v-img>

    <v-card-text class="pa-4 pa-sm-5 pa-md-6 card-content">
      <div class="card-header mb-3">
        <div class="title-rating-wrap">
          <h2 class="text-subtitle-1 text-md-h6 font-weight-bold mb-0 card-title">{{ cruise.itineraryName }}</h2>
          <v-chip
            v-if="mode === 'date'"
            color="error"
            size="small"
            variant="flat"
            class="date-emphasis-chip"
          >
            {{ formatDate(earliestDate) }} to {{ formatDate(latestDate) }}
          </v-chip>
          <div class="d-flex align-center ga-2 rating-wrap">
            <v-rating
              :model-value="reviewRating"
              color="amber"
              size="16"
              density="compact"
              half-increments
              readonly
            />
            <span class="text-caption text-medium-emphasis">{{ reviewRating.toFixed(1) }} / 5</span>
          </div>
        </div>
        <div class="text-right price-wrap">
          <div class="price-display">{{ formatCurrency(displayPrice) }}</div>
          <div class="text-caption mt-1">Starting from per {{ priceLabel }}</div>
        </div>
      </div>
      <p class="text-caption route-copy mb-2">{{ cruise.itineraryMap }}</p>
      <p v-if="mode === 'itinerary'" class="text-caption text-medium-emphasis mb-0 d-flex align-center ga-1">
        <v-icon size="14" icon="mdi-calendar-range" />
        {{ formatDate(earliestDate) }} to {{ formatDate(latestDate) }}
      </p>

      <template v-if="mode === 'itinerary'">
        <v-expansion-panels variant="accordion" class="mt-3 itinerary-expansion" flat>
          <v-expansion-panel :title="`Show ${itineraryCruises.length} cruise dates`" rounded="lg">
            <v-expansion-panel-text>
              <v-row>
                <v-col v-for="departure in itineraryCruises" :key="departure.id" cols="12">
                  <v-sheet rounded="lg" class="pa-3 departure-chip">
                    <div class="text-subtitle-2 mb-1">
                      {{ formatDate(departure.startDate) }} to {{ formatDate(departure.endDate) }}
                    </div>
                    <div class="text-caption">
                      Starting at {{ formatCurrency(departurePrices[departure.id] ?? departure.pricePerPerson) }} / {{ priceLabel }}
                    </div>
                  </v-sheet>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>

      <template v-else>
        <v-divider class="my-3" />
        <div class="text-caption text-medium-emphasis mb-2">Stateroom base prices</div>
        <v-row dense class="price-grid">
          <v-col cols="6">
            <div class="text-caption">Interior</div>
            <div class="text-body-2 font-weight-medium">{{ formatCurrency(cruise.stateroomPricing.interior) }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption">Oceanview</div>
            <div class="text-body-2 font-weight-medium">{{ formatCurrency(cruise.stateroomPricing.oceanview) }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption">Balcony</div>
            <div class="text-body-2 font-weight-medium">{{ formatCurrency(cruise.stateroomPricing.balcony) }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption">Suite</div>
            <div class="text-body-2 font-weight-medium">{{ formatCurrency(cruise.stateroomPricing.suite) }}</div>
          </v-col>
        </v-row>
      </template>
    </v-card-text>

    <v-card-actions class="px-4 pb-5 pt-3 px-sm-5 pb-sm-5 px-md-6 pb-md-6 card-actions">
      <v-spacer />
      <v-btn size="small" variant="outlined" @click="openQuickView">Quick view</v-btn>
      <v-btn size="small" color="primary" variant="flat" @click="emit('book', cruise)">Book now</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.result-card {
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(16, 67, 109, 0.12);
}

.card-image {
  position: relative;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 54, 89, 0.05) 24%, rgba(11, 54, 89, 0.58) 100%);
}

.image-chip-wrap {
  position: absolute;
  left: 12px;
  bottom: 12px;
}

.card-label-chip {
  background-color: #ffffff !important;
}

.image-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.icon-action {
  box-shadow: 0 4px 12px rgba(16, 58, 97, 0.15);
}

.compare-action {
  box-shadow: 0 4px 12px rgba(16, 58, 97, 0.15);
  font-size: 0.72rem;
}

.card-content {
  border-top: 1px solid #e4edf6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title-rating-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rating-wrap {
  min-width: fit-content;
}

.price-wrap {
  min-width: fit-content;
}

.price-display {
  font-size: 1.5rem;
  font-weight: 700;
  color: #13395f;
  line-height: 1.2;
}

.card-title {
  color: #103a61;
  letter-spacing: 0.01em;
}

.route-copy {
  color: #28557f;
}

.date-emphasis-chip {
  font-weight: 700;
}

.price-wrap {
  min-width: 98px;
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

.price-grid {
  background: #f9fcff;
  border: 1px solid #dce8f4;
  border-radius: 10px;
  padding: 6px;
}

.card-actions {
  border-top: 1px solid #edf2f8;
  row-gap: 8px;
  margin-top: 6px;
}

@media (max-width: 640px) {
  .card-title {
    line-height: 1.25;
  }

  .route-copy {
    line-height: 1.35;
  }

  .price-wrap {
    min-width: 88px;
  }
}
</style>
