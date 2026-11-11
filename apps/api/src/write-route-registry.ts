/** B-088 registry: every mutating HTTP route must map to a validator group. */
export const WRITE_ROUTE_VALIDATORS: Array<{
  method: string;
  path: string;
  validator: string;
}> = [
  { method: 'POST', path: '/auth/sign-in', validator: 'auth-sign-in' },
  { method: 'POST', path: '/reports', validator: 'report-create' },
  { method: 'PATCH', path: '/reports/:id', validator: 'report-update' },
  { method: 'DELETE', path: '/reports/:id', validator: 'report-delete' },
  { method: 'POST', path: '/materials/requests', validator: 'material-request' },
  { method: 'POST', path: '/materials/admin/items', validator: 'material-admin-add' },
  { method: 'POST', path: '/materials/admin/items/:id', validator: 'material-admin-update' },
  { method: 'POST', path: '/materials/admin/import', validator: 'material-import' },
  { method: 'POST', path: '/payroll/calculate', validator: 'payroll-calculate' },
  { method: 'POST', path: '/ledger/entries', validator: 'ledger-create' },
  { method: 'POST', path: '/ledger/entries/:id/evidence', validator: 'ledger-evidence' },
  { method: 'PATCH', path: '/settings/retention-cap', validator: 'retention-cap' },
  { method: 'PATCH', path: '/settings/system', validator: 'settings-system' },
  { method: 'POST', path: '/owner/admins', validator: 'account-create-admin' },
  { method: 'POST', path: '/accounts/users', validator: 'account-create-user' },
  { method: 'PATCH', path: '/accounts/:id/bank', validator: 'bank-account' },
  { method: 'PATCH', path: '/accounts/:id/financials', validator: 'account-financials' },
  { method: 'PATCH', path: '/accounts/:id/retention-offset', validator: 'retention-offset' },
  { method: 'POST', path: '/accounts/me/password', validator: 'password-change' },
  { method: 'POST', path: '/retention/year-end', validator: 'retention-year-end' },
  { method: 'POST', path: '/archives/daily', validator: 'archive-daily' },
];
