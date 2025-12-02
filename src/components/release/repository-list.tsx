"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Repository } from "@/lib/types";
import { createOctokit, fetchRepositories, searchRepositories } from "@/lib/github";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Star,
  Lock,
  Globe,
  GitFork,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RepositoryListProps {
  accessToken: string;
}

export function RepositoryList({ accessToken }: RepositoryListProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const octokit = useMemo(() => createOctokit(accessToken), [accessToken]);

  const loadRepos = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }

    try {
      if (searchQuery) {
        const results = await searchRepositories(octokit, searchQuery, reset ? 1 : page);
        if (reset) {
          setRepos(results);
        } else {
          setRepos((prev) => [...prev, ...results]);
        }
        setHasMore(results.length === 30);
      } else {
        const { repos: newRepos, hasMore: more } = await fetchRepositories(
          octokit,
          reset ? 1 : page
        );
        if (reset) {
          setRepos(newRepos);
        } else {
          setRepos((prev) => [...prev, ...newRepos]);
        }
        setHasMore(more);
      }
    } catch (error) {
      console.error("Failed to load repositories:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [octokit, page, searchQuery]);

  useEffect(() => {
    loadRepos(true);
  }, [searchQuery]);

  useEffect(() => {
    if (page > 1) {
      setLoadingMore(true);
      loadRepos();
    }
  }, [page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleSelectRepo = (repo: Repository) => {
    router.push(`/dashboard/${repo.owner.login}/${repo.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={handleSearch}
          className="pl-11 h-12 text-base"
        />
      </div>

      {/* Repository List */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-3 pr-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </Card>
            ))
          ) : repos.length === 0 ? (
            <div className="text-center py-12">
              <GitFork className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No repositories found matching your search"
                  : "No repositories found"}
              </p>
            </div>
          ) : (
            repos.map((repo, index) => (
              <Card
                key={repo.id}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => handleSelectRepo(repo)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate">
                        {repo.full_name}
                      </h3>
                      <Badge
                        variant={repo.private ? "secondary" : "outline"}
                        className="shrink-0"
                      >
                        {repo.private ? (
                          <Lock className="h-3 w-3 mr-1" />
                        ) : (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        {repo.private ? "Private" : "Public"}
                      </Badge>
                    </div>

                    {repo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getLanguageColor(repo.language),
                            }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {repo.stargazers_count.toLocaleString()}
                      </span>
                      <span>
                        Updated{" "}
                        {formatDistanceToNow(new Date(repo.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))
          )}

          {/* Load More */}
          {!loading && hasMore && repos.length > 0 && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Language colors (subset of GitHub's language colors)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Scala: "#c22d40",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Svelte: "#ff3e00",
  };
  return colors[language] || "#8b949e";
}

