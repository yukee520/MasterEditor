import { useQuery } from '@tanstack/react-query';
import { listTemplateRepos } from '../api/github';
import type { GitHubRepo } from '../types/github';

export function useTemplateRepos(token: string | null) {
  return useQuery<GitHubRepo[]>({
    queryKey: ['templateRepos', token],
    queryFn: () => listTemplateRepos(token as string),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
