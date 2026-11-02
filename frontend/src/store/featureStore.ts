// Feature flags store (Zustand)
import create from 'zustand';
import { persist } from 'zustand/middleware';

type FeatureState = {
  isTriajeEnabled: boolean;
  setTriajeEnabled: (enabled: boolean) => void;
};

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      isTriajeEnabled: true, // default enabled
      setTriajeEnabled: (enabled: boolean) => set({ isTriajeEnabled: enabled }),
    }),
    {
      name: 'feature-storage', // localStorage key
    },
  ),
);

