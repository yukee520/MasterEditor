import { createGitHubClient } from './client';
import { base64Decode, base64Encode } from '../utils/base64';
import type { GitHubContent } from '../types/github';

/**
 * Get contents of a path in a repo.
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

/**
 * Get single file's content as decoded UTF-8 string.
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
): Promise<{ text: string; sha: string }> {
  const client = createGitHubClient(token);
  const url = `/repos/${owner}/${repo}/contents/${path}`;
  const { data } = await client.get<GitHubContent>(url);

  if (Array.isArray(data)) {
    throw new Error('Path is a directory, not a file');
  }
  if (!data.content || data.encoding !== 'base64') {
    if (data.size > 1024 * 1024) {
      throw new Error(`File is too large to edit (${(data.size / 1024 / 1024).toFixed(1)} MB). GitHub only returns content for files under 1 MB.`);
    }
    throw new Error('File content not available yet. Try again in a few seconds or pull to refresh.');
  }

  const text = base64Decode(data.content);
  return { text, sha: data.sha };
}

/**
 * Create or update a file.
 * If `sha` is provided, updates. Otherwise creates.
 */
export async function putFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  text: string,
  message: string,
  sha?: string,
): Promise<void> {
  const client = createGitHubClient(token);
  const url = `/repos/${owner}/${repo}/contents/${path}`;
  const body: Record<string, any> = {
    message,
    content: base64Encode(text),
  };
  if (sha) body.sha = sha;
  await client.put(url, body);
}

/**
 * Delete a file.
 */
export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string,
): Promise<void> {
  const client = createGitHubClient(token);
  const url = `/repos/${owner}/${repo}/contents/${path}`;
  await client.delete(url, {
    data: { message, sha },
  });
}
