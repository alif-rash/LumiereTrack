---
name: Academic identity continuity
description: Why existing workspace accounts must survive changes in Clerk identity
---
Keep the established application account and academic ownership intact when a returning person has a different Clerk identity. Recovery by email requires a primary email verified by Clerk server-side; never trust an email supplied by the browser.

**Why:** A published sign-in encountered an email uniqueness conflict because a new Clerk identity shared the existing workspace email. Replacing the account ID or deleting the earlier row would break course ownership, memberships, and assessment history.

**How to apply:** Treat the academic account ID as stable. Any future identity-mapping changes must preserve existing roles and references, reject ambiguous matches, and require trusted proof of email ownership.
