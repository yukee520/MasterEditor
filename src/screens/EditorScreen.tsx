import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

export default function EditorScreen() {
  const route = useRoute<any>();
  const { name, path, owner, repo } = route.params || {};

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-text mb-2">
          {name || 'Editor'}
        </Text>
        <Text className="text-xs text-muted mb-4 text-center">
          {owner}/{repo}
          {'\n'}
          {path}
        </Text>
        <Text className="text-base text-muted text-center">
          Editor coming in Milestone 4B
        </Text>
      </View>
    </SafeAreaView>
  );
}
