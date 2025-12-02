"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch, FileText, Sparkles, ArrowRight, Github } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-lg" />
          <div className="h-6 w-32 bg-primary/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background to-background" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-chart-1/5 to-transparent rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">ReleaseNotes</span>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border text-sm text-muted-foreground mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Streamline your release workflow</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in stagger-1">
            Generate{" "}
            <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-transparent">
              release notes
            </span>
            <br />
            in minutes
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in stagger-2">
            Connect your GitHub repositories, select your changes, add context,
            and export beautiful release notes — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-3">
            <Button
              size="lg"
              onClick={() => signIn("github")}
              className="text-lg px-8 py-6 gap-3 bg-foreground hover:bg-foreground/90 text-background"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-24 animate-fade-in stagger-4">
            <FeatureCard
              icon={<GitBranch className="w-6 h-6" />}
              title="Smart Filtering"
              description="Filter by milestones, tags, date ranges, or branch comparisons"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Rich Annotations"
              description="Add notes to PRs, issues, and commits for detailed changelogs"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Multiple Exports"
              description="Export as Markdown, JSON, or copy directly to clipboard"
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-24 text-center text-sm text-muted-foreground animate-fade-in stagger-5">
          <p>Built with Next.js, shadcn/ui, and the GitHub API</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card/50 border border-border/50 text-left hover:border-border transition-colors">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 text-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
