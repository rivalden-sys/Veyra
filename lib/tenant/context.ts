import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import type { AppRole, MemberStatus, TenantStatus } from "@/lib/supabase/types";

export const ACTIVE_TENANT_COOKIE = "veyra_active_tenant";

type MembershipRow = {
  id: string;
  tenant_id: string;
  role: AppRole;
  status: MemberStatus;
  tenant: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    status: TenantStatus;
  };
};

export type TenantMembership = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantTimezone: string;
  tenantStatus: TenantStatus;
  role: AppRole;
  status: MemberStatus;
};

export type TenantContext = {
  userId: string;
  activeTenant: TenantMembership;
  memberships: TenantMembership[];
};

export async function getTenantContext(): Promise<TenantContext> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_memberships")
    .select(
      "id, tenant_id, role, status, tenant:tenants!inner(id, name, slug, timezone, status)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const memberships = ((data ?? []) as unknown as MembershipRow[])
    .filter((membership) => membership.tenant.status === "active")
    .map((membership) => ({
      id: membership.id,
      tenantId: membership.tenant_id,
      tenantName: membership.tenant.name,
      tenantSlug: membership.tenant.slug,
      tenantTimezone: membership.tenant.timezone,
      tenantStatus: membership.tenant.status,
      role: membership.role,
      status: membership.status,
    }));

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const requestedTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;

  const { data: preference } = await supabase
    .from("user_tenant_preferences")
    .select("active_tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const activeTenant =
    memberships.find((membership) => membership.tenantId === requestedTenantId) ??
    memberships.find(
      (membership) => membership.tenantId === preference?.active_tenant_id,
    ) ??
    memberships[0];

  return {
    userId: user.id,
    activeTenant,
    memberships,
  };
}
