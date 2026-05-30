import { ArrowRightLeft } from "lucide-react";
import { switchTenant } from "@/lib/tenant/actions";
import type { TenantContext } from "@/lib/tenant/context";

type TenantSwitcherProps = {
  tenantContext: TenantContext;
};

export function TenantSwitcher({ tenantContext }: TenantSwitcherProps) {
  return (
    <form action={switchTenant} className="flex items-center gap-2">
      <label className="sr-only" htmlFor="tenantId">
        Tenant
      </label>
      <select
        className="h-10 min-w-48 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm font-medium text-[#333942] outline-none"
        defaultValue={tenantContext.activeTenant.tenantId}
        id="tenantId"
        name="tenantId"
      >
        {tenantContext.memberships.map((membership) => (
          <option key={membership.tenantId} value={membership.tenantId}>
            {membership.tenantName}
          </option>
        ))}
      </select>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfd6e1] bg-white text-[#333942] transition hover:bg-[#f1f4f8]"
        title="Switch tenant"
        type="submit"
      >
        <ArrowRightLeft aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Switch tenant</span>
      </button>
    </form>
  );
}
