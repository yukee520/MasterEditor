import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Wraps children and applies the `dark` class to the root view
 * so NativeWind's dark: variants work.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, load } = useThemeStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View className={mode === 'dark' ? 'dark flex-1' : 'flex-1'}>
      {children}
    </View>
  );
}
