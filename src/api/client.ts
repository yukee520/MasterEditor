import axios, { AxiosInstance } from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Create an axios instance authenticated with a GitHub PAT.
 */
export function createGitHubClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: GITHUB_API_BASE,
    timeout: 20000,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  // Log errors for debugging (remove in production)
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 401) {
        console.warn('[GitHub API] Unauthorized — check your token');
      } else if (status === 403) {
        console.warn('[GitHub API] Forbidden — rate limit or scope issue:', message);
      } else if (status === 404) {
        console.warn('[GitHub API] Not found:', message);
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export { GITHUB_API_BASE };
