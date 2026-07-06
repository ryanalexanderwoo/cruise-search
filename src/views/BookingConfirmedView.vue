<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CruiseDeparture } from '../types/cruise'
import cruiseData from '../data/metrics.json'

const route = useRoute()
const router = useRouter()
const cruises = cruiseData as CruiseDeparture[]

const cruiseId = route.query.cruiseId as string
const adults = parseInt(route.query.adults as string) || 0
const children = parseInt(route.query.children as string) || 0
const totalPrice = parseInt(route.query.totalPrice as string) || 0

const cruise = computed(() => cruises.find((item) => item.id === cruiseId))
const totalGuests = computed(() => adults + children)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function returnToSearch(): void {
  router.push('/')
}
</script>

<template>
  <v-container fluid class="booking-confirmed-page pa-3 pa-sm-5 pa-md-8">
    <v-card rounded="xl" elevation="4" class="booking-confirmed-card mx-auto">
      <v-card-text class="pa-6 pa-sm-8 text-center">
        <v-icon icon="mdi-check-circle" size="72" color="secondary" class="mb-4" />
        <p class="text-overline text-secondary mb-2">Booking Confirmed</p>
        <h1 class="text-h4 font-weight-bold mb-3">Your cruise is confirmed</h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          {{ cruise?.itineraryName ?? 'Your selected sailing' }} has been successfully booked.
        </p>

        <v-row class="text-left mb-8" justify="center">
          <v-col cols="12" md="8" lg="7">
            <div class="mb-4">
              <div class="text-body-2 text-medium-emphasis">Cruise</div>
              <div class="text-body-1 font-weight-medium">{{ cruise?.itineraryName ?? '—' }}</div>
            </div>
            <div class="mb-4">
              <div class="text-body-2 text-medium-emphasis">Sail Date</div>
              <div class="text-body-1 font-weight-medium">
                {{ cruise ? `${formatDate(cruise.startDate)} - ${formatDate(cruise.endDate)} (${cruise.nights} nights)` : '—' }}
              </div>
            </div>
            <div class="mb-4">
              <div class="text-body-2 text-medium-emphasis">Guests</div>
              <div class="text-body-1 font-weight-medium">{{ adults }} Adults, {{ children }} Children ({{ totalGuests }} total)</div>
            </div>
            <div>
              <div class="text-body-2 text-medium-emphasis">Total Price</div>
              <div class="text-h5 font-weight-bold total-highlight">{{ formatCurrency(totalPrice) }}</div>
            </div>
          </v-col>
        </v-row>

        <v-btn color="primary" variant="flat" size="large" @click="returnToSearch">
          Back to Cruise Search
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.booking-confirmed-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 9% 14%, rgba(230, 126, 34, 0.2), transparent 34%),
    radial-gradient(circle at 88% 10%, rgba(11, 79, 138, 0.18), transparent 31%),
    linear-gradient(180deg, #eef6fc 0%, #f6fafe 58%, #ffffff 100%);
}

.booking-confirmed-card {
  max-width: 920px;
  border: 1px solid rgba(11, 79, 138, 0.12);
  background: rgba(255, 255, 255, 0.97);
}

.total-highlight {
  color: #0b4f8a;
}
</style>
