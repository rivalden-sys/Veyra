# Testing Veyra

Veyra uses two CI validation layers:

1. Application and repository quality checks: migration-ledger integrity, authentication-routing security, timezone runtime validation, lint, TypeScript typechecking, and a production Next.js build.
2. Database security checks: a fresh local Supabase Postgres instance replays every migration and runs the pgTAP suite in `supabase/tests/database`.

## Application and repository checks

```bash
npm ci
node scripts/validate-migrations.mjs
node scripts/validate-auth-routing.mjs
node scripts/validate-timezones.mjs
npm run lint
npm run typecheck
npm run build
```

`validate-migrations.mjs` verifies that migration versions are unique, byte-identical migration files do not exist under different versions, and the migration manifest in `README.md` exactly matches `supabase/migrations`.

`validate-auth-routing.mjs` executes the shared authentication-routing helpers and checks route-level invariants. It covers safe same-origin `next` handling, open-redirect bypass cases, canonical callback construction, production `NEXT_PUBLIC_SITE_URL` requirements, POST-only sign-out, stable public auth errors, and accessible login feedback.

Migration workflow and drift-recovery rules are documented in [`MIGRATIONS.md`](MIGRATIONS.md).

## Database security checks

Requirements:

- Docker-compatible container runtime
- Supabase CLI 2.116.0

The repository currently keeps migrations under `supabase/migrations`. If the local Supabase config has not been initialized yet, run:

```bash
supabase init
```

Start a fresh local database and apply all migrations:

```bash
supabase db start
```

Run the database test suite:

```bash
supabase test db
```

The critical workspace suite validates:

- RLS is enabled on tenant-sensitive workspace tables
- non-owner vs owner workspace settings authorization
- non-owner vs owner membership role management
- cross-tenant write isolation
- the final-active-owner invariant
- invitation creation authorization
- invitation revocation isolation
- invitation expiration handling
- invitation email binding
- successful invitation acceptance
- accepted-token replay prevention

All test data is created inside a transaction and rolled back at the end of the pgTAP file.

## CI

GitHub Actions runs migration-ledger, auth-routing, and timezone validation before lint/typecheck/build and pins the Supabase CLI version for the database job. The `database-security` job starts a fresh database for every run, replays the full source-controlled migration chain, and executes the pgTAP suite. No remote Supabase project credentials or production data are used by these tests.
