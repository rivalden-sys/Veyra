# Repository governance

This document defines the expected GitHub mainline and maintenance model for Veyra.

## Canonical branch

`main` is the canonical integration branch.

Normal development should use short-lived topic branches and pull requests. Direct changes to `main` should be reserved for explicit repository recovery when normal pull-request flow cannot be used.

## Required pull-request gates

The following CI jobs are release gates for changes targeting `main`:

- `quality`
- `database-security`

The `quality` job validates migration-ledger integrity, auth-routing security invariants, timezone behavior, lint, TypeScript typechecking, and the production build.

The `database-security` job starts a fresh local Supabase database, replays the complete source-controlled migration ledger, and runs the pgTAP workspace security suite.

Repository protection should require both jobs before merge and require pull requests for normal changes. Maintainers should retain an intentional administrative recovery path rather than disabling checks during ordinary development.

## Branch lifecycle

Topic branches should be deleted after their pull request is merged and the merge is verified on `main`.

Before deleting an old branch, compare it against `main` and verify that it contains no unique work that still belongs in the product.

The pre-normalization branch `rename-to-veyra-foundation` was the canonical branch through Issues #1–#11 and is superseded by `main` once mainline normalization is complete.

The previous stale `main` pointed to commit `66ca13f0c823f7cd7052b8b928d82ddda1cfd1cb`, which added an experimental password-login path. That change was intentionally not promoted into the normalized mainline because the current supported auth surface is Google OAuth plus Magic Link and the legacy implementation exposed raw provider error messages, conflicting with the auth hardening completed in Issue #11. The commit SHA is recorded here for historical traceability.

## Merge policy

Prefer squash merge for focused topic branches so the mainline records one reviewed unit per pull request. A pull request should not merge while either required CI gate is failing.

## Release policy

Tags and GitHub Releases are created from `main` only after the release checklist in [`RELEASING.md`](RELEASING.md) is satisfied.

Do not use a tag or release to bypass unresolved release blockers. Pre-1.0 version numbers describe project maturity; they do not reduce the requirement to keep migration history and security boundaries reproducible.
