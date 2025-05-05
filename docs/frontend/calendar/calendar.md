# Frontend: Calendar Feature

## Overview

The Calendar feature provides users with a visual interface to view, manage, and schedule events across one or more selected calendars. It supports month, week, and day views and allows users to navigate through different time periods. Event creation is facilitated through a dedicated dialog.

## Entry Point & Initial Load

- **Server Component:** `src/app/(calendar)/calendar/page.tsx`
  - Acts as the entry point for the calendar route.
  - Runs on the server initially.
  - Prefetches the list of all available calendars using React Query (`useCalendars` hook, `queryKeys.calendars`) and the `getCalendars` API function. This optimizes the initial load by having calendar data ready.
  - Sets default view settings (e.g., initial date, view type).
  - Passes the prefetched data (via React Query's `HydrationBoundary`) and initial settings to the main client component.

## Core Client Component

- **Client Component:** `src/components/calendar/calendar-client-ui.tsx`
  - Handles all user interactions and dynamic rendering within the calendar page.
  - Receives initial data/settings from the server component.
  - **State Management:**
    - Manages the current view (`month`, `week`, `day`) using local React state (`useState`).
    - Manages the currently displayed date using a global Zustand store (`useCalendarStore`). This allows the date to persist across navigations or potentially be shared with other components (like a mini-calendar).
  - **URL-Driven Calendar Selection:** Reads the `calendars` query parameter from the URL (`useSearchParams`) to determine which calendars' events should be displayed. The parameter should contain comma-separated calendar IDs (e.g., `?calendars=1,3`).
  - **Data Fetching:** Uses the `useCalendars` hook (`src/hooks/useCalendar.tsx`) to get details for all available calendars (leveraging the prefetched data). It then filters this list based on the IDs selected via the URL parameter.
  - **Rendering:**
    - Renders `CalendarHeader` for navigation controls (Previous, Next, Today), view switching buttons, and an "Add Event" button.
    - Dynamically renders the appropriate view component based on the selected view state:
      - `MonthView` (`src/components/calendar/month-view.tsx`)
      - `WeekView` (`src/components/calendar/week-view.tsx`)
      - `DayView` (`src/components/calendar/day-view.tsx`)
    - These view components are responsible for fetching and displaying the actual _events_ for the `currentDate` and `selectedCalendarIdsArray`. (Assumed interaction with `useEvents` hook and `event-service`).
  - **Event Creation:** Manages the state (`isAddEventDialogOpen`) for the `AddEventDialog`. Opens the dialog when a day/timeslot is clicked in a view or when the header's "Add Event" button is clicked. Passes the list of currently selected calendars (`selectableCalendarsDetails`) to the dialog.

## Sidebar Integration

The main application layout (`src/components/layout2.tsx`) includes a sidebar (`src/components/sidebar/app-sidebar.tsx`) which contains components that interact directly with the Calendar feature when viewing `/calendar` routes:

- **Date Navigation (`src/components/sidebar/calendar/calendar-nav.tsx`):**

  - Displays a mini-calendar.
  - Uses the same Zustand store (`useCalendarStore`) as the main calendar view (`CalendarClientUI`).
  - Selecting a date in the mini-calendar updates the `currentDate` in the store, causing the main calendar view to navigate to that date.

- **Calendar Filtering (`src/components/sidebar/calendar/multi-calendar-selector.tsx`):**
  - Fetches the list of available calendars (`useCalendars` hook).
  - Displays checkboxes for each calendar.
  - When checkboxes are selected/deselected, this component updates the `calendars` URL search parameter (e.g., `/calendar?calendars=1,3`).
  - The main calendar view (`CalendarClientUI`) reads this URL parameter (`useSearchParams`) to determine which calendars' events to fetch and display.

## Key Components

- `page.tsx`: Server entry point, prefetching.
- `calendar-client-ui.tsx`: Main client orchestrator.
- `header.tsx`: Navigation and view controls.
- `month-view.tsx`, `week-view.tsx`, `day-view.tsx`: Display logic for different views, event fetching/display.
- `add/add-event-dialog.tsx`: Dialog/form for creating new events.
- `store/calendarStore.ts`: Zustand store for `currentDate`.
- `hooks/useCalendar.tsx`: Hook (`useCalendars`) for fetching the list of calendars.
- `hooks/useEvents.tsx`: (Assumed) Hook for fetching events for specific dates/calendars.

## Backend Interaction

- **Calendar Service:** `getCalendars` API function likely interacts with the `calendar-service` to fetch the list of available calendars.
- **Event Service:** The view components and `AddEventDialog` likely interact with the `event-service` to fetch and create events, respectively.

## Usage

Navigate to `/calendar`. To view specific calendars, append the `calendars` query parameter with comma-separated IDs, e.g., `/calendar?calendars=1,2`.
