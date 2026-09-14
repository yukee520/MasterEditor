import React, { useState, useEffect } from 'react';
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
import { useTemplateRepos } from '../hooks/useTemplateRepos';
import {
  createProjectFromTemplate,
  CreateProjectResult,
} from '../api/templates';
import type { GitHubRepo } from '../types/github';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: CreateProjectResult) => void;
};

export default function CreateProjectModal({ visible, onClose, onSuccess }: Props) {
  const { token, user } = useAuthStore();
  const { data: templateRepos, isLoading: loadingTemplates } = useTemplateRepos(token);

  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState('');

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<GitHubRepo | null>(null);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customOwner, setCustomOwner] = useState('yukee520');
  const [customRepo, setCustomRepo] = useState('rn-blank-template');

  // Auto-select first template when list loads
  useEffect(() => {
    if (templateRepos && templateRepos.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templateRepos[0]);
    }
  }, [templateRepos, selectedTemplate]);

  function reset() {
    setAppName('');
    setPackageName('');
    setDescription('');
    setIsPrivate(false);
    setProgress('');
    setUseCustomTemplate(false);
  }

  function handleClose() {
    if (creating) return;
    reset();
    onClose();
  }

  function autoPackageFromName(name: string) {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return clean ? `com.${user?.login || 'user'}.${clean}` : '';
  }

  function getTemplateOwner(): string {
    return useCustomTemplate ? customOwner : (selectedTemplate?.owner.login ?? '');
  }

  function getTemplateRepo(): string {
    return useCustomTemplate ? customRepo : (selectedTemplate?.name ?? '');
  }

  async function handleCreate() {
    if (!token || !user) {
      Alert.alert('Not logged in');
      return;
    }
    const trimmedName = appName.trim();
    const trimmedPackage = packageName.trim();
    const tmplOwner = getTemplateOwner().trim();
    const tmplRepo = getTemplateRepo().trim();

    if (!tmplOwner || !tmplRepo) {
      Alert.alert('Missing template', 'Please select or enter a template repository.');
      return;
    }
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a project name.');
      return;
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmedName)) {
      Alert.alert('Invalid name', 'Use letters, numbers, dashes or underscores. Must start with a letter.');
      return;
    }
    if (!trimmedPackage) {
      Alert.alert('Missing package', 'Please enter a package name.');
      return;
    }
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(trimmedPackage)) {
      Alert.alert('Invalid package', 'Format: com.yourname.appname (lowercase, dotted)');
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
          templateOwner: tmplOwner,
          templateRepo: tmplRepo,
          newPackageName: trimmedPackage,
        },
        (msg) => setProgress(msg),
      );

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
          {/* ============ TEMPLATE SECTION ============ */}
          <Text className="text-base font-bold text-text mb-3">📋 Template</Text>

          {loadingTemplates ? (
            <View className="bg-card border border-border rounded-xl p-4 mb-4 flex-row items-center">
              <ActivityIndicator color="#2563EB" />
              <Text className="ml-3 text-sm text-muted">Loading your templates…</Text>
            </View>
          ) : (
            <>
              {/* Existing template repos */}
              {templateRepos && templateRepos.length > 0 ? (
                <View className="mb-4">
                  {templateRepos.map((repo) => {
                    const active = !useCustomTemplate && selectedTemplate?.id === repo.id;
                    return (
                      <TouchableOpacity
                        key={repo.id}
                        className={`flex-row items-center p-3 mb-2 rounded-xl border ${
                          active ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                        }`}
                        onPress={() => {
                          setSelectedTemplate(repo);
                          setUseCustomTemplate(false);
                        }}
                        disabled={creating}
                      >
                        <View
                          className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                            active ? 'border-primary' : 'border-border'
                          }`}
                        >
                          {active ? <View className="w-2.5 h-2.5 bg-primary rounded-full" /> : null}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-text">
                            {repo.name}
                          </Text>
                          <Text className="text-xs text-muted" numberOfLines={1}>
                            {repo.full_name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-xs text-muted mb-4">
                  No template repos found. Mark a repo as template on GitHub, or use a custom one below.
                </Text>
              )}

              {/* Custom template toggle */}
              <TouchableOpacity
                className={`flex-row items-center p-3 mb-3 rounded-xl border ${
                  useCustomTemplate ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                }`}
                onPress={() => setUseCustomTemplate((v) => !v)}
                disabled={creating}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    useCustomTemplate ? 'border-primary' : 'border-border'
                  }`}
                >
                  {useCustomTemplate ? (
                    <View className="w-2.5 h-2.5 bg-primary rounded-full" />
                  ) : null}
                </View>
                <Text className="text-sm font-semibold text-text">
                  Custom template
                </Text>
              </TouchableOpacity>

              {/* Custom owner/repo inputs */}
              {useCustomTemplate ? (
                <View className="mb-5">
                  <Text className="text-xs text-muted mb-1">Owner</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-sm mb-3"
                    placeholder="yukee520"
                    placeholderTextColor="#94A3B8"
                    value={customOwner}
                    onChangeText={setCustomOwner}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!creating}
                  />
                  <Text className="text-xs text-muted mb-1">Repo name</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-text font-mono text-sm"
                    placeholder="rn-blank-template"
                    placeholderTextColor="#94A3B8"
                    value={customRepo}
                    onChangeText={setCustomRepo}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!creating}
                  />
                </View>
              ) : null}
            </>
          )}

          {/* ============ PROJECT DETAILS ============ */}
          <Text className="text-base font-bold text-text mb-3 mt-2">📱 New Project</Text>

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

          <View className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-6">
            <Text className="text-sm font-semibold text-text">Private repo</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              disabled={creating}
            />
          </View>

          {creating ? (
            <View className="bg-card border border-border rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <ActivityIndicator color="#2563EB" />
                <Text className="ml-3 text-sm font-semibold text-text">Creating…</Text>
              </View>
              <Text className="text-xs text-muted">{progress}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-8 ${creating ? 'bg-muted' : 'bg-primary'}`}
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
