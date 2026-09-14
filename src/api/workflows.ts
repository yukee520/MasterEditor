import { createGitHubClient } from './client';

export type WorkflowRun = {
  id: number;
  name: string;
  head_branch: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
  event: string;
  workflow_id: number;
};

export type WorkflowRunsResponse = {
  total_count: number;
  workflow_runs: WorkflowRun[];
};

export type Artifact = {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  expires_at: string;
  workflow_run: {
    id: number;
    head_branch: string;
  };
};

export type ArtifactsResponse = {
  total_count: number;
  artifacts: Artifact[];
};

export async function listWorkflowRuns(
  token: string,
  owner: string,
  repo: string,
  perPage = 30,
): Promise<WorkflowRun[]> {
  const client = createGitHubClient(token);
  const { data } = await client.get<WorkflowRunsResponse>(
    `/repos/${owner}/${repo}/actions/runs`,
    { params: { per_page: perPage } },
  );
  return data.workflow_runs;
}

export async function listRunArtifacts(
  token: string,
  owner: string,
  repo: string,
  runId: number,
): Promise<Artifact[]> {
  const client = createGitHubClient(token);
  const { data } = await client.get<ArtifactsResponse>(
    `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,
  );
  return data.artifacts;
}

export async function triggerWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowFileOrId: string,
  branch = 'main',
): Promise<void> {
  const client = createGitHubClient(token);
  await client.post(
    `/repos/${owner}/${repo}/actions/workflows/${workflowFileOrId}/dispatches`,
    { ref: branch },
  );
}
