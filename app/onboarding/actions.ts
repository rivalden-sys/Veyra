"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveTenantCookie } from "@/lib/tenant/actions";
import { canonicalizeTimeZone } from "@/lib/timezone";

export async function completeOnboarding(formData: FormData) {
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const tenantSlug = String(formData.get("tenantSlug") ?? "")
    .trim()
    .toLowerCase();
  const timezoneEntry = formData.get("tenantTimezone");
  const requestedTimezone =
    timezoneEntry === null ? "UTC" : String(timezoneEntry).trim();
  const tenantTimezone = canonicalizeTimeZone(requestedTimezone);

  if (tenantName.length < 2 || tenantName.length > 120) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Workspace name must be between 2 and 120 characters")}`,
    );
  }

  if (tenantSlug && !/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(tenantSlug)) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Workspace slug must use 3–64 lowercase letters, numbers, or hyphens")}`,
    );
  }

  if (!tenantTimezone) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Unsupported timezone")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  // Idempotency guard: an authenticated user who already belongs to an active
  // workspace should never create a second tenant by replaying onboarding.
  const { data: existingMembership, error: membershipError } = await supabase
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Unable to verify your workspace membership")}`,
    );
  }

  if (existingMembership) {
    await setActiveTenantCookie(existingMembership.tenant_id);
    redirect("/dashboard");
  }

  const { data: tenantId, error } = await supabase.rpc(
    "create_tenant_for_current_user",
    {
      tenant_name: tenantName,
      tenant_slug: tenantSlug || null,
      tenant_timezone: tenantTimezone,
    },
  );

  if (error || !tenantId) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Unable to create the workspace. Try a different name or slug.")}`,
    );
  }

  await setActiveTenantCookie(tenantId);
  redirect("/dashboard");
}
