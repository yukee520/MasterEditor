import { useQuery } from '@tanstack/react-query';
import { getContents } from '../api/contents';
import type { GitHubContent } from '../types/github';

export function useRepoContents(
  token: string | null,
  owner: string,
  repo: string,
  path: string,
) {
  return useQuery<GitHubContent[]>({
    queryKey: ['contents', token, owner, repo, path],
    queryFn: async () => {
      const data = await getContents(token as string, owner, repo, path);
      // If API returned an array (folder), use it. If a single file, wrap.
      if (Array.isArray(data)) {
        // Sort: folders first, then files, alphabetical
        return [...data].sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });
      }
      return [data];
    },
    enabled: !!token && !!owner && !!repo,
    staleTime: 30_000,
  });
}
