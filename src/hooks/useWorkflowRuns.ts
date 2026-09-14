import { useQuery } from '@tanstack/react-query';
import { listWorkflowRuns, WorkflowRun } from '../api/workflows';

export function useWorkflowRuns(
  token: string | null,
  owner: string,
  repo: string,
) {
  return useQuery<WorkflowRun[]>({
    queryKey: ['workflowRuns', token, owner, repo],
    queryFn: () => listWorkflowRuns(token as string, owner, repo),
    enabled: !!token && !!owner && !!repo,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
