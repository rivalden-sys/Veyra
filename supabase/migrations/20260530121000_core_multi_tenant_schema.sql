begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text,
  avatar_url text,
  phone text,
  locale text not null default 'en-US',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(btrim(email::text)) > 3)
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  timezone text not null default 'UTC',
  status public.tenant_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint tenants_slug_format check (slug::text ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  status public.member_status not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_memberships_unique_user unique (tenant_id, user_id),
  constraint tenant_memberships_no_platform_role check (role <> 'super_admin'),
  constraint tenant_memberships_active_is_accepted check (
    status <> 'active' or accepted_at is not null
  )
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_tenant_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx
  on public.profiles (email);

create index if not exists tenants_created_by_idx
  on public.tenants (created_by);

create index if not exists tenant_memberships_user_idx
  on public.tenant_memberships (user_id, status);

create index if not exists tenant_memberships_tenant_idx
  on public.tenant_memberships (tenant_id, status);

create index if not exists tenant_memberships_role_idx
  on public.tenant_memberships (tenant_id, role, status);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row
execute function private.set_updated_at();

drop trigger if exists tenant_memberships_set_updated_at on public.tenant_memberships;
create trigger tenant_memberships_set_updated_at
before update on public.tenant_memberships
for each row
execute function private.set_updated_at();

drop trigger if exists user_tenant_preferences_set_updated_at on public.user_tenant_preferences;
create trigger user_tenant_preferences_set_updated_at
before update on public.user_tenant_preferences
for each row
execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row
execute function private.handle_new_auth_user();

create or replace function private.is_super_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    exists (
      select 1
      from public.platform_admins
      where user_id = check_user_id
    ),
    false
  );
$$;

create or replace function private.is_tenant_member(
  check_tenant_id uuid,
  check_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    exists (
      select 1
      from public.tenant_memberships
      where tenant_id = check_tenant_id
        and user_id = check_user_id
        and status = 'active'
    ),
    false
  );
$$;

create or replace function private.has_tenant_role(
  check_tenant_id uuid,
  allowed_roles public.app_role[],
  check_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.is_super_admin(check_user_id)
    or coalesce(
      exists (
        select 1
        from public.tenant_memberships
        where tenant_id = check_tenant_id
          and user_id = check_user_id
          and status = 'active'
          and role = any(allowed_roles)
      ),
      false
    );
$$;

create or replace function private.shares_tenant_with(
  subject_user_id uuid,
  viewer_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    exists (
      select 1
      from public.tenant_memberships viewer
      join public.tenant_memberships subject
        on subject.tenant_id = viewer.tenant_id
      where viewer.user_id = viewer_user_id
        and viewer.status = 'active'
        and subject.user_id = subject_user_id
        and subject.status = 'active'
    ),
    false
  );
$$;

create or replace function private.enforce_membership_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'UPDATE' then
    if new.tenant_id <> old.tenant_id or new.user_id <> old.user_id then
      raise exception 'tenant_membership_identity_is_immutable'
        using errcode = '23514';
    end if;
  end if;

  if (
    tg_op = 'DELETE'
    and old.role = 'owner'
    and old.status = 'active'
  ) or (
    tg_op = 'UPDATE'
    and old.role = 'owner'
    and old.status = 'active'
    and (new.role <> 'owner' or new.status <> 'active')
  ) then
    if not exists (
      select 1
      from public.tenant_memberships
      where tenant_id = old.tenant_id
        and id <> old.id
        and role = 'owner'
        and status = 'active'
    ) then
      raise exception 'tenant_must_keep_active_owner'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists tenant_memberships_enforce_integrity on public.tenant_memberships;
create trigger tenant_memberships_enforce_integrity
before update or delete on public.tenant_memberships
for each row
execute function private.enforce_membership_integrity();

create or replace function public.create_tenant_for_current_user(
  tenant_name text,
  tenant_slug text default null,
  tenant_timezone text default 'UTC'
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requester uuid := auth.uid();
  clean_name text := nullif(btrim(tenant_name), '');
  base_slug text;
  final_slug text;
  suffix integer := 1;
  created_tenant_id uuid;
begin
  if requester is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if clean_name is null or length(clean_name) < 2 then
    raise exception 'tenant_name_required' using errcode = '23514';
  end if;

  base_slug := coalesce(
    nullif(private.slugify(tenant_slug), ''),
    nullif(private.slugify(clean_name), ''),
    'garage'
  );
  if length(base_slug) < 3 then
    base_slug := rpad(base_slug, 3, '0');
  end if;
  base_slug := left(base_slug, 56);
  final_slug := base_slug;

  while exists (
    select 1
    from public.tenants
    where slug = final_slug::citext
  ) loop
    suffix := suffix + 1;
    final_slug := left(base_slug, 56 - length(suffix::text)) || '-' || suffix::text;
  end loop;

  insert into public.tenants (
    name,
    slug,
    timezone,
    created_by
  )
  values (
    clean_name,
    final_slug,
    coalesce(nullif(btrim(tenant_timezone), ''), 'UTC'),
    requester
  )
  returning id into created_tenant_id;

  insert into public.tenant_memberships (
    tenant_id,
    user_id,
    role,
    status,
    accepted_at
  )
  values (
    created_tenant_id,
    requester,
    'owner',
    'active',
    now()
  );

  insert into public.user_tenant_preferences (
    user_id,
    active_tenant_id
  )
  values (
    requester,
    created_tenant_id
  )
  on conflict (user_id) do update
  set
    active_tenant_id = excluded.active_tenant_id,
    updated_at = now();

  update public.profiles
  set
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    updated_at = now()
  where id = requester;

  return created_tenant_id;
end;
$$;

create or replace function public.set_active_tenant(selected_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requester uuid := auth.uid();
begin
  if requester is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not private.is_tenant_member(selected_tenant_id, requester) then
    raise exception 'tenant_not_available' using errcode = '42501';
  end if;

  insert into public.user_tenant_preferences (
    user_id,
    active_tenant_id
  )
  values (
    requester,
    selected_tenant_id
  )
  on conflict (user_id) do update
  set
    active_tenant_id = excluded.active_tenant_id,
    updated_at = now();
end;
$$;

revoke all on function public.create_tenant_for_current_user(text, text, text) from public;
revoke all on function public.create_tenant_for_current_user(text, text, text) from anon;
grant execute on function public.create_tenant_for_current_user(text, text, text) to authenticated;

revoke all on function public.set_active_tenant(uuid) from public;
revoke all on function public.set_active_tenant(uuid) from anon;
grant execute on function public.set_active_tenant(uuid) to authenticated;

commit;
