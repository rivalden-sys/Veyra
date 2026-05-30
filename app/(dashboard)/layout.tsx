import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTenantContext } from "@/lib/tenant/context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenantContext = await getTenantContext();

  return (
    <DashboardShell tenantContext={tenantContext}>{children}</DashboardShell>
  );
}
