begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

do $$
begin
  create type public.app_role as enum (
    'super_admin',
    'owner',
    'service_advisor',
    'mechanic',
    'customer'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tenant_status as enum (
    'active',
    'suspended',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.member_status as enum (
    'active',
    'invited',
    'disabled'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.slugify(input text)
returns text
language sql
immutable
strict
as $$
  select trim(
    both '-'
    from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g')
  );
$$;

commit;
