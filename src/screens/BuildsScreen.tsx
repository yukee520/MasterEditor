import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/useAuthStore';
import { useWorkflowRuns } from '../hooks/useWorkflowRuns';
import RNFS from 'react-native-fs';
import { listRunArtifacts, triggerWorkflow, WorkflowRun } from '../api/workflows';

type RouteParams = {
  owner?: string;
  repo?: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusBadge(run: WorkflowRun) {
  if (run.status === 'in_progress') {
    return { text: 'Running', color: '#2563EB', bg: '#DBEAFE' };
  }
  if (run.status === 'queued') {
    return { text: 'Queued', color: '#64748B', bg: '#E2E8F0' };
  }
  if (run.conclusion === 'success') {
    return { text: 'Success', color: '#10B981', bg: '#D1FAE5' };
  }
  if (run.conclusion === 'failure') {
    return { text: 'Failed', color: '#EF4444', bg: '#FEE2E2' };
  }
  if (run.conclusion === 'cancelled') {
    return { text: 'Cancelled', color: '#64748B', bg: '#E2E8F0' };
  }
  return { text: run.conclusion || run.status, color: '#64748B', bg: '#E2E8F0' };
}

export default function BuildsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();

  const params: RouteParams = route.params || {};
  const owner = params.owner;
  const repo = params.repo;

  const { data: runs, isLoading, isError, error, refetch, isRefetching } =
    useWorkflowRuns(token, owner ?? '', repo ?? '');

  const [downloading, setDownloading] = useState<number | null>(null);
  const [building, setBuilding] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function handleBuildNow() {
    if (!token || !owner || !repo) return;
    Alert.alert(
      'Trigger build?',
      `This will run the GitHub Actions workflow for ${owner}/${repo}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Build now',
          onPress: async () => {
            setBuilding(true);
            try {
              await triggerWorkflow(token, owner, repo, 'build-apk.yml', 'main');
              Alert.alert('Build queued', 'Refresh in ~30s to see it.');
              setTimeout(() => refetch(), 3000);
            } catch (e: any) {
              Alert.alert(
                'Build failed',
                e?.response?.data?.message || e?.message || 'Unknown error',
              );
            } finally {
              setBuilding(false);
            }
          },
        },
      ],
    );
  }

  async function handleDownloadApk(run: WorkflowRun) {
    if (!token || !owner || !repo) return;
    setDownloading(run.id);
    setDownloadProgress(0);
    try {
      const artifacts = await listRunArtifacts(token, owner, repo, run.id);
      const apkArtifact = artifacts.find((a) => !a.expired);
      if (!apkArtifact) {
        Alert.alert('No APK', 'No artifacts found for this run.');
        return;
      }

      const sizeMB = (apkArtifact.size_in_bytes / 1024 / 1024).toFixed(1);
      const confirm = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Download APK?',
          apkArtifact.name + ' (' + sizeMB + ' MB)\n\nSaved to app folder. Extract the zip to get the APK.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Download', onPress: () => resolve(true) },
          ],
        );
      });
      if (!confirm) return;

      const downloadUrl =
        'https://api.github.com/repos/' +
        owner +
        '/' +
        repo +
        '/actions/artifacts/' +
        apkArtifact.id +
        '/zip';

      const destDir = RNFS.DocumentDirectoryPath + '/apks';
      const destPath = destDir + '/' + repo + '-run' + run.run_number + '.zip';

      const dirExists = await RNFS.exists(destDir);
      if (!dirExists) await RNFS.mkdir(destDir);

      const result = await RNFS.downloadFile({
        toFile: destPath,
        fromUrl: downloadUrl,
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
        },
        progress: (res) => {
          const pct = res.bytesWritten / res.contentLength;
          setDownloadProgress(isFinite(pct) ? pct : 0);
        },
        progressDivider: 5,
      }).promise;

      if (result.statusCode === 200) {
        Alert.alert(
          'Downloaded',
          'Saved to:\n' + destPath + '\n\nExtract the zip to install the APK.',
        );
      } else {
        Alert.alert('Download failed', 'HTTP ' + result.statusCode);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error');
    } finally {
      setDownloading(null);
      setDownloadProgress(0);
    }
  }

  if (!owner || !repo) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🏗️</Text>
          <Text className="text-xl font-bold text-text mb-2">No project selected</Text>
          <Text className="text-base text-muted text-center mb-6">
            Pick a project from the Projects tab to see its builds.
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

  if (isLoading && !runs) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted mt-4">Loading builds…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-text mb-2">Could not load builds</Text>
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
      <View className="px-5 pt-4 pb-3 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-text">Builds</Text>
            <Text className="text-sm text-muted">{owner}/{repo}</Text>
          </View>
          <TouchableOpacity
            className={`px-4 py-2 rounded-xl ml-2 ${
              building ? 'bg-muted' : 'bg-primary'
            }`}
            onPress={handleBuildNow}
            disabled={building}
          >
            {building ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-sm">🚀 Build</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
        renderItem={({ item }) => {
          const badge = statusBadge(item);
          return (
            <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-bold text-text flex-1" numberOfLines={1}>
                  #{item.run_number} · {item.name}
                </Text>
                <View
                  className="px-2 py-1 rounded-md ml-2"
                  style={{ backgroundColor: badge.bg }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: badge.color }}
                  >
                    {badge.text}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted mb-3">
                {item.head_branch} · {timeAgo(item.created_at)}
              </Text>

              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 border border-primary rounded-xl py-2 items-center mr-2"
                  onPress={() => Linking.openURL(item.html_url)}
                >
                  <Text className="text-primary font-semibold text-sm">View logs</Text>
                </TouchableOpacity>
                {item.conclusion === 'success' ? (
                  <TouchableOpacity
                    className={`flex-1 rounded-xl py-2 items-center ml-2 ${
                      downloading === item.id ? 'bg-muted' : 'bg-primary'
                    }`}
                    onPress={() => handleDownloadApk(item)}
                    disabled={downloading === item.id}
                  >
                    {downloading === item.id ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold text-xs ml-2">
                          {Math.round(downloadProgress * 100)}%
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-sm">
                        Download APK
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">🎉</Text>
            <Text className="text-base text-muted">No builds yet.</Text>
            <Text className="text-xs text-muted mt-2 text-center">
              Push a commit to trigger the workflow.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
