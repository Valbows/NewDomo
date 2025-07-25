import { create } from 'zustand';

export interface UserState {
  user: {
    id: string;
    email: string;
    isAuthenticated: boolean;
  } | null;
  setUser: (user: UserState['user']) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
