Title: test(mbt): add GraphWalker path harness for booking lifecycle

Base: qa/model-based-booking (draft; never main)

Refs #6

Execute the Issue #5 GraphWalker path through the existing Issue #04 helpers
and read-only Prisma oracles. Create a stale reschedule slot using a synthetic
blocker, then start a separate booking session after cancellation without
changing the cancelled records. Evidence excludes booking identifiers and
records only verified coverage.

Run: `node scripts/run-issue-06-mbt.mjs` after the prerequisites in
`apps/web/playwright/mbt/README.md`.

Actual attempt: **chưa kiểm chứng**, edges **0/6 (0%)**, vertices **0/5 (0%)**.
Java, GraphWalker JAR and node_modules are missing. Biome and
`type-check:ci --force` were attempted and could not start due to missing Yarn
node_modules state. No browser or DB oracle has passed. See the timestamped
Issue #6 evidence under `docs/qa/evidence/`.

Limits: only the six-edge personal booking model; supplementary state/guard
coverage from Issue #5 is not claimed. Stale-form behavior and UI selectors
need validation in a provisioned environment before review/merge.

Report pending: @anvodangiu (Issue #7, Part G), @BoyTay. No GitHub CLI or
GitHub messaging connector is available in this environment.
