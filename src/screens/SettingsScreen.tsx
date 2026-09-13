import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { getCurrentUser } from '../api/github';

export default function SettingsScreen() {
  const { token, user, setToken, clear, setError, error } = useAuthStore();
  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  async function handleSave() {
    const t = inputToken.trim();
    if (!t) {
      Alert.alert('Missing token', 'Please paste your GitHub Personal Access Token.');
      return;
    }
    if (!t.startsWith('ghp_') && !t.startsWith('github_pat_')) {
      Alert.alert('Invalid token', 'Token should start with "ghp_" or "github_pat_".');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser(t);
      await setToken(t, me);
      setInputToken('');
      Alert.alert('Success', `Logged in as ${me.login}`);
    } catch (e: any) {
      const msg =
        e?.response?.status === 401
          ? 'Invalid or expired token'
          : e?.message || 'Failed to connect to GitHub';
      setError(msg);
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Log out?', 'This will remove your token from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clear();
          setInputToken('');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-5">
        <Text className="text-3xl font-bold text-text mb-1">Settings</Text>
        <Text className="text-base text-muted mb-6">
          Connect your GitHub account to manage projects.
        </Text>

        {/* Logged in card */}
        {user && token ? (
          <View className="bg-card rounded-2xl p-5 mb-6 border border-border">
            <View className="flex-row items-center mb-3">
              <Image
                source={{ uri: user.avatar_url }}
                className="w-14 h-14 rounded-full mr-4"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold text-text">
                  {user.name || user.login}
                </Text>
                <Text className="text-sm text-muted">@{user.login}</Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-secondary">
                {user.public_repos} repos
              </Text>
              <Text className="text-xs text-secondary">
                {user.followers} followers
              </Text>
            </View>
            <TouchableOpacity
              className="mt-4 border border-danger rounded-xl py-3 items-center"
              onPress={handleLogout}
            >
              <Text className="text-danger font-semibold">Log out</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Token input */}
        <View className="bg-card rounded-2xl p-5 mb-6 border border-border">
          <Text className="text-base font-semibold text-text mb-3">
            {user ? 'Replace token' : 'GitHub Personal Access Token'}
          </Text>
          <Text className="text-xs text-muted mb-3">
            Create a token at github.com/settings/tokens with scopes: repo, workflow
          </Text>

          <View className="flex-row items-center border border-border rounded-xl mb-4 bg-background">
            <TextInput
              className="flex-1 px-4 py-3 text-text"
              placeholder="ghp_..."
              placeholderTextColor="#94A3B8"
              value={inputToken}
              onChangeText={setInputToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showToken}
            />
            <TouchableOpacity
              className="px-3"
              onPress={() => setShowToken((s) => !s)}
            >
              <Text className="text-primary text-sm font-semibold">
                {showToken ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${
              loading ? 'bg-muted' : 'bg-primary'
            }`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {user ? 'Update token' : 'Save & verify'}
              </Text>
            )}
          </TouchableOpacity>

          {error ? (
            <Text className="text-danger text-sm mt-3">{error}</Text>
          ) : null}
        </View>

        {/* Info */}
        <View className="bg-card rounded-2xl p-5 border border-border">
          <Text className="text-sm font-semibold text-text mb-2">
            🔒 Privacy
          </Text>
          <Text className="text-xs text-muted leading-5">
            Your token is stored locally on this device only. It is never sent
            anywhere except directly to api.github.com.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
