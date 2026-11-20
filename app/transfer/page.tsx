'use client';

import { useState } from 'react';
import { ArrowRightLeft, Loader2, CheckCircle2, Info } from 'lucide-react';
import { getDomains, updateDomain, createId, addDomain } from '@/lib/storage';
import { Domain } from '@/lib/types';

export default function TransferPage() {
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTransferIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1500));

    const clean = domainName.trim().toLowerCase();
    const existing = getDomains().find((d) => d.name === clean);

    if (existing) {
      setResult({ success: false, message: 'This domain is already in your account.' });
      setLoading(false);
      return;
    }

    // Simulate successful transfer-in of a free domain
    const parts = clean.split('.');
    const tld = parts.length > 1 ? parts.pop()! : 'free';
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 100);

    const newDomain: Domain = {
      id: createId(),
      name: clean,
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
          value: '76.76.21.21',
          ttl: 3600,
          createdAt: now.toISOString(),
        },
      ],
      traffic: { requests24h: 0, bandwidthMB: 0 },
    };

    addDomain(newDomain);
    setResult({
      success: true,
      message: `Transfer initiated successfully! ${clean} is now in your account.`,
    });
    setDomainName('');
    setAuthCode('');
    setLoading(false);
  };

  const handleTransferOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));

    const domains = getDomains();
    const domain = domains.find((d) => d.name.toLowerCase() === domainName.trim().toLowerCase());

    if (!domain) {
      setResult({ success: false, message: 'Domain not found in your account.' });
      setLoading(false);
      return;
    }

    updateDomain(domain.id, { status: 'transferring' });
    setResult({
      success: true,
      message: `Transfer out started for ${domain.name}. Auth code: FDH-${Math.random().toString(36).slice(2, 10).toUpperCase()}. Status set to transferring.`,
    });
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Domain Transfer</h1>
        <p className="text-slate-500 mt-2">
          Transfer free domains in or out of Free Domain Hub
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
        <button
          onClick={() => {
            setMode('in');
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Transfer In
        </button>
        <button
          onClick={() => {
            setMode('out');
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'out' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Transfer Out
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {mode === 'in' ? (
          <form onSubmit={handleTransferIn} className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 text-blue-800 text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Enter the domain you want to transfer into Free Domain Hub. For demo purposes,
                any free-style domain can be transferred in.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain Name</label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="example.free"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Authorization Code (EPP) <span className="text-slate-400 font-normal">optional for demo</span>
              </label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Auth / EPP code"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                'Start Transfer In'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTransferOut} className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Select a domain from your account to transfer out. You will receive an auth code.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain to Transfer Out</label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="yourdomain.free"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>

            <button
              type="submit"lando={loading}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Auth Code...
                </>
              ) : (
                'Start Transfer Out'
              )}
            </button>
          </form>
        )}

        {result && (
          <div
            className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
              result.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${result.success ? '' : 'hidden'}`} />
            <p className="text-sm font-medium">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}