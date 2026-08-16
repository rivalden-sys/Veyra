"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";

const allowedTimezones = new Set([
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Warsaw",
]);

export async function updateWorkspaceSettings(formData: FormData) {
  const context = await getTenantContext();

  if (context.activeTenant.role !== "owner") {
    redirect("/settings?error=Only%20workspace%20owners%20can%20change%20settings");
  }

  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "UTC").trim();

  if (name.length < 2 || name.length > 120) {
    redirect(
      "/settings?error=Workspace%20name%20must%20be%20between%202%20and%20120%20characters",
    );
  }

  if (!allowedTimezones.has(timezone)) {
    redirect("/settings?error=Unsupported%20timezone");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ name, timezone })
    .eq("id", context.activeTenant.tenantId);

  if (error) {
    redirect("/settings?error=Unable%20to%20update%20workspace%20settings");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
