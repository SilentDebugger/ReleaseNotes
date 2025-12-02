import { auth } from "@/lib/auth";
import { ReleaseWorkspace } from "@/components/release/release-workspace";

interface RepoPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default async function RepoPage({ params }: RepoPageProps) {
  const session = await auth();
  const { owner, repo } = await params;

  return (
    <ReleaseWorkspace
      owner={owner}
      repo={repo}
      accessToken={session?.accessToken || ""}
    />
  );
}

