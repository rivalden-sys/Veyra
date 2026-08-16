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

function ownerOnlyMessage() {
  return "/members?error=Only%20workspace%20owners%20can%20manage%20members";
}

export async function updateMemberRole(formData: FormData) {
  const context = await getTenantContext();

  if (context.activeTenant.role !== "owner") {
    redirect(ownerOnlyMessage());
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

export async function createWorkspaceInvitation(formData: FormData) {
  const context = await getTenantContext();

  if (context.activeTenant.role !== "owner") {
    redirect(ownerOnlyMessage());
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim() as AppRole;

  if (!email || !email.includes("@") || !editableRoles.has(role)) {
    redirect("/members?error=Enter%20a%20valid%20email%20and%20role");
  }

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("create_tenant_invitation", {
    invited_email: email,
    invited_role: role,
    selected_tenant_id: context.activeTenant.tenantId,
  });

  if (error || !token) {
    const message = error?.message.includes("already_a_member")
      ? "This person is already an active member"
      : "Unable to create invitation";
    redirect(`/members?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/members");
  redirect(`/members?invited=1&token=${encodeURIComponent(token)}`);
}

export async function revokeWorkspaceInvitation(formData: FormData) {
  const context = await getTenantContext();

  if (context.activeTenant.role !== "owner") {
    redirect(ownerOnlyMessage());
  }

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) {
    redirect("/members?error=Invalid%20invitation");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("accepted_at", null);

  if (error) {
    redirect("/members?error=Unable%20to%20revoke%20invitation");
  }

  revalidatePath("/members");
  redirect("/members?revoked=1");
}
