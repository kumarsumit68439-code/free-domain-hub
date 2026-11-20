import { SearchBox } from '@/components/SearchBox';
import { Check, Shield, Zap, Globe2, Server, ArrowRightLeft } from 'lucide-react';

const features = [
  {
    icon: Globe2,
    title: 'Free *.kozow.com',
    desc: 'Claim free hostnames like myserver.kozow.com — same family Dynu uses for free DDNS.',
  },
  {
    icon: Server,
    title: 'IP → Active',
    desc: 'Enter your public IP and the hostname points to it. Update anytime (Dynu-style).',
  },
  {
    icon: Zap,
    title: 'Public DNS',
    desc: 'With Dynu API key, records go live on the internet under kozow.com nameservers.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Update API',
    desc: 'Router-friendly /api/update URL to refresh IP when it changes.',
  },
  {
    icon: Shield,
    title: 'Your account',
    desc: 'Supabase auth + ownership. Only you manage your hostnames.',
  },
  {
    icon: Check,
    title: 'DNS records',
    desc: 'A, AAAA, CNAME, TXT, MX and more stored in your FreeDomain database.',
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pt-16 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Free hostnames on kozow.com
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight text-balance">
            Free hostname +{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
              your IP
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Claim <strong>name.kozow.com</strong>, set your IP, and go active — Dynu-style free DDNS with
            dashboard, records, and update API.
          </p>

          <div className="mt-10">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
          Like Dynu — built for free kozow.com hostnames
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
    </div>
  );
}
