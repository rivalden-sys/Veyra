"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveTenantCookie } from "@/lib/tenant/actions";

export async function completeOnboarding(formData: FormData) {
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
  const tenantTimezone = String(formData.get("tenantTimezone") ?? "UTC").trim();

  if (tenantName.length < 2) {
    redirect(
      `/onboarding?error=${encodeURIComponent("Garage name must be at least 2 characters")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tenantId, error } = await supabase.rpc(
    "create_tenant_for_current_user",
    {
      tenant_name: tenantName,
      tenant_slug: tenantSlug || null,
      tenant_timezone: tenantTimezone || "UTC",
    },
  );

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  await setActiveTenantCookie(tenantId);
  redirect("/dashboard");
}
