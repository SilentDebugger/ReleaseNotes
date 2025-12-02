"use client";

import { useState } from "react";
import { Milestone, Tag, Branch, ReleaseFilter, FilterType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Flag,
  GitBranch,
  Tag as TagIcon,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReleaseConfigPanelProps {
  milestones: Milestone[];
  tags: Tag[];
  branches: Branch[];
  defaultBranch: string;
  onFetchItems: (filter: ReleaseFilter) => void;
  loading: boolean;
  existingFilter: ReleaseFilter | null;
}

export function ReleaseConfigPanel({
  milestones,
  tags,
  branches,
  defaultBranch,
  onFetchItems,
  loading,
  existingFilter,
}: ReleaseConfigPanelProps) {
  const [filterType, setFilterType] = useState<FilterType>(
    existingFilter?.type || "tag"
  );

  // Version input
  const [version, setVersion] = useState("");

  // Milestone filter
  const [selectedMilestone, setSelectedMilestone] = useState<string>(
    existingFilter?.type === "milestone"
      ? String(existingFilter.milestone?.id || "")
      : ""
  );

  // Tag filter
  const [fromTag, setFromTag] = useState(
    existingFilter?.type === "tag" ? existingFilter.fromTag || "" : ""
  );
  const [toTag, setToTag] = useState(
    existingFilter?.type === "tag" ? existingFilter.toTag || "" : ""
  );

  // Date filter
  const [fromDate, setFromDate] = useState<Date | undefined>(
    existingFilter?.type === "date" ? existingFilter.fromDate : undefined
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    existingFilter?.type === "date" ? existingFilter.toDate : undefined
  );

  // Branch filter
  const [baseBranch, setBaseBranch] = useState(
    existingFilter?.type === "branch"
      ? existingFilter.baseBranch || defaultBranch
      : defaultBranch
  );
  const [compareBranch, setCompareBranch] = useState(
    existingFilter?.type === "branch" ? existingFilter.compareBranch || "" : ""
  );

  const handleFetch = () => {
    let filter: ReleaseFilter;

    switch (filterType) {
      case "milestone":
        const milestone = milestones.find(
          (m) => String(m.id) === selectedMilestone
        );
        filter = { type: "milestone", milestone };
        break;

      case "tag":
        filter = { type: "tag", fromTag, toTag: toTag || undefined };
        break;

      case "date":
        filter = { type: "date", fromDate, toDate };
        break;

      case "branch":
        filter = { type: "branch", baseBranch, compareBranch };
        break;

      default:
        return;
    }

    onFetchItems(filter);
  };

  const isValid = () => {
    switch (filterType) {
      case "milestone":
        return !!selectedMilestone;
      case "tag":
        return !!fromTag;
      case "date":
        return !!fromDate;
      case "branch":
        return !!baseBranch && !!compareBranch;
      default:
        return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release Configuration</CardTitle>
        <CardDescription>
          Choose how to filter the changes for your release notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Input */}
        <div className="space-y-2">
          <Label htmlFor="version">Version (optional)</Label>
          <Input
            id="version"
            placeholder="e.g., v2.1.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="max-w-xs font-mono"
          />
          <p className="text-xs text-muted-foreground">
            You can set the version now or later in the export step
          </p>
        </div>

        {/* Filter Type Tabs */}
        <Tabs
          value={filterType}
          onValueChange={(v) => setFilterType(v as FilterType)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tag" className="gap-2">
              <TagIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
            <TabsTrigger value="milestone" className="gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Milestone</span>
            </TabsTrigger>
            <TabsTrigger value="date" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Date Range</span>
            </TabsTrigger>
            <TabsTrigger value="branch" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Branches</span>
            </TabsTrigger>
          </TabsList>

          {/* Tag Filter */}
          <TabsContent value="tag" className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Tag</Label>
                <Select value={fromTag} onValueChange={setFromTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select starting tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.name} value={tag.name}>
                        <span className="font-mono">{tag.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Tag (optional)</Label>
                <Select value={toTag || "__HEAD__"} onValueChange={(v) => setToTag(v === "__HEAD__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="HEAD (latest)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__HEAD__">HEAD (latest)</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.name} value={tag.name}>
                        <span className="font-mono">{tag.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tags found in this repository. Create some tags first or use
                another filter method.
              </p>
            )}
          </TabsContent>

          {/* Milestone Filter */}
          <TabsContent value="milestone" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select
                value={selectedMilestone}
                onValueChange={setSelectedMilestone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={String(milestone.id)}>
                      <div className="flex items-center gap-2">
                        <span>{milestone.title}</span>
                        <Badge
                          variant={
                            milestone.state === "open" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {milestone.state}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {milestones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No milestones found in this repository. Create some milestones
                first or use another filter method.
              </p>
            )}
          </TabsContent>

          {/* Date Range Filter */}
          <TabsContent value="date" className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Today"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </TabsContent>

          {/* Branch Comparison Filter */}
          <TabsContent value="branch" className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Branch</Label>
                <Select value={baseBranch} onValueChange={setBaseBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        <span className="font-mono">{branch.name}</span>
                        {branch.name === defaultBranch && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            default
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Compare Branch</Label>
                <Select value={compareBranch} onValueChange={setCompareBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compare branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches
                      .filter((b) => b.name !== baseBranch)
                      .map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          <span className="font-mono">{branch.name}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Shows commits in <code className="font-mono">{compareBranch || "compare"}</code>{" "}
              that are not in <code className="font-mono">{baseBranch}</code>
            </p>
          </TabsContent>
        </Tabs>

        {/* Fetch Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            size="lg"
            onClick={handleFetch}
            disabled={!isValid() || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                Fetch Changes
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

