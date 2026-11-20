import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Free Domain Hub | Get Free Domains with Full DNS',
  description: 'Claim free domains instantly. Manage A, CNAME, TXT, MX records, transfer domains and more — 100% free forever.',
  keywords: 'free domain, free dns, domain management, cname, txt record, domain transfer',
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
            <p className="mt-1">100% Free Domains · Full DNS Control · No Credit Card</p>
            <p className="mt-3 text-xs">This is a demonstration platform. Domains are simulated for learning & portfolio purposes.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}