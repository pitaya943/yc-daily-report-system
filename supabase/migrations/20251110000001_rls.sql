-- RLS per data-model.md §6; auth.uid() ↔ accounts.auth_user_id via app_account_id() / app_current_role()

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER reads accounts regardless of caller RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.accounts a
  WHERE a.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_current_role()
RETURNS public.account_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.role
  FROM public.accounts a
  WHERE a.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_is_signed_in()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_account_id() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.can_view_daily_report(p_report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.daily_reports dr
    WHERE dr.id = p_report_id
      AND (
        public.app_current_role() IN ('ADMIN', 'OWNER')
        OR dr.submitter_id = public.app_account_id()
        OR EXISTS (
          SELECT 1
          FROM public.report_collaborators rc
          WHERE rc.report_id = dr.id
            AND rc.account_id = public.app_account_id()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.app_account_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_is_signed_in() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_daily_report(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.app_account_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.app_current_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.app_is_signed_in() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_daily_report(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Default deny
-- ---------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS on all application tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_offsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_item_retention_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_annual_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_item_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_year_end_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_year_end_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signin_rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- bank_account_ciphertext: ordinary clients use API/views; ciphertext not exposed via default grants
REVOKE SELECT (bank_account_ciphertext) ON public.accounts FROM authenticated;

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

CREATE POLICY accounts_select ON public.accounts
  FOR SELECT TO authenticated
  USING (
    public.app_current_role() IN ('ADMIN', 'OWNER')
    OR id = public.app_account_id()
  );

CREATE POLICY accounts_insert_admin_user ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_current_role() = 'ADMIN'
    AND role = 'USER'
  );

CREATE POLICY accounts_insert_owner ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_current_role() = 'OWNER'
    AND role IN ('USER', 'ADMIN')
  );

CREATE POLICY accounts_update_user_self ON public.accounts
  FOR UPDATE TO authenticated
  USING (public.app_current_role() = 'USER' AND id = public.app_account_id())
  WITH CHECK (public.app_current_role() = 'USER' AND id = public.app_account_id());

CREATE POLICY accounts_update_admin_users ON public.accounts
  FOR UPDATE TO authenticated
  USING (
    public.app_current_role() = 'ADMIN'
    AND role = 'USER'
  )
  WITH CHECK (
    public.app_current_role() = 'ADMIN'
    AND role = 'USER'
  );

CREATE POLICY accounts_update_owner ON public.accounts
  FOR UPDATE TO authenticated
  USING (public.app_current_role() = 'OWNER')
  WITH CHECK (
    public.app_current_role() = 'OWNER'
    AND (role <> 'OWNER' OR (role = 'OWNER' AND archived_at IS NULL))
  );

GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;

-- ---------------------------------------------------------------------------
-- retention_offsets / account_item_retention_rates
-- ---------------------------------------------------------------------------

CREATE POLICY retention_offsets_select ON public.retention_offsets
  FOR SELECT TO authenticated
  USING (
    public.app_current_role() IN ('ADMIN', 'OWNER')
    OR account_id = public.app_account_id()
  );

CREATE POLICY retention_offsets_write_admin ON public.retention_offsets
  FOR ALL TO authenticated
  USING (
    public.app_current_role() = 'ADMIN'
    AND account_id IN (SELECT id FROM public.accounts WHERE role = 'USER')
  )
  WITH CHECK (
    public.app_current_role() = 'ADMIN'
    AND account_id IN (SELECT id FROM public.accounts WHERE role = 'USER')
  );

CREATE POLICY retention_offsets_write_owner ON public.retention_offsets
  FOR ALL TO authenticated
  USING (public.app_current_role() = 'OWNER')
  WITH CHECK (public.app_current_role() = 'OWNER');

CREATE POLICY account_item_retention_rates_select ON public.account_item_retention_rates
  FOR SELECT TO authenticated
  USING (
    public.app_current_role() IN ('ADMIN', 'OWNER')
    OR account_id = public.app_account_id()
  );

CREATE POLICY account_item_retention_rates_write_admin ON public.account_item_retention_rates
  FOR ALL TO authenticated
  USING (
    public.app_current_role() = 'ADMIN'
    AND account_id IN (SELECT id FROM public.accounts WHERE role = 'USER')
  )
  WITH CHECK (
    public.app_current_role() = 'ADMIN'
    AND account_id IN (SELECT id FROM public.accounts WHERE role = 'USER')
  );

CREATE POLICY account_item_retention_rates_write_owner ON public.account_item_retention_rates
  FOR ALL TO authenticated
  USING (public.app_current_role() = 'OWNER')
  WITH CHECK (public.app_current_role() = 'OWNER');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_offsets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_item_retention_rates TO authenticated;

-- ---------------------------------------------------------------------------
-- work_items, unit_prices, system_settings, retention_annual_caps
-- ---------------------------------------------------------------------------

CREATE POLICY work_items_select ON public.work_items
  FOR SELECT TO authenticated
  USING (public.app_is_signed_in());

CREATE POLICY unit_prices_select ON public.unit_prices
  FOR SELECT TO authenticated
  USING (public.app_is_signed_in());

CREATE POLICY unit_prices_write ON public.unit_prices
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY system_settings_select ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.app_is_signed_in());

CREATE POLICY system_settings_update ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY retention_annual_caps_select ON public.retention_annual_caps
  FOR SELECT TO authenticated
  USING (public.app_is_signed_in());

CREATE POLICY retention_annual_caps_write ON public.retention_annual_caps
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

GRANT SELECT ON public.work_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_prices TO authenticated;
GRANT SELECT, UPDATE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_annual_caps TO authenticated;

-- ---------------------------------------------------------------------------
-- daily_reports and children
-- ---------------------------------------------------------------------------

CREATE POLICY daily_reports_select ON public.daily_reports
  FOR SELECT TO authenticated
  USING (public.can_view_daily_report(id));

CREATE POLICY daily_reports_insert_user ON public.daily_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_current_role() = 'USER'
    AND submitter_id = public.app_account_id()
  );

CREATE POLICY daily_reports_update_user ON public.daily_reports
  FOR UPDATE TO authenticated
  USING (
    public.app_current_role() = 'USER'
    AND submitter_id = public.app_account_id()
    AND status IN ('PENDING', 'REJECTED')
  )
  WITH CHECK (
    submitter_id = public.app_account_id()
    AND status IN ('PENDING', 'REJECTED')
  );

CREATE POLICY daily_reports_delete_user ON public.daily_reports
  FOR DELETE TO authenticated
  USING (
    public.app_current_role() = 'USER'
    AND submitter_id = public.app_account_id()
    AND status IN ('PENDING', 'REJECTED')
  );

CREATE POLICY daily_reports_write_admin ON public.daily_reports
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY report_item_quantities_select ON public.report_item_quantities
  FOR SELECT TO authenticated
  USING (public.can_view_daily_report(report_id));

CREATE POLICY report_item_quantities_write_user ON public.report_item_quantities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.daily_reports dr
      WHERE dr.id = report_id
        AND dr.submitter_id = public.app_account_id()
        AND dr.status IN ('PENDING', 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.daily_reports dr
      WHERE dr.id = report_id
        AND dr.submitter_id = public.app_account_id()
        AND dr.status IN ('PENDING', 'REJECTED')
    )
  );

CREATE POLICY report_item_quantities_write_admin ON public.report_item_quantities
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY report_collaborators_select ON public.report_collaborators
  FOR SELECT TO authenticated
  USING (public.can_view_daily_report(report_id));

CREATE POLICY report_collaborators_write_user ON public.report_collaborators
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.daily_reports dr
      WHERE dr.id = report_id
        AND dr.submitter_id = public.app_account_id()
        AND dr.status IN ('PENDING', 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.daily_reports dr
      WHERE dr.id = report_id
        AND dr.submitter_id = public.app_account_id()
        AND dr.status IN ('PENDING', 'REJECTED')
    )
  );

CREATE POLICY report_collaborators_write_admin ON public.report_collaborators
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY report_shares_select ON public.report_shares
  FOR SELECT TO authenticated
  USING (public.can_view_daily_report(report_id));

CREATE POLICY report_shares_write_admin ON public.report_shares
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_item_quantities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_shares TO authenticated;

-- ---------------------------------------------------------------------------
-- materials / material_requests
-- ---------------------------------------------------------------------------

CREATE POLICY materials_select_user ON public.materials
  FOR SELECT TO authenticated
  USING (
    public.app_current_role() = 'USER'
    AND hidden = false
    AND quarantined = false
  );

CREATE POLICY materials_select_admin ON public.materials
  FOR SELECT TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY materials_write_admin ON public.materials
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY material_requests_select_own ON public.material_requests
  FOR SELECT TO authenticated
  USING (
    public.app_current_role() IN ('ADMIN', 'OWNER')
    OR applicant_id = public.app_account_id()
  );

CREATE POLICY material_requests_insert_user ON public.material_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_current_role() = 'USER'
    AND applicant_id = public.app_account_id()
  );

CREATE POLICY material_requests_delete_user_pending ON public.material_requests
  FOR DELETE TO authenticated
  USING (
    public.app_current_role() = 'USER'
    AND applicant_id = public.app_account_id()
    AND status = 'PENDING'
  );

CREATE POLICY material_requests_update_admin ON public.material_requests
  FOR UPDATE TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_requests TO authenticated;

-- ---------------------------------------------------------------------------
-- ledger
-- ---------------------------------------------------------------------------

CREATE POLICY ledger_entries_admin ON public.ledger_entries
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY ledger_evidence_files_admin ON public.ledger_evidence_files
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ledger_evidence_files TO authenticated;

-- ---------------------------------------------------------------------------
-- payroll / retention year-end / archives
-- ---------------------------------------------------------------------------

CREATE POLICY payroll_runs_admin ON public.payroll_runs
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY payroll_run_rows_admin ON public.payroll_run_rows
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY retention_year_end_settlements_admin ON public.retention_year_end_settlements
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY retention_year_end_rows_admin ON public.retention_year_end_rows
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

CREATE POLICY archives_admin ON public.archives
  FOR ALL TO authenticated
  USING (public.app_current_role() IN ('ADMIN', 'OWNER'))
  WITH CHECK (public.app_current_role() IN ('ADMIN', 'OWNER'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_run_rows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_year_end_settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_year_end_rows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.archives TO authenticated;

-- ---------------------------------------------------------------------------
-- audit_log (owner read-only; inserts via service_role; mutations blocked by trigger)
-- ---------------------------------------------------------------------------

CREATE POLICY audit_log_select_owner ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.app_current_role() = 'OWNER');

GRANT SELECT ON public.audit_log TO authenticated;

-- signin_rate_limits: service_role only (no grants/policies for anon/authenticated)

COMMIT;
