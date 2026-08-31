# Database migrations

Veyra treats `supabase/migrations` as the canonical, ordered database change ledger.

## Invariants

- Every migration filename uses a unique 14-digit timestamp followed by a snake_case name.
- Applied migration versions are immutable once they exist in a shared Supabase environment.
- Two migration files must never contain byte-identical SQL under different versions.
- Schema, function, policy, and privilege changes must be represented by migrations rather than undocumented remote edits.
- A fresh database must be able to replay the complete ledger before a release is considered valid.

The repository enforces the filename, content-uniqueness, and README-ledger invariants with `scripts/validate-migrations.mjs` in CI.

## Current workflow

Before changing the database, create a migration with the Supabase CLI and review the generated timestamp before adding SQL:

```bash
supabase migration new descriptive_change_name
```

Before deploying to a linked shared environment, compare local and remote history:

```bash
supabase migration list
```

Preview the deployment when supported by the linked environment, then push the ordered migrations:

```bash
supabase db push --dry-run
supabase db push
```

Do not use the remote SQL editor or Table Editor for schema changes that are intended to become part of Veyra. Direct remote schema changes bypass migration history and create drift between Git and Supabase.

## Handling drift

Supabase records applied versions in `supabase_migrations.schema_migrations`. Git records the migration files. These ledgers must describe the same history.

If they diverge:

1. compare the local and remote migration lists;
2. verify the actual remote schema before changing either history;
3. preserve versions already applied to shared environments whenever possible;
4. use `supabase migration repair` only when the schema state is already correct and the history record itself is wrong;
5. verify the final result with a fresh local replay and the database security suite.

Never delete or rename a migration merely because another file appears equivalent without first checking whether either version has been applied remotely.

## Release verification

The release path requires both repository and database validation:

```bash
node scripts/validate-migrations.mjs
supabase db start
supabase test db
```

The GitHub Actions `quality` job validates the migration ledger, while `database-security` starts a fresh local Supabase database, replays the full migration chain, and runs the pgTAP security suite.
