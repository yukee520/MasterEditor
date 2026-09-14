import { createGitHubClient } from './client';
import { getContents, putFileContent, deleteFile } from './contents';
import type { GitHubContent } from '../types/github';
import { base64Decode, base64Encode } from '../utils/base64';

export type CreateProjectOptions = {
  token: string;
  owner: string;              // GitHub username
  repoName: string;           // e.g. "MyToDoApp"
  description?: string;
  isPrivate?: boolean;
  templateOwner: string;      // e.g. "yukee520"
  templateRepo: string;       // e.g. "rn-blank-template"
  newPackageName: string;     // e.g. "com.yukee.todoapp"
};

export type CreateProjectResult = {
  repoName: string;
  repoUrl: string;
  renamedFiles: string[];
  errors: string[];
};

/**
 * Create a new repo from a template, then rename package + app name.
 */
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

  // Give GitHub a moment for the copy to settle
  await new Promise((r) => setTimeout(r, 3000));

  // === 2. Rename in text files ===
  const OLD_PACKAGE = 'com.rntest';

  const textRenames: { path: string; find: string; replace: string }[] = [
    {
      path: 'android/app/build.gradle',
      find: OLD_PACKAGE,
      replace: newPackageName,
    },
    {
      path: 'android/app/src/main/java/com/rntest/MainActivity.kt',
      find: OLD_PACKAGE,
      replace: newPackageName,
    },
    {
      path: 'android/app/src/main/java/com/rntest/MainApplication.kt',
      find: OLD_PACKAGE,
      replace: newPackageName,
    },
    {
      path: 'android/settings.gradle',
      find: `rootProject.name = 'rn-blank-template'`,
      replace: `rootProject.name = '${repoName}'`,
    },
    {
      path: 'app.json',
      find: `"name": "rn-blank-template"`,
      replace: `"name": "${repoName}"`,
    },
    {
      path: 'app.json',
      find: `"displayName": "RN Blank Template"`,
      replace: `"displayName": "${repoName}"`,
    },
    {
      path: 'android/app/src/main/res/values/strings.xml',
      find: `<string name="app_name">RN Blank Template</string>`,
      replace: `<string name="app_name">${repoName}</string>`,
    },
  ];

  for (const item of textRenames) {
    try {
      progress(`Renaming in ${item.path}…`);
      const file = await getContents(token, owner, repoName, item.path);
      if (Array.isArray(file)) continue;
      const single = file as GitHubContent;
      if (!single.content) continue;

      // dynamic import to avoid circular dep
      const decoded = base64Decode(single.content);

      if (!decoded.includes(item.find)) {
        continue; // nothing to change
      }

      const updated = decoded.split(item.find).join(item.replace);
      await putFileContent(
        token,
        owner,
        repoName,
        item.path,
        updated,
        `Rename to ${repoName}`,
        single.sha,
      );
      result.renamedFiles.push(item.path);
    } catch (e: any) {
      result.errors.push(`${item.path}: ${e.message || 'unknown'}`);
    }
  }

  // === 3. Fix MainActivity component name ===
  try {
    progress('Updating MainActivity component name…');
    const path = 'android/app/src/main/java/com/rntest/MainActivity.kt';
    const file = await getContents(token, owner, repoName, path);
    if (!Array.isArray(file)) {
      const single = file as GitHubContent;
      if (single.content) {
        const decoded = base64Decode(single.content);
        const updated = decoded.replace(
          /getMainComponentName\(\): String = "[^"]*"/,
          `getMainComponentName(): String = "${repoName}"`,
        );
        if (updated !== decoded) {
          await putFileContent(
            token,
            owner,
            repoName,
            path,
            updated,
            `Set component name to ${repoName}`,
            single.sha,
          );
          result.renamedFiles.push(`${path} (component name)`);
        }
      }
    }
  } catch (e: any) {
    result.errors.push(`MainActivity component: ${e.message || 'unknown'}`);
  }

  // === 4. Move Java package folder ===
  progress('Moving Java package folder…');
  const oldFolderPath = 'android/app/src/main/java/com/rntest';
  const newFolderPath = `android/app/src/main/java/${newPackageName.replace(/\./g, '/')}`;

  try {
    const oldFiles = (await getContents(
      token,
      owner,
      repoName,
      oldFolderPath,
    )) as GitHubContent[];

    if (Array.isArray(oldFiles)) {
      for (const f of oldFiles) {
        if (f.type !== 'file') continue;

        // Read old content
        const oldFile = await getContents(token, owner, repoName, f.path);
        if (Array.isArray(oldFile)) continue;
        const single = oldFile as GitHubContent;
        if (!single.content) continue;

        const content = base64Decode(single.content);
        const updated = content.split(OLD_PACKAGE).join(newPackageName);

        // Write to new path
        await putFileContent(
          token,
          owner,
          repoName,
          `${newFolderPath}/${f.name}`,
          updated,
          `Move ${f.name} to new package`,
        );

        // Delete old file
        await deleteFile(
          token,
          owner,
          repoName,
          f.path,
          single.sha,
          `Remove old ${f.name}`,
        );

        result.renamedFiles.push(`moved ${f.path} → ${newFolderPath}/${f.name}`);
      }
    }
  } catch (e: any) {
    result.errors.push(`Java move: ${e.message || 'unknown'}`);
  }

  progress('Done!');
  return result;
}
