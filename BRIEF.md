# Cruise Search Mobile Experience

## Summary
The cruise line, Intrepid Cruise Lines, is building a cruise search application that is designed primarily for a mobile experience, but should still work for all resolutions. It should have searching and filtering functionality that helps potential cruisers find vacations that match their travel style and budget. Being mainly a mobile experience, the search and filtering functionality is incredibly important when searching for cruises on-the-go with one hand. Users should also be able to save, compare, and shop for cruises.

The experience now includes post-booking confirmation and a dedicated Booked Cruises history page accessible from the user profile menu.

## Data
Comprehensive fake dataset as a JSON file (src/data/metrics.json) with 77 cruise departures across 22+ different itineraries, spanning July 2027 through February 2028, including:
- Price per person based on double occupancy
- Total base price based on double occupancy
- Itinerary name and itinerary map (destinations)
- Ship name
- Cruise dates and night duration
- Stateroom pricing by type (interior, oceanview, balcony, suite)

## Layout (Vuetify)
- Responsive website
- Working interactive prototype

### Header
- Header on top with responsive design
    - Desktop: Orange ship logo icon in top left, blue "Intrepid" text, then "Cruises", "Destinations", and "Deals" in navbar with user profile menu in top right
        - "Cruises" links to the Cruise Search page (active)
        - "Destinations" is placeholder for future destinations screen
        - "Deals" is placeholder for future deals screen
    - Mobile: Hamburger menu in top left (no chevron arrows) with orange ship logo icon and blue "Intrepid" text in centre, user profile menu in top right
        - Navigation drawer contains nav links (no "Cruise Search" label)

### Body - Search, Filter and Sort
- Full-width Search section at the top of the page
  - Search input bar with magnifying glass icon for keyword search
  - Search button with magnifying glass icon and "Search" label to the right of input
  - Search does NOT apply live filtering; users must click the Search button to trigger results
  - Search queries across itinerary names, ship names, and destinations/itinerary map
- Staterooms control
    - Positioned to the right of the Search input bar in a card panel
    - "Staterooms" title with +/- buttons to add/remove staterooms (minimum 1, maximum 4)
    - Each stateroom displayed in an expandable accordion panel labeled "Stateroom 1", "Stateroom 2", etc, with a trash can icon to remove
    - Within each accordion panel:
      - Stateroom type selector (dropdown or pill buttons): Interior, Oceanview, Balcony, Suite
      - "Adults" control (Ages 18+) with -/+ buttons and current count displayed
      - "Children" control (Under 18) with -/+ buttons and current count displayed
      - Constraint: Maximum 4 guests per stateroom, minimum 1 adult per stateroom
      - Helper text: "Max 4 guests per stateroom and at least 1 adult."
    - Guest summary displayed below accordions: "X staterooms • Y Adults, Z Children"
    - This control's configuration syncs to the Quickview modal stateroom defaults (but changes in Quick View don't affect the Search page) 
- Filters on left rail (for desktop) and on a button (for mobile)
    - Chip-based filter UI with individual removable selections
    - Month and Ship selections render as blue closable chips inside the select input fields
    - Price and Cruise Nights show as single adjustable chips when range is modified from defaults
    - Each chip can be removed individually to update filters immediately
- "Pricing by" dropdown menu: Per Stateroom and Per Person
    - Pricing by Stateroom
        - Refreshes the card to show the price by stateroom
    - Pricing per Person
        - Refreshes the card to show the price per person
- "View by" dropdown menu: Itinerary and Cruise Date
    - Product cards by Itinerary
        - Number of Itinerary search results should reflect the number of itineraries only
        - Users should be able to dig into each Itinerary to see a quick view of the cruise along with cruise dates that fall under that Itinerary
    - Product cards by Cruise Date
        - Number of Cruise Date search results should reflect the number of cruise dates only
        - Users should be able to dig into each Cruise Date to see a quick view of the cruise along with stateroom pricing
- Sorting dropdown that lets users sort the search results
    - Sorting options:
        - Recommended - Sorts based on knowledge about the user (Saved cruises, Location, etc)
        - Highest Rated - Sorts by highest rated user-reviewed cruises
        - Price: Low to High - Sorts by lowest price first (also sorts the cruise dates lowest price first in the Itinerary View)
        - Price: High to Low - Sorts by highest price first
    - Date: Earliest First - Sorts by earliest sail date first
    - In Itinerary View, the active sort also applies to the cruise dates shown inside each "Show cruise dates" accordion (e.g. Price: Low to High lists the cheapest departure first within each itinerary group)
- Applied Filters Summary
  - Display a summary line showing all active filters and searches (search term, selected months, ships, price range, night range)
  - Shows "No filters applied" when no filters are active
  - Updated in real-time as filters/searches are applied
  - Individual removable blue chips for each active filter with close (X) button
  - "Clear filters" button positioned at the end of the filter chips row to reset all filters when there are filters selected

### Body - Search Results
- Have a section header separating the Search and Filter controls and the Search Results. This section header should keep a count of the search results.
- "ResultCard" reusable component
    - Displays itinerary name (or ship name for date view), cruise dates, ship name, and destinations
    - "Save" button (Heart icon) - blue filled heart when saved, outlined heart when unsaved
    - "Compare" button (Checkbox icon with "Compare" label)
    - User-reviewed 5-star rating display
    - "Quickview" button (secondary style) to show cruise details modal
    - "Book now" button (primary orange style) for booking flow
    - Destination image with fallback to default SVG if unavailable
    - Stacked accordion view of cruise dates within each itinerary card
  - Cruise Date cards show all stateroom base prices: Interior, Oceanview, Balcony, and Suite
  - Cruise Date cards show the sailing date as a red chip near the cruise title for stronger emphasis
- Quickview modal
    - Displays cruise itinerary, ship information, and highlighted destinations
    - Cruise date selector with pricing calculator for each date
  - Cruise date selector labels include base price in dash format: Start Date - End Date - Base Price
    - Stateroom configuration panel (independent from Search page controls)
        - Add/remove staterooms with +/- buttons
        - Select stateroom type (interior, oceanview, balcony, suite)
        - Configure guest count per stateroom (adults/children)
        - Shows dynamic pricing per stateroom and per person
        - Changes to configuration do not affect Search page settings
    - "Estimated Total" price displayed prominently right-aligned
    - "Per Stateroom" and "Per Person" pricing shown as supporting text
    - "Save cruise" button to save this cruise configuration to Saved Cruises page
    - "Save" (Heart) button - filled when saved, outlined when not
    - "Compare" button to add cruise to comparison panel
    - "Close" button (secondary style) to dismiss modal
    - "Book now" button (primary orange style) for booking flow


### Body - Features
- Compare
  - Once a cruise card is selected to be compared, a "Compare cruises" panel appear pinned at the bottom (maximum 4 selections)
    - Contains information about the cruise itinerary, cruise dates, prices, ship name, as well as the destinations visited, and ship highlights 
    - Should have an "Expand" button to expand and see the cruises selected to compare
    - Should have a "Collapse" button to collapse the panel back to its pinned view

### Booking Landing
- Booking Landing
    - Once the Book Now button is clicked, take user to a Booking Landing page which contains information about the cruise they selected
  - Contains a Sail Date dropdown so users can switch between available departure dates for that itinerary
  - Each Sail Date option includes the lowest base stateroom price for that departure
    - Changing Sail Date updates the selected departure details and recalculates pricing
    - Contains the Staterooms and number of guests they selected
    - Contains the estimated base price as well as a breakdown of price per stateroom and price per person
    - Contains a "Back" button aligned to the left at the bottom to return to Cruise Search
    - Contains a "Save Cruise" button to save the current Booking Landing configuration to Saved Cruises
    - Contains a "Continue" button to continue into the Booking Flow
    - Bottom actions are split: Back on the left, Save Cruise and Continue grouped on the right
    - Users should still be able to configure and reconfigure the staterooms and guests that they selected on the Cruise Search page

### Booking Flow
- Booking Flow
    - Continuing from the Booking Landing page, users should be taken to a multi-step process where they select various aspects of their cruise
    - Cabin type: each selected stateroom gets its own cabin-selection step
    - Cabin options are filtered by stateroom type (for example, Interior only shows Interior variants)
    - Each cabin step shows selected stateroom details (type, adults, children)
  - Cruise add-ons
  - Cabin options are displayed as stacked selectable cards with cabin details and cabin-specific images
  - Contains a running price summary at the bottom of the page in the same visual style as Booking Landing pricing
  - Running total updates live and includes Booking Flow selections (cabin upgrades and add-ons)
  - Review & Confirm step includes a cruise image above the booking summary
  - Top Back button returns to Cruise Search
  - Bottom Back button returns to Booking Landing
  - Complete Booking shows a loading state and then routes to Booking Confirmation

### Booking Confirmation
- Booking Confirmation page
  - Shows a green confirmation check icon and heading "Booking confirmed"
  - Shows a cruise image and booking summary details
  - CTA button text is "View Booked Cruise"
  - CTA navigates to the Booked Cruises page

### Booked Cruises
- Booked Cruises page (from profile menu)
  - Displays confirmed bookings with cruise images, itinerary details, guests, and pricing
  - Supports removing individual entries and clearing all entries
  - Uses persisted local storage so bookings remain after refresh
   
### Footer
- Footer on bottom
    - Dark grey footer with social media links and link tree

## Style
- Google font: Open Sans
- Brand Colors:
  - Primary (Orange): #E67E22 - Used for Call-to-Action buttons (Book now, Search) and primary chips
  - Secondary (Blue): #0b4f8a - Used for interactive elements, Filter buttons, and secondary chips
  - Text Colors: Dark grey for body text, white for light backgrounds
- Background: Light grey with a hint of blue
- Buttons:
  - Book now, Search: Primary (orange, filled/flat)
  - Close, Quickview, Filter: Secondary (blue)
  - Default states use icon+text or text only (no icon-only buttons)
- Card Design:
  - Ship name chip: Orange filled badge
  - Sailings/nights chip: Blue outlined with white background
  - Price display: Large, bold, dark grey text (no container)
- Logo: Orange ship icon with blue "Intrepid" text

## Tech
- Vue 3 + TypeScript + Vuetify3
- Chart.js via vue-chartjs for all charts
- Fake data from a local JSON (no API calls)

## Implementation Details

### Router Configuration
The application has been set up with Vue Router (v4) with the following routes:
- `/` (home) → HomeView.vue
- `/saved-cruises` (saved-cruises) → SavedCruisesView.vue
- `/booked-cruises` (booked-cruises) → BookedCruisesView.vue
- `/booking-landing` (booking-landing) → BookingLandingView.vue
- `/booking-flow` (booking-flow) → BookingFlowView.vue
- `/booking-confirmed` (booking-confirmed) → BookingConfirmedView.vue

### Booking Flow Components

#### BookingLandingView.vue
- **Purpose**: Displays a summary of the cruise booking before users proceed to the multi-step booking process
- **Location**: src/views/BookingLandingView.vue
- **Features**:
  - Back button at the top and at the bottom to return to Cruise Search
  - Title heading of the cruise name with a big splash image of the cruise (same one used for the cruise card)
  - Query parameter handling: cruiseId, stateroomTypes, stateroomDetails, adults, children, totalPrice, pricePerStateroom, pricePerPerson
  - Displays cruise details (name, date range, duration, ship)
  - **Sail Date Selection**:
    - Dropdown of available departures for the selected itinerary
    - Selecting a new date switches the active departure on Booking Landing
    - Duration and date-dependent pricing update immediately when date changes
    - Each option appends the departure's lowest base stateroom price
  - **Editable Stateroom Configuration**:
    - Accordion interface for each stateroom (min 1, max 4), matching Cruise Search styling
    - Add/Remove stateroom buttons (+/- controls with 1-4 stateroom limit)
    - For each stateroom:
      - Type selector dropdown (Interior, Oceanview, Balcony, Suite)
      - Adults count with +/- buttons (min 1 per stateroom, max 4 total per stateroom)
      - Children count with +/- buttons (min 0, max based on room capacity)
      - Price display per stateroom type
    - Remove button per stateroom (disabled if only 1 stateroom remains)
    - Uses the same accordion affordance and panel styling as Cruise Search
  - Dynamic pricing recalculation as users modify selections:
    - Date change recalculates total based on the selected departure's stateroom pricing
    - Total cruise price across all staterooms
    - Price per stateroom (total price ÷ number of staterooms)
    - Price per person (total price ÷ total guests)
  - Pricing card with breakdown displayed on right side (sticky positioning)
    - No card outline
    - Primary total label is "Total Price"
    - "Staterooms" and "Total Guests" are shown on the same line
  - Removed horizontal divider above the "Cruise Details" section
  - Removed the "Selected Cruise" overline label from the hero image
  - Save Cruise button stores the currently selected departure and stateroom configuration in Saved Cruises
  - Navigation: Back button (left-aligned, returns to home), Save Cruise and Continue buttons on right (Continue proceeds to booking flow with updated values and full stateroom details)
  - Stateroom type label formatter for display (interior → "Interior", etc.)

#### BookingFlowView.vue
- **Purpose**: Multi-step booking process for cruise bookings
- **Location**: src/views/BookingFlowView.vue
- **Features**:
  - Dynamic stepper with one cabin-selection step per selected stateroom, followed by Add-ons and Review & Confirm
  - Cabin selections are constrained by selected stateroom type:
    - Interior: Standard, Premium, Spacious
    - Oceanview: Standard, Premium with Balcony
    - Balcony: Standard, Deluxe, Grand
    - Suite: Grand, Penthouse
  - Each cabin-selection step shows stateroom context details:
    - Stateroom index (for example, Stateroom 2 of 3)
    - Stateroom type label
    - Adults and children counts
  - Cabin variants are presented as vertically stacked selectable cards
    - Each card includes cabin label, price impact, supporting description, and cabin-specific image
    - Selected cabin card uses a thicker blue border for emphasis
  - Responsive step progress indicator:
    - Desktop uses stepper header
    - Mobile uses compact "Step X of Y" text + progress bar
  - Dynamic pricing:
    - Add-on selections recalculate add-on total in real-time
    - Cabin upgrade selections calculate cabin upgrade total
    - Review step grand total includes base cruise + cabin upgrades + add-ons
    - Bottom running pricing card mirrors Booking Landing style and includes:
      - Total Price
      - Stateroom and guest counts
      - Base cruise, cabin upgrades, and add-ons line items
      - Price per stateroom and price per person
    - Running pricing card is shown on cabin and add-on steps, but hidden on the Review & Confirm step
    - All Booking Flow selections immediately update the running bottom total and per-unit breakdown
  - Query parameter parsing to restore user's cruise, stateroom selections, and pricing selection
  - Navigation:
    - Top "Back to Search" button returns to Cruise Search
    - Footer Back button returns to Booking Landing
    - Cancel exits flow
  - Complete Booking button on final step shows loading and routes to Booking Confirmation
  - Review & Confirm step includes Sail Date in the booking details summary
  - Review & Confirm step includes cruise image
  - Review pricing summary is displayed without an outer card container on the right side
  - Currency formatting with locale-aware number formatting

#### BookingConfirmedView.vue
- **Purpose**: Final confirmation screen shown after booking completion
- **Location**: src/views/BookingConfirmedView.vue
- **Features**:
  - Green check icon and heading text: "Booking confirmed"
  - Cruise image and booking summary (cruise, sail date, guests, total)
  - CTA button "View Booked Cruise" routes to Booked Cruises
  - Stores confirmed booking entries into local storage-backed Booked Cruises data

#### BookedCruisesView.vue
- **Purpose**: Displays confirmed cruise bookings
- **Location**: src/views/BookedCruisesView.vue
- **Features**:
  - Renders booked cruise cards with destination image, itinerary details, and pricing
  - Shows guest counts and booking date
  - Supports removing individual bookings and clearing all bookings
  - Uses dedicated local storage composable for persisted booking history (`useBookedCruises`)

### Router Behavior Updates
- Global scroll reset on navigation via Vue Router `scrollBehavior`
  - New route navigations (including Book now → Booking Landing and Continue → Booking Flow) start at top of page
  - Browser saved positions are preserved for history navigation where applicable

### ResultCard Component Updates
- Added `book` event emit to result card component
- Book Now button now emits the 'book' event with cruise data
- Allows direct navigation to booking landing with default configuration (1 interior stateroom, 2 adults)

### HomeView.vue Updates
- Imported useRouter from vue-router for navigation
- Added goToBookingLanding() function to navigate from Quick View modal
- Added bookCruiseFromCard() function to handle Book Now clicks from ResultCard
- Updated both ResultCard instances (itinerary and date views) with @book listener
- Quick View "Book Now" button calls goToBookingLanding() with full stateroom configuration
- Result card "Book Now" buttons navigate directly with default configuration (1 interior stateroom, 2 adults)
- Cruise Search state persistence when returning from Booking Landing:
  - Restores View by, Pricing by, Sort by, Search text, and applied filters/ranges
  - Uses sessionStorage to preserve in-session state across route navigation
 - Added new Sort by option: "Date: Earliest First"
 - In Itinerary View, the active sort also applies to the cruise dates shown inside each itinerary accordion