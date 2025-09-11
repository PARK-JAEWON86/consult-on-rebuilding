import { create } from 'zustand';

export type RoleView = 'user' | 'expert';

interface RoleState {
  roleView: RoleView;
  setRoleView: (view: RoleView) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  roleView: 'user',
  setRoleView: (view) => set({ roleView: view }),
}));
