import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../store/useAuthStore';
import { useFileContent } from '../hooks/useFileContent';
import { putFileContent, deleteFile } from '../api/contents';

type RouteParams = {
  owner?: string;
  repo?: string;
  path?: string;
  name?: string;
  sha?: string;
};

export default function EditorScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const params: RouteParams = route.params || {};
  const { owner, repo, path, name } = params;

  const {
    data: fileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFileContent(token, owner ?? '', repo ?? '', path ?? '');

  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load file content into state once fetched
  useEffect(() => {
    if (fileData) {
      setText(fileData.text);
      setOriginalText(fileData.text);
    }
  }, [fileData]);

  const isDirty = text !== originalText;

  async function handleSave() {
    if (!token || !owner || !repo || !path) return;
    if (!fileData?.sha) {
      Alert.alert('Error', 'Missing file SHA. Reload and try again.');
      return;
    }

    setSaving(true);
    try {
      const commitMessage = `Update ${name || path}`;
      await putFileContent(
        token,
        owner,
        repo,
        path,
        text,
        commitMessage,
        fileData.sha,
      );
      setOriginalText(text);

      // Invalidate file + contents cache so fresh data loads
      await queryClient.invalidateQueries({
        queryKey: ['file', token, owner, repo, path],
      });
      await queryClient.invalidateQueries({
        queryKey: ['contents'],
      });

      Alert.alert('Saved', `Committed to ${owner}/${repo}`);
      await refetch();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!token || !owner || !repo || !path || !fileData?.sha) return;
    Alert.alert(
      'Delete file?',
      `This will permanently remove ${path} from ${owner}/${repo}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteFile(
                token,
                owner,
                repo,
                path,
                fileData.sha,
                `Delete ${name || path}`,
              );
              await queryClient.invalidateQueries({
                queryKey: ['contents'],
              });
              Alert.alert('Deleted', 'File removed from GitHub');
              // Go back to Files tab
              navigation.navigate('FilesTab');
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || 'Unknown error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  // No file selected
  if (!owner || !repo || !path) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">📝</Text>
          <Text className="text-xl font-bold text-text mb-2">
            No file open
          </Text>
          <Text className="text-base text-muted text-center mb-6">
            Pick a file from the Files tab to view or edit it.
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => navigation.navigate('FilesTab')}
          >
            <Text className="text-white font-semibold">Go to Files</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (isLoading && !fileData) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted mt-4">Loading file…</Text>
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
            Could not load file
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-border">
          <Text className="text-lg font-bold text-text" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {owner}/{repo}/{path}
          </Text>
        </View>

        {/* Editor */}
        <ScrollView className="flex-1 bg-card" contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            className="flex-1 p-4 text-text font-mono text-sm"
            multiline
            value={text}
            onChangeText={setText}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={{ minHeight: 400 }}
          />
        </ScrollView>

        {/* Actions */}
        <View className="flex-row p-4 border-t border-border bg-background">
          <TouchableOpacity
            className="flex-1 bg-danger/10 border border-danger rounded-xl py-3 items-center mr-2"
            onPress={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text className="text-danger font-semibold">Delete</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-xl py-3 items-center ml-2 ${
              isDirty && !saving ? 'bg-primary' : 'bg-muted'
            }`}
            onPress={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">
                {isDirty ? 'Save & Commit' : 'No changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
