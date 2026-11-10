import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'yc-daily-report-system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
