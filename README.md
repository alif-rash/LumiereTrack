# LumiereTrack

LumiereTrack is an evidence-first workspace for university group projects. It helps students and professors organize courses, assignments, groups, tasks, submissions, reviews, and grades while preserving a clear contribution history.

## What it provides

- Course and assignment management for professors
- Group creation, invitations, membership, and formation deadlines
- Group tasks with assignees and approval states
- Versioned submissions and file evidence
- Professor reviews and separate group and individual grades
- Notifications and activity history
- A permission-filtered, read-only workspace assistant
- Role-based access for students and professors through Clerk

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Wouter
- **API:** Express 5, TypeScript, Zod-generated API contracts
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Clerk
- **File storage:** Replit Object Storage / Google Cloud Storage-compatible API
- **AI:** OpenAI-compatible integration with a read-only workspace snapshot
- **Package manager:** pnpm

## Repository structure

```text
artifacts/
  lumieretrack/      React/Vite frontend
  api-server/        Express API
lib/
  api-spec/          OpenAPI contract and client generation
  api-client-react/  Generated React API client
  api-zod/           Generated Zod schemas and types
  db/                Drizzle database schema and connection
scripts/             SQL and development utilities
```

## Requirements

- Node.js 20+
- pnpm
- PostgreSQL
- Clerk application credentials
- Object Storage credentials/configuration for uploads

## Getting started

Install dependencies from the repository root:

```bash
pnpm install
```

Configure the frontend environment in `artifacts/lumieretrack/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
# Optional when using a Clerk proxy:
VITE_CLERK_PROXY_URL=
```

Configure the API environment in `artifacts/api-server/.env` or in the environment used to start the server:

```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/lumieretrack
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
PRIVATE_OBJECT_DIR=
PUBLIC_OBJECT_SEARCH_PATHS=

# Optional assistant integration
AI_INTEGRATIONS_OPENAI_BASE_URL=
AI_INTEGRATIONS_OPENAI_API_KEY=
```

Apply the database schema through Drizzle:

```bash
pnpm --filter @workspace/db run push
```

Start the frontend and API using the repository's managed workflows, or run the package scripts directly:

```bash
# Terminal 1
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/lumieretrack run dev

# Terminal 2
PORT=5000 pnpm --filter @workspace/api-server run dev
```

The frontend expects the API to be available under `/api`. In hosted environments, configure the platform's routing or proxy so `/api` reaches the API server.

## Common commands

```bash
# Type-check all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API clients after changing the OpenAPI contract
pnpm --filter @workspace/api-spec run codegen

# Run the group-formation regression test
pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/src/lib/group-formation.test.ts
```

## Product and data rules

- Assignments are group-based; individual tasks and submissions belong to a group.
- Individual grades are visible only to the student and authorized professors.
- Submission, review, and grading histories are preserved.
- No demo accounts or academic records are seeded.
- Group capacity and one-membership-per-assignment rules are enforced transactionally.
- The assistant can read permission-filtered workspace data but cannot change academic records.
- Database DDL is not run automatically when the application starts.

## API contract

The canonical API definition is [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml). Generated clients and schemas should be regenerated when the contract changes rather than edited by hand.

## License

This project is released under the MIT License.
