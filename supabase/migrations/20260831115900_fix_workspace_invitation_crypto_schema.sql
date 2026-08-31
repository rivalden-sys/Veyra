begin;

create or replace function public.create_tenant_invitation(
  invited_email text,
  invited_role public.app_role,
  selected_tenant_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  requester uuid := auth.uid();
  clean_email citext := lower(nullif(btrim(invited_email), ''))::citext;
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  hash_value text := encode(extensions.digest(raw_token, 'sha256'), 'hex');
begin
  if requester is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if clean_email is null then
    raise exception 'invitation_email_required' using errcode = '23514';
  end if;

  if invited_role = 'super_admin' then
    raise exception 'invalid_invitation_role' using errcode = '23514';
  end if;

  if not private.has_tenant_role(
    selected_tenant_id,
    array['owner']::public.app_role[],
    requester
  ) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.tenant_memberships membership
    join public.profiles profile on profile.id = membership.user_id
    where membership.tenant_id = selected_tenant_id
      and membership.status = 'active'
      and profile.email = clean_email
  ) then
    raise exception 'already_a_member' using errcode = '23505';
  end if;

  delete from public.tenant_invitations
  where tenant_id = selected_tenant_id
    and email = clean_email
    and accepted_at is null;

  insert into public.tenant_invitations (
    tenant_id,
    email,
    role,
    token_hash,
    invited_by
  )
  values (
    selected_tenant_id,
    clean_email,
    invited_role,
    hash_value,
    requester
  );

  return raw_token;
end;
$$;

create or replace function public.accept_tenant_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  requester uuid := auth.uid();
  requester_email citext;
  invitation public.tenant_invitations%rowtype;
begin
  if requester is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select lower(email)::citext
  into requester_email
  from auth.users
  where id = requester;

  if requester_email is null then
    raise exception 'account_email_required' using errcode = '23514';
  end if;

  select *
  into invitation
  from public.tenant_invitations
  where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if invitation.id is null then
    raise exception 'invitation_invalid_or_expired' using errcode = '22023';
  end if;

  if invitation.email <> requester_email then
    raise exception 'invitation_email_mismatch' using errcode = '42501';
  end if;

  insert into public.tenant_memberships (
    tenant_id,
    user_id,
    role,
    status,
    invited_by,
    accepted_at
  )
  values (
    invitation.tenant_id,
    requester,
    invitation.role,
    'active',
    invitation.invited_by,
    now()
  )
  on conflict (tenant_id, user_id) do update
  set
    role = excluded.role,
    status = 'active',
    invited_by = excluded.invited_by,
    accepted_at = coalesce(public.tenant_memberships.accepted_at, excluded.accepted_at),
    updated_at = now();

  update public.tenant_invitations
  set accepted_at = now()
  where id = invitation.id;

  insert into public.user_tenant_preferences (user_id, active_tenant_id)
  values (requester, invitation.tenant_id)
  on conflict (user_id) do update
  set active_tenant_id = excluded.active_tenant_id,
      updated_at = now();

  return invitation.tenant_id;
end;
$$;

revoke all on function public.create_tenant_invitation(text, public.app_role, uuid) from public;
revoke all on function public.create_tenant_invitation(text, public.app_role, uuid) from anon;
grant execute on function public.create_tenant_invitation(text, public.app_role, uuid) to authenticated;

revoke all on function public.accept_tenant_invitation(text) from public;
revoke all on function public.accept_tenant_invitation(text) from anon;
grant execute on function public.accept_tenant_invitation(text) to authenticated;

commit;
