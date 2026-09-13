import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GitHubUser } from '../types/github';

const PAT_KEY = '@master_editor:github_pat';
const USER_KEY = '@master_editor:github_user';

type AuthState = {
  token: string | null;
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFromStorage: () => Promise<void>;
  setToken: (token: string, user: GitHubUser) => Promise<void>;
  clear: () => Promise<void>;
  setError: (error: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  error: null,

  loadFromStorage: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(PAT_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      const user = userJson ? (JSON.parse(userJson) as GitHubUser) : null;
      set({ token, user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setToken: async (token, user) => {
    await AsyncStorage.multiSet([
      [PAT_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
    set({ token, user, error: null });
  },

  clear: async () => {
    await AsyncStorage.multiRemove([PAT_KEY, USER_KEY]);
    set({ token: null, user: null, error: null });
  },

  setError: (error) => set({ error }),
}));
