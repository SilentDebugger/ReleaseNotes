"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Repository,
  Milestone,
  Tag,
  Branch,
  ReleaseFilter,
  ReleaseItem,
  ReleaseDraft,
  PullRequest,
  Issue,
  Commit,
} from "@/lib/types";
import {
  createOctokit,
  getRepository,
  fetchMilestones,
  fetchTags,
  fetchBranches,
  fetchPullRequests,
  fetchIssues,
  fetchCommits,
} from "@/lib/github";
import {
  createDraft,
  saveDraft,
  getRepoDrafts,
  generateItemId,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Lock,
  Globe,
  Star,
  Loader2,
} from "lucide-react";
import { ReleaseConfigPanel } from "./release-config-panel";
import { ReviewInterface } from "./review-interface";
import { ReleaseSummary } from "./release-summary";
import { toast } from "sonner";

interface ReleaseWorkspaceProps {
  owner: string;
  repo: string;
  accessToken: string;
}

type WorkspaceStep = "config" | "review" | "summary";

export function ReleaseWorkspace({
  owner,
  repo,
  accessToken,
}: ReleaseWorkspaceProps) {
  const router = useRouter();
  const octokit = useMemo(() => createOctokit(accessToken), [accessToken]);

  // Repository data
  const [repository, setRepository] = useState<Repository | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(true);

  // Draft state
  const [draft, setDraft] = useState<ReleaseDraft | null>(null);
  const [step, setStep] = useState<WorkspaceStep>("config");

  // Filter and items
  const [filter, setFilter] = useState<ReleaseFilter | null>(null);
  const [items, setItems] = useState<ReleaseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load repository data
  useEffect(() => {
    async function loadRepoData() {
      setLoadingRepo(true);
      try {
        const [repoData, milestonesData, tagsData, branchesData] =
          await Promise.all([
            getRepository(octokit, owner, repo),
            fetchMilestones(octokit, owner, repo),
            fetchTags(octokit, owner, repo),
            fetchBranches(octokit, owner, repo),
          ]);

        setRepository(repoData);
        setMilestones(milestonesData);
        setTags(tagsData);
        setBranches(branchesData);

        // Check for existing drafts
        const existingDrafts = getRepoDrafts(owner, repo);
        if (existingDrafts.length > 0) {
          // Load the most recent draft
          const latestDraft = existingDrafts.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          setDraft(latestDraft);
          if (latestDraft.items.length > 0) {
            setItems(latestDraft.items);
            setFilter(latestDraft.filter);
            setStep("review");
          }
        }
      } catch (error) {
        console.error("Failed to load repository data:", error);
        toast.error("Failed to load repository data");
      } finally {
        setLoadingRepo(false);
      }
    }

    loadRepoData();
  }, [owner, repo, octokit]);

  // Fetch items based on filter
  const fetchItems = useCallback(
    async (releaseFilter: ReleaseFilter) => {
      setLoadingItems(true);
      setFilter(releaseFilter);

      try {
        const [prs, issues, commits] = await Promise.all([
          fetchPullRequests(octokit, owner, repo, releaseFilter),
          fetchIssues(octokit, owner, repo, releaseFilter),
          fetchCommits(octokit, owner, repo, releaseFilter),
        ]);

        const allItems: ReleaseItem[] = [
          ...prs.map((pr) => ({
            id: generateItemId("pr", pr.number),
            type: "pr" as const,
            data: pr,
            included: true,
            note: "",
          })),
          ...issues.map((issue) => ({
            id: generateItemId("issue", issue.number),
            type: "issue" as const,
            data: issue,
            included: true,
            note: "",
          })),
          ...commits.map((commit) => ({
            id: generateItemId("commit", commit.sha),
            type: "commit" as const,
            data: commit,
            included: false, // Commits excluded by default
            note: "",
          })),
        ];

        setItems(allItems);

        // Create or update draft
        const newDraft = draft || createDraft(owner, repo);
        newDraft.filter = releaseFilter;
        newDraft.items = allItems;
        saveDraft(newDraft);
        setDraft(newDraft);

        setStep("review");
        toast.success(
          `Found ${prs.length} PRs, ${issues.length} issues, and ${commits.length} commits`
        );
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error("Failed to fetch release items");
      } finally {
        setLoadingItems(false);
      }
    },
    [octokit, owner, repo, draft]
  );

  // Update item
  const updateItem = useCallback(
    (itemId: string, updates: Partial<Pick<ReleaseItem, "note" | "included">>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );

      // Auto-save to draft
      if (draft) {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        saveDraft({ ...draft, items: updatedItems });
      }
    },
    [draft, items]
  );

  // Update draft metadata
  const updateDraftMeta = useCallback(
    (updates: Partial<Pick<ReleaseDraft, "version" | "title" | "description">>) => {
      if (draft) {
        const updatedDraft = { ...draft, ...updates };
        setDraft(updatedDraft);
        saveDraft(updatedDraft);
      }
    },
    [draft]
  );

  // Go to summary
  const handleProceedToSummary = () => {
    if (draft) {
      saveDraft({ ...draft, items });
    }
    setStep("summary");
  };

  if (loadingRepo) {
    return <WorkspaceLoading />;
  }

  if (!repository) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Repository not found</p>
        <Button variant="link" onClick={() => router.push("/dashboard")}>
          Back to repositories
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to repositories
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {repository.full_name}
            </h1>
            <Badge variant={repository.private ? "secondary" : "outline"}>
              {repository.private ? (
                <Lock className="h-3 w-3 mr-1" />
              ) : (
                <Globe className="h-3 w-3 mr-1" />
              )}
              {repository.private ? "Private" : "Public"}
            </Badge>
          </div>
          {repository.description && (
            <p className="text-muted-foreground mt-1">{repository.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {repository.stargazers_count.toLocaleString()} stars
            </span>
            {repository.language && (
              <span>{repository.language}</span>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />
      </div>

      {/* Main Content */}
      {step === "config" && (
        <ReleaseConfigPanel
          milestones={milestones}
          tags={tags}
          branches={branches}
          defaultBranch={repository.default_branch}
          onFetchItems={fetchItems}
          loading={loadingItems}
          existingFilter={filter}
        />
      )}

      {step === "review" && (
        <ReviewInterface
          items={items}
          onUpdateItem={updateItem}
          onBack={() => setStep("config")}
          onProceed={handleProceedToSummary}
        />
      )}

      {step === "summary" && draft && (
        <ReleaseSummary
          draft={draft}
          items={items}
          repository={repository}
          onUpdateDraft={updateDraftMeta}
          onBack={() => setStep("review")}
        />
      )}

      {/* Loading Overlay */}
      {loadingItems && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Fetching release items...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: WorkspaceStep }) {
  const steps = [
    { id: "config", label: "Configure" },
    { id: "review", label: "Review" },
    { id: "summary", label: "Export" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : steps.findIndex((s) => s.id === currentStep) > index
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }
            `}
          >
            {index + 1}
          </div>
          <span
            className={`ml-2 text-sm hidden sm:block ${
              currentStep === step.id
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className="w-8 h-px bg-border mx-3" />
          )}
        </div>
      ))}
    </div>
  );
}

function WorkspaceLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

