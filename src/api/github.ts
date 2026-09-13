import { createGitHubClient } from './client';
import type { GitHubUser, GitHubRepo } from '../types/github';

export async function getCurrentUser(token: string): Promise<GitHubUser> {
  const client = createGitHubClient(token);
  const { data } = await client.get<GitHubUser>('/user');
  return data;
}

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const client = createGitHubClient(token);
  const { data } = await client.get<GitHubRepo[]>('/user/repos', {
    params: {
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner,collaborator',
    },
  });
  return data;
}

export async function getRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  const client = createGitHubClient(token);
  const { data } = await client.get<GitHubRepo>(`/repos/${owner}/${repo}`);
  return data;
}
