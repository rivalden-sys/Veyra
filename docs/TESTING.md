# Testing Veyra

Veyra uses two CI validation layers:

1. Application quality checks: lint, TypeScript typechecking, timezone runtime validation, and a production Next.js build.
2. Database security checks: a fresh local Supabase Postgres instance replays every migration and runs the pgTAP suite in `supabase/tests/database`.

## Application checks

```bash
npm ci
npm run lint
npm run typecheck
node scripts/validate-timezones.mjs
npm run build
```

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

GitHub Actions pins the Supabase CLI version and starts a fresh database for every `database-security` job. No remote Supabase project credentials or production data are used by these tests.
