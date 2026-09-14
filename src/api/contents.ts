import { createGitHubClient } from './client';
import type { GitHubContent } from '../types/github';

/**
 * Get contents of a path in a repo.
 * - If path is "" or "/", returns root.
 * - If path is a folder, returns array of items.
 * - If path is a file, returns a single object with base64 content.
 */
export async function getContents(
  token: string,
  owner: string,
  repo: string,
  path: string = '',
): Promise<GitHubContent | GitHubContent[]> {
  const client = createGitHubClient(token);
  const url = `/repos/${owner}/${repo}/contents/${path}`;
  const { data } = await client.get<GitHubContent | GitHubContent[]>(url);
  return data;
}
