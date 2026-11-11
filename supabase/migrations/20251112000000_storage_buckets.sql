-- B-085 ledger evidence + B-077 archive files (local Supabase)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'ledger-evidence',
    'ledger-evidence',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'archives',
    'archives',
    false,
    52428800,
    ARRAY[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/csv'
    ]
  )
ON CONFLICT (id) DO NOTHING;
