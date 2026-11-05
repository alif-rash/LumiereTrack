---
name: OpenAPI schema naming
description: Orval code generation collision with TypeScript built-in Record
---
Avoid naming new schemas `Record` when they will be direct endpoint response types.

**Why:** Orval imports direct response schemas into the generated API file, where a domain type called `Record` shadows the built-in `Record<K,V>` used internally for headers and query helpers. Code generation succeeds but library typechecking fails.

**How to apply:** Give endpoint responses domain-specific names, such as `InvitationPreview`. Nested legacy workspace record types do not require renaming solely for this issue.
