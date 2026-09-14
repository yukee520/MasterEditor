import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/useAuthStore';
import { useRepos } from '../hooks/useRepos';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const {
    data: repos,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRepos(token);

  // Not logged in
  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-xl font-bold text-text mb-2">
            Not connected
          </Text>
          <Text className="text-base text-muted text-center mb-6">
            Connect your GitHub account in Settings to see your projects.
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => navigation.navigate('SettingsTab')}
          >
            <Text className="text-white font-semibold">Go to Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading (first time)
  if (isLoading && !repos) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted mt-4">Loading your projects…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-text mb-2">
            Could not load projects
          </Text>
          <Text className="text-sm text-muted text-center mb-6">
            {(error as any)?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => refetch()}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main list
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-3xl font-bold text-text">Projects</Text>
        <Text className="text-sm text-muted">
          {user?.login} · {repos?.length ?? 0} repositor
          {repos?.length === 1 ? 'y' : 'ies'}
        </Text>
      </View>

      <FlatList
        data={repos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        renderItem={({ item }) => (
          <ProjectCard
            repo={item}
            onPress={() =>
              navigation.navigate('FilesTab', {
                owner: item.owner.login,
                repo: item.name,
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">📦</Text>
            <Text className="text-base text-muted">
              No repositories yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
