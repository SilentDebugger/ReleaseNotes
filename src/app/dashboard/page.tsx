import { auth } from "@/lib/auth";
import { RepositoryList } from "@/components/release/repository-list";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Select a Repository
        </h1>
        <p className="text-muted-foreground">
          Choose a repository to generate release notes for
        </p>
      </div>

      <RepositoryList accessToken={session?.accessToken || ""} />
    </div>
  );
}

