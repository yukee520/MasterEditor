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
  Switch,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import {
  createProjectFromTemplate,
  CreateProjectResult,
} from '../api/templates';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: CreateProjectResult) => void;
};

export default function CreateProjectModal({ visible, onClose, onSuccess }: Props) {
  const { token, user } = useAuthStore();

  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState('');

  function reset() {
    setAppName('');
    setPackageName('');
    setDescription('');
    setIsPrivate(false);
    setProgress('');
  }

  function handleClose() {
    if (creating) return;
    reset();
    onClose();
  }

  function autoPackageFromName(name: string) {
    // MyToDoApp → com.yourname.mytoDoApp
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return clean ? `com.${user?.login || 'user'}.${clean}` : '';
  }

  async function handleCreate() {
    if (!token || !user) {
      Alert.alert('Not logged in');
      return;
    }
    const trimmedName = appName.trim();
    const trimmedPackage = packageName.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a project name.');
      return;
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmedName)) {
      Alert.alert(
        'Invalid name',
        'Use letters, numbers, dashes or underscores. Must start with a letter.',
      );
      return;
    }
    if (!trimmedPackage) {
      Alert.alert('Missing package', 'Please enter a package name.');
      return;
    }
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(trimmedPackage)) {
      Alert.alert(
        'Invalid package',
        'Format: com.yourname.appname (lowercase, dotted)',
      );
      return;
    }

    setCreating(true);
    setProgress('Starting…');

    try {
      const result = await createProjectFromTemplate(
        {
          token,
          owner: user.login,
          repoName: trimmedName,
          description,
          isPrivate,
          templateOwner: 'yukee520',
          templateRepo: 'rn-blank-template',
          newPackageName: trimmedPackage,
        },
        (msg) => setProgress(msg),
      );

      // Show result
      if (result.errors.length > 0) {
        Alert.alert(
          'Created with warnings',
          `Repo: ${result.repoName}\n\nRenamed: ${result.renamedFiles.length} files\n\nErrors:\n${result.errors.join('\n')}`,
          [{ text: 'OK', onPress: () => { onSuccess(result); handleClose(); } }],
        );
      } else {
        Alert.alert(
          'Project created!',
          `${result.repoName} is ready. GitHub Actions will build the APK in ~10 minutes.`,
          [{ text: 'Great', onPress: () => { onSuccess(result); handleClose(); } }],
        );
      }
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.message || e?.message || 'Unknown error');
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
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <TouchableOpacity onPress={handleClose} disabled={creating}>
            <Text className={`text-base font-semibold ${creating ? 'text-muted' : 'text-primary'}`}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-text">New Project</Text>
          <View className="w-16" />
        </View>

        <ScrollView contentContainerClassName="p-5">
          <Text className="text-xs text-muted mb-6">
            Creates a new GitHub repo from <Text className="font-mono">yukee520/rn-blank-template</Text>, then renames the package + app name automatically.
          </Text>

          {/* App name */}
          <Text className="text-sm font-semibold text-text mb-2">Project name</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text mb-5"
            placeholder="MyToDoApp"
            placeholderTextColor="#94A3B8"
            value={appName}
            onChangeText={(v) => {
              setAppName(v);
              if (!packageName || packageName === autoPackageFromName(appName)) {
                setPackageName(autoPackageFromName(v));
              }
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!creating}
          />

          {/* Package */}
          <Text className="text-sm font-semibold text-text mb-2">Package ID</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-sm mb-5"
            placeholder="com.yourname.appname"
            placeholderTextColor="#94A3B8"
            value={packageName}
            onChangeText={setPackageName}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating}
          />

          {/* Description */}
          <Text className="text-sm font-semibold text-text mb-2">Description (optional)</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-text mb-5"
            placeholder="A brief description"
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            editable={!creating}
            multiline
          />

          {/* Private toggle */}
          <View className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-6">
            <Text className="text-sm font-semibold text-text">Private repo</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              disabled={creating}
            />
          </View>

          {/* Progress */}
          {creating ? (
            <View className="bg-card border border-border rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <ActivityIndicator color="#2563EB" />
                <Text className="ml-3 text-sm font-semibold text-text">Creating…</Text>
              </View>
              <Text className="text-xs text-muted">{progress}</Text>
            </View>
          ) : null}

          {/* Create button */}
          <TouchableOpacity
            className={`py-4 rounded-2xl items-center ${creating ? 'bg-muted' : 'bg-primary'}`}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create Project
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
