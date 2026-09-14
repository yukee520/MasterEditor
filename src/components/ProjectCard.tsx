import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { GitHubRepo } from '../types/github';

type Props = {
  repo: GitHubRepo;
  onPress: () => void;
  onLongPress?: () => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProjectCard({ repo, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      className="bg-card rounded-2xl p-4 mb-3 border border-border"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text
          className="text-base font-bold text-text flex-1"
          numberOfLines={1}
        >
          {repo.name}
        </Text>
        <View
          className={`px-2 py-1 rounded-md ml-2 ${
            repo.private ? 'bg-muted' : 'bg-success/20'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              repo.private ? 'text-white' : 'text-success'
            }`}
          >
            {repo.private ? 'Private' : 'Public'}
          </Text>
        </View>
      </View>

      {repo.description ? (
        <Text className="text-sm text-secondary mb-2" numberOfLines={2}>
          {repo.description}
        </Text>
      ) : (
        <Text className="text-sm text-muted italic mb-2">
          No description
        </Text>
      )}

      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row items-center">
          {repo.language ? (
            <>
              <View className="w-3 h-3 rounded-full bg-primary mr-1" />
              <Text className="text-xs text-muted mr-3">
                {repo.language}
              </Text>
            </>
          ) : null}
        </View>
        <Text className="text-xs text-muted">
          Updated {timeAgo(repo.pushed_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
