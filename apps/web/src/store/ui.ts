import { create } from 'zustand';

interface UIState {
  bookingModalOpen: boolean;
  setBookingModalOpen: (v: boolean) => void;
}

const useUI = create<UIState>((set) => ({
  bookingModalOpen: false,
  setBookingModalOpen: (v: boolean) => set({ bookingModalOpen: v }),
}));

export { useUI };