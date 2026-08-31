# Veyra

Veyra is an open-source multi-tenant SaaS foundation built with Next.js, React, TypeScript, Supabase, and Tailwind CSS.

It provides the application plumbing that many SaaS products need before product-specific features can begin: authentication, onboarding, workspaces, memberships, roles, active-tenant context, Row Level Security, and a dashboard shell.

## Why Veyra

Building a multi-tenant SaaS correctly requires more than a login page. Tenant isolation, membership authorization, onboarding state, active workspace selection, server/client boundaries, and database policies all need to agree with each other.

Veyra keeps those concerns together in one small reference implementation that can be studied, forked, or extended into a product.

## Current status

Veyra is currently an early `v0.1.0` foundation. The core authentication and multi-tenant model exist, while workspace management and product-quality UX are still being hardened.

The repository is intentionally focused on a reliable foundation rather than a large feature surface.

## Included

- Next.js App Router application
- React + TypeScript
- Supabase Auth
- Google OAuth and Magic Link authentication flows
- User profiles
- Tenant/workspace creation
- Tenant memberships and roles
- Active tenant preference
- Tenant switcher
- Onboarding flow
- Row Level Security policies
- Server-side tenant authorization helpers
- Dashboard shell
- SQL migrations kept in source control
- Environment example for local setup

## Architecture at a glance

```text
Browser
  |
  v
Next.js App Router
  |-- auth routes / server actions
  |-- onboarding
  |-- dashboard
  |-- tenant switcher
  |
  v
Supabase SSR client
  |
  +--> Supabase Auth
  |
  +--> Postgres
         |-- profiles
         |-- tenants
         |-- tenant_memberships
         |-- user_tenant_preferences
         |-- platform_admins
         +-- RLS policies + security-definer helpers
```

For a deeper explanation, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Requirements

- Node.js 20+
- npm
- A Supabase project

## Local development

1. Clone the repository.

```bash
git clone https://github.com/rivalden-sys/Veyra.git
cd Veyra
```

2. Install dependencies.

```bash
npm install
```

3. Copy the environment template.

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. Configure the variables in `.env.local`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Never commit real credentials.

5. Apply the migrations from `supabase/migrations` in timestamp order.

Current migration sequence:

<!-- migration-ledger:start -->
```text
20260816101941_foundation_types.sql
20260816102007_core_multi_tenant_schema.sql
20260816102020_rls_policies.sql
20260816102039_workspace_invitations.sql
20260831115900_fix_workspace_invitation_crypto_schema.sql
```
<!-- migration-ledger:end -->

See [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) for migration and drift-handling rules.

6. Enable the authentication providers you want in Supabase Auth.

For the existing Google OAuth and Magic Link flows, configure callback URLs for:

```text
http://localhost:3000/auth/callback
https://your-domain.example/auth/callback
```

7. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
node scripts/validate-timezones.mjs
node scripts/validate-migrations.mjs
npm run lint
npm run typecheck
npm run build
```

The CI workflow runs static quality checks on pushes and pull requests. Database security validation is documented in [`docs/TESTING.md`](docs/TESTING.md).

## Multi-tenant security model

Veyra treats tenant isolation as a database-level security concern, not only a UI concern.

The database uses:

- Row Level Security on tenant-sensitive tables
- membership-aware helper functions
- owner checks for tenant administration
- immutable membership identity
- protection against removing the final active owner
- active tenant validation

Application code must still perform explicit authorization and must never treat client-provided tenant identifiers as trusted input.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the current trust boundaries and invariants.

## Project structure

```text
app/                    Next.js routes, auth, onboarding and dashboard
components/             shared UI and tenant/dashboard components
lib/auth/               authentication guards
lib/supabase/           Supabase client/server/proxy configuration
lib/tenant/             tenant context and actions
supabase/migrations/    database schema and RLS migrations
docs/                   engineering documentation
.github/workflows/      CI configuration
```

## Roadmap to v0.1.0

- harden workspace settings and management
- complete membership/role UX
- improve loading, empty and error states
- verify tenant authorization paths
- expand automated validation for critical flows
- publish the first stable OSS release

## Contributing

Contributions and issue reports are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

For security issues, follow [`SECURITY.md`](SECURITY.md) instead of opening a public vulnerability report.

## License

Veyra is licensed under the MIT License. See [`LICENSE`](LICENSE).
