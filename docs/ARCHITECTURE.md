# Veyra architecture

This document describes the current `v0.1.0` architecture and the security assumptions that must remain true as the project evolves.

## System boundaries

Veyra is a Next.js App Router application backed by Supabase Auth and Postgres.

The browser is considered untrusted. Authentication state is verified server-side. Tenant identifiers supplied by the client are never sufficient authorization by themselves.

```text
Untrusted browser
      |
      v
Next.js App Router
      |
      |  server components / routes / actions
      v
Supabase SSR client
      |
      +------> Supabase Auth
      |
      +------> Postgres + RLS
```

## Core entities

### `profiles`

One application profile per Supabase Auth user.

Primary responsibilities:
- application-visible identity
- profile metadata
- onboarding completion state

### `tenants`

A tenant represents an isolated workspace/account boundary.

Important fields include:
- `id`
- `name`
- `slug`
- `timezone`
- `status`
- `created_by`

### `tenant_memberships`

Connects users to tenants and carries authorization state.

Important invariants:
- one membership per `(tenant_id, user_id)`
- membership identity cannot be changed after creation
- `super_admin` is not a valid tenant membership role
- an active tenant must retain at least one active owner
- active memberships require an acceptance timestamp

### `tenant_invitations`

Stores pending workspace invitations without persisting plaintext invitation tokens.

Important invariants:
- invitation administration is owner-scoped to the target tenant
- `super_admin` is not a valid invitation role
- only a token hash is persisted in Postgres
- an invitation must be unexpired and unaccepted before it can be used
- the authenticated account email must match the invited email
- accepting an invitation creates or activates membership only in the invitation's tenant
- accepted invitation tokens cannot be replayed

Invitation creation and acceptance use narrowly scoped `security definer` RPCs. Cryptographic functions are schema-qualified so their resolution does not depend on the RPC `search_path`.

### `user_tenant_preferences`

Stores the user's currently selected tenant.

The selected tenant must be a tenant for which the user has an active membership.

### `platform_admins`

Separate platform-level administrative capability from tenant roles.

This prevents a global platform privilege from being represented as a normal workspace membership.

## Tenant creation

Tenant creation is performed through `public.create_tenant_for_current_user(...)`.

The database function performs the operation atomically:

1. validates the authenticated user
2. validates and normalizes the tenant name/slug
3. creates the tenant
4. creates the creator's active `owner` membership
5. makes the new tenant active for that user
6. marks onboarding as completed when appropriate

Keeping this sequence in a database function avoids intermediate states such as a tenant without an owner.

## Workspace invitations

Workspace invitations are managed through `public.create_tenant_invitation(...)` and `public.accept_tenant_invitation(...)`.

The invitation boundary deliberately separates the plaintext token from persisted state:

1. an owner requests an invitation for the active tenant
2. the RPC generates a cryptographically random token and stores only its SHA-256 hash
3. the raw token is returned only for invitation-link delivery
4. acceptance hashes the supplied token and resolves a single pending, unexpired invitation
5. the authenticated user's account email must match the invitation email
6. membership activation, invitation acceptance, and active-tenant preference update happen in one database transaction

Application code must never treat a token or tenant identifier as authorization by itself. Authorization remains enforced by the RPC checks and RLS policies.

## Active tenant selection

`public.set_active_tenant(uuid)` verifies membership before persisting the preference.

Application code must still resolve the active tenant on the server before performing tenant-sensitive operations.

## Authorization model

Authorization is defense in depth.

### Layer 1 — application authorization

Server routes/actions should:
- require an authenticated user
- resolve the target tenant
- validate membership and required role
- validate input before calling the database

### Layer 2 — Postgres Row Level Security

RLS is enabled on the current tenant-sensitive tables.

Policies use membership-aware helper functions such as:
- `private.is_super_admin`
- `private.is_tenant_member`
- `private.has_tenant_role`
- `private.shares_tenant_with`

RLS is the final isolation boundary if application code makes an authorization mistake.

## Roles

Tenant roles and platform roles are deliberately separate.

Current tenant administration is owner-centric. Future role expansion must not weaken the invariant that only sufficiently privileged members can manage tenant state or memberships.

## Security-definer functions

Several database helpers use `security definer` so RLS policies can safely evaluate membership state without recursive-policy problems.

When adding new security-definer functions:
- use an explicit `search_path`
- schema-qualify extension functions and other security-sensitive dependencies
- keep the function narrowly scoped
- revoke public execution unless intentionally exposed
- grant execution only to the minimum required database role
- never trust caller-provided user IDs when `auth.uid()` can be used instead

## Authentication

The current application supports Supabase authentication flows including Google OAuth and Magic Link.

The callback route exchanges the provider/magic-link code for an authenticated session.

Production deployments must configure allowed redirect URLs explicitly in Supabase.

## Environment boundary

The browser receives only public Supabase configuration:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Service-role keys and other privileged credentials must never use a `NEXT_PUBLIC_` prefix and must never be exposed to client components.

## Migration boundary

`supabase/migrations` is the canonical ordered schema ledger for the repository. Hosted Supabase tracks applied migration versions separately in `supabase_migrations.schema_migrations`, so the two histories must stay aligned.

Migration rules:
- already-applied migration versions are immutable public history; do not rename or delete them after deployment
- already-applied migration SQL must not be rewritten in place; deliver changes through a new forward migration
- each migration version must be unique
- byte-identical duplicate migration files are rejected by CI
- the README migration manifest must match the repository ledger
- remote schema changes must be delivered through migrations rather than undocumented Dashboard/SQL-editor edits
- before deleting or renaming a migration during ledger repair, verify its status against every shared remote database that may have applied it

See [`docs/MIGRATIONS.md`](MIGRATIONS.md) for the operational migration workflow and ledger-reconciliation rules.

## Current directory boundaries

```text
app/
  (auth)/              authentication UI
  (dashboard)/         authenticated dashboard routes
  auth/                auth callback/sign-out routes
  onboarding/          first-workspace creation flow

components/
  dashboard/           dashboard shell
  tenant/              workspace selection UI

lib/
  auth/                server-side auth guards
  supabase/            SSR/browser/proxy clients and types
  tenant/              active tenant resolution/actions

supabase/migrations/   database schema, functions and RLS policies
```

## Architectural rules for future changes

1. Tenant isolation is enforced at the database layer as well as the application layer.
2. Client-side checks are UX only; they are never security controls.
3. Privileged database credentials never enter browser bundles.
4. Tenant membership identity is immutable.
5. Every active tenant retains an active owner.
6. New tenant-owned tables must have RLS before product code depends on them.
7. Cross-tenant queries require an explicit, reviewed platform-level use case.
8. Server actions and routes must validate user input and authorization independently.
9. Schema changes are delivered through ordered migrations, not undocumented dashboard edits.
10. Applied migration history is immutable; fixes are forward-only.
11. Documentation must be updated when a security or trust boundary changes.

## Near-term evolution

Before the first stable OSS release, the architecture work focuses on:
- workspace settings
- membership management flows
- role-management boundaries
- consistent authorization errors
- automated checks around critical auth/tenant paths
- CI validation

The goal is not to make Veyra a framework. It should remain a compact, understandable reference implementation that can be extended into a real SaaS product.
