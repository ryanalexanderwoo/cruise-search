<script setup lang="ts">
const props = defineProps<{
  monthOptions: { label: string; value: string }[]
  shipOptions: string[]
  minPrice: number
  maxPrice: number
  minNights: number
  maxNights: number
  pricingMode?: 'stateroom' | 'person'
}>()

const selectedMonths = defineModel<string[]>('selectedMonths', { required: true })
const selectedShips = defineModel<string[]>('selectedShips', { required: true })
const selectedStateroomTypes = defineModel<string[]>('selectedStateroomTypes', { required: true })
const startDate = defineModel<string>('startDate', { required: true })
const endDate = defineModel<string>('endDate', { required: true })
const maxStops = defineModel<number | null>('maxStops', { required: true })
const priceRange = defineModel<number[]>('priceRange', { required: true })
const nightsRange = defineModel<number[]>('nightsRange', { required: true })

function removeMonth(value: string): void {
  selectedMonths.value = selectedMonths.value.filter((m) => m !== value)
}

function removeShip(ship: string): void {
  selectedShips.value = selectedShips.value.filter((s) => s !== ship)
}

function resetPriceRange(): void {
  priceRange.value = [props.minPrice, props.maxPrice]
}

function resetNightsRange(): void {
  nightsRange.value = [props.minNights, props.maxNights]
}
</script>

<template>
  <div class="filter-container">
    <div class="filter-section">
      <div class="section-title">Sailing month</div>
      <div class="mb-3">
        <v-select
          v-model="selectedMonths"
          :items="monthOptions"
          item-title="label"
          item-value="value"
          label="Select months"
          variant="outlined"
          multiple
          chips
          closable-chips
          hide-details
          density="compact"
          class="mb-3"
        >
          <template #chip="{ props: chipProps, item }">
            <v-chip
              v-bind="chipProps"
              closable
              color="secondary"
              variant="flat"
              size="small"
              class="mr-1"
              @click:close.stop="removeMonth(item.value)"
            >
              {{ item.title }}
            </v-chip>
          </template>
        </v-select>
      </div>
    </div>

    <div class="filter-section">
      <div class="section-title">Ship</div>
      <div class="mb-3">
        <v-select
          v-model="selectedShips"
          :items="shipOptions"
          label="Select ships"
          variant="outlined"
          multiple
          chips
          closable-chips
          hide-details
          density="compact"
          class="mb-3"
        >
          <template #chip="{ props: chipProps, item }">
            <v-chip
              v-bind="chipProps"
              closable
              color="secondary"
              variant="flat"
              size="small"
              class="mr-1"
              @click:close.stop="removeShip(item.value)"
            >
              {{ item.title }}
            </v-chip>
          </template>
        </v-select>
      </div>
    </div>

    <div class="filter-section">
      <div class="section-title">Sailing dates</div>
      <div class="date-filter-grid">
        <v-text-field v-model="startDate" type="date" label="From" variant="outlined" density="compact" hide-details />
        <v-text-field v-model="endDate" type="date" label="To" variant="outlined" density="compact" hide-details />
      </div>
    </div>

    <div class="filter-section">
      <div class="section-title">Stateroom availability</div>
      <v-select
        v-model="selectedStateroomTypes"
        :items="[
          { title: 'Interior', value: 'interior' },
          { title: 'Oceanview', value: 'oceanview' },
          { title: 'Balcony', value: 'balcony' },
          { title: 'Suite', value: 'suite' },
        ]"
        label="Available types"
        multiple
        chips
        closable-chips
        variant="outlined"
        density="compact"
        hide-details
      />
    </div>

    <div class="filter-section">
      <div class="section-title">Number of stops</div>
      <v-select
        v-model="maxStops"
        :items="[
          { title: 'Any number of stops', value: null },
          { title: 'Up to 2 stops', value: 2 },
          { title: 'Up to 3 stops', value: 3 },
          { title: 'Up to 4 stops', value: 4 },
        ]"
        label="Stops"
        variant="outlined"
        density="compact"
        hide-details
      />
    </div>

    <div class="filter-section">
      <div class="section-title">{{ pricingMode === 'stateroom' ? 'Price per stateroom' : 'Price per person' }}</div>
      <v-range-slider
        v-model="priceRange"
        :min="minPrice"
        :max="maxPrice"
        :step="10"
        color="primary"
        thumb-label="always"
        hide-details
        class="mb-3"
      />
      <div v-if="priceRange[0] !== minPrice || priceRange[1] !== maxPrice" class="d-flex flex-wrap ga-2 mb-2">
        <v-chip
          closable
          color="secondary"
          variant="flat"
          size="small"
          @click:close="resetPriceRange"
        >
          Price: ${{ priceRange[0] }}-${{ priceRange[1] }}
        </v-chip>
      </div>
    </div>

    <div class="filter-section">
      <div class="section-title">Cruise nights</div>
      <v-range-slider
        v-model="nightsRange"
        :min="minNights"
        :max="maxNights"
        :step="1"
        color="primary"
        thumb-label="always"
        hide-details
        class="mb-3"
      />
      <div v-if="nightsRange[0] !== minNights || nightsRange[1] !== maxNights" class="d-flex flex-wrap ga-2">
        <v-chip
          closable
          color="secondary"
          variant="flat"
          size="small"
          @click:close="resetNightsRange"
        >
          Nights: {{ nightsRange[0] }}-{{ nightsRange[1] }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.75rem 0.875rem 1rem;
}

@media (min-width: 960px) {
  .filter-container {
    padding: 1rem 1.125rem 1.25rem;
  }
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.section-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #164675;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.filter-accordion {
  border: 0;
  border-radius: 0;
  overflow: visible;
}

.filter-accordion :deep(.filter-section) {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0;
  border: 0;
  margin: 0;
}

.filter-accordion :deep(.filter-section .v-expansion-panel__shadow),
.filter-accordion :deep(.filter-section::before),
.filter-accordion :deep(.filter-section::after) {
  display: none;
}

.filter-accordion :deep(.filter-section + .filter-section) {
  border-top: 1px solid #dbe6f2;
}

.filter-accordion :deep(.filter-section .v-expansion-panel-title),
.filter-accordion :deep(.filter-section .v-expansion-panel-text) {
  background: transparent !important;
}
</style>
