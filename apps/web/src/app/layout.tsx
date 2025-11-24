import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'React Next Architecture',
  description: 'Monorepo template with Next.js',
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
