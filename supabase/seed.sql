-- Seed fixtures for local / CI (test-plan.md §3)
-- PROVISIONAL: material catalogue is placeholder until Kuei provides the official list (B-036 / Q-029).
-- Fixture login password is hashed as seedpass01 below. App/e2e may read SEED_PASSWORD env (default seedpass01); SQL does not use env.

BEGIN;

-- ---------------------------------------------------------------------------
-- Auth users (linked to public.accounts below)
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'seed-owner@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-owner"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'seed-admin@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'seed-user-west@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-user-west"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'seed-user-south@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-user-south"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'seed-user-west-bm@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-user-west-bm"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000006',
    'authenticated',
    'authenticated',
    'seed-user-west-2@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-user-west-2"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000001-0001-4000-8000-000000000007',
    'authenticated',
    'authenticated',
    'seed-user-west-3@fixture.yc-daily-report.local',
    crypt('seedpass01', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fixture":"seed-user-west-3"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email LIKE '%@fixture.yc-daily-report.local';

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

INSERT INTO public.accounts (
  id,
  auth_user_id,
  display_name,
  role,
  zone,
  big_meter
)
VALUES
  (
    'b0000001-0001-4000-8000-000000000001',
    'a0000001-0001-4000-8000-000000000001',
    'Kuei',
    'OWNER',
    'WEST',
    false
  ),
  (
    'b0000001-0001-4000-8000-000000000002',
    'a0000001-0001-4000-8000-000000000002',
    '種子管理員',
    'ADMIN',
    'WEST',
    false
  ),
  (
    'b0000001-0001-4000-8000-000000000003',
    'a0000001-0001-4000-8000-000000000003',
    '種子西區',
    'USER',
    'WEST',
    false
  ),
  (
    'b0000001-0001-4000-8000-000000000004',
    'a0000001-0001-4000-8000-000000000004',
    '種子南區',
    'USER',
    'SOUTH',
    false
  ),
  (
    'b0000001-0001-4000-8000-000000000005',
    'a0000001-0001-4000-8000-000000000005',
    '種子大表',
    'USER',
    'WEST',
    true
  ),
  (
    'b0000001-0001-4000-8000-000000000006',
    'a0000001-0001-4000-8000-000000000006',
    '種子西區二',
    'USER',
    'WEST',
    false
  ),
  (
    'b0000001-0001-4000-8000-000000000007',
    'a0000001-0001-4000-8000-000000000007',
    '種子西區三',
    'USER',
    'WEST',
    false
  );

-- ---------------------------------------------------------------------------
-- system_settings & retention cap
-- ---------------------------------------------------------------------------

INSERT INTO public.system_settings (id)
VALUES (1);

INSERT INTO public.retention_annual_caps (calendar_year, cap_ntd)
VALUES (2026, 60000);

-- Full work-item catalogues spec §4 (B-038–B-040)
\ir seeds/work_items_full.sql

-- ---------------------------------------------------------------------------
-- Placeholder materials (PROVISIONAL)
-- ---------------------------------------------------------------------------

INSERT INTO public.materials (
  id,
  code,
  name,
  specification,
  unit,
  cumulative_usage,
  received_qty,
  remaining_qty,
  tab,
  display_order
)
VALUES
  (
    'c0000001-0001-4000-8000-000000000001',
    'MAT-001',
    '佔位材料甲',
    '規格待確認',
    '個',
    0,
    100,
    100,
    1,
    1
  ),
  (
    'c0000001-0001-4000-8000-000000000002',
    NULL,
    '佔位材料乙',
    NULL,
    '米',
    0,
    50,
    50,
    1,
    2
  ),
  (
    'c0000001-0001-4000-8000-000000000003',
    'MAT-003',
    '佔位材料丙',
    NULL,
    '組',
    10,
    40,
    30,
    1,
    3
  );

COMMIT;
