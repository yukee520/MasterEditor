import { createGitHubClient } from './client';
import { base64Encode } from '../utils/base64';

/**
 * Batch update files in a repo with a single commit using the Git Data API.
 * 
 * Files to delete: pass `content: null`
 * Files to create/update: pass `content: string`
 */
export type FileChange = {
  path: string;
  content: string | null; // null = delete
};

export async function batchCommitFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  changes: FileChange[],
  message: string,
): Promise<{ commitSha: string }> {
  const client = createGitHubClient(token);

  // 1. Get current branch's commit SHA
  const { data: refData } = await client.get(
    `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
  );
  const parentCommitSha: string = refData.object.sha;

  // 2. Get current commit's tree SHA
  const { data: commitData } = await client.get(
    `/repos/${owner}/${repo}/git/commits/${parentCommitSha}`,
  );
  const baseTreeSha: string = commitData.tree.sha;

  // 3. Create blobs for each file (parallel)

  const treeItems = await Promise.all(
    changes.map(async (change) => {
      if (change.content === null) {
        // Delete — use sha: null in tree
        return {
          path: change.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: null,
        };
      }

      // Create blob
      const { data: blob } = await client.post(
        `/repos/${owner}/${repo}/git/blobs`,
        {
          content: base64Encode(change.content),
          encoding: 'base64',
        },
      );

      return {
        path: change.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    }),
  );

  // 4. Create a new tree
  const { data: newTree } = await client.post(
    `/repos/${owner}/${repo}/git/trees`,
    {
      base_tree: baseTreeSha,
      tree: treeItems,
    },
  );

  // 5. Create a new commit
  const { data: newCommit } = await client.post(
    `/repos/${owner}/${repo}/git/commits`,
    {
      message,
      tree: newTree.sha,
      parents: [parentCommitSha],
    },
  );

  // 6. Update the branch to point to the new commit
  await client.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: newCommit.sha,
    force: false,
  });

  return { commitSha: newCommit.sha };
}
