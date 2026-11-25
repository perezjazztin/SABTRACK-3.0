import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EcoBotWidget } from '@/components/EcoBotWidget';
import './globals.css';

export const metadata: Metadata = {
  title: 'SABTRACK 3.0 — A Digital Solid Waste Management and Community Engagement Platform for Barangay Sabang',
  description:
    'A Digital Solid Waste Management and Community Engagement Platform for Barangay Sabang, Lipa City, Batangas.',
};

// Root application layout injecting global authentication provider and persistent UI chrome.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-civic-sand text-slate-800 antialiased">
        {/* Global authentication context provider wrapping all client routes */}
        <AuthProvider>
          <Header />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <Footer />
          <EcoBotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
