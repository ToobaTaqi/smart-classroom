# Smart Classroom

Next.js app for teachers and students. This repository currently contains the
scaffold plus a working Inngest ingestion preview. The rest of the product is
described in `.specify/memory/constitution.md` and `specs/`.

## Requirements

- Node.js 20 or newer
- pnpm 11 (`corepack enable` will install the pinned version)
- Optional: Docker if you want to run Supabase locally

## First-time setup

```bash
pnpm install
```

Create your local environment file:

```powershell
Copy-Item .env.example .env.local
```

Fill in the Supabase and Groq values. For local Inngest development, leave the
Inngest keys blank and keep `INNGEST_DEV=1`.

## Run locally

Start the Next.js app:

```bash
pnpm dev
```

In a second terminal, start the Inngest Dev Server:

```bash
pnpm inngest:dev
```

- App: http://localhost:3000
- Inngest Dev Server: http://localhost:8288
- Inngest endpoint: http://localhost:3000/api/inngest

The Inngest SDK registers the app with the Dev Server automatically. If it does
not appear, open http://localhost:8288, choose **Apps**, and sync
`http://localhost:3000/api/inngest`.

## Test the ingestion function

The app registers one function, `chapter-ingest-preview`, triggered by the
`chapter.uploaded` event. It parses markdown into a chapter title, topics, and
chunks without writing to the database.

Open http://localhost:8288, choose **Events**, and send this event:

```json
{
  "name": "chapter.uploaded",
  "data": {
    "fileName": "01-hardware-basics.md",
    "rawMd": "# Hardware basics\n\n## CPU\n\nThe CPU executes instructions.\n\n## Memory\n\nRAM is volatile working memory."
  }
}
```

The run's trace shows the durable `preview-chapter` step and its saved result.

## Handoff notes

- Source code, migrations, and configuration belong in git.
- `.env.local` is machine-specific and git-ignored. Send secrets through a
  private channel, never through the repository.
- Supabase cloud projects work for both people if credentials are shared. Local
  Supabase data does not transfer between machines.
- Each person runs their own Inngest Dev Server; no cloud keys are needed for
  local development.
- Inngest Cloud keys are only needed for deployed environments.

## Scripts

```bash
pnpm dev          # Next.js dev server on port 3000
pnpm build        # production build
pnpm start        # run the production build
pnpm lint         # ESLint
pnpm typecheck    # generated Next.js types + TypeScript
pnpm inngest:dev  # Inngest Dev Server on port 8288
```
