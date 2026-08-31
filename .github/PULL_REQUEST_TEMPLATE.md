## Problem

Describe the concrete problem this pull request solves.

## Scope

- What changed:
- Intentionally not changed:

## Security / tenant boundary

Describe any effect on authentication, authorization, RLS, tenant isolation, invitations, redirects, cookies, SECURITY DEFINER functions, or privileged configuration. Write `None` when not applicable.

## Database / configuration

List migrations, environment variables, deployment steps, or configuration changes. Write `None` when not applicable.

## Validation

- [ ] `node scripts/validate-migrations.mjs`
- [ ] `node scripts/validate-auth-routing.mjs`
- [ ] `node scripts/validate-timezones.mjs`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `supabase test db` when database/security behavior is affected

## Documentation

- [ ] Documentation is updated, or no documentation change is required.
