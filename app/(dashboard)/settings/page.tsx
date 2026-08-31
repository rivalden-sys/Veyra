import { Settings } from "lucide-react";
import { updateWorkspaceSettings } from "@/app/(dashboard)/settings/actions";
import { getTenantContext } from "@/lib/tenant/context";
import {
  canonicalizeTimeZone,
  getSupportedTimeZones,
  groupTimeZones,
} from "@/lib/timezone";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const isOwner = context.activeTenant.role === "owner";
  const storedTimeZone = context.activeTenant.tenantTimezone;
  const canonicalTimeZone = canonicalizeTimeZone(storedTimeZone);
  const selectedTimeZone = canonicalTimeZone ?? "UTC";
  const timeZoneGroups = groupTimeZones(
    getSupportedTimeZones(selectedTimeZone),
  );
  const hasInvalidStoredTimeZone = canonicalTimeZone === null;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#59616d]">
            Manage the active workspace identity and timezone. Changes are
            restricted to workspace owners and are additionally enforced by
            database row-level security.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e7f5f2] text-[#0f766e]">
          <Settings aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      {params.error ? (
        <div
          className="rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]"
          role="alert"
        >
          {params.error}
        </div>
      ) : null}

      {params.saved ? (
        <div
          className="rounded-md border border-[#b7dfd5] bg-[#eefaf7] px-4 py-3 text-sm text-[#0f5f4d]"
          role="status"
        >
          Workspace settings saved.
        </div>
      ) : null}

      {hasInvalidStoredTimeZone ? (
        <div
          className="rounded-md border border-[#e7cf98] bg-[#fff9e8] px-4 py-3 text-sm text-[#765416]"
          role="alert"
        >
          The stored timezone <strong>{storedTimeZone}</strong> is not a valid
          IANA timezone. UTC is selected as a safe fallback. Saving the form will
          replace the legacy value.
        </div>
      ) : null}

      <div className="rounded-lg border border-[#dde2ea] bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-2 text-sm text-[#59616d] sm:grid-cols-2">
          <p>
            <span className="font-medium text-[#333942]">Slug:</span>{" "}
            {context.activeTenant.tenantSlug}
          </p>
          <p>
            <span className="font-medium text-[#333942]">Your role:</span>{" "}
            {context.activeTenant.role}
          </p>
        </div>

        <form action={updateWorkspaceSettings} className="space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#333942]"
              htmlFor="name"
            >
              Workspace name
            </label>
            <input
              className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none disabled:bg-[#f4f6f8] disabled:text-[#7b8490]"
              defaultValue={context.activeTenant.tenantName}
              disabled={!isOwner}
              id="name"
              maxLength={120}
              minLength={2}
              name="name"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#333942]"
              htmlFor="timezone"
            >
              Timezone
            </label>
            <select
              className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none disabled:bg-[#f4f6f8] disabled:text-[#7b8490]"
              defaultValue={selectedTimeZone}
              disabled={!isOwner}
              id="timezone"
              name="timezone"
            >
              {timeZoneGroups.map(([group, timeZones]) => (
                <optgroup key={group} label={group}>
                  {timeZones.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#7b8490]">
              Timezones use canonical IANA identifiers and are validated again
              on the server before saving.
            </p>
          </div>

          {isOwner ? (
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
              type="submit"
            >
              Save settings
            </button>
          ) : (
            <p className="text-sm text-[#59616d]">
              Only workspace owners can edit these settings.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
