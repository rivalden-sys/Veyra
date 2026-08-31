begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(23);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'owner-a@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'advisor-a@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'owner-b@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000004', 'invitee@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000005', 'mismatch@example.com', '{}');

insert into public.tenants (id, name, slug, timezone, created_by)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Workspace A',
    'workspace-a',
    'Europe/Warsaw',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Workspace B',
    'workspace-b',
    'UTC',
    '00000000-0000-0000-0000-000000000003'
  );

insert into public.tenant_memberships (
  tenant_id,
  user_id,
  role,
  status,
  accepted_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner',
    'active',
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'service_advisor',
    'active',
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'owner',
    'active',
    now()
  );

create temporary table test_tokens (
  name text primary key,
  token text not null
) on commit drop;

grant all on table test_tokens to authenticated;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenants'::regclass),
  'tenants has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenant_memberships'::regclass),
  'tenant_memberships has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenant_invitations'::regclass),
  'tenant_invitations has RLS enabled'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.tenants),
  1,
  'a non-owner only sees their own workspace'
);

select is(
  (
    with changed as (
      update public.tenants
      set name = 'Advisor changed workspace'
      where id = '10000000-0000-0000-0000-000000000001'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'a non-owner cannot update workspace settings'
);

select is(
  (
    with changed as (
      update public.tenant_memberships
      set role = 'mechanic'
      where tenant_id = '10000000-0000-0000-0000-000000000001'
        and user_id = '00000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'a non-owner cannot change membership roles'
);

select throws_ok(
  $test$
    select public.create_tenant_invitation(
      'blocked@example.com',
      'mechanic'::public.app_role,
      '10000000-0000-0000-0000-000000000001'::uuid
    )
  $test$,
  '42501',
  'owner_required',
  'a non-owner cannot create workspace invitations'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    with changed as (
      update public.tenants
      set name = 'Workspace A updated'
      where id = '10000000-0000-0000-0000-000000000001'
      returning id
    )
    select count(*)::integer from changed
  ),
  1,
  'an owner can update their workspace settings'
);

select is(
  (
    with changed as (
      update public.tenants
      set name = 'Workspace B compromised'
      where id = '10000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'an owner cannot update another tenant workspace'
);

select is(
  (
    with changed as (
      update public.tenant_memberships
      set role = 'mechanic'
      where tenant_id = '10000000-0000-0000-0000-000000000001'
        and user_id = '00000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::integer from changed
  ),
  1,
  'an owner can change a role inside their workspace'
);

select is(
  (
    with changed as (
      update public.tenant_memberships
      set role = 'mechanic'
      where tenant_id = '10000000-0000-0000-0000-000000000002'
        and user_id = '00000000-0000-0000-0000-000000000003'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'an owner cannot change a role in another tenant'
);

select throws_ok(
  $test$
    update public.tenant_memberships
    set role = 'mechanic'
    where tenant_id = '10000000-0000-0000-0000-000000000001'
      and user_id = '00000000-0000-0000-0000-000000000001'
  $test$,
  '23514',
  'tenant_must_keep_active_owner',
  'the final active owner cannot be demoted'
);

select throws_ok(
  $test$
    select public.create_tenant_invitation(
      'cross-tenant@example.com',
      'mechanic'::public.app_role,
      '10000000-0000-0000-0000-000000000002'::uuid
    )
  $test$,
  '42501',
  'owner_required',
  'an owner cannot create an invitation for another tenant'
);

insert into test_tokens (name, token)
select
  'revoke-own',
  public.create_tenant_invitation(
    'revoke-own@example.com',
    'mechanic'::public.app_role,
    '10000000-0000-0000-0000-000000000001'::uuid
  );

select ok(
  (select length(token) = 64 from test_tokens where name = 'revoke-own'),
  'invitation creation returns a random plaintext token'
);

select is(
  (
    with deleted as (
      delete from public.tenant_invitations
      where tenant_id = '10000000-0000-0000-0000-000000000001'
        and email = 'revoke-own@example.com'
      returning id
    )
    select count(*)::integer from deleted
  ),
  1,
  'an owner can revoke a pending invitation in their workspace'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000003',
  true
);
set local role authenticated;

insert into test_tokens (name, token)
select
  'foreign',
  public.create_tenant_invitation(
    'foreign@example.com',
    'mechanic'::public.app_role,
    '10000000-0000-0000-0000-000000000002'::uuid
  );

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

select is(
  (
    with deleted as (
      delete from public.tenant_invitations
      where tenant_id = '10000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::integer from deleted
  ),
  0,
  'an owner cannot revoke another tenant invitation'
);

insert into test_tokens (name, token)
select
  'expired',
  public.create_tenant_invitation(
    'invitee@example.com',
    'mechanic'::public.app_role,
    '10000000-0000-0000-0000-000000000001'::uuid
  );

reset role;
update public.tenant_invitations
set expires_at = now() - interval '1 minute'
where tenant_id = '10000000-0000-0000-0000-000000000001'
  and email = 'invitee@example.com';

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000004',
  true
);
set local role authenticated;

select throws_ok(
  format(
    'select public.accept_tenant_invitation(%L)',
    (select token from test_tokens where name = 'expired')
  ),
  '22023',
  'invitation_invalid_or_expired',
  'an expired invitation cannot be accepted'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

insert into test_tokens (name, token)
select
  'valid',
  public.create_tenant_invitation(
    'invitee@example.com',
    'mechanic'::public.app_role,
    '10000000-0000-0000-0000-000000000001'::uuid
  );

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000005',
  true
);
set local role authenticated;

select throws_ok(
  format(
    'select public.accept_tenant_invitation(%L)',
    (select token from test_tokens where name = 'valid')
  ),
  '42501',
  'invitation_email_mismatch',
  'an invitation cannot be accepted by a different email account'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000004',
  true
);
set local role authenticated;

select is(
  public.accept_tenant_invitation(
    (select token from test_tokens where name = 'valid')
  ),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'a valid invitation is accepted into the intended workspace'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.tenant_memberships
    where tenant_id = '10000000-0000-0000-0000-000000000001'
      and user_id = '00000000-0000-0000-0000-000000000004'
      and role = 'mechanic'
      and status = 'active'
  ),
  1,
  'accepting an invitation creates the expected active membership'
);

select is(
  (
    select count(*)::integer
    from public.tenant_invitations
    where tenant_id = '10000000-0000-0000-0000-000000000001'
      and email = 'invitee@example.com'
      and accepted_at is not null
  ),
  1,
  'accepting an invitation marks the invitation as accepted'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000004',
  true
);
set local role authenticated;

select throws_ok(
  format(
    'select public.accept_tenant_invitation(%L)',
    (select token from test_tokens where name = 'valid')
  ),
  '22023',
  'invitation_invalid_or_expired',
  'an accepted invitation token cannot be reused'
);

select is(
  (select count(*)::integer from public.tenants),
  1,
  'an invited member only gains access to the accepted tenant'
);

select * from finish();
rollback;
