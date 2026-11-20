'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { FREE_TLDS, isValidDomainName, generateSuggestions } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ domain: string; available: boolean }[] | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const base = query.trim().toLowerCase().split('.')[0];
    if (!base || !isValidDomainName(base)) {
      setMessage({ type: 'error', text: 'Please enter a valid name (letters, numbers, hyphens only)' });
      return;
    }

    setSearching(true);
    setMessage(null);
    setResults(null);

    const suggestions = generateSuggestions(base);
    const exact = FREE_TLDS.map((tld) => `${base}.${tld}`);
    const ordered = Array.from(new Set(exact.concat(suggestions))).slice(0, 10);

    const checks = await Promise.all(
      ordered.map(async (full) => {
        const { data, error } = await supabase.rpc('is_domain_available', { check_name: full });
        return { domain: full, available: error ? false : Boolean(data) };
      })
    );

    setResults(checks);
    setSearching(false);
  };

  const handleRegister = async (fullDomain: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in first to claim a domain.' });
      router.push(`/login?next=/`);
      return;
    }

    setRegistering(fullDomain);
    setMessage(null);

    const tld = fullDomain.split('.').pop() || 'free';
    const { error } = await supabase.rpc('claim_domain', {
      p_name: fullDomain,
      p_tld: tld,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to claim domain' });
      setRegistering(null);
      return;
    }

    setRegistering(null);
    setMessage({ type: 'success', text: `Successfully claimed ${fullDomain}! Opening DNS panel...` });
    setResults((prev) =>
      prev ? prev.map((r) => (r.domain === fullDomain ? { ...r, available: false } : r)) : null
    );

    setTimeout(() => {
      router.push(`/domain/${encodeURIComponent(fullDomain)}`);
      router.refresh();
    }, 1000);
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
            {results.filter((r) => r.available).length} free domains available (live check)
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
                    {r.available ? 'Available · Free forever · Stored in Supabase' : 'Already taken'}
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
