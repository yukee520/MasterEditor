import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@master_editor:theme';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  isLoading: boolean;
  load: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isLoading: true,

  load: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        set({ mode: saved, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setMode: async (mode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    set({ mode });
  },

  toggle: async () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },
}));
