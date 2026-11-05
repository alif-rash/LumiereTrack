# LumiereTrack

University group-project collaboration, documented contributions, professor review and grading.

## Product rules
- Group assignments only. Individual tasks and submissions exist within a group, never as standalone assignments.
- Individual marks are visible only to the student and authorized course professors. Never include them in shared activity or group notifications.
- Completion is approved tasks divided by assigned tasks; it is not a measure of total effort or academic quality.
- Preserve submission, review and grading histories.
- The user will supply the actual logo. Reserve space; do not generate a replacement logo.
- No hardcoded academic statistics, fake uploads or decorative nonfunctional controls.

## Architecture
- React/Vite frontend: `artifacts/lumieretrack`, served at `/`.
- Express API: `artifacts/api-server`, served at `/api`.
- Contract: `lib/api-spec/openapi.yaml`. Regenerate clients with `pnpm --filter @workspace/api-spec run codegen`.
- PostgreSQL: `lib/db/src/schema/academic.ts`. Initial development schema source is `scripts/lumiere-schema.sql`; never run DDL at application startup.
- Clerk owns authentication; local users are bridged on first authenticated request. One-time onboarding chooses student or professor. A professor can manage only courses they own or teach.
- Files use direct presigned uploads to App Storage, with group-authorized attachment-only downloads.
- OpenAI assistant receives a read-only, permission-filtered workspace snapshot and cannot alter academic records.

## Run
- Managed API workflow: `artifacts/api-server: API Server`
- Managed frontend workflow: `artifacts/lumieretrack: web`
- `pnpm run typecheck` checks all packages.
- `pnpm --filter @workspace/db run push` applies declared schema in development. Production schema is applied through Publish.

## Data
- No fake/demo accounts or academic records are seeded.
- Professors create courses and share invitation codes. Students enroll using those codes.
- Account onboarding establishes each user's role once; it does not grant access to anyone else's courses.
- Notifications come from mutations and idempotent deadline checks during workspace polling.
