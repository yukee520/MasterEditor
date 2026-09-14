import { useQuery } from '@tanstack/react-query';
import { getFileContent } from '../api/contents';

export function useFileContent(
  token: string | null,
  owner: string,
  repo: string,
  path: string,
) {
  return useQuery<{ text: string; sha: string }>({
    queryKey: ['file', token, owner, repo, path],
    queryFn: () => getFileContent(token as string, owner, repo, path),
    enabled: !!token && !!owner && !!repo && !!path,
    staleTime: 0,
  });
}
