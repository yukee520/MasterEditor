import React, { useEffect } from 'react';
import { View } from 'react-native';
import { colorScheme } from 'nativewind';
import { useThemeStore } from '../store/useThemeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, load } = useThemeStore();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    colorScheme.set(mode);
  }, [mode]);

  return <View className="flex-1">{children}</View>;
}
