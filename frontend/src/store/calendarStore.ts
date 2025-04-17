import { create } from "zustand";

interface CalendarState {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  currentDate: new Date(), // Initialize with today's date
  setCurrentDate: (date) => set({ currentDate: date }),
}));
