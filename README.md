# Intrepid Cruise Search

Intrepid Cruise Search is a responsive, mobile-first cruise discovery prototype. It helps travelers compare itineraries, dates, ships, stateroom configurations, and pricing before saving, comparing, or booking a cruise.

The project uses curated synthetic data rather than a production cruise inventory API.

## Product Goals

The experience addresses the problems documented in `USER-RESEARCH.md`:

- Help users narrow an overwhelming set of cruise options.
- Make pricing visible while users compare dates, itineraries, and staterooms.
- Provide granular controls for budget, dates, accommodation, and stops.
- Let users save, compare, and continue into a booking flow without losing their configuration.

## Features

### Search and Results

- Keyword search across itinerary names, ship names, and destinations.
- Explicit Search action rather than live filtering.
- View results by itinerary or individual cruise date.
- Sort by recommended, rating, price, or earliest sailing date.
- Result counts reflect the active result view.
- Responsive desktop and mobile layouts.

### Filters

- Sailing month and ship.
- Flexible sailing date range.
- Cruise-night range.
- Budget range using the selected pricing mode.
- Stateroom type: Interior, Oceanview, Balcony, or Suite.
- Maximum number of itinerary stops.
- Removable filter chips and Clear filters.
- Desktop filter rail and mobile filter dialog.

The dataset contains stateroom prices but not inventory counts. Stateroom availability filtering therefore uses a nonzero price for the selected cabin type as its availability signal.

### Pricing and Staterooms

- Per-person and per-stateroom pricing modes.
- One to four stateroom configurations.
- Adult and child counts per stateroom.
- Room capacity validation and minimum adult requirement.
- Dynamic totals for total price, price per stateroom, and price per person.
- Search-page stateroom settings initialize Quick View.
- Quick View configuration remains independent after the modal opens.

### Quick View

Quick View provides a deeper look at an itinerary or sailing:

- Cruise dates and date selection.
- Stateroom pricing by type.
- Destination breakdown and ship highlights.
- Independent stateroom and guest configuration.
- Dynamic pricing calculator.
- Save and compare actions.
- Save configuration for later use in Saved Cruises.
- Book Now entry point.

### Save and Compare

- Save or remove cruises with a heart action.
- Compare up to four cruises.
- Bottom compare panel with expand and collapse behavior.
- Comparison includes itinerary, ship, dates, nights, map, and active pricing mode.
- Saved cruise configurations persist through browser local storage.

### Booking Workflow

- Booking Landing page for reviewing and editing the selected sailing.
- Editable sailing date and stateroom configuration.
- Cabin-selection step for each selected stateroom.
- Cabin upgrades and add-ons.
- Running booking total.
- Review and confirmation step.
- Booking confirmation page.
- Booked Cruises history persisted in local storage.

## Data

The local dataset is stored in `src/data/metrics.json` and contains:

- 77 cruise departures.
- 22+ itineraries.
- Departures from July 2027 through February 2028.
- Itinerary names and destination maps.
- Ship names, dates, and cruise-night duration.
- Price per person and total base price.
- Interior, Oceanview, Balcony, and Suite pricing.

Ratings and some recommendation behavior are generated locally for prototype purposes. This is not live inventory, live pricing, or production availability data.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Cruise search and results |
| `/saved-cruises` | Saved cruise configurations |
| `/booked-cruises` | Confirmed booking history |
| `/booking-landing` | Review and edit a selected cruise |
| `/booking-flow` | Cabin, add-on, and confirmation flow |
| `/booking-confirmed` | Booking confirmation |

## Project Structure

```text
src/
  components/
    CruiseFilters.vue       Shared filter controls
    ResultCard.vue          Itinerary and cruise-date result cards
  composables/
    useSavedCruises.ts      Saved cruise localStorage state
    useBookedCruises.ts     Booked cruise localStorage state
  data/
    metrics.json            Synthetic cruise departure dataset
  router/
    index.ts                Application routes
  views/
    HomeView.vue            Search, filters, results, Quick View, compare
    SavedCruisesView.vue    Saved configurations
    BookedCruisesView.vue   Booking history
    BookingLandingView.vue Pre-booking review and editing
    BookingFlowView.vue    Cabin and add-on workflow
    BookingConfirmedView.vue Confirmation state
```

## Tech Stack

- Vue 3 Composition API
- TypeScript
- Vite
- Vuetify 3
- Vue Router
- Chart.js and vue-chartjs for the price trend visualization
- Material Design Icons
- Local JSON data and browser storage

## Getting Started

Requirements: Node.js `20.19+` or Node.js `22.12+`.

```sh
npm install
npm run dev
```

The development server prints the local URL, typically `http://localhost:5173/`.

## Validation Commands

```sh
# Type-check and production build
npm run build

# Type-check only
npm run type-check

# Production preview
npm run preview
```

## Images

Cruise card images are stored locally in `public/images` for reliable rendering and offline development. Original image sources and licensing information are documented in `IMAGE_SOURCES.md`.

## Project Context

- `BRIEF.md` describes the product requirements and implemented workflow.
- `USER-RESEARCH.md` describes user problems, hypotheses, and feature rationale.
- `IMAGE_SOURCES.md` documents local image sources and licensing context.
