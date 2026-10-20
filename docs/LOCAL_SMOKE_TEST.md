# Local application smoke test

Use this checklist after setting up Veyra from a clean clone. It complements the automated checks in [TESTING.md](TESTING.md); it does not replace them.

## Prerequisites

- Follow the setup steps in [README.md](../README.md).
- Use a local development environment and disposable test accounts/workspaces.
- Start the app with `npm run dev`.
- Record **PASS**, **FAIL**, or **NOT RUN** for each scenario. Do not mark untested flows as passing.

## Manual scenarios

| ID | Scenario | Expected outcome |
| --- | --- | --- |
| S01 | Open a protected dashboard route while signed out. | The app requests sign-in rather than showing workspace data. |
| S02 | Sign in using a locally configured provider. | The user reaches the appropriate onboarding or dashboard route. |
| S03 | Create the first workspace as a new test user. | Onboarding completes and the new workspace appears as active. |
| S04 | Reload the dashboard after onboarding. | The existing workspace remains available; onboarding does not restart. |
| S05 | Switch between two workspaces belonging to the same test user. | The active workspace and displayed context change consistently. |
| S06 | Edit workspace name/timezone as an owner. | Saved values remain after a reload. |
| S07 | Attempt workspace settings as a non-owner member. | Restricted changes are not permitted. |
| S08 | Update the test user's profile. | Validation and save feedback are visible; saved values persist. |
| S09 | Navigate the login, onboarding and dashboard controls by keyboard. | Controls are reachable in logical order and focus is visible. |
| S10 | Sign out and revisit a protected route. | The signed-out user cannot continue into the dashboard. |

For failures, record the route, account role, browser, reproduction steps, expected/actual result, and a redacted screenshot if helpful. Create an issue only for a reproducible defect not already tracked.

This document is a **test plan**, not a claim that the scenarios have been executed successfully.
