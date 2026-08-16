import { Users } from "lucide-react";
import { updateMemberRole } from "@/app/(dashboard)/members/actions";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";

type MembersPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

type MemberRow = {
  id: string;
  user_id: string;
  role: "owner" | "service_advisor" | "mechanic" | "customer";
  status: "active" | "invited" | "disabled";
  profile: {
    email: string;
    full_name: string | null;
  } | null;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const supabase = await createClient();
  const isOwner = context.activeTenant.role === "owner";

  const { data, error } = await supabase
    .from("tenant_memberships")
    .select("id, user_id, role, status, profile:profiles(email, full_name)")
    .eq("tenant_id", context.activeTenant.tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load workspace members");
  }

  const members = (data ?? []) as unknown as MemberRow[];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Members</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#59616d]">
            Review workspace membership and manage roles. Owner-only changes are
            enforced both in the server action and by Supabase RLS.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e7f5f2] text-[#0f766e]">
          <Users aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      {params.error ? (
        <div className="rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]">
          {params.error}
        </div>
      ) : null}

      {params.saved ? (
        <div className="rounded-md border border-[#b7dfd5] bg-[#eefaf7] px-4 py-3 text-sm text-[#0f5f4d]">
          Member role updated.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#dde2ea] bg-white shadow-sm">
        <div className="border-b border-[#dde2ea] px-5 py-4">
          <p className="text-sm font-medium text-[#333942]">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="divide-y divide-[#e8ebf0]">
          {members.map((member) => {
            const displayName =
              member.profile?.full_name?.trim() ||
              member.profile?.email ||
              member.user_id;

            return (
              <div
                className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                key={member.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#24282f]">
                    {displayName}
                  </p>
                  {member.profile?.email ? (
                    <p className="mt-1 truncate text-sm text-[#667085]">
                      {member.profile.email}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#89919c]">
                    {member.status}
                  </p>
                </div>

                {isOwner ? (
                  <form
                    action={updateMemberRole}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="membershipId"
                      type="hidden"
                      value={member.id}
                    />
                    <select
                      className="h-10 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
                      defaultValue={member.role}
                      name="role"
                    >
                      <option value="owner">Owner</option>
                      <option value="service_advisor">Service advisor</option>
                      <option value="mechanic">Mechanic</option>
                      <option value="customer">Customer</option>
                    </select>
                    <button
                      className="h-10 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm font-semibold text-[#333942] transition hover:bg-[#f1f4f8]"
                      type="submit"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-[#f1f4f8] px-3 py-1 text-xs font-semibold text-[#59616d]">
                    {member.role.replace("_", " ")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
