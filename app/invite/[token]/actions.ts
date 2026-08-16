"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveTenantCookie } from "@/lib/tenant/actions";

export async function acceptWorkspaceInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/login?error=Invalid%20invitation");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data: tenantId, error } = await supabase.rpc(
    "accept_tenant_invitation",
    { invitation_token: token },
  );

  if (error || !tenantId) {
    const message = error?.message.includes("invitation_email_mismatch")
      ? "This invitation belongs to a different email address"
      : "This invitation is invalid or has expired";
    redirect(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(message)}`);
  }

  await setActiveTenantCookie(tenantId);
  redirect("/dashboard");
}
