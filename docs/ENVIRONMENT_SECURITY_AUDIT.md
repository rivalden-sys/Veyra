# Environment security audit

Date: 2026-10-15

This document records a focused review of Veyra's current environment-variable surface and tracked ignore rules. It is intentionally limited to the repository state that can be verified from the current default branch; it is not a substitute for a full Git history secret scan.

## Scope

Reviewed:

- `.env.example`
- `.gitignore`
- `SECURITY.md`
- repository code-search checks for obvious privileged-secret naming such as `service_role`, `SUPABASE_SERVICE`, `SECRET`, and `API_KEY`

## Current verified state

The tracked environment template contains only these public configuration values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The values committed in `.env.example` are placeholders. No Supabase service-role key or other privileged credential is present in that template.

The security policy already states that public and privileged credentials must remain separated and identifies exposed credentials or service-role keys as high-priority security issues.

## Ignore-rule gap

The current `.gitignore` protects:

```text
.env
.env*.local
```

This does not cover common non-local environment filenames such as:

```text
.env.development
.env.production
.env.test
```

Those files can contain privileged runtime values in real projects. Accidentally creating one locally would therefore leave it visible to Git unless it is ignored by another mechanism.

## Recommended remediation

Prefer an allowlist-style rule that ignores all environment files while explicitly keeping the public example template trackable:

```gitignore
.env*
!.env.example
```

Before applying this change, verify that the repository does not intentionally track any other `.env.*` file.

## Additional recommendations

1. Keep privileged Supabase credentials server-only and never expose them through a `NEXT_PUBLIC_*` variable.
2. Keep `.env.example` limited to placeholders and variables required for local setup.
3. Add a lightweight repository validation that rejects tracked environment files other than the approved example template.
4. Perform a dedicated Git history secret scan before the first stable OSS release; the current review covers the present repository surface only.
5. Re-run the audit whenever new deployment integrations, service credentials, or server-side providers are added.

## Status

Current template safety: **pass**

Current ignore coverage: **needs hardening**

History-level secret scan: **not yet verified**
