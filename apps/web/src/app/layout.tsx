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
      <body style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
        {children}
      </body>
    </html>
  );
}
