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
  const [folderPath, setFolderPath] = useState(currentPath);
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  // Update folder path when modal is opened with a new currentPath
  React.useEffect(() => {
    if (visible) {
      setFolderPath(currentPath);
    }
  }, [visible, currentPath]);

  function reset() {
    setFileName('');
    setContent('');
    setCreating(false);
    setFolderPath(currentPath);
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

    const cleanFolder = folderPath.trim().replace(/^\/+|\/+$/g, '');
    const fullPath = cleanFolder ? `${cleanFolder}/${name}` : name;

    setCreating(true);
    try {
      console.log('[NewFile] Creating:', fullPath);
      console.log('[NewFile] Owner:', owner, 'Repo:', repo);

      const response = await putFileContent(
        token,
        owner,
        repo,
        fullPath,
        content,
        `Create ${name} [skip ci]`,
      );

      console.log('[NewFile] Success:', response);

      // Give GitHub a moment to index
      await new Promise((r) => setTimeout(r, 1500));

      setCreating(false);
      reset();
      Alert.alert(
        'Created',
        `${fullPath} added to repository`,
        [{ text: 'OK', onPress: () => { onClose(); onCreated(); } }],
      );
    } catch (e: any) {
      console.log('[NewFile] Error:', e?.response?.status, e?.response?.data, e?.message);
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message;
      let msg = apiMsg || e?.message || 'Unknown error';
      if (status === 404) {
        msg = `Repo ${owner}/${repo} not found OR path doesn't exist.`;
      } else if (status === 403) {
        msg = 'Token missing permissions (need repo scope).';
      } else if (status === 422) {
        msg = `Invalid request: ${apiMsg || 'check file name/path'}`;
      }
      Alert.alert('Create failed', `[${status || 'network'}] ${msg}`);
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
          <Text className="text-sm font-semibold text-text mb-2">Folder</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-xs mb-5"
            placeholder="(root)"
            placeholderTextColor="#94A3B8"
            value={folderPath}
            onChangeText={setFolderPath}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating}
          />

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
