import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { GitHubContent } from '../types/github';

type Props = {
  item: GitHubContent;
  onPress: () => void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(name: string, type: GitHubContent['type']): string {
  if (type === 'dir') return '📁';
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return '🟦';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟨';
  if (name.endsWith('.json')) return '🟫';
  if (name.endsWith('.md')) return '📘';
  if (name.endsWith('.gradle') || name.endsWith('.properties')) return '⚙️';
  if (name.endsWith('.kt') || name.endsWith('.java')) return '☕';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return '🖼️';
  if (name.startsWith('.')) return '🔧';
  return '📄';
}

export default function FileRow({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-4 bg-card rounded-xl mb-2 border border-border"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-2xl mr-3">{iconFor(item.name, item.type)}</Text>
      <View className="flex-1">
        <Text className="text-base font-medium text-text" numberOfLines={1}>
          {item.name}
        </Text>
        {item.type === 'file' ? (
          <Text className="text-xs text-muted mt-0.5">
            {formatSize(item.size)}
          </Text>
        ) : null}
      </View>
      {item.type === 'dir' ? (
        <Text className="text-muted text-lg">›</Text>
      ) : null}
    </TouchableOpacity>
  );
}
