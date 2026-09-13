export type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  is_template: boolean;
};

export type GitHubContent = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;   // base64 encoded, only for files
  encoding?: string;  // "base64"
  download_url: string | null;
  html_url: string | null;
};

export type GitHubCommitResponse = {
  content: {
    name: string;
    path: string;
    sha: string;
  };
  commit: {
    sha: string;
    message: string;
  };
};

export type GitHubWorkflowRun = {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_branch: string;
};

export type GitHubWorkflowRunsResponse = {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
};
