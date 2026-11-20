import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Free Domain Hub | Real Free Domains + DNS on Supabase',
  description: 'Claim free domains, manage real DNS records (A, CNAME, TXT, MX), transfers and traffic — powered by Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">Free Domain Hub</p>
            <p className="mt-1">Real Supabase backend · Auth · DNS records · Transfers · Traffic</p>
            <p className="mt-3 text-xs max-w-xl mx-auto">
              Ownership and DNS records are stored live in PostgreSQL. Public resolution of free TLDs requires a real registry or parent domain + nameservers.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}