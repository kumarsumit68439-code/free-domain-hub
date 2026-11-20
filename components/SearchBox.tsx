'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { FREE_TLDS, isValidDomainName, generateSuggestions } from '@/lib/tld';
import { getDomains, addDomain, createId } from '@/lib/storage';
import { Domain } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ domain: string; available: boolean }[] | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const base = query.trim().toLowerCase().split('.')[0];
    if (!base || !isValidDomainName(base)) {
      setMessage({ type: 'error', text: 'Please enter a valid domain name (letters, numbers, hyphens only)' });
      return;
    }

    setSearching(true);
    setMessage(null);
    setResults(null);

    // Simulate real API delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const existing = getDomains().map((d) => d.name.toLowerCase());
    const suggestions = generateSuggestions(base);

    const res = suggestions.map((full) => ({
      domain: full,
      available: !existing.includes(full.toLowerCase()),
    }));

    // Always put exact match first if possible
    const exact = FREE_TLDS.map((tld) => `${base}.${tld}`);
    const ordered = [
      ...exact.map((d) => ({
        domain: d,
        available: !existing.includes(d.toLowerCase()),
      })),
      ...res.filter((r) => !exact.includes(r.domain)),
    ].slice(0, 10);

    setResults(ordered);
    setSearching(false);
  };

  const handleRegister = async (fullDomain: string) => {
    setRegistering(fullDomain);
    setMessage(null);

    await new Promise((r) => setTimeout(r, 1200)); // real response feel

    const [name, tld] = fullDomain.split('.');
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 100); // free forever

    const newDomain: Domain = {
      id: createId(),
      name: fullDomain,
      tld,
      status: 'active',
      registeredAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      nameservers: ['ns1.freedomainhub.com', 'ns2.freedomainhub.com'],
      records: [
        {
          id: createId(),
          type: 'A',
          name: '@',
          value: '76.76.21.21', // Vercel-like IP mock
          ttl: 3600,
          createdAt: now.toISOString(),
        },
        {
          id: createId(),
          type: 'CNAME',
          name: 'www',
          value: fullDomain,
          ttl: 3600,
          createdAt: now.toISOString(),
        },
      ],
      traffic: {
        requests24h: Math.floor(Math.random() * 50),
        bandwidthMB: Math.floor(Math.random() * 10),
      },
    };

    addDomain(newDomain);
    setRegistering(null);
    setMessage({
      type: 'success',
      text: `Successfully registered ${fullDomain}! Redirecting to dashboard...`,
    });

    // Refresh results to show taken
    setResults((prev) =>
      prev
        ? prev.map((r) =>
            r.domain === fullDomain ? { ...r, available: false } : r
          )
        : null
    );

    setTimeout(() => {
      router.push(`/domain/${encodeURIComponent(fullDomain)}`);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search free domain (e.g. myblog)"
              className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-brand-200 flex items-center gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-500 font-medium">
            {results.filter((r) => r.available).length} free domains available
          </p>
          {results.map((r) => (
            <div
              key={r.domain}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                {r.available ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">{r.domain}</p>
                  <p className="text-xs text-slate-500">
                    {r.available ? 'Available · 100% Free forever' : 'Already taken'}
                  </p>
                </div>
              </div>
              {r.available && (
                <button
                  onClick={() => handleRegister(r.domain)}
                  disabled={!!registering}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {registering === r.domain ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    'Claim Free'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}