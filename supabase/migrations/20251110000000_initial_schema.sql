-- yc-daily-report-system initial schema (data-model.md §2–§3.20, B-037 audit types minus Removed)
-- Storage buckets ledger-evidence and archives are created via Supabase Storage dashboard/API (see comments at end).

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums (§2)
-- ---------------------------------------------------------------------------

CREATE TYPE public.account_role AS ENUM ('OWNER', 'ADMIN', 'USER');
CREATE TYPE public.zone AS ENUM ('WEST', 'SOUTH');
CREATE TYPE public.payment_method AS ENUM ('TRANSFER', 'CASH');
CREATE TYPE public.report_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE public.material_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.ledger_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE public.ledger_category AS ENUM (
  '材料費',
  '人工費',
  '雜支',
  '設備費',
  '運費',
  '其他'
);
CREATE TYPE public.price_set AS ENUM ('WEST', 'SOUTH', 'BIG_METER');
CREATE TYPE public.archive_type AS ENUM ('DAILY', 'MONTHLY');
CREATE TYPE public.archive_source AS ENUM ('AUTOMATIC', 'MANUAL');

CREATE TYPE public.audit_action AS ENUM (
  'REPORT_CREATE',
  'REPORT_UPDATE',
  'REPORT_DELETE',
  'REPORT_CONFIRM',
  'REPORT_REJECT',
  'REPORT_UNCONFIRM',
  'ACCOUNT_CREATE',
  'ACCOUNT_UPDATE',
  'ACCOUNT_ARCHIVE',
  'ACCOUNT_RESTORE',
  'PASSWORD_CHANGE',
  'MATERIAL_REQUEST',
  'MATERIAL_CANCEL',
  'MATERIAL_ADD',
  'MATERIAL_UPDATE',
  'MATERIAL_DELETE',
  'MATERIAL_APPROVE',
  'MATERIAL_REJECT',
  'MATERIAL_IMPORT',
  'MATERIAL_RESET',
  'MATERIAL_KEEP_A',
  'MATERIAL_SYNC_B',
  'SYSTEM_CONFIG',
  'RETENTION_RESET',
  'RETENTION_SET',
  'RETENTION_YEAR_END',
  'LEDGER_CREATE',
  'LEDGER_UPDATE',
  'LEDGER_DELETE',
  'LEDGER_SETTLE',
  'BANK_REVEAL',
  'EXPORT',
  'FILE_DOWNLOAD',
  'ACCESS_DENIED',
  'LEDGER_VOID',
  'ACCOUNT_ROLE_CHANGE',
  'ACCOUNT_LOCKOUT'
);

-- ---------------------------------------------------------------------------
-- Utility: updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3.1 accounts
-- ---------------------------------------------------------------------------

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE RESTRICT,
  display_name varchar(50) NOT NULL,
  role public.account_role NOT NULL,
  zone public.zone NOT NULL DEFAULT 'WEST',
  big_meter boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'TRANSFER',
  bank_account_ciphertext bytea,
  bank_account_last4 char(4),
  insurance_deduction integer NOT NULL DEFAULT 0,
  uninsured_exempt boolean NOT NULL DEFAULT false,
  uninsured_rate_override numeric(5, 2),
  fixed_salary integer NOT NULL DEFAULT 0,
  pay_fixed_every_period boolean NOT NULL DEFAULT false,
  failed_signin_count integer NOT NULL DEFAULT 0,
  lockout_until timestamptz,
  last_failed_signin_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounts_display_name_not_blank CHECK (length(trim(display_name)) > 0),
  CONSTRAINT accounts_insurance_deduction_nonneg CHECK (insurance_deduction >= 0),
  CONSTRAINT accounts_fixed_salary_nonneg CHECK (fixed_salary >= 0),
  CONSTRAINT accounts_failed_signin_nonneg CHECK (failed_signin_count >= 0),
  CONSTRAINT accounts_uninsured_rate_range CHECK (
    uninsured_rate_override IS NULL
    OR (uninsured_rate_override >= 0 AND uninsured_rate_override <= 100)
  ),
  CONSTRAINT accounts_owner_never_archived CHECK (
  NOT (role = 'OWNER' AND archived_at IS NOT NULL)
  ),
  CONSTRAINT accounts_bank_last4_digits CHECK (
    bank_account_last4 IS NULL OR bank_account_last4 ~ '^[0-9]{4}$'
  )
);

CREATE UNIQUE INDEX accounts_display_name_key ON public.accounts (display_name);
CREATE INDEX accounts_role_idx ON public.accounts (role);
CREATE INDEX accounts_zone_archived_at_idx ON public.accounts (zone, archived_at);
CREATE INDEX accounts_archived_at_active_idx ON public.accounts (archived_at)
  WHERE archived_at IS NULL;

-- Exactly one OWNER (B-003, B-009)
CREATE UNIQUE INDEX accounts_single_owner_idx ON public.accounts ((1))
  WHERE role = 'OWNER';

CREATE TRIGGER accounts_set_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Owner row: role fixed, never archived (B-096)
CREATE OR REPLACE FUNCTION public.enforce_owner_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'OWNER' THEN
    IF NEW.role <> 'OWNER' THEN
      RAISE EXCEPTION 'owner role cannot be changed (B-096)'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'owner cannot be archived (B-096)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounts_owner_invariants
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_owner_invariants();

-- ---------------------------------------------------------------------------
-- 3.4 work_items (before account_item_retention_rates / unit_prices)
-- ---------------------------------------------------------------------------

CREATE TABLE public.work_items (
  code varchar(64) NOT NULL,
  catalogue public.price_set NOT NULL,
  display_name text NOT NULL,
  default_price numeric(12, 2) NOT NULL,
  attracts_retention boolean NOT NULL,
  sort_order integer NOT NULL,
  PRIMARY KEY (code, catalogue),
  CONSTRAINT work_items_default_price_nonneg CHECK (default_price >= 0),
  CONSTRAINT work_items_no_bm_40_fen CHECK (code <> 'bm_40_fen')
);

-- ---------------------------------------------------------------------------
-- 3.2 retention_offsets
-- ---------------------------------------------------------------------------

CREATE TABLE public.retention_offsets (
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  calendar_year integer NOT NULL,
  offset_ntd integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  PRIMARY KEY (account_id, calendar_year)
);

-- ---------------------------------------------------------------------------
-- 3.3 account_item_retention_rates
-- item_code validated against account catalogue in API (work_items PK is code+catalogue)
-- ---------------------------------------------------------------------------

CREATE TABLE public.account_item_retention_rates (
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  item_code varchar(64) NOT NULL,
  rate_ntd integer NOT NULL,
  PRIMARY KEY (account_id, item_code),
  CONSTRAINT account_item_retention_rates_rate_range CHECK (rate_ntd >= 0 AND rate_ntd <= 9999)
);

-- ---------------------------------------------------------------------------
-- 3.5 unit_prices
-- ---------------------------------------------------------------------------

CREATE TABLE public.unit_prices (
  price_set public.price_set NOT NULL,
  item_code varchar(64) NOT NULL,
  price numeric(12, 2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  PRIMARY KEY (price_set, item_code),
  CONSTRAINT unit_prices_price_nonneg CHECK (price >= 0),
  CONSTRAINT unit_prices_item_fkey
    FOREIGN KEY (item_code, price_set)
    REFERENCES public.work_items (code, catalogue)
    ON DELETE RESTRICT
);

CREATE TRIGGER unit_prices_set_updated_at
  BEFORE UPDATE ON public.unit_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.6 system_settings
-- ---------------------------------------------------------------------------

CREATE TABLE public.system_settings (
  id smallint PRIMARY KEY,
  tab_name_1 varchar(50) NOT NULL DEFAULT '全部材料',
  tab_name_2 varchar(50) NOT NULL DEFAULT '',
  tab_name_3 varchar(50) NOT NULL DEFAULT '',
  tab_name_4 varchar(50) NOT NULL DEFAULT '',
  tab_name_5 varchar(50) NOT NULL DEFAULT '',
  tab_name_6 varchar(50) NOT NULL DEFAULT '',
  tab_name_7 varchar(50) NOT NULL DEFAULT '',
  tab_name_8 varchar(50) NOT NULL DEFAULT '',
  tab_name_9 varchar(50) NOT NULL DEFAULT '',
  tab_name_10 varchar(50) NOT NULL DEFAULT '',
  inventory_comparison_label text,
  uninsured_rate_west numeric(5, 2) NOT NULL DEFAULT 3,
  uninsured_rate_south numeric(5, 2) NOT NULL DEFAULT 3,
  global_retention_west integer NOT NULL DEFAULT 20,
  global_retention_south integer NOT NULL DEFAULT 20,
  CONSTRAINT system_settings_singleton CHECK (id = 1),
  CONSTRAINT system_settings_uninsured_west_range CHECK (
    uninsured_rate_west >= 0 AND uninsured_rate_west <= 100
  ),
  CONSTRAINT system_settings_uninsured_south_range CHECK (
    uninsured_rate_south >= 0 AND uninsured_rate_south <= 100
  ),
  CONSTRAINT system_settings_retention_west_range CHECK (
    global_retention_west >= 0 AND global_retention_west <= 9999
  ),
  CONSTRAINT system_settings_retention_south_range CHECK (
    global_retention_south >= 0 AND global_retention_south <= 9999
  )
);

-- ---------------------------------------------------------------------------
-- 3.7 retention_annual_caps
-- ---------------------------------------------------------------------------

CREATE TABLE public.retention_annual_caps (
  calendar_year integer PRIMARY KEY,
  cap_ntd integer NOT NULL DEFAULT 60000,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  CONSTRAINT retention_annual_caps_cap_nonneg CHECK (cap_ntd >= 0)
);

CREATE TRIGGER retention_annual_caps_set_updated_at
  BEFORE UPDATE ON public.retention_annual_caps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.8 daily_reports
-- ---------------------------------------------------------------------------

CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  report_date date NOT NULL,
  status public.report_status NOT NULL DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  custom_item_name varchar(100),
  custom_item_qty_units integer,
  custom_item_unit_price integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_reports_custom_qty_range CHECK (
    custom_item_qty_units IS NULL
    OR (custom_item_qty_units >= 0 AND custom_item_qty_units <= 9999)
  ),
  CONSTRAINT daily_reports_custom_price_nonneg CHECK (
    custom_item_unit_price IS NULL OR custom_item_unit_price >= 0
  ),
  CONSTRAINT daily_reports_custom_fields_consistent CHECK (
    custom_item_name IS NULL
    OR length(trim(custom_item_name)) = 0
    OR (
      custom_item_qty_units IS NOT NULL
      AND custom_item_unit_price IS NOT NULL
    )
  )
);

CREATE INDEX daily_reports_submitter_date_idx ON public.daily_reports (submitter_id, report_date);
CREATE INDEX daily_reports_date_status_idx ON public.daily_reports (report_date, status);
CREATE INDEX daily_reports_status_idx ON public.daily_reports (status);
CREATE INDEX daily_reports_submitter_status_idx ON public.daily_reports (submitter_id, status);

CREATE TRIGGER daily_reports_set_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- B-025: at most 3 own submissions per (submitter, date); API also enforces with FOR UPDATE
CREATE OR REPLACE FUNCTION public.enforce_daily_report_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  existing_count integer;
BEGIN
  SELECT count(*)::integer
  INTO existing_count
  FROM public.daily_reports dr
  WHERE dr.submitter_id = NEW.submitter_id
    AND dr.report_date = NEW.report_date
    AND dr.id IS DISTINCT FROM NEW.id;

  IF existing_count >= 3 THEN
    RAISE EXCEPTION 'daily report cap exceeded for submitter % on %', NEW.submitter_id, NEW.report_date
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER daily_reports_cap_before_insert
  BEFORE INSERT ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_report_cap();

-- ---------------------------------------------------------------------------
-- 3.9 report_item_quantities
-- ---------------------------------------------------------------------------

CREATE TABLE public.report_item_quantities (
  report_id uuid NOT NULL REFERENCES public.daily_reports (id) ON DELETE CASCADE,
  item_code varchar(64) NOT NULL,
  qty_units integer NOT NULL DEFAULT 0,
  PRIMARY KEY (report_id, item_code),
  CONSTRAINT report_item_quantities_qty_range CHECK (qty_units >= 0 AND qty_units <= 9999)
);

-- ---------------------------------------------------------------------------
-- 3.10 report_collaborators
-- ---------------------------------------------------------------------------

CREATE TABLE public.report_collaborators (
  report_id uuid NOT NULL REFERENCES public.daily_reports (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL,
  PRIMARY KEY (report_id, account_id),
  CONSTRAINT report_collaborators_sort_order_range CHECK (sort_order >= 0 AND sort_order <= 5)
);

-- ---------------------------------------------------------------------------
-- 3.11 report_shares
-- ---------------------------------------------------------------------------

CREATE TABLE public.report_shares (
  report_id uuid NOT NULL REFERENCES public.daily_reports (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  item_code varchar(64) NOT NULL,
  share_units integer NOT NULL,
  PRIMARY KEY (report_id, account_id, item_code),
  CONSTRAINT report_shares_share_units_nonneg CHECK (share_units >= 0)
);

-- ---------------------------------------------------------------------------
-- 3.12 materials
-- ---------------------------------------------------------------------------

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50),
  name varchar(100) NOT NULL,
  specification varchar(200),
  unit varchar(20) NOT NULL,
  cumulative_usage numeric(14, 3) NOT NULL DEFAULT 0,
  received_qty numeric(14, 3) NOT NULL DEFAULT 0,
  remaining_qty numeric(14, 3) NOT NULL DEFAULT 0,
  tab integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  quarantined boolean NOT NULL DEFAULT false,
  quarantine_note text,
  CONSTRAINT materials_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT materials_unit_not_blank CHECK (length(trim(unit)) > 0),
  CONSTRAINT materials_tab_range CHECK (tab >= 1 AND tab <= 10),
  CONSTRAINT materials_qty_nonneg CHECK (
    cumulative_usage >= 0 AND received_qty >= 0 AND remaining_qty >= 0
  ),
  CONSTRAINT materials_qty_invariant CHECK (
    received_qty = cumulative_usage + remaining_qty
  )
);

CREATE INDEX materials_tab_display_order_idx ON public.materials (tab, display_order);
CREATE INDEX materials_code_idx ON public.materials (code) WHERE code IS NOT NULL;
CREATE INDEX materials_quarantined_idx ON public.materials (quarantined);

CREATE OR REPLACE FUNCTION public.enforce_materials_qty_invariant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.received_qty <> NEW.cumulative_usage + NEW.remaining_qty THEN
    RAISE EXCEPTION 'materials invariant violated (B-027): received must equal usage + remaining'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER materials_qty_invariant
  BEFORE INSERT OR UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_materials_qty_invariant();

-- ---------------------------------------------------------------------------
-- 3.13 material_requests
-- ---------------------------------------------------------------------------

CREATE TABLE public.material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  material_id uuid NOT NULL REFERENCES public.materials (id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  note varchar(50),
  status public.material_request_status NOT NULL DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_requests_quantity_range CHECK (quantity >= 1 AND quantity <= 99)
);

CREATE INDEX material_requests_status_created_idx ON public.material_requests (status, created_at);
CREATE INDEX material_requests_applicant_idx ON public.material_requests (applicant_id);
CREATE INDEX material_requests_material_status_idx ON public.material_requests (material_id, status);

-- ---------------------------------------------------------------------------
-- 3.14 ledger_entries
-- ---------------------------------------------------------------------------

CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL,
  type public.ledger_type NOT NULL,
  amount integer NOT NULL,
  description varchar(200) NOT NULL,
  category public.ledger_category,
  note varchar(100),
  payer_account_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  voided_at timestamptz,
  voided_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  has_ever_had_evidence boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_entries_amount_positive CHECK (amount >= 1),
  CONSTRAINT ledger_entries_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT ledger_entries_payer_expense_only CHECK (
    payer_account_id IS NULL OR type = 'EXPENSE'
  )
);

CREATE INDEX ledger_entries_entry_date_idx ON public.ledger_entries (entry_date);
CREATE INDEX ledger_entries_type_category_idx ON public.ledger_entries (type, category);
CREATE INDEX ledger_entries_payer_idx ON public.ledger_entries (payer_account_id);
CREATE INDEX ledger_entries_voided_at_idx ON public.ledger_entries (voided_at);

CREATE TRIGGER ledger_entries_set_updated_at
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.15 ledger_evidence_files
-- ---------------------------------------------------------------------------

CREATE TABLE public.ledger_evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.ledger_entries (id) ON DELETE RESTRICT,
  storage_bucket text NOT NULL DEFAULT 'ledger-evidence',
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  version integer NOT NULL,
  is_current boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  CONSTRAINT ledger_evidence_files_size_limit CHECK (size_bytes <= 10485760),
  CONSTRAINT ledger_evidence_files_mime_type CHECK (
    mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    )
  )
);

CREATE UNIQUE INDEX ledger_evidence_files_one_current_per_entry
  ON public.ledger_evidence_files (entry_id)
  WHERE is_current = true;

-- ---------------------------------------------------------------------------
-- 3.16 payroll_runs / payroll_run_rows
-- ---------------------------------------------------------------------------

CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_10th_payday boolean NOT NULL DEFAULT false,
  cap_year integer,
  cap_ntd_used integer,
  calculated_at timestamptz,
  calculated_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  status text,
  CONSTRAINT payroll_runs_date_order CHECK (start_date <= end_date)
);

CREATE TABLE public.payroll_run_rows (
  run_id uuid NOT NULL REFERENCES public.payroll_runs (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  display_name_snapshot text NOT NULL,
  role_at_calc public.account_role NOT NULL,
  zone public.zone NOT NULL,
  big_meter boolean NOT NULL,
  gross integer NOT NULL,
  period_retention integer NOT NULL,
  ytd_before integer NOT NULL,
  net integer NOT NULL,
  fixed_salary_applied integer NOT NULL DEFAULT 0,
  insurance_applied integer NOT NULL DEFAULT 0,
  uninsured_deduction integer NOT NULL DEFAULT 0,
  final_pay integer NOT NULL,
  fixed_salary_manual_amount integer,
  fixed_salary_added_back boolean NOT NULL DEFAULT false,
  payment_method public.payment_method,
  bank_last4 char(4),
  PRIMARY KEY (run_id, account_id)
);

-- ---------------------------------------------------------------------------
-- 3.17 retention_year_end_settlements / retention_year_end_rows
-- ---------------------------------------------------------------------------

CREATE TABLE public.retention_year_end_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_year integer NOT NULL,
  settled_at timestamptz NOT NULL DEFAULT now(),
  settled_by uuid REFERENCES public.accounts (id) ON DELETE SET NULL
);

CREATE TABLE public.retention_year_end_rows (
  settlement_id uuid NOT NULL REFERENCES public.retention_year_end_settlements (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  ytd_retention integer NOT NULL,
  refunded_amount integer NOT NULL,
  PRIMARY KEY (settlement_id, account_id)
);

-- ---------------------------------------------------------------------------
-- 3.18 archives
-- ---------------------------------------------------------------------------

CREATE TABLE public.archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.archive_type NOT NULL,
  archive_date date NOT NULL,
  source public.archive_source NOT NULL,
  manual_suffix integer,
  generator_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  xlsx_path text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX archives_one_automatic_per_type_date
  ON public.archives (type, archive_date)
  WHERE source = 'AUTOMATIC';

-- ---------------------------------------------------------------------------
-- 3.19 audit_log
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  actor_display_name text NOT NULL,
  action_type public.audit_action NOT NULL,
  description text NOT NULL
);

CREATE INDEX audit_log_occurred_at_desc_idx ON public.audit_log (occurred_at DESC);
CREATE INDEX audit_log_actor_occurred_idx ON public.audit_log (actor_id, occurred_at DESC);
CREATE INDEX audit_log_action_occurred_idx ON public.audit_log (action_type, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.audit_log_deny_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (B-037, PROVISIONAL Q-059)';
END;
$$;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_deny_mutation();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_deny_mutation();

-- ---------------------------------------------------------------------------
-- 3.20 signin_rate_limits
-- ---------------------------------------------------------------------------

CREATE TABLE public.signin_rate_limits (
  client_address_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  attempt_count integer NOT NULL,
  PRIMARY KEY (client_address_hash, window_start),
  CONSTRAINT signin_rate_limits_attempt_count_nonneg CHECK (attempt_count >= 0)
);

-- ---------------------------------------------------------------------------
-- Storage buckets (§4) — provision outside SQL migration:
--   • ledger-evidence — private; PDF/JPEG/PNG/WebP evidence ≤ 10 MB; permanent retention
--   • archives — private; daily/monthly xlsx/pdf; files removed when archive row deleted
-- Access via NestJS signed URLs (3600s); not stored as long-lived addresses (B-085).
-- ---------------------------------------------------------------------------

COMMIT;
