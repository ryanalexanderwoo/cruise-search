<script setup lang="ts">
import { computed } from 'vue'
import { useBookedCruises } from '../composables/useBookedCruises'
import { destinationImageFromItineraryMap } from '../utils/destinationImage'

const { bookedCruises, removeBookedCruise, clearBookedCruises } = useBookedCruises()
const hasBookedCruises = computed(() => bookedCruises.value.length > 0)

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(date: string): string {
  return dateFormatter.format(new Date(date))
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function bookedCruiseImage(item: (typeof bookedCruises.value)[number]): string {
  return destinationImageFromItineraryMap(item.itineraryMap, item.itineraryName)
}
</script>

<template>
  <v-container fluid class="pa-3 pa-sm-5 pa-md-8 booked-page">
    <v-card rounded="xl" class="booked-header mb-5" elevation="0">
      <v-card-text class="py-6 py-md-7 px-4 px-sm-5 px-md-7 d-flex flex-wrap align-center ga-3">
        <div>
          <p class="text-overline mb-1">Booked Cruises</p>
          <h1 class="text-h5 text-md-h4 mb-0">Your confirmed cruise bookings</h1>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
            {{ bookedCruises.length }} booked {{ bookedCruises.length === 1 ? 'cruise' : 'cruises' }}
          </p>
        </div>
        <v-spacer />
        <v-btn
          v-if="hasBookedCruises"
          variant="outlined"
          color="secondary"
          prepend-icon="mdi-delete-outline"
          @click="clearBookedCruises"
        >
          Clear all
        </v-btn>
      </v-card-text>
    </v-card>

    <v-alert v-if="!hasBookedCruises" type="info" variant="tonal" border="start" class="rounded-xl">
      No booked cruises yet. Complete a booking to see it here.
    </v-alert>

    <v-row v-else>
      <v-col v-for="item in bookedCruises" :key="item.id" cols="12" md="6">
        <v-card rounded="xl" class="booked-card" elevation="2">
          <v-img :src="bookedCruiseImage(item)" height="180" cover />
          <v-card-text class="pa-4 pa-sm-5">
            <div class="d-flex justify-space-between ga-3 align-start mb-2">
              <div>
                <h2 class="text-h6 mb-1">{{ item.itineraryName }}</h2>
                <p class="text-caption text-medium-emphasis mb-0">{{ item.shipName }}</p>
              </div>
              <v-chip size="small" color="success" variant="flat">Confirmed</v-chip>
            </div>

            <p class="text-caption mb-2">{{ item.itineraryMap }}</p>
            <p class="text-caption text-medium-emphasis mb-1">
              {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }} ({{ item.nights }} nights)
            </p>
            <p class="text-caption text-medium-emphasis mb-3">
              Booked {{ formatDate(item.bookedAt) }}
            </p>

            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>Guests</span>
              <strong>{{ item.adults }} Adults, {{ item.children }} Children</strong>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>Total</span>
              <strong>{{ formatCurrency(item.totalPrice) }}</strong>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>Per stateroom</span>
              <strong>{{ formatCurrency(item.pricePerStateroom) }}</strong>
            </div>
            <div class="d-flex justify-space-between text-body-2">
              <span>Per person</span>
              <strong>{{ formatCurrency(item.pricePerPerson) }}</strong>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 px-sm-5 pb-sm-5">
            <v-spacer />
            <v-btn variant="text" color="secondary" prepend-icon="mdi-delete-outline" @click="removeBookedCruise(item.id)">
              Remove
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.booked-page {
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
}

.booked-header {
  background: linear-gradient(145deg, #ffffff 0%, #eef6ff 100%);
  border: 1px solid #d3e3f3;
}

.booked-card {
  border: 1px solid #d8e5f1;
}
</style>