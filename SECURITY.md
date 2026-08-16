# Security policy

Security reports are welcome and should be handled privately until a fix is available.

## Supported version

Veyra is currently in pre-1.0 development. Security fixes target the latest code on the active development branch and the most recent tagged release when one exists.

## Reporting a vulnerability

Please do not publish exploitable details in a public GitHub issue.

Use GitHub's private vulnerability reporting feature when it is available for this repository. If private reporting is unavailable, contact the repository maintainer privately through the contact method listed on the maintainer's GitHub profile.

Include:
- affected path or component
- reproduction steps
- expected and observed behavior
- impact assessment
- any suggested mitigation

Do not include real user credentials, private data, or production secrets in a report.

## Security model

Veyra relies on defense in depth:
- server-side authentication checks
- application-level tenant authorization
- Supabase/Postgres Row Level Security
- restricted security-definer functions
- separation of tenant roles from platform administration
- environment-variable separation between public and privileged credentials

See `docs/ARCHITECTURE.md` for the current trust boundaries and authorization invariants.

## Scope priorities

Reports involving the following are treated as high priority:
- cross-tenant data access
- authentication or session bypass
- RLS bypass
- unauthorized membership or role changes
- privilege escalation
- exposed credentials or service-role keys
- unsafe security-definer database functions
- ability to remove or bypass the final active tenant owner invariant

## Disclosure

Please allow reasonable time to investigate and release a fix before public disclosure. Once a fix is available, coordinated disclosure is preferred.
