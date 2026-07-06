import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SavedCruisesView from '../views/SavedCruisesView.vue'
import BookedCruisesView from '../views/BookedCruisesView.vue'
import BookingLandingView from '../views/BookingLandingView.vue'
import BookingFlowView from '../views/BookingFlowView.vue'
import BookingConfirmedView from '../views/BookingConfirmedView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/saved-cruises',
      name: 'saved-cruises',
      component: SavedCruisesView,
    },
    {
      path: '/booked-cruises',
      name: 'booked-cruises',
      component: BookedCruisesView,
    },
    {
      path: '/booking-landing',
      name: 'booking-landing',
      component: BookingLandingView,
    },
    {
      path: '/booking-flow',
      name: 'booking-flow',
      component: BookingFlowView,
    },
    {
      path: '/booking-confirmed',
      name: 'booking-confirmed',
      component: BookingConfirmedView,
    },
  ],
})

export default router
