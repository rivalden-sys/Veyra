import { Building2, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();
  const supabase = await createClient();

  const { count: activeMemberCount } = await supabase
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantContext.activeTenant.tenantId)
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[#667085]">
          {tenantContext.activeTenant.tenantSlug}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#15171a]">
          {tenantContext.activeTenant.tenantName}
        </h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <Building2 aria-hidden="true" className="mb-4 h-5 w-5 text-[#0f766e]" />
          <p className="text-sm font-medium text-[#667085]">Tenant</p>
          <p className="mt-1 text-xl font-semibold">
            {tenantContext.activeTenant.tenantStatus}
          </p>
        </div>
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <ShieldCheck
            aria-hidden="true"
            className="mb-4 h-5 w-5 text-[#0f766e]"
          />
          <p className="text-sm font-medium text-[#667085]">Role</p>
          <p className="mt-1 text-xl font-semibold">
            {tenantContext.activeTenant.role.replace("_", " ")}
          </p>
        </div>
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <Users aria-hidden="true" className="mb-4 h-5 w-5 text-[#0f766e]" />
          <p className="text-sm font-medium text-[#667085]">Active members</p>
          <p className="mt-1 text-xl font-semibold">{activeMemberCount ?? 0}</p>
        </div>
      </section>
    </div>
  );
}
