import { SearchBox } from '@/components/SearchBox';
import { Check, Shield, Zap, Globe2, Server, ArrowRightLeft } from 'lucide-react';

const features = [
  {
    icon: Globe2,
    title: 'Free Domains',
    desc: 'Claim domains like .free, .space, .online and more — completely free, forever.',
  },
  {
    icon: Server,
    title: 'Full DNS Control',
    desc: 'Add A, AAAA, CNAME, TXT, MX, NS records with real-time style responses.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Domain Transfer',
    desc: 'Transfer domains in or out with a simple, guided process.',
  },
  {
    icon: Zap,
    title: 'Instant Activation',
    desc: 'Domains become active immediately after claiming. No waiting.',
  },
  {
    icon: Shield,
    title: 'No Credit Card',
    desc: 'Truly free. No trials, no upsells, no hidden paid tiers.',
  },
  {
    icon: Check,
    title: 'Nameservers Ready',
    desc: 'Get free nameservers and manage everything from one dashboard.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pt-16 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            100% Free · No Paid Plans
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight text-balance">
            Get Your Own{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
              Free Domain
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Search, claim and manage free domains with full DNS records, CNAME, TXT, IP,
            transfer and more — just like a real registrar.
          </p>

          <div className="mt-10">
            <SearchBox />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Popular free TLDs: .free · .space · .online · .site · .xyz · .fun · .live · .blog · .dev · .app
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
          Everything a real domain needs — for free
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 sm:p-12 text-center text-white shadow-xl shadow-brand-200">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to claim your free domain?</h2>
          <p className="mt-3 text-brand-100 max-w-xl mx-auto">
            No account required to start. Search above, claim in one click, and manage DNS instantly.
          </p>
        </div>
      </section>
    </div>
  );
}