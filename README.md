# Release Notes Generator

A powerful web application for generating release notes from your GitHub repositories. Connect your GitHub account, select a repository, filter changes by milestone, tags, date range, or branch comparison, and create beautiful release notes with annotations.

## Features

- **GitHub Authentication**: Secure OAuth login with GitHub
- **Repository Selection**: Browse and search your repositories
- **Smart Filtering**: Filter changes by:
  - Tag comparison (e.g., v1.0.0 to v2.0.0)
  - Milestone
  - Date range
  - Branch comparison
- **Comprehensive Review**: View all PRs, issues, and commits in one place
- **Rich Annotations**: Add notes to each item for detailed changelogs
- **Include/Exclude**: Cherry-pick exactly what goes into your release notes
- **Multiple Export Formats**: 
  - Markdown
  - JSON
  - Copy to clipboard
- **Auto-save Drafts**: Work in progress is saved locally

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub account
- A GitHub OAuth App

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Release Notes Generator
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Generate and copy the **Client Secret**

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your_random_secret_here

# App URL
NEXTAUTH_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign in**: Click "Sign in with GitHub" on the landing page
2. **Select Repository**: Browse or search for the repository you want to generate release notes for
3. **Configure Release**: Choose your filter method:
   - **Tags**: Compare changes between two tags
   - **Milestone**: Get all items associated with a milestone
   - **Date Range**: Filter by date
   - **Branches**: Compare two branches
4. **Review Items**: 
   - Browse through PRs, issues, and commits
   - Check/uncheck items to include or exclude them
   - Add notes to provide context
5. **Export**: 
   - Set version number and title
   - Preview the generated markdown
   - Download as Markdown or JSON, or copy to clipboard

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js v5
- **GitHub API**: Octokit
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks
- **Storage**: Browser localStorage

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/  # Auth API routes
│   ├── dashboard/               # Main app pages
│   │   └── [owner]/[repo]/      # Repository workspace
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── release/                 # Release notes components
│   │   ├── dashboard-nav.tsx
│   │   ├── release-config-panel.tsx
│   │   ├── release-summary.tsx
│   │   ├── release-workspace.tsx
│   │   ├── repository-list.tsx
│   │   └── review-interface.tsx
│   ├── providers.tsx            # Context providers
│   └── ui/                      # shadcn/ui components
└── lib/
    ├── auth.ts                  # NextAuth configuration
    ├── github.ts                # GitHub API wrapper
    ├── storage.ts               # localStorage utilities
    ├── types.ts                 # TypeScript types
    └── utils.ts                 # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
