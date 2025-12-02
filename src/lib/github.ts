import { Octokit } from "@octokit/rest";
import {
  Repository,
  PullRequest,
  Issue,
  Commit,
  Branch,
  Milestone,
  Tag,
  ReleaseFilter,
} from "./types";

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

/**
 * Fetch all repositories the user has access to
 */
export async function fetchRepositories(
  octokit: Octokit,
  page: number = 1,
  perPage: number = 30
): Promise<{ repos: Repository[]; hasMore: boolean }> {
  const response = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    per_page: perPage,
    page,
  });

  return {
    repos: response.data as Repository[],
    hasMore: response.data.length === perPage,
  };
}

/**
 * Search repositories by name
 */
export async function searchRepositories(
  octokit: Octokit,
  query: string,
  page: number = 1
): Promise<Repository[]> {
  if (!query.trim()) {
    const result = await fetchRepositories(octokit, page);
    return result.repos;
  }

  // Search in user's repos
  const response = await octokit.search.repos({
    q: `${query} user:@me`,
    sort: "updated",
    per_page: 30,
    page,
  });

  return response.data.items as Repository[];
}

/**
 * Get a single repository
 */
export async function getRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Repository> {
  const response = await octokit.repos.get({ owner, repo });
  return response.data as Repository;
}

/**
 * Fetch milestones for a repository
 */
export async function fetchMilestones(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Milestone[]> {
  const response = await octokit.issues.listMilestones({
    owner,
    repo,
    state: "all",
    sort: "due_on",
    direction: "desc",
    per_page: 100,
  });

  return response.data as Milestone[];
}

/**
 * Fetch tags for a repository
 */
export async function fetchTags(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Tag[]> {
  const response = await octokit.repos.listTags({
    owner,
    repo,
    per_page: 100,
  });

  return response.data as Tag[];
}

/**
 * Fetch branches for a repository
 */
export async function fetchBranches(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Branch[]> {
  const response = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return response.data as Branch[];
}

/**
 * Fetch pull requests based on filter
 */
export async function fetchPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  filter: ReleaseFilter
): Promise<PullRequest[]> {
  const pullRequests: PullRequest[] = [];
  let page = 1;
  const perPage = 100;

  // Determine date range from filter
  const { since, until } = await getDateRangeFromFilter(
    octokit,
    owner,
    repo,
    filter
  );

  while (true) {
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: perPage,
      page,
    });

    if (response.data.length === 0) break;

    for (const pr of response.data) {
      // Only include merged PRs
      if (!pr.merged_at) continue;

      const mergedAt = new Date(pr.merged_at);

      // Check date range
      if (since && mergedAt < since) continue;
      if (until && mergedAt > until) continue;

      // For milestone filter, check if PR is associated with milestone
      if (filter.type === "milestone" && filter.milestone) {
        // PRs don't have milestones directly, we'll include all in range
      }

      pullRequests.push(pr as unknown as PullRequest);
    }

    // If we've gone past our date range, stop
    const lastPR = response.data[response.data.length - 1];
    if (lastPR && since) {
      const lastUpdated = new Date(lastPR.updated_at);
      if (lastUpdated < since) break;
    }

    if (response.data.length < perPage) break;
    page++;

    // Safety limit
    if (page > 10) break;
  }

  return pullRequests;
}

/**
 * Fetch issues based on filter
 */
export async function fetchIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  filter: ReleaseFilter
): Promise<Issue[]> {
  const issues: Issue[] = [];
  let page = 1;
  const perPage = 100;

  const { since, until } = await getDateRangeFromFilter(
    octokit,
    owner,
    repo,
    filter
  );

  const params: Parameters<typeof octokit.issues.listForRepo>[0] = {
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: perPage,
    page,
  };

  // If filtering by milestone
  if (filter.type === "milestone" && filter.milestone) {
    params.milestone = filter.milestone.number.toString();
  }

  while (true) {
    params.page = page;
    const response = await octokit.issues.listForRepo(params);

    if (response.data.length === 0) break;

    for (const issue of response.data) {
      // Skip pull requests (they show up in issues API too)
      if (issue.pull_request) continue;

      if (!issue.closed_at) continue;

      const closedAt = new Date(issue.closed_at);

      // Check date range
      if (since && closedAt < since) continue;
      if (until && closedAt > until) continue;

      issues.push(issue as unknown as Issue);
    }

    // If we've gone past our date range, stop
    const lastIssue = response.data[response.data.length - 1];
    if (lastIssue && since) {
      const lastUpdated = new Date(lastIssue.updated_at);
      if (lastUpdated < since) break;
    }

    if (response.data.length < perPage) break;
    page++;

    // Safety limit
    if (page > 10) break;
  }

  return issues;
}

/**
 * Fetch commits based on filter
 */
export async function fetchCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  filter: ReleaseFilter
): Promise<Commit[]> {
  // For tag comparison, use compare API
  if (filter.type === "tag" && filter.fromTag) {
    return fetchCommitsBetweenTags(
      octokit,
      owner,
      repo,
      filter.fromTag,
      filter.toTag
    );
  }

  // For branch comparison
  if (filter.type === "branch" && filter.baseBranch && filter.compareBranch) {
    return fetchCommitsBetweenBranches(
      octokit,
      owner,
      repo,
      filter.baseBranch,
      filter.compareBranch
    );
  }

  // For date range or milestone, fetch commits by date
  const { since, until } = await getDateRangeFromFilter(
    octokit,
    owner,
    repo,
    filter
  );

  const response = await octokit.repos.listCommits({
    owner,
    repo,
    since: since?.toISOString(),
    until: until?.toISOString(),
    per_page: 100,
  });

  return response.data as Commit[];
}

/**
 * Fetch commits between two tags
 */
async function fetchCommitsBetweenTags(
  octokit: Octokit,
  owner: string,
  repo: string,
  fromTag: string,
  toTag?: string
): Promise<Commit[]> {
  const base = fromTag;
  const head = toTag || "HEAD";

  try {
    const response = await octokit.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });

    return response.data.commits as Commit[];
  } catch {
    console.error("Failed to compare commits between tags");
    return [];
  }
}

/**
 * Fetch commits between two branches
 */
async function fetchCommitsBetweenBranches(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseBranch: string,
  compareBranch: string
): Promise<Commit[]> {
  try {
    const response = await octokit.repos.compareCommits({
      owner,
      repo,
      base: baseBranch,
      head: compareBranch,
    });

    return response.data.commits as Commit[];
  } catch {
    console.error("Failed to compare commits between branches");
    return [];
  }
}

/**
 * Get date range from filter configuration
 */
async function getDateRangeFromFilter(
  octokit: Octokit,
  owner: string,
  repo: string,
  filter: ReleaseFilter
): Promise<{ since: Date | undefined; until: Date | undefined }> {
  switch (filter.type) {
    case "date":
      return {
        since: filter.fromDate,
        until: filter.toDate,
      };

    case "milestone":
      if (filter.milestone) {
        return {
          since: filter.milestone.created_at
            ? new Date(filter.milestone.created_at)
            : undefined,
          until: filter.milestone.due_on
            ? new Date(filter.milestone.due_on)
            : new Date(),
        };
      }
      return { since: undefined, until: undefined };

    case "tag":
      if (filter.fromTag) {
        try {
          // Get the commit date of the from tag
          const tagRef = await octokit.git.getRef({
            owner,
            repo,
            ref: `tags/${filter.fromTag}`,
          });

          let commitSha = tagRef.data.object.sha;

          // If this is an annotated tag, we need to get the tag object first
          // to find the actual commit SHA
          if (tagRef.data.object.type === "tag") {
            const tagObject = await octokit.git.getTag({
              owner,
              repo,
              tag_sha: tagRef.data.object.sha,
            });
            commitSha = tagObject.data.object.sha;
          }

          const commit = await octokit.git.getCommit({
            owner,
            repo,
            commit_sha: commitSha,
          });

          return {
            since: new Date(commit.data.author.date),
            until: filter.toTag ? undefined : new Date(),
          };
        } catch (error) {
          console.error("Failed to get tag date:", error);
          return { since: undefined, until: undefined };
        }
      }
      return { since: undefined, until: undefined };

    case "branch":
      // For branch comparison, we'll use the compare API instead
      return { since: undefined, until: undefined };

    default:
      return { since: undefined, until: undefined };
  }
}

/**
 * Get the authenticated user
 */
export async function getAuthenticatedUser(octokit: Octokit) {
  const response = await octokit.users.getAuthenticated();
  return response.data;
}

