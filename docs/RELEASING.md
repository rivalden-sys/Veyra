# Releasing Veyra

Veyra releases are cut from the protected `main` branch after all release blockers are closed.

## v0.1.0 release checklist

Before creating the first tag and GitHub Release, verify all of the following from the exact release candidate commit:

- [ ] `main` is the repository default branch.
- [ ] `main` requires pull requests plus successful `quality` and `database-security` checks.
- [ ] No unresolved high-priority release-blocker issue remains.
- [ ] A clean clone installs with `npm ci` using the documented Node.js version and `.env.example`.
- [ ] `node scripts/validate-migrations.mjs` passes.
- [ ] `node scripts/validate-auth-routing.mjs` passes.
- [ ] `node scripts/validate-timezones.mjs` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes with the documented public environment variables.
- [ ] A fresh local Supabase database starts from the complete migration ledger.
- [ ] `supabase test db` passes against that fresh database.
- [ ] Hosted Supabase migration history matches the source-controlled ledger for any migration intended to be deployed before release.
- [ ] `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, architecture, migration, and testing docs describe the current behavior.
- [ ] `package.json` version and release notes match the intended tag.
- [ ] Release notes summarize user-visible functionality, security hardening, migration requirements, known limitations, and upgrade/setup notes.
- [ ] The release candidate has a green CI run on `main`.

## Tagging

Use an annotated semantic-version tag from the verified `main` commit. For the first release, the intended tag is `v0.1.0` only after every checklist item above is satisfied.

Do not retag an existing published version to another commit. If a published release needs correction, ship a new patch version.

## Release notes

Release notes should include:

1. What Veyra provides at this version.
2. Security and tenant-isolation guarantees materially changed since the previous release.
3. Database migrations or deployment steps.
4. Configuration/environment changes.
5. Known limitations and intentionally unsupported behavior.
6. Verification performed for the release candidate.

## Post-release

After publishing:

- verify the GitHub Release points to the expected commit;
- verify installation links and documentation render correctly;
- keep the released migration ledger immutable;
- open follow-up issues for deferred work instead of silently changing the release contract.
