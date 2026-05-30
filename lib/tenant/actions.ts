"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant/context";

const tenantCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function switchTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");

  if (!tenantId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_active_tenant", {
    selected_tenant_id: tenantId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, tenantCookieOptions);

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function setActiveTenantCookie(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, tenantCookieOptions);
}
