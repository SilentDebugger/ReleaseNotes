// GitHub API Types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  labels: Label[];
  additions: number;
  deletions: number;
  changed_files: number;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: Label[];
  milestone: Milestone | null;
  pull_request?: {
    url: string;
  };
}

export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Milestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  open_issues: number;
  closed_issues: number;
  due_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  name: string;
  commit: {
    sha: string;
  };
  zipball_url: string;
  tarball_url: string;
}

// App Types
export interface ReleaseItem {
  id: string;
  type: 'pr' | 'issue' | 'commit';
  data: PullRequest | Issue | Commit;
  included: boolean;
  note: string;
}

export interface ReleaseFilter {
  type: 'milestone' | 'tag' | 'date' | 'branch';
  milestone?: Milestone;
  fromTag?: string;
  toTag?: string;
  fromDate?: Date;
  toDate?: Date;
  baseBranch?: string;
  compareBranch?: string;
}

export interface ReleaseDraft {
  id: string;
  owner: string;
  repo: string;
  version: string;
  title: string;
  description: string;
  filter: ReleaseFilter | null;
  items: ReleaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseExport {
  version: string;
  title: string;
  description: string;
  date: string;
  repository: {
    owner: string;
    name: string;
    url: string;
  };
  filter: ReleaseFilter | null;
  pullRequests: Array<{
    number: number;
    title: string;
    url: string;
    author: string;
    note: string;
    labels: string[];
  }>;
  issues: Array<{
    number: number;
    title: string;
    url: string;
    author: string;
    note: string;
    labels: string[];
  }>;
  commits: Array<{
    sha: string;
    message: string;
    url: string;
    author: string;
    note: string;
  }>;
  summary: string;
}

// Filter types
export type FilterType = 'milestone' | 'tag' | 'date' | 'branch';

export interface FilterConfig {
  type: FilterType;
  milestone?: number;
  fromTag?: string;
  toTag?: string;
  fromDate?: string;
  toDate?: string;
  baseBranch?: string;
  compareBranch?: string;
}

