import { createGitHubClient } from './client';
import { getContents } from './contents';
import { batchCommitFiles, FileChange } from './gitTree';
import { base64Decode } from '../utils/base64';
import type { GitHubContent } from '../types/github';

export type CreateProjectOptions = {
  token: string;
  owner: string;
  repoName: string;
  description?: string;
  isPrivate?: boolean;
  templateOwner: string;
  templateRepo: string;
  newPackageName: string;
};

export type CreateProjectResult = {
  repoName: string;
  repoUrl: string;
  renamedFiles: string[];
  errors: string[];
};

const OLD_PACKAGE = 'com.rntest';
const OLD_JAVA_DIR = 'android/app/src/main/java/com/rntest';

export async function createProjectFromTemplate(
  opts: CreateProjectOptions,
  onProgress?: (msg: string) => void,
): Promise<CreateProjectResult> {
  const {
    token,
    owner,
    repoName,
    description,
    isPrivate = false,
    templateOwner,
    templateRepo,
    newPackageName,
  } = opts;

  const progress = onProgress || (() => {});
  const result: CreateProjectResult = {
    repoName,
    repoUrl: '',
    renamedFiles: [],
    errors: [],
  };

  // === 1. Create repo from template ===
  progress('Creating repository from template…');
  const client = createGitHubClient(token);
  const { data: newRepo } = await client.post(
    `/repos/${templateOwner}/${templateRepo}/generate`,
    {
      owner,
      name: repoName,
      description: description || '',
      private: isPrivate,
      include_all_branches: false,
    },
  );
  result.repoUrl = newRepo.html_url;

  // Get default branch (GitHub sets this from the template)
  const branch: string = newRepo.default_branch || 'main';

  // Give GitHub a moment for the copy to settle
  progress('Waiting for repo to be ready…');
  await new Promise((r) => setTimeout(r, 4000));

  // === 2. Fetch all files we need to change ===
  progress('Reading files from template…');

  const filesToRead = [
    'app.json',
    'android/app/build.gradle',
    'android/settings.gradle',
    'android/app/src/main/res/values/strings.xml',
    `${OLD_JAVA_DIR}/MainActivity.kt`,
    `${OLD_JAVA_DIR}/MainApplication.kt`,
  ];

  const fileContents: Record<string, { text: string; sha: string }> = {};

  for (const path of filesToRead) {
    try {
      const file = await getContents(token, owner, repoName, path);
      if (Array.isArray(file)) continue;
      const single = file as GitHubContent;
      if (!single.content) continue;
      fileContents[path] = {
        text: base64Decode(single.content),
        sha: single.sha,
      };
    } catch (e: any) {
      result.errors.push(`Read ${path}: ${e.message || 'unknown'}`);
    }
  }

  // Also fetch old Java folder file names to move them
  let oldJavaFiles: string[] = [];
  try {
    const listing = await getContents(token, owner, repoName, OLD_JAVA_DIR);
    if (Array.isArray(listing)) {
      oldJavaFiles = listing.filter((f) => f.type === 'file').map((f) => f.name);
      for (const name of oldJavaFiles) {
        const path = `${OLD_JAVA_DIR}/${name}`;
        if (fileContents[path]) continue;
        const file = await getContents(token, owner, repoName, path);
        if (Array.isArray(file)) continue;
        const single = file as GitHubContent;
        if (!single.content) continue;
        fileContents[path] = {
          text: base64Decode(single.content),
          sha: single.sha,
        };
      }
    }
  } catch (e: any) {
    result.errors.push(`Read Java folder: ${e.message || 'unknown'}`);
  }

  // === 3. Compute all changes in memory ===
  progress('Applying renames…');
  const changes: FileChange[] = [];
  const newJavaDir = `android/app/src/main/java/${newPackageName.replace(/\./g, '/')}`;

  // Helper to safely edit a file
  const editFile = (
    path: string,
    transforms: ((text: string) => string)[],
  ) => {
    const entry = fileContents[path];
    if (!entry) return;
    let text = entry.text;
    for (const fn of transforms) text = fn(text);
    if (text !== entry.text) {
      changes.push({ path, content: text });
      result.renamedFiles.push(path);
    }
  };

  // app.json
  editFile('app.json', [
    (t) =>
      t
        .replace(/"name"\s*:\s*"rn-blank-template"/, `"name": "${repoName}"`)
        .replace(
          /"displayName"\s*:\s*"RN Blank Template"/,
          `"displayName": "${repoName}"`,
        ),
  ]);

  // build.gradle
  editFile('android/app/build.gradle', [
    (t) => t.split(OLD_PACKAGE).join(newPackageName),
  ]);

  // settings.gradle
  editFile('android/settings.gradle', [
    (t) => t.replace(/rootProject\.name\s*=\s*'[^']*'/, `rootProject.name = '${repoName}'`),
  ]);

  // strings.xml
  editFile('android/app/src/main/res/values/strings.xml', [
    (t) =>
      t.replace(
        /<string name="app_name">[^<]*<\/string>/,
        `<string name="app_name">${repoName}</string>`,
      ),
  ]);

  // MainActivity.kt — package + component name
  editFile(`${OLD_JAVA_DIR}/MainActivity.kt`, [
    (t) => t.split(OLD_PACKAGE).join(newPackageName),
    (t) =>
      t.replace(
        /getMainComponentName\(\): String = "[^"]*"/,
        `getMainComponentName(): String = "${repoName}"`,
      ),
  ]);

  // MainApplication.kt — package only
  editFile(`${OLD_JAVA_DIR}/MainApplication.kt`, [
    (t) => t.split(OLD_PACKAGE).join(newPackageName),
  ]);

  // === 4. Move Java files: create at new path, delete old ===
  for (const name of oldJavaFiles) {
    const oldPath = `${OLD_JAVA_DIR}/${name}`;
    const newPath = `${newJavaDir}/${name}`;
    const entry = fileContents[oldPath];
    if (!entry) continue;

    // New content (already updated via editFile above if applicable)
    const updatedEntry = changes.find((c) => c.path === oldPath);
    const finalContent = updatedEntry ? (updatedEntry.content as string) : entry.text;

    // Add new file
    changes.push({ path: newPath, content: finalContent });
    result.renamedFiles.push(`moved → ${newPath}`);

    // Delete old file
    changes.push({ path: oldPath, content: null });
  }

  // === 5. Commit everything as ONE commit ===
  if (changes.length === 0) {
    progress('No changes needed.');
    return result;
  }

  progress(`Committing ${changes.length} changes in a single commit…`);

  try {
    await batchCommitFiles(
      token,
      owner,
      repoName,
      branch,
      changes,
      `Rename to ${repoName} (auto-generated from ${templateOwner}/${templateRepo})`,
    );
    progress('Done!');
  } catch (e: any) {
    result.errors.push(`Commit: ${e.message || 'unknown'}`);
  }

  return result;
}
