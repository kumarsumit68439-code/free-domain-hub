'use client';

import { useState } from 'react';
import { ArrowRightLeft, Loader2, CheckCircle2, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TransferPage() {
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const supabase = createClient();

  const handleTransferIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setLoading(true);
    setResult(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setResult({ success: false, message: 'Please sign in first.' });
      setLoading(false);
      return;
    }

    const clean = domainName.trim().toLowerCase();
    const parts = clean.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : 'free';

    // Check availability
    const { data: available } = await supabase.rpc('is_domain_available', { check_name: clean });
    if (!available) {
      setResult({ success: false, message: 'Domain is already registered in the system.' });
      setLoading(false);
      return;
    }

    // Create transfer record
    const { error: tErr } = await supabase.from('domain_transfers').insert({
      domain_name: clean,
      direction: 'in',
      user_id: user.id,
      auth_code: authCode || null,
      status: 'processing',
      message: 'Transfer in started',
    });

    if (tErr) {
      setResult({ success: false, message: tErr.message });
      setLoading(false);
      return;
    }

    // Claim domain for user
    const { data: domainId, error: cErr } = await supabase.rpc('claim_domain', {
      p_name: clean,
      p_tld: tld,
    });

    if (cErr) {
      await supabase
        .from('domain_transfers')
        .update({ status: 'failed', message: cErr.message })
        .eq('domain_name', clean)
        .eq('user_id', user.id)
        .eq('direction', 'in');
      setResult({ success: false, message: cErr.message });
      setLoading(false);
      return;
    }

    await supabase
      .from('domain_transfers')
      .update({ status: 'completed', domain_id: domainId, message: 'Transfer completed' })
      .eq('domain_name', clean)
      .eq('user_id', user.id)
      .eq('direction', 'in');

    setResult({
      success: true,
      message: `Transfer in completed. ${clean} is now in your account with DNS records.`,
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setResult({ success: false, message: 'Please sign in first.' });
      setLoading(false);
      return;
    }

    const clean = domainName.trim().toLowerCase();
    const { data: domain } = await supabase
      .from('domains')
      .select('*')
      .eq('name', clean)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!domain) {
      setResult({ success: false, message: 'Domain not found in your account.' });
      setLoading(false);
      return;
    }

    const code = `FDH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const { error: tErr } = await supabase.from('domain_transfers').insert({
      domain_name: clean,
      direction: 'out',
      user_id: user.id,
      domain_id: domain.id,
      auth_code: code,
      status: 'processing',
      message: 'Transfer out initiated',
    });

    if (tErr) {
      setResult({ success: false, message: tErr.message });
      setLoading(false);
      return;
    }

    await supabase.from('domains').update({ status: 'transferring' }).eq('id', domain.id);

    setResult({
      success: true,
      message: `Transfer out started for ${clean}. Auth code: ${code}. Status set to transferring in database.`,
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
        <p className="text-slate-500 mt-2">Real transfer requests stored in Supabase</p>
      </div>

      <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
        <button
          onClick={() => { setMode('in'); setResult(null); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Transfer In
        </button>
        <button
          onClick={() => { setMode('out'); setResult(null); }}
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
                Transfer a domain into your account. Creates a real transfer row + claims the domain in the database.
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Authorization Code (optional)
              </label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="EPP / Auth code"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Transfer In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTransferOut} className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Transfer a domain out of your account. Status + auth code saved in domain_transfers table.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain to Transfer Out</label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="yourdomain.free"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Transfer Out'}
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
            {result.success && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
            <p className="text-sm font-medium">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}