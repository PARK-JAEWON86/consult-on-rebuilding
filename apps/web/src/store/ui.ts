import { create } from 'zustand';

interface UIState {
  bookingModalOpen: boolean;
  setBookingModalOpen: (v: boolean) => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (v: boolean) => void;
}

const useUI = create<UIState>((set) => ({
  bookingModalOpen: false,
  setBookingModalOpen: (v: boolean) => set({ bookingModalOpen: v }),
  loginModalOpen: false,
  setLoginModalOpen: (v: boolean) => set({ loginModalOpen: v }),
}));

export { useUI };