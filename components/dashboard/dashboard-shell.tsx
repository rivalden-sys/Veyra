import { Gauge, LogOut } from "lucide-react";
import Link from "next/link";
import { TenantSwitcher } from "@/components/tenant/tenant-switcher";
import type { TenantContext } from "@/lib/tenant/context";

type DashboardShellProps = {
  children: React.ReactNode;
  tenantContext: TenantContext;
};

export function DashboardShell({
  children,
  tenantContext,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#15171a]">
      <header className="border-b border-[#dde2ea] bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <Link className="flex items-center gap-3" href="/dashboard">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0f766e] text-white">
              <Gauge aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">Veyra</span>
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <TenantSwitcher tenantContext={tenantContext} />
            <form action="/auth/sign-out" method="post">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm font-semibold text-[#333942] transition hover:bg-[#f1f4f8]"
                type="submit"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="rounded-lg border border-[#dde2ea] bg-white p-3 shadow-sm md:min-h-[calc(100vh-7rem)]">
          <nav aria-label="Dashboard" className="space-y-1">
            <Link
              className="flex h-10 items-center gap-2 rounded-md bg-[#e7f5f2] px-3 text-sm font-semibold text-[#0f5f4d]"
              href="/dashboard"
            >
              <Gauge aria-hidden="true" className="h-4 w-4" />
              Dashboard
            </Link>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
