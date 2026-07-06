import { ref } from 'vue'
import type { BookedCruiseEntry } from '../types/bookedCruise'

const STORAGE_KEY = 'intrepid.bookedCruises'
const bookedCruises = ref<BookedCruiseEntry[]>([])
let initialized = false

function loadBookedCruises(): BookedCruiseEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as BookedCruiseEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistBookedCruises(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookedCruises.value))
}

function ensureInitialized(): void {
  if (!initialized) {
    bookedCruises.value = loadBookedCruises()
    initialized = true
  }
}

export function useBookedCruises() {
  ensureInitialized()

  function addBookedCruise(entry: BookedCruiseEntry): void {
    if (bookedCruises.value.some((item) => item.id === entry.id)) {
      return
    }

    bookedCruises.value = [entry, ...bookedCruises.value]
    persistBookedCruises()
  }

  function removeBookedCruise(id: string): void {
    bookedCruises.value = bookedCruises.value.filter((item) => item.id !== id)
    persistBookedCruises()
  }

  function clearBookedCruises(): void {
    bookedCruises.value = []
    persistBookedCruises()
  }

  return {
    bookedCruises,
    addBookedCruise,
    removeBookedCruise,
    clearBookedCruises,
  }
}