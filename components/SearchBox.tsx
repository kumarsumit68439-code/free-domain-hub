'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  PARENT_DOMAIN,
  isValidHostnameLabel,
  isValidOwnDomain,
  generateSuggestions,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const [mode, setMode] = useState<'free' | 'own'>('free');
  const [query, setQuery] = useState('');
  const [ip, setIp] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ domain: string; available: boolean }[] | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    setResults(null);

    if (mode === 'own') {
      const full = query.trim().toLowerCase();
      if (!isValidOwnDomain(full)) {
        setMessage({ type: 'error', text: 'Enter your domain, e.g. myblog.com' });
        return;
      }
      if (!ip.trim() || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip.trim())) {
        setMessage({
          type: 'error',
          text: 'Own domain: sirf IP se connect — valid public IP required (e.g. 203.0.113.10)',
        });
        return;
      }
      setSearching(true);
      const { data, error } = await supabase.rpc('is_domain_available', { check_name: full });
      setResults([{ domain: full, available: error ? false : Boolean(data) }]);
      setSearching(false);
      return;
    }

    const base = query.trim().toLowerCase().split('.')[0];
    if (!base || !isValidHostnameLabel(base)) {
      setMessage({ type: 'error', text: 'Valid hostname only' });
      return;
    }

    setSearching(true);
    const ordered = generateSuggestions(base);
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
      setMessage({ type: 'error', text: 'Please sign in first.' });
      router.push(`/login?next=/`);
      return;
    }

    const ipTrim = ip.trim();
    if (mode === 'own' && (!ipTrim || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ipTrim))) {
      setMessage({ type: 'error', text: 'Own domain needs IP only — enter public IP' });
      return;
    }
    if (ipTrim && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ipTrim)) {
      setMessage({ type: 'error', text: 'Invalid IPv4' });
      return;
    }

    setRegistering(fullDomain);
    setMessage(null);

    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, hostname: fullDomain, ipv4: ipTrim || null }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage({ type: 'error', text: json.error || json.hint || 'Failed' });
      setRegistering(null);
      return;
    }

    setRegistering(null);
    setMessage({
      type: 'success',
      text:
        json.message ||
        (mode === 'own'
          ? `${fullDomain} → ${ipTrim} connected (auto DNS)`
          : `Claimed ${fullDomain}`),
    });
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
      <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => {
            setMode('free');
            setResults(null);
            setMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'free' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Free · *.{PARENT_DOMAIN}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('own');
            setResults(null);
            setMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'own' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Own domain · IP only
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'free'
                  ? `Hostname → *.${PARENT_DOMAIN}`
                  : 'Your domain e.g. myblog.com'
              }
              className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-2xl shadow-lg shadow-brand-200"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>

        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder={
            mode === 'own'
              ? 'Public IP required — e.g. 203.0.113.10 (no A/CNAME manual)'
              : 'Public IP (optional)'
          }
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm font-mono"
          required={mode === 'own'}
        />

        <p className="text-xs text-slate-500 text-left">
          {mode === 'own' ? (
            <>
              <strong>Sirf IP:</strong> A / AAAA / CNAME / TXT nahi dalna. Connect = auto records + Cloudflare
              (token set ho to).
            </>
          ) : (
            <>
              Free hostname on {PARENT_DOMAIN}. IP optional here; baad mein bhi set kar sakte ho.
            </>
          )}
        </p>
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
          {results.map((r) => (
            <div
              key={r.domain}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
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
                    {r.available
                      ? mode === 'own'
                        ? `→ ${ip.trim()} (auto A + www)`
                        : 'Available'
                      : 'Already taken'}
                  </p>
                </div>
              </div>
              {r.available && (
                <button
                  onClick={() => handleRegister(r.domain)}
                  disabled={!!registering}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
                >
                  {registering === r.domain ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
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
