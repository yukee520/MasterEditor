import { createGitHubClient } from './client';
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
    throw new Error('File has no base64 content');
  }

  // GitHub returns base64 with line breaks — decode to UTF-8
  const cleanBase64 = data.content.replace(/\n/g, '');
  const text = decodeBase64Utf8(cleanBase64);
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
    content: encodeBase64Utf8(text),
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

// ---- Base64 helpers (handle UTF-8 correctly) ----

function decodeBase64Utf8(b64: string): string {
  const binary = global.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return global.btoa(binary);
}
