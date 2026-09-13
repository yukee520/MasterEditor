import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-text mb-2">Projects</Text>
        <Text className="text-base text-muted text-center">
          Your GitHub repositories will appear here.
        </Text>
        <Text className="text-xs text-muted text-center mt-4">
          (Coming in Milestone 3)
        </Text>
      </View>
    </SafeAreaView>
  );
}
