# Contributing to Veyra

Veyra is a compact, security-sensitive multi-tenant SaaS foundation. Contributions should preserve tenant isolation, authentication boundaries, migration reproducibility, and a small understandable codebase.

## Before opening a pull request

1. Start from the current `main` branch.
2. Keep the change focused. Product behavior, database migrations, and security-boundary changes should not be mixed unless they are inseparable.
3. Do not include secrets, production credentials, private customer data, or plaintext invitation tokens.
4. For database changes, add a new forward migration. Never rewrite an already-applied migration.
5. Run the same validation gates used by CI:

```bash
npm ci
node scripts/validate-migrations.mjs
node scripts/validate-auth-routing.mjs
node scripts/validate-timezones.mjs
npm run lint
npm run typecheck
npm run build
```

For database-sensitive changes, also run:

```bash
supabase init
supabase db start
supabase test db
```

See [`docs/TESTING.md`](docs/TESTING.md) and [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) for details.

## Pull request expectations

A pull request should explain:

- the problem being solved;
- the scope and intentionally excluded work;
- security or tenant-boundary implications;
- migrations, configuration, or environment-variable changes;
- how the change was validated.

`quality` and `database-security` are release gates for `main`. Do not bypass failing checks to merge normal development work.

## Security-sensitive changes

Treat authentication, authorization, RLS, SECURITY DEFINER functions, invitation tokens, redirects, cookies, and tenant identifiers as trust boundaries. Security-sensitive changes require explicit validation of failure cases, not only the happy path.

Do not publish exploitable vulnerability details in a normal issue. Follow [`SECURITY.md`](SECURITY.md) for private reporting guidance.

## Scope discipline

Veyra is intended to remain a foundation rather than a large framework. Prefer small, explicit changes over new abstractions that do not solve a current product or security need.
