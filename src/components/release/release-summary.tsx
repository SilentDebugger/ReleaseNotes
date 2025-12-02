"use client";

import { useState, useMemo } from "react";
import {
  Repository,
  ReleaseDraft,
  ReleaseItem,
  ReleaseExport,
  PullRequest,
  Issue,
  Commit,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileJson,
  FileText,
  Eye,
  Edit3,
  ChevronDown,
  GitPullRequest,
  CircleDot,
  GitCommit,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ReleaseSummaryProps {
  draft: ReleaseDraft;
  items: ReleaseItem[];
  repository: Repository;
  onUpdateDraft: (
    updates: Partial<Pick<ReleaseDraft, "version" | "title" | "description">>
  ) => void;
  onBack: () => void;
}

export function ReleaseSummary({
  draft,
  items,
  repository,
  onUpdateDraft,
  onBack,
}: ReleaseSummaryProps) {
  const [activeTab, setActiveTab] = useState("edit");
  const [copied, setCopied] = useState(false);

  // Get included items
  const includedItems = useMemo(() => {
    return items.filter((i) => i.included);
  }, [items]);

  const prs = includedItems.filter((i) => i.type === "pr");
  const issues = includedItems.filter((i) => i.type === "issue");
  const commits = includedItems.filter((i) => i.type === "commit");

  // Generate export data
  const exportData: ReleaseExport = useMemo(() => {
    return {
      version: draft.version,
      title: draft.title || `Release ${draft.version}`,
      description: draft.description,
      date: new Date().toISOString(),
      repository: {
        owner: repository.owner.login,
        name: repository.name,
        url: repository.html_url,
      },
      filter: draft.filter,
      pullRequests: prs.map((item) => {
        const pr = item.data as PullRequest;
        return {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          author: pr.user.login,
          note: item.note,
          labels: pr.labels.map((l) => l.name),
        };
      }),
      issues: issues.map((item) => {
        const issue = item.data as Issue;
        return {
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          author: issue.user.login,
          note: item.note,
          labels: issue.labels.map((l) => l.name),
        };
      }),
      commits: commits.map((item) => {
        const commit = item.data as Commit;
        return {
          sha: commit.sha,
          message: commit.commit.message.split("\n")[0],
          url: commit.html_url,
          author: commit.author?.login || commit.commit.author.name,
          note: item.note,
        };
      }),
      summary: generateSummary(),
    };
  }, [draft, prs, issues, commits, repository]);

  // Generate markdown
  const markdown = useMemo(() => {
    return generateMarkdown(exportData);
  }, [exportData]);

  function generateSummary(): string {
    const parts: string[] = [];

    if (draft.description) {
      parts.push(draft.description);
      parts.push("");
    }

    if (prs.length > 0) {
      parts.push("## Pull Requests");
      parts.push("");
      prs.forEach((item) => {
        const pr = item.data as PullRequest;
        const note = item.note ? ` - ${item.note}` : "";
        parts.push(`- ${pr.title} (#${pr.number})${note}`);
      });
      parts.push("");
    }

    if (issues.length > 0) {
      parts.push("## Issues Fixed");
      parts.push("");
      issues.forEach((item) => {
        const issue = item.data as Issue;
        const note = item.note ? ` - ${item.note}` : "";
        parts.push(`- ${issue.title} (#${issue.number})${note}`);
      });
      parts.push("");
    }

    if (commits.length > 0) {
      parts.push("## Commits");
      parts.push("");
      commits.forEach((item) => {
        const commit = item.data as Commit;
        const message = commit.commit.message.split("\n")[0];
        const note = item.note ? ` - ${item.note}` : "";
        parts.push(`- ${message} (${commit.sha.slice(0, 7)})${note}`);
      });
    }

    return parts.join("\n");
  }

  function generateMarkdown(data: ReleaseExport): string {
    const lines: string[] = [];

    // Title
    lines.push(`# ${data.title || `Release ${data.version}`}`);
    lines.push("");
    lines.push(`**Version:** ${data.version || "Unreleased"}`);
    lines.push(`**Date:** ${format(new Date(data.date), "MMMM d, yyyy")}`);
    lines.push("");

    // Description
    if (data.description) {
      lines.push(data.description);
      lines.push("");
    }

    // Pull Requests
    if (data.pullRequests.length > 0) {
      lines.push("## Pull Requests");
      lines.push("");
      data.pullRequests.forEach((pr) => {
        const labels =
          pr.labels.length > 0 ? ` \`${pr.labels.join("` `")}\`` : "";
        const note = pr.note ? `\n  > ${pr.note}` : "";
        lines.push(
          `- [#${pr.number}](${pr.url}) ${pr.title} (@${pr.author})${labels}${note}`
        );
      });
      lines.push("");
    }

    // Issues
    if (data.issues.length > 0) {
      lines.push("## Issues Fixed");
      lines.push("");
      data.issues.forEach((issue) => {
        const labels =
          issue.labels.length > 0 ? ` \`${issue.labels.join("` `")}\`` : "";
        const note = issue.note ? `\n  > ${issue.note}` : "";
        lines.push(
          `- [#${issue.number}](${issue.url}) ${issue.title} (@${issue.author})${labels}${note}`
        );
      });
      lines.push("");
    }

    // Commits
    if (data.commits.length > 0) {
      lines.push("## Commits");
      lines.push("");
      data.commits.forEach((commit) => {
        const note = commit.note ? `\n  > ${commit.note}` : "";
        lines.push(
          `- [\`${commit.sha.slice(0, 7)}\`](${commit.url}) ${commit.message} (@${commit.author})${note}`
        );
      });
      lines.push("");
    }

    // Footer
    lines.push("---");
    lines.push(
      `*Generated from [${data.repository.owner}/${data.repository.name}](${data.repository.url})*`
    );

    return lines.join("\n");
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = (format: "json" | "md") => {
    const content = format === "json" ? JSON.stringify(exportData, null, 2) : markdown;
    const filename = `release-notes-${draft.version || "draft"}.${format}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Release Summary</h2>
          <p className="text-sm text-muted-foreground">
            {includedItems.length} items included in release notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload("md")}>
                <FileText className="h-4 w-4 mr-2" />
                Download Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("json")}>
                <FileJson className="h-4 w-4 mr-2" />
                Download JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(markdown)}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCopy(JSON.stringify(exportData, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Edit Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Release Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g., v2.1.0"
                value={draft.version}
                onChange={(e) => onUpdateDraft({ version: e.target.value })}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={`Release ${draft.version || "Notes"}`}
                value={draft.title}
                onChange={(e) => onUpdateDraft({ title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the highlights of this release..."
                value={draft.description}
                onChange={(e) => onUpdateDraft({ description: e.target.value })}
                rows={4}
              />
            </div>

            <Separator />

            {/* Included Items Summary */}
            <div className="space-y-3">
              <Label>Included Items</Label>

              {prs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GitPullRequest className="h-4 w-4 text-github-purple" />
                    Pull Requests ({prs.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {prs.slice(0, 5).map((item) => {
                      const pr = item.data as PullRequest;
                      return (
                        <div
                          key={item.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="font-mono">#{pr.number}</span>
                          <span className="truncate">{pr.title}</span>
                          {item.note && (
                            <Badge variant="secondary" className="text-xs">
                              Has note
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {prs.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        +{prs.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {issues.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CircleDot className="h-4 w-4 text-github-green" />
                    Issues ({issues.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {issues.slice(0, 5).map((item) => {
                      const issue = item.data as Issue;
                      return (
                        <div
                          key={item.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="font-mono">#{issue.number}</span>
                          <span className="truncate">{issue.title}</span>
                          {item.note && (
                            <Badge variant="secondary" className="text-xs">
                              Has note
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {issues.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        +{issues.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {commits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GitCommit className="h-4 w-4" />
                    Commits ({commits.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {commits.slice(0, 5).map((item) => {
                      const commit = item.data as Commit;
                      return (
                        <div
                          key={item.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="font-mono">
                            {commit.sha.slice(0, 7)}
                          </span>
                          <span className="truncate">
                            {commit.commit.message.split("\n")[0]}
                          </span>
                        </div>
                      );
                    })}
                    {commits.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        +{commits.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-auto"
              >
                <TabsList className="h-8">
                  <TabsTrigger value="edit" className="text-xs px-3 h-7">
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="json" className="text-xs px-3 h-7">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {activeTab === "edit" ? (
                <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {markdown}
                </pre>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

