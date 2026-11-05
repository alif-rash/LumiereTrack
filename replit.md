# LumiereTrack

University group-project collaboration, documented contributions, professor review and grading.

## Product rules
- Group assignments only. Individual tasks and submissions exist within a group, never as standalone assignments.
- Individual marks are visible only to the student and authorized course professors. Never include them in shared activity or group notifications.
- Completion is approved tasks divided by assigned tasks; it is not a measure of total effort or academic quality.
- Preserve submission, review and grading histories.
- Use the user-approved polished logo based on their supplied artwork: purple LT lettermark, gold sparkle, sweeping tail, and teamwork detail. Keep the LumiereTrack name; do not invent a replacement logo.
- No hardcoded academic statistics, fake uploads or decorative nonfunctional controls.
- Improve the existing application incrementally; preserve existing academic data and professor workflows.

## Visual direction
- Treat LumiereTrack as a distinctive academic workspace, not a generic dashboard template.
- The former blue-and-white palette is not a requirement. Use the current shared design foundations consistently across every screen, including auth, reports, and empty states.
- Prefer strong hierarchy and useful lists, tables, and workspaces over repeated floating cards. Avoid decorative gradients, glassmorphism, excessive rounding, and unnecessary shadows.
- Visual redesigns must preserve all real actions, private grades, evidence histories, and role-specific workflows; do not replace behavior with mockups or invented academic data.

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
- Student group creators become leaders. Leaders may manage invitations and remove members only when professor rules permit; academic records block member removal.
- Creation and code-based joining are independently controlled by each assignment. Formation deadlines include the whole date when no time is specified.
- Group capacity and one membership per assignment are enforced transactionally with a database uniqueness constraint.
- Old groups remain accessible after formation closes; only new student membership and invitations are restricted.

## Group lifecycle regression check
- `pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/src/lib/group-formation.test.ts`
- Uses unique, temporary fixture records and deletes only its own fixtures. Do not delete user records during browser tests.
