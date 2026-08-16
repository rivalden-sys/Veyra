# Contributing to Veyra

Veyra is intentionally small and architecture-focused. Contributions should preserve that property.

## Before you start

For bug fixes and documentation corrections, a pull request is usually sufficient.

For larger changes, open an issue first so the intended behavior and tenant/security implications can be discussed before implementation.

## Development setup

1. Fork or clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure a Supabase project.
5. Apply migrations in `supabase/migrations` in timestamp order.
6. Run `npm run dev`.

## Required checks

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
```

Run `npm run build` when your local environment is configured with the required public Supabase variables.

## Pull request expectations

A good pull request should:
- solve one clear problem
- explain user-visible and architectural impact
- include any required database migration
- preserve tenant isolation and authorization rules
- update documentation when behavior or trust boundaries change
- avoid unrelated refactors

## Database changes

Do not make schema changes that only exist in the Supabase dashboard.

All schema, function, policy, and privilege changes must be reproducible through ordered SQL migrations in `supabase/migrations`.

New tenant-owned tables must have an explicit RLS model before they are used by application code.

## Security-sensitive changes

Changes involving authentication, RLS, memberships, roles, tenant selection, security-definer functions, or privileged environment variables require extra review.

Do not weaken database authorization because an equivalent check exists in the UI or application layer.

## Style

Prefer readable, direct code over unnecessary abstraction. Veyra is a reference implementation first; contributors should be able to understand critical authorization paths without navigating a framework of internal wrappers.

## Reporting vulnerabilities

Do not open a public issue for a suspected security vulnerability. Follow `SECURITY.md`.
