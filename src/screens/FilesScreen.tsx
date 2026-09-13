import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FilesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-text mb-2">Files</Text>
        <Text className="text-base text-muted text-center">
          Select a project to browse its files.
        </Text>
        <Text className="text-xs text-muted text-center mt-4">
          (Coming in Milestone 4)
        </Text>
      </View>
    </SafeAreaView>
  );
}
