"use client";

import { useState, useMemo } from "react";
import { ReleaseItem, PullRequest, Issue, Commit } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  GitPullRequest,
  CircleDot,
  GitCommit,
  Search,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  FileCode,
  StickyNote,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReviewInterfaceProps {
  items: ReleaseItem[];
  onUpdateItem: (
    itemId: string,
    updates: Partial<Pick<ReleaseItem, "note" | "included">>
  ) => void;
  onBack: () => void;
  onProceed: () => void;
}

export function ReviewInterface({
  items,
  onUpdateItem,
  onBack,
  onProceed,
}: ReviewInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("prs");

  // Separate items by type
  const { prs, issues, commits } = useMemo(() => {
    return {
      prs: items.filter((i) => i.type === "pr"),
      issues: items.filter((i) => i.type === "issue"),
      commits: items.filter((i) => i.type === "commit"),
    };
  }, [items]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return {
      prs: prs.filter((item) => {
        const pr = item.data as PullRequest;
        return (
          pr.title.toLowerCase().includes(query) ||
          pr.user.login.toLowerCase().includes(query) ||
          String(pr.number).includes(query)
        );
      }),
      issues: issues.filter((item) => {
        const issue = item.data as Issue;
        return (
          issue.title.toLowerCase().includes(query) ||
          issue.user.login.toLowerCase().includes(query) ||
          String(issue.number).includes(query)
        );
      }),
      commits: commits.filter((item) => {
        const commit = item.data as Commit;
        return (
          commit.commit.message.toLowerCase().includes(query) ||
          commit.commit.author.name.toLowerCase().includes(query) ||
          commit.sha.includes(query)
        );
      }),
    };
  }, [prs, issues, commits, searchQuery]);

  // Count included items
  const includedCount = items.filter((i) => i.included).length;

  // Toggle all in current tab
  const toggleAllInTab = (type: "pr" | "issue" | "commit", include: boolean) => {
    const tabItems =
      type === "pr" ? prs : type === "issue" ? issues : commits;
    tabItems.forEach((item) => {
      onUpdateItem(item.id, { included: include });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Review Changes</h2>
          <p className="text-sm text-muted-foreground">
            {includedCount} of {items.length} items selected for release notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onProceed}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, author, or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="prs" className="gap-2">
              <GitPullRequest className="h-4 w-4" />
              Pull Requests
              <Badge variant="secondary" className="ml-1">
                {prs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <CircleDot className="h-4 w-4" />
              Issues
              <Badge variant="secondary" className="ml-1">
                {issues.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="commits" className="gap-2">
              <GitCommit className="h-4 w-4" />
              Commits
              <Badge variant="secondary" className="ml-1">
                {commits.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toggleAllInTab(
                  activeTab === "prs"
                    ? "pr"
                    : activeTab === "issues"
                    ? "issue"
                    : "commit",
                  true
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toggleAllInTab(
                  activeTab === "prs"
                    ? "pr"
                    : activeTab === "issues"
                    ? "issue"
                    : "commit",
                  false
                )
              }
            >
              <XCircle className="h-4 w-4 mr-1" />
              Deselect All
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-380px)] mt-4">
          <TabsContent value="prs" className="mt-0 space-y-3">
            {filteredItems.prs.length === 0 ? (
              <EmptyState type="pull requests" />
            ) : (
              filteredItems.prs.map((item) => (
                <PRCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => onUpdateItem(item.id, updates)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="issues" className="mt-0 space-y-3">
            {filteredItems.issues.length === 0 ? (
              <EmptyState type="issues" />
            ) : (
              filteredItems.issues.map((item) => (
                <IssueCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => onUpdateItem(item.id, updates)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="commits" className="mt-0 space-y-3">
            {filteredItems.commits.length === 0 ? (
              <EmptyState type="commits" />
            ) : (
              filteredItems.commits.map((item) => (
                <CommitCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => onUpdateItem(item.id, updates)}
                />
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function PRCard({
  item,
  onUpdate,
}: {
  item: ReleaseItem;
  onUpdate: (updates: Partial<Pick<ReleaseItem, "note" | "included">>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pr = item.data as PullRequest;

  return (
    <Card
      className={cn(
        "transition-colors",
        !item.included && "opacity-60 bg-muted/30"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <Checkbox
              checked={item.included}
              onCheckedChange={(checked) =>
                onUpdate({ included: checked as boolean })
              }
              className="mt-1"
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitPullRequest className="h-4 w-4 text-github-purple shrink-0" />
                    <span className="font-mono text-sm text-muted-foreground">
                      #{pr.number}
                    </span>
                    {pr.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        style={{
                          borderColor: `#${label.color}`,
                          color: `#${label.color}`,
                        }}
                        className="text-xs"
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="font-medium leading-snug">{pr.title}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={pr.user.avatar_url} />
                    <AvatarFallback>{pr.user.login[0]}</AvatarFallback>
                  </Avatar>
                  <span>{pr.user.login}</span>
                </div>
                <span>
                  merged {formatDistanceToNow(new Date(pr.merged_at!), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-github-green flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {pr.additions}
                  </span>
                  <span className="text-github-red flex items-center gap-1">
                    <Minus className="h-3 w-3" />
                    {pr.deletions}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="h-3 w-3" />
                    {pr.changed_files}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4 border-t mt-2 pt-4">
            {pr.body && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {pr.body}
              </div>
            )}

            {/* Note Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="h-4 w-4" />
                Release Note
              </div>
              <Textarea
                placeholder="Add a note for the release notes..."
                value={item.note}
                onChange={(e) => onUpdate({ note: e.target.value })}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function IssueCard({
  item,
  onUpdate,
}: {
  item: ReleaseItem;
  onUpdate: (updates: Partial<Pick<ReleaseItem, "note" | "included">>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const issue = item.data as Issue;

  return (
    <Card
      className={cn(
        "transition-colors",
        !item.included && "opacity-60 bg-muted/30"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={item.included}
              onCheckedChange={(checked) =>
                onUpdate({ included: checked as boolean })
              }
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CircleDot className="h-4 w-4 text-github-green shrink-0" />
                    <span className="font-mono text-sm text-muted-foreground">
                      #{issue.number}
                    </span>
                    {issue.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        style={{
                          borderColor: `#${label.color}`,
                          color: `#${label.color}`,
                        }}
                        className="text-xs"
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="font-medium leading-snug">{issue.title}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={issue.user.avatar_url} />
                    <AvatarFallback>{issue.user.login[0]}</AvatarFallback>
                  </Avatar>
                  <span>{issue.user.login}</span>
                </div>
                <span>
                  closed{" "}
                  {formatDistanceToNow(new Date(issue.closed_at!), {
                    addSuffix: true,
                  })}
                </span>
                {issue.milestone && (
                  <Badge variant="secondary" className="text-xs">
                    {issue.milestone.title}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4 border-t mt-2 pt-4">
            {issue.body && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {issue.body}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="h-4 w-4" />
                Release Note
              </div>
              <Textarea
                placeholder="Add a note for the release notes..."
                value={item.note}
                onChange={(e) => onUpdate({ note: e.target.value })}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function CommitCard({
  item,
  onUpdate,
}: {
  item: ReleaseItem;
  onUpdate: (updates: Partial<Pick<ReleaseItem, "note" | "included">>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const commit = item.data as Commit;
  const [firstLine, ...rest] = commit.commit.message.split("\n");
  const hasMoreContent = rest.filter((l) => l.trim()).length > 0;

  return (
    <Card
      className={cn(
        "transition-colors",
        !item.included && "opacity-60 bg-muted/30"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={item.included}
              onCheckedChange={(checked) =>
                onUpdate({ included: checked as boolean })
              }
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm text-muted-foreground">
                      {commit.sha.slice(0, 7)}
                    </span>
                  </div>
                  <h4 className="font-medium leading-snug">{firstLine}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {commit.author ? (
                    <>
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={commit.author.avatar_url} />
                        <AvatarFallback>
                          {commit.author.login[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{commit.author.login}</span>
                    </>
                  ) : (
                    <span>{commit.commit.author.name}</span>
                  )}
                </div>
                <span>
                  {format(new Date(commit.commit.author.date), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4 border-t mt-2 pt-4">
            {hasMoreContent && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg font-mono">
                {rest.join("\n").trim()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="h-4 w-4" />
                Release Note
              </div>
              <Textarea
                placeholder="Add a note for the release notes..."
                value={item.note}
                onChange={(e) => onUpdate({ note: e.target.value })}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No {type} found</p>
    </div>
  );
}

