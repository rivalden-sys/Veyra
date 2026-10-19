# Keyboard accessibility QA

This is a manual regression checklist for the current Veyra v0.1.0 interface. It complements the automated checks in [TESTING.md](TESTING.md); it is not evidence that a browser accessibility audit has passed.

## Scope and prerequisites

Test the login page, first-workspace onboarding, dashboard navigation, workspace switcher, members, workspace settings, and account settings. Use a local development environment with test accounts and at least two test workspaces. No production data is required.

Use a desktop browser at 100% zoom, repeat at 200% zoom and at a 375px-wide viewport, and check at least one second browser. Navigate with the keyboard only: Tab, Shift+Tab, Enter, Space, and arrow keys. Record browser, viewport, route, steps, expected result, actual result, and screenshot when a case fails.

## Test cases

| ID | Area | Steps | Expected result |
| --- | --- | --- | --- |
| K01 | Login | Tab through Google sign-in, email, and magic-link submit. | Every interactive control is reachable in logical reading order and has a clearly visible focus indicator. |
| K02 | Login | Submit an empty or invalid email, then a valid test email. | Browser validation is understandable; successful submission displays a status message that assistive technology can announce. |
| K03 | Login | Trigger a handled sign-in error using a test flow. | Error is visible, readable, and announced without requiring pointer interaction. |
| K04 | Onboarding | Tab through garage name, slug, timezone, and Continue. | Each field has a programmatic label; select can be changed using arrow keys; focused field remains visually identifiable. |
| K05 | Onboarding | Submit an invalid slug or missing required name. | Validation can be discovered without a mouse; keyboard focus does not become trapped. |
| K06 | Dashboard | Tab from the header through workspace switcher, sign-out, and sidebar links. | All controls are reachable, focus order follows the visual layout, and the current location is understandable. |
| K07 | Workspace switcher | Select another workspace with keyboard and activate Switch tenant. | The selected workspace becomes active; the resulting page is usable by keyboard after navigation. |
| K08 | Members and settings | Tab through forms, buttons, and any available member actions. | All actions are keyboard-operable and labels/feedback remain clear at 200% zoom. |
| K09 | Account settings | Edit a test profile field, submit, and observe feedback. | Save state and success/error feedback are perceivable without a pointer; no unexpected focus loss occurs. |
| K10 | Small viewport | Repeat K01, K04, K06, and K08 at 375px width. | No interactive element is hidden behind overflow or inaccessible to keyboard navigation. |

## Code-review observations to validate

These observations are based on the current default-branch source, not a completed browser test:

- `app/(auth)/login/page.tsx`: the email input uses `outline-none` inside a bordered wrapper. Confirm that the focused input has a visible indicator; if not, a future UI fix should add a focus style on the wrapper or input.
- `app/onboarding/page.tsx`: the garage name, slug, and timezone controls use `outline-none`. Verify keyboard focus visibility for each field.
- `components/tenant/tenant-switcher.tsx`: the workspace select uses `outline-none`. Verify its focus indicator and keyboard selection.
- `components/dashboard/dashboard-shell.tsx`: verify visible focus and sensible order for header actions and sidebar links.

A missing CSS outline alone does not prove a WCAG failure: test the rendered browser focus indicator before opening a defect. Do not change the existing application code as part of this documentation-only check.

## Recording results

For each case, record **PASS**, **FAIL**, or **NOT RUN**, with a short reproduction note. Do not mark unexecuted tests as passing. Open a focused issue for a confirmed failure with route, keyboard sequence, expected/actual behavior, browser, viewport, and relevant screenshot. Re-test the affected case after any approved UI change.

Reference: WCAG 2.2, [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) and [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).
