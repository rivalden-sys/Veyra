begin;

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;

grant execute on function private.is_super_admin(uuid) to authenticated;
grant execute on function private.is_tenant_member(uuid, uuid) to authenticated;
grant execute on function private.has_tenant_role(uuid, public.app_role[], uuid) to authenticated;
grant execute on function private.shares_tenant_with(uuid, uuid) to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, update on public.tenants to authenticated;
grant select, insert, update, delete on public.tenant_memberships to authenticated;
grant select on public.platform_admins to authenticated;
grant select, insert, update on public.user_tenant_preferences to authenticated;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.user_tenant_preferences enable row level security;

drop policy if exists "profiles_select_visible_users" on public.profiles;
create policy "profiles_select_visible_users"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.is_super_admin((select auth.uid()))
  or private.shares_tenant_with(id, (select auth.uid()))
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "profiles_update_self_or_super_admin" on public.profiles;
create policy "profiles_update_self_or_super_admin"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or private.is_super_admin((select auth.uid()))
)
with check (
  id = (select auth.uid())
  or private.is_super_admin((select auth.uid()))
);

drop policy if exists "tenants_select_member_or_super_admin" on public.tenants;
create policy "tenants_select_member_or_super_admin"
on public.tenants
for select
to authenticated
using (
  private.is_super_admin((select auth.uid()))
  or private.is_tenant_member(id, (select auth.uid()))
);

drop policy if exists "tenants_update_owner_or_super_admin" on public.tenants;
create policy "tenants_update_owner_or_super_admin"
on public.tenants
for update
to authenticated
using (
  private.has_tenant_role(id, array['owner']::public.app_role[], (select auth.uid()))
)
with check (
  private.has_tenant_role(id, array['owner']::public.app_role[], (select auth.uid()))
);

drop policy if exists "tenant_memberships_select_same_tenant" on public.tenant_memberships;
create policy "tenant_memberships_select_same_tenant"
on public.tenant_memberships
for select
to authenticated
using (
  private.is_super_admin((select auth.uid()))
  or private.is_tenant_member(tenant_id, (select auth.uid()))
);

drop policy if exists "tenant_memberships_insert_owner_or_super_admin" on public.tenant_memberships;
create policy "tenant_memberships_insert_owner_or_super_admin"
on public.tenant_memberships
for insert
to authenticated
with check (
  role <> 'super_admin'
  and private.has_tenant_role(tenant_id, array['owner']::public.app_role[], (select auth.uid()))
);

drop policy if exists "tenant_memberships_update_owner_or_super_admin" on public.tenant_memberships;
create policy "tenant_memberships_update_owner_or_super_admin"
on public.tenant_memberships
for update
to authenticated
using (
  private.has_tenant_role(tenant_id, array['owner']::public.app_role[], (select auth.uid()))
)
with check (
  role <> 'super_admin'
  and private.has_tenant_role(tenant_id, array['owner']::public.app_role[], (select auth.uid()))
);

drop policy if exists "tenant_memberships_delete_owner_or_super_admin" on public.tenant_memberships;
create policy "tenant_memberships_delete_owner_or_super_admin"
on public.tenant_memberships
for delete
to authenticated
using (
  private.has_tenant_role(tenant_id, array['owner']::public.app_role[], (select auth.uid()))
);

drop policy if exists "platform_admins_select_super_admin" on public.platform_admins;
create policy "platform_admins_select_super_admin"
on public.platform_admins
for select
to authenticated
using (private.is_super_admin((select auth.uid())));

drop policy if exists "user_tenant_preferences_select_own" on public.user_tenant_preferences;
create policy "user_tenant_preferences_select_own"
on public.user_tenant_preferences
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "user_tenant_preferences_insert_own_member_tenant" on public.user_tenant_preferences;
create policy "user_tenant_preferences_insert_own_member_tenant"
on public.user_tenant_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    active_tenant_id is null
    or private.is_tenant_member(active_tenant_id, (select auth.uid()))
  )
);

drop policy if exists "user_tenant_preferences_update_own_member_tenant" on public.user_tenant_preferences;
create policy "user_tenant_preferences_update_own_member_tenant"
on public.user_tenant_preferences
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    active_tenant_id is null
    or private.is_tenant_member(active_tenant_id, (select auth.uid()))
  )
);

commit;
