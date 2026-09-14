import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/useAuthStore';
import { useRepos } from '../hooks/useRepos';
import { deleteRepo } from '../api/github';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';

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
  const [showCreate, setShowCreate] = useState(false);

  function handleLongPress(item: any) {
    Alert.alert(
      item.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete project',
          style: 'destructive',
          onPress: () => confirmDelete(item),
        },
      ],
      { cancelable: true },
    );
  }

  function confirmDelete(item: any) {
    Alert.alert(
      'Delete repository?',
      `This will permanently delete ${item.full_name} from GitHub. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteRepo(token, item.owner.login, item.name);
              Alert.alert('Deleted', `${item.name} removed from GitHub`);
              refetch();
            } catch (e: any) {
              Alert.alert(
                'Delete failed',
                e?.response?.data?.message || e?.message || 'Unknown error',
              );
            }
          },
        },
      ],
    );
  }

  // Not logged in
  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-bg">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-xl font-bold text-text dark:text-dark-text mb-2">
            Not connected
          </Text>
          <Text className="text-base text-muted dark:text-dark-muted text-center mb-6">
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
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-bg">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted dark:text-dark-muted mt-4">Loading your projects…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-bg">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-text dark:text-dark-text mb-2">
            Could not load projects
          </Text>
          <Text className="text-sm text-muted dark:text-dark-muted text-center mb-6">
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
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-bg">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-text dark:text-dark-text">Projects</Text>
          <Text className="text-sm text-muted dark:text-dark-muted">
            {user?.login} · {repos?.length ?? 0} repositor
            {repos?.length === 1 ? 'y' : 'ies'}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary w-12 h-12 rounded-full items-center justify-center"
          onPress={() => setShowCreate(true)}
        >
          <Text className="text-white text-3xl font-light" style={{ marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={repos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        renderItem={({ item }) => (
          <ProjectCard
            repo={item}
            onPress={() => {
              navigation.navigate('FilesTab', {
                owner: item.owner.login,
                repo: item.name,
              });
              navigation.navigate('BuildsTab', {
                owner: item.owner.login,
                repo: item.name,
              });
            }}
            onLongPress={() => handleLongPress(item)}
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
            <Text className="text-base text-muted dark:text-dark-muted">
              No repositories yet.
            </Text>
          </View>
        }
      />

      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </SafeAreaView>
  );
}
