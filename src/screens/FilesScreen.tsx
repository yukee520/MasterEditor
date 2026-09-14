import React, { useState, useCallback } from 'react';
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
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '../store/useAuthStore';
import { useRepoContents } from '../hooks/useRepoContents';
import FileRow from '../components/FileRow';
import type { GitHubContent } from '../types/github';

type RouteParams = {
  owner?: string;
  repo?: string;
};

export default function FilesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();

  const params: RouteParams = route.params || {};
  const owner = params.owner;
  const repo = params.repo;

  const [currentPath, setCurrentPath] = useState('');

  const {
    data: contents,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRepoContents(token, owner ?? '', repo ?? '', currentPath);

  // Refetch when this screen gains focus (e.g., coming back from editor)
  useFocusEffect(
    useCallback(() => {
      if (owner && repo) {
        refetch();
      }
    }, [owner, repo, refetch]),
  );

  const handleBack = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  }, [currentPath]);

  const handleItemPress = useCallback(
    (item: GitHubContent) => {
      if (item.type === 'dir') {
        setCurrentPath(item.path);
      } else if (item.type === 'file') {
        navigation.navigate('EditorTab', {
          owner,
          repo,
          path: item.path,
          name: item.name,
          sha: item.sha,
        });
      }
    },
    [navigation, owner, repo],
  );

  // No project selected
  if (!owner || !repo) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">📂</Text>
          <Text className="text-xl font-bold text-text mb-2">
            No project selected
          </Text>
          <Text className="text-base text-muted text-center mb-6">
            Choose a project from the Projects tab to browse its files.
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => navigation.navigate('ProjectsTab')}
          >
            <Text className="text-white font-semibold">Go to Projects</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading first time
  if (isLoading && !contents) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted mt-4">Loading files…</Text>
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
            Could not load files
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-border">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className="text-2xl font-bold text-text flex-1"
            numberOfLines={1}
          >
            {repo}
          </Text>
        </View>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {owner} / {repo}
          {currentPath ? ` / ${currentPath}` : ''}
        </Text>

        {/* Breadcrumb / back button */}
        {currentPath ? (
          <TouchableOpacity
            className="mt-3 flex-row items-center"
            onPress={handleBack}
          >
            <Text className="text-primary font-semibold">
              ← Back to parent
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* File list */}
      <FlatList
        data={contents}
        keyExtractor={(item) => item.sha + item.path}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <FileRow item={item} onPress={() => handleItemPress(item)} />
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
            <Text className="text-4xl mb-3">📭</Text>
            <Text className="text-base text-muted">
              This folder is empty.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
