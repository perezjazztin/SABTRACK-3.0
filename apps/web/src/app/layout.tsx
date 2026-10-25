import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'SABTRACK 3.0 — Barangay Sabang Solid Waste Management Platform',
  description:
    'Digital governance platform for garbage collection scheduling, community reporting, engagement, and administrative analytics in Barangay Sabang, Lipa City, Batangas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-civic-sand text-civic-slate">
        <AuthProvider>
          <Header />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
