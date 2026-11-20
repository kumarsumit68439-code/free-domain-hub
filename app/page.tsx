import { SearchBox } from '@/components/SearchBox';
import { Check, Shield, Zap, Globe2, Server, ArrowRightLeft } from 'lucide-react';

const features = [
  {
    icon: Globe2,
    title: 'Free *.kozow.com',
    desc: 'Dynu-style free hostnames. IP set karo, Dynu API se public DNS active.',
  },
  {
    icon: Server,
    title: 'Own domain',
    desc: 'Apna kharida hua domain (myblog.com) yahan add karo, IP + DNS records manage karo.',
  },
  {
    icon: Zap,
    title: 'IP → Active',
    desc: 'Public IP daalo — A record update. Router update URL bhi milti hai.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Transfer',
    desc: 'Domain transfer in/out requests Supabase mein save.',
  },
  {
    icon: Shield,
    title: 'Secure account',
    desc: 'Supabase Auth + RLS — sirf tumhare domains.',
  },
  {
    icon: Check,
    title: 'Full DNS panel',
    desc: 'A, AAAA, CNAME, TXT, MX, NS — live database.',
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
            Free kozow.com + Own domains
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight text-balance">
            Free hostname{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
              &amp; own domain
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Dynu wala free <strong>*.kozow.com</strong> rahega, aur saath mein apna domain bhi add karke IP + DNS
            manage kar sakte ho.
          </p>

          <div className="mt-10">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">Do modes — ek panel</h2>
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
