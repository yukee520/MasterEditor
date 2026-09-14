import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { putFileContent } from '../api/contents';

type Props = {
  visible: boolean;
  owner: string;
  repo: string;
  currentPath: string; // folder to create in
  onClose: () => void;
  onCreated: () => void;
};

export default function NewFileModal({
  visible,
  owner,
  repo,
  currentPath,
  onClose,
  onCreated,
}: Props) {
  const { token } = useAuthStore();
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  function reset() {
    setFileName('');
    setContent('');
    setCreating(false);
  }

  function handleClose() {
    if (creating) return;
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!token) return;
    const name = fileName.trim();

    if (!name) {
      Alert.alert('Missing name', 'Please enter a file name.');
      return;
    }
    if (name.includes('/') || name.includes('\\')) {
      Alert.alert('Invalid name', 'File name cannot contain slashes.');
      return;
    }
    if (!/^[a-zA-Z0-9_.\-]+$/.test(name)) {
      Alert.alert(
        'Invalid name',
        'Use only letters, numbers, dots, dashes, and underscores.',
      );
      return;
    }

    const fullPath = currentPath ? `${currentPath}/${name}` : name;

    setCreating(true);
    try {
      await putFileContent(
        token,
        owner,
        repo,
        fullPath,
        content,
        `Create ${name} [skip ci]`,
      );
      Alert.alert('Created', `${fullPath} added to repository`);
      reset();
      onCreated();
    } catch (e: any) {
      Alert.alert(
        'Create failed',
        e?.response?.data?.message || e?.message || 'Unknown error',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <TouchableOpacity onPress={handleClose} disabled={creating}>
            <Text
              className={`text-base font-semibold ${
                creating ? 'text-muted' : 'text-primary'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-text">New File</Text>
          <View className="w-16" />
        </View>

        <ScrollView contentContainerClassName="p-5">
          <Text className="text-xs text-muted mb-4">
            Creating in: <Text className="font-mono">{currentPath || '/'}</Text>
          </Text>

          <Text className="text-sm font-semibold text-text mb-2">File name</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-sm mb-5"
            placeholder="myFile.tsx"
            placeholderTextColor="#94A3B8"
            value={fileName}
            onChangeText={setFileName}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating}
          />

          <Text className="text-sm font-semibold text-text mb-2">
            Initial content (optional)
          </Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-xs mb-5"
            placeholder="// your code here"
            placeholderTextColor="#94A3B8"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            editable={!creating}
            style={{ minHeight: 160, textAlignVertical: 'top' }}
          />

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center ${
              creating ? 'bg-muted' : 'bg-primary'
            }`}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create File
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
