"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";
import type { AppRole } from "@/lib/supabase/types";

const editableRoles = new Set<AppRole>([
  "owner",
  "service_advisor",
  "mechanic",
  "customer",
]);

export async function updateMemberRole(formData: FormData) {
  const context = await getTenantContext();

  if (context.activeTenant.role !== "owner") {
    redirect("/members?error=Only%20workspace%20owners%20can%20change%20roles");
  }

  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as AppRole;

  if (!membershipId || !editableRoles.has(role)) {
    redirect("/members?error=Invalid%20member%20or%20role");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("tenant_id", context.activeTenant.tenantId);

  if (error) {
    const message = error.message.includes("tenant_must_keep_active_owner")
      ? "A workspace must keep at least one active owner"
      : "Unable to update member role";
    redirect(`/members?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");
  redirect("/members?saved=1");
}
