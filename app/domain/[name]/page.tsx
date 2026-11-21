'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Domain, DnsRecord, TrafficLog } from '@/lib/types';
import {
  ArrowLeft,
  Loader2,
  Globe,
  CheckCircle2,
  Activity,
  Wifi,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function DomainPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const supabase = createClient();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [traffic, setTraffic] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ipInput, setIpInput] = useState('');
  const [updatingIp, setUpdatingIp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: d } = await supabase
      .from('domains')
      .select('*')
      .eq('name', name.toLowerCase())
      .single();

    if (!d) {
      setDomain(null);
      setLoading(false);
      return;
    }

    setDomain(d as Domain);
    setIpInput((d as Domain).ipv4 || '');

    const { data: recs } = await supabase
      .from('dns_records')
      .select('*')
      .eq('domain_id', d.id)
      .order('created_at', { ascending: false });

    setRecords((recs as DnsRecord[]) || []);

    const today = new Date().toISOString().slice(0, 10);
    const { data: traf } = await supabase
      .from('traffic_logs')
      .select('*')
      .eq('domain_id', d.id)
      .eq('recorded_at', today)
      .maybeSingle();

    setTraffic((traf as TrafficLog) || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [name]);

  const handleUpdateIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain?.update_token) return;

    const ip = ipInput.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      setMessage('Invalid IPv4 address');
      return;
    }

    setUpdatingIp(true);
    setMessage(null);

    const res = await fetch(
      `/api/update?hostname=${encodeURIComponent(domain.name)}&token=${encodeURIComponent(
        domain.update_token
      )}&myip=${encodeURIComponent(ip)}`
    );
    const text = await res.text();

    setUpdatingIp(false);
    if (text === 'good' || text === 'nochg') {
      setMessage(
        domain.is_own
          ? `Connected! ${domain.name} → ${ip} (A + www auto — no manual records)`
          : `IP updated to ${ip} — active`
      );
      await load();
    } else {
      setMessage(`Update failed: ${text}`);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Domain not found</h2>
        <Link href="/dashboard" className="inline-block mt-6 text-brand-600 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const updateUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/update?hostname=${domain.name}&token=${domain.update_token}&myip=`
      : `/api/update?hostname=${domain.name}&token=${domain.update_token}&myip=`;

  const isConnected = Boolean(domain.ipv4 && domain.ipv4 !== '0.0.0.0');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{domain.name}</h1>
        <p className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isConnected ? `Connected → ${domain.ipv4}` : 'Only IP needed to connect'}
          </span>
          {domain.is_own ? (
            <span className="text-xs text-slate-400">Own domain · auto DNS</span>
          ) : (
            <span className="text-xs text-slate-400">Free · kozow.com</span>
          )}
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Primary: IP only */}
      <div className="mb-6 bg-gradient-to-br from-brand-50 to-white rounded-2xl border-2 border-brand-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2 text-lg">
          <Wifi className="w-5 h-5 text-brand-600" />
          Connect with IP only
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          A, AAAA, CNAME, TXT <strong>manual nahi dalne</strong>. Sirf public IP daalo — system auto A record (+ www)
          set karega{domain.is_own ? ' (Cloudflare pe bhi, token ho to)' : ' (Dynu pe, key ho to)'}.
        </p>
        <form onSubmit={handleUpdateIp} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="e.g. 203.0.113.10"
            className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-mono text-lg"
            required
          />
          <button
            type="submit"
            disabled={updatingIp}
            className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {updatingIp ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Connect
          </button>
        </form>

        {domain.update_token && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-600 break-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-slate-500 font-sans text-xs">Auto-update URL (router / cron)</span>
              <button
                type="button"
                onClick={() => copyText('url', `${updateUrl}YOUR_IP`)}
                className="text-brand-600 hover:underline font-sans"
              >
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {updateUrl}&lt;YOUR_IP&gt;
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Current IP</h3>
          <p className="font-mono text-xl text-slate-900">{domain.ipv4 || '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Traffic today
          </h3>
          <p className="text-xl font-semibold text-slate-900">{traffic?.requests ?? 0} req</p>
        </div>
      </div>

      {/* Advanced: optional view of auto records */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Advanced: auto-created records (optional view)
      </button>

      {showAdvanced && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <p className="px-5 py-3 text-xs text-slate-500 border-b border-slate-100">
            Ye records IP connect se <strong>auto</strong> bante hain — manually add karne ki zarurat nahi.
          </p>
          {records.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">IP connect karo — records auto aa jayenge.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-500">
                    <th className="px-5 py-2 font-medium">Type</th>
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-5 py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-2.5 font-mono text-xs font-semibold">{r.type}</td>
                      <td className="px-5 py-2.5 font-mono">{r.name}</td>
                      <td className="px-5 py-2.5 font-mono text-slate-600 truncate max-w-[180px]">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
