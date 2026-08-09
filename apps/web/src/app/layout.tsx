import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roznamcha',
  description: 'Business accounting — web app coming soon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7FAF8] text-[#12211B] antialiased">
        {children}
      </body>
    </html>
  );
}
