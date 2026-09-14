import { useQuery } from '@tanstack/react-query';
import { listUserRepos } from '../api/github';
import type { GitHubRepo } from '../types/github';

export function useRepos(token: string | null) {
  return useQuery<GitHubRepo[]>({
    queryKey: ['repos', token],
    queryFn: () => listUserRepos(token as string),
    enabled: !!token,
    staleTime: 60_000,
    retry: 1,
  });
}
