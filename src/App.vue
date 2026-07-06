<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()
const mobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Cruises', to: '/' },
  { label: 'Destinations' },
  { label: 'Deals' },
]

const isDesktop = computed(() => mdAndUp.value)
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="mobileMenuOpen" temporary class="drawer-shell" width="280">
      <div class="pa-5 drawer-brand border-b">
        <div class="d-flex align-center ga-2">
          <img src="/logo.svg?v=2" alt="" class="logo-icon" />
          <p class="drawer-brand-title mb-0">Intrepid</p>
        </div>
      </div>
      <v-list nav density="comfortable" class="pa-2">
        <v-list-item
          v-for="link in navLinks"
          :key="link.label"
          :title="link.label"
          :to="link.to"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="0" class="app-bar-shell" height="72">
      <div v-if="isDesktop" class="app-bar-desktop">
        <div class="d-flex align-center ga-3">
          <img src="/logo.svg?v=2" alt="" class="logo-icon" />
          <v-toolbar-title class="brand-title mb-0">INTREPID</v-toolbar-title>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            v-for="link in navLinks"
            :key="link.label"
            :to="link.to"
            variant="text"
            class="nav-link"
            rounded="pill"
          >
            {{ link.label }}
          </v-btn>

          <v-menu>
            <template #activator="{ props }">
              <v-btn icon="mdi-account-circle-outline" variant="text" v-bind="props" />
            </template>
            <v-list density="compact">
              <v-list-item title="My Profile" />
              <v-list-item title="Saved Cruises" to="/saved-cruises" />
              <v-list-item title="Booked Cruises" to="/booked-cruises" />
              <v-list-item title="Sign Out" />
            </v-list>
          </v-menu>
        </div>
      </div>

      <div v-else class="app-bar-mobile">
        <div class="mobile-slot">
          <v-btn icon="mdi-menu" variant="text" @click="mobileMenuOpen = !mobileMenuOpen" />
        </div>

        <div class="mobile-brand d-flex align-center justify-center ga-2">
          <img src="/logo.svg?v=2" alt="" class="logo-icon-sm" />
          <span class="brand-title">INTREPID</span>
        </div>

        <div class="mobile-slot d-flex justify-end">
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon="mdi-account-circle-outline" variant="text" v-bind="props" />
            </template>
            <v-list density="compact">
              <v-list-item title="My Profile" />
              <v-list-item title="Saved Cruises" to="/saved-cruises" />
              <v-list-item title="Booked Cruises" to="/booked-cruises" />
              <v-list-item title="Sign Out" />
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>

    <v-footer color="#2f343b" class="py-10 footer-shell">
      <v-container>
        <v-row class="gy-6" align="start">
          <v-col cols="12" md="5">
            <h3 class="text-h6 mb-2">Intrepid Cruise Lines</h3>
            <p class="text-body-2 mb-4 footer-copy">
              Built for one-hand discovery: search, compare, and book sailings in seconds.
            </p>
            <div class="d-flex ga-2">
              <v-btn icon="mdi-instagram" size="small" variant="outlined" class="footer-social" />
              <v-btn icon="mdi-facebook" size="small" variant="outlined" class="footer-social" />
              <v-btn icon="mdi-youtube" size="small" variant="outlined" class="footer-social" />
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <h4 class="text-subtitle-1 mb-2 footer-heading">Explore</h4>
            <div><button type="button" class="footer-link footer-button">Cruises</button></div>
            <div><button type="button" class="footer-link footer-button">Destinations</button></div>
            <div><button type="button" class="footer-link footer-button">Deals</button></div>
          </v-col>
          <v-col cols="12" md="4">
            <h4 class="text-subtitle-1 mb-2 footer-heading">Support</h4>
            <div><button type="button" class="footer-link footer-button">Contact</button></div>
            <div><button type="button" class="footer-link footer-button">Travel Advisors</button></div>
            <div><button type="button" class="footer-link footer-button">Accessibility</button></div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style scoped>
.brand-title {
  font-weight: 800;
  color: #0b4f8a;
  letter-spacing: 0.16em;
  font-size: 1rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-icon-sm {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.app-bar-shell {
  border-bottom: 1px solid #d8e6f3;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(8px);
}

.app-bar-desktop {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.app-bar-mobile {
  width: 100%;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  padding: 0 8px;
}

.mobile-slot {
  width: 48px;
  display: flex;
  align-items: center;
}

.mobile-brand {
  text-align: center;
}

.drawer-shell {
  background: #f6fbff;
}

.drawer-brand {
  color: #164675;
}

.drawer-brand-title {
  font-weight: 800;
  color: #0b4f8a;
  letter-spacing: 0.16em;
  font-size: 1rem;
  text-transform: uppercase;
}

.border-b {
  border-bottom: 1px solid #d7e6f3;
}

.nav-link {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.footer-copy {
  color: #c9d2db;
}

.footer-heading {
  color: #f2f5f8;
}

.footer-shell {
  border-top: 1px solid #454d57;
  color: #e5eaef;
}

.footer-link {
  color: #d0d8e1;
  text-decoration: none;
  line-height: 1.9;
}

.footer-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.footer-button {
  background: transparent;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.footer-social {
  color: #eaf0f6;
  border-color: #647282;
}
</style>
