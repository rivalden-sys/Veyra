import { MailPlus, Users } from "lucide-react";
import {
  createWorkspaceInvitation,
  revokeWorkspaceInvitation,
  updateMemberRole,
} from "@/app/(dashboard)/members/actions";
import { InviteLink } from "@/components/members/invite-link";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";

type MembersPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    invited?: string;
    revoked?: string;
    token?: string;
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

type InvitationRow = {
  id: string;
  email: string;
  role: "owner" | "service_advisor" | "mechanic" | "customer";
  expires_at: string;
  accepted_at: string | null;
};

type InviteLinkValue = {
  value: string;
  isShareable: boolean;
};

function buildInviteLink(token: string): InviteLinkValue {
  const invitePath = `/invite/${encodeURIComponent(token)}`;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredSiteUrl || !URL.canParse(configuredSiteUrl)) {
    return { value: invitePath, isShareable: false };
  }

  return {
    value: new URL(invitePath, configuredSiteUrl).toString(),
    isShareable: true,
  };
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const supabase = await createClient();
  const isOwner = context.activeTenant.role === "owner";

  const [{ data, error }, { data: invitationData, error: invitationError }] =
    await Promise.all([
      supabase
        .from("tenant_memberships")
        .select("id, user_id, role, status, profile:profiles(email, full_name)")
        .eq("tenant_id", context.activeTenant.tenantId)
        .order("created_at", { ascending: true }),
      isOwner
        ? supabase
            .from("tenant_invitations")
            .select("id, email, role, expires_at, accepted_at")
            .eq("tenant_id", context.activeTenant.tenantId)
            .is("accepted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (error) {
    throw new Error("Unable to load workspace members");
  }

  if (invitationError) {
    throw new Error("Unable to load workspace invitations");
  }

  const members = (data ?? []) as unknown as MemberRow[];
  const invitations = (invitationData ?? []) as unknown as InvitationRow[];
  const inviteLink = params.token ? buildInviteLink(params.token) : null;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Members</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#59616d]">
            Review workspace membership, manage roles, and create expiring invite
            links. Owner-only changes are enforced in server actions and Supabase
            RLS.
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

      {params.revoked ? (
        <div className="rounded-md border border-[#b7dfd5] bg-[#eefaf7] px-4 py-3 text-sm text-[#0f5f4d]">
          Invitation revoked.
        </div>
      ) : null}

      {params.invited && inviteLink ? (
        <div className="rounded-lg border border-[#b7dfd5] bg-[#eefaf7] p-5 text-sm text-[#0f5f4d]">
          <div className="min-w-0">
            <p className="font-semibold">Invitation created</p>
            {inviteLink.isShareable ? (
              <>
                <p className="mt-1 text-[#356a61]">
                  Share this link with the invited person. It is shown only after
                  creation; the database stores only a SHA-256 hash of the token.
                </p>
                <InviteLink value={inviteLink.value} />
              </>
            ) : (
              <div className="mt-2">
                <p className="text-[#8a5a16]">
                  A shareable URL could not be generated because
                  NEXT_PUBLIC_SITE_URL is missing or invalid. Configure the
                  canonical site URL before sharing this invitation externally.
                </p>
                <code className="mt-3 block overflow-x-auto rounded-md bg-white px-3 py-2 text-xs text-[#24282f]">
                  {inviteLink.value}
                </code>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isOwner ? (
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <MailPlus aria-hidden="true" className="h-5 w-5 text-[#0f766e]" />
            <div>
              <h2 className="font-semibold">Invite member</h2>
              <p className="text-sm text-[#667085]">
                Create a seven-day invite link tied to an email address.
              </p>
            </div>
          </div>
          <form
            action={createWorkspaceInvitation}
            className="grid gap-3 md:grid-cols-[1fr_190px_auto]"
          >
            <input
              className="h-10 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
              name="email"
              placeholder="person@example.com"
              required
              type="email"
            />
            <select
              className="h-10 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
              defaultValue="mechanic"
              name="role"
            >
              <option value="owner">Owner</option>
              <option value="service_advisor">Service advisor</option>
              <option value="mechanic">Mechanic</option>
              <option value="customer">Customer</option>
            </select>
            <button
              className="h-10 rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
              type="submit"
            >
              Create invite
            </button>
          </form>
        </div>
      ) : null}

      {isOwner && invitations.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#dde2ea] bg-white shadow-sm">
          <div className="border-b border-[#dde2ea] px-5 py-4">
            <p className="text-sm font-medium text-[#333942]">
              Pending invitations
            </p>
          </div>
          <div className="divide-y divide-[#e8ebf0]">
            {invitations.map((invitation) => (
              <div
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                key={invitation.id}
              >
                <div>
                  <p className="text-sm font-semibold text-[#24282f]">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-xs text-[#667085]">
                    {invitation.role.replace("_", " ")} · expires{" "}
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <form action={revokeWorkspaceInvitation}>
                  <input
                    name="invitationId"
                    type="hidden"
                    value={invitation.id}
                  />
                  <button
                    className="h-9 rounded-md border border-[#cfd6e1] bg-white px-3 text-sm font-semibold text-[#59616d] transition hover:bg-[#f1f4f8]"
                    type="submit"
                  >
                    Revoke
                  </button>
                </form>
              </div>
            ))}
          </div>
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
