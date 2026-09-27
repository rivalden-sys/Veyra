"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { parseProfileInput } from "@/lib/profile/input";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = parseProfileInput(formData);

  if (!parsed.ok) {
    redirect(`/account?error=${encodeURIComponent(parsed.message)}`);
  }

  const supabase = await createClient();
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.value.fullName,
      phone: parsed.value.phone,
      locale: parsed.value.locale,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error || !updatedProfile) {
    redirect("/account?error=Unable%20to%20update%20your%20profile");
  }

  revalidatePath("/account");
  revalidatePath("/members");
  redirect("/account?saved=1");
}
