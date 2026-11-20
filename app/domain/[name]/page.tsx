'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Domain, DnsRecord, RecordType, TrafficLog } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Server,
  Globe,
  CheckCircle2,
  Copy,
  Activity,
  Wifi,
} from 'lucide-react';

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA'];

export default function DomainPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const supabase = createClient();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [traffic, setTraffic] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [ipInput, setIpInput] = useState('');
  const [updatingIp, setUpdatingIp] = useState(false);

  const [type, setType] = useState<RecordType>('A');
  const [recordName, setRecordName] = useState('@');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState(3600);
  const [priority, setPriority] = useState(10);

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
      setMessage(`IP updated to ${ip} — domain active (like Dynu)`);
      await load();
    } else {
      setMessage(`Update failed: ${text}`);
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !value.trim()) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from('dns_records').insert({
      domain_id: domain.id,
      type,
      name: recordName.trim() || '@',
      value: value.trim(),
      ttl,
      priority: type === 'MX' || type === 'SRV' ? priority : null,
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setShowAdd(false);
    setValue('');
    setRecordName('@');
    setMessage('DNS record saved');
    await load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteRecord = async (recordId: string) => {
    setSaving(true);
    const { error } = await supabase.from('dns_records').delete().eq('id', recordId);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Record deleted');
    await load();
    setTimeout(() => setMessage(null), 2500);
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{domain.name}</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isConnected ? `Active → ${domain.ipv4}` : 'No IP — set IP to activate'}
              </span>
              · {records.length} DNS records
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* Dynu-style IP connect */}
      <div className="mb-6 bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-200 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Wifi className="w-5 h-5 text-brand-600" />
          Connect IP (Dynu style)
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Apna public IP daalo — domain ka A record update ho jayega aur status <strong>Active</strong> ho jayega.
        </p>
        <form onSubmit={handleUpdateIp} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="203.0.113.10"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-mono"
          />
          <button
            type="submit"
            disabled={updatingIp}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {updatingIp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update IP & Activate
          </button>
        </form>

        {domain.update_token && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-600 break-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-slate-500 font-sans text-xs">Router / cron update URL</span>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" />
                DNS Records
              </h2>
            </div>

            {records.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No records yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-slate-500">
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">TTL</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                            {r.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-800">{r.name}</td>
                        <td className="px-5 py-3 font-mono text-slate-600 max-w-[200px] truncate" title={r.value}>
                          {r.priority != null ? `${r.priority} ` : ''}
                          {r.value}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{r.ttl}s</td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showAdd && (
            <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Add DNS Record</h3>
              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as RecordType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none"
                    >
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={recordName}
                      onChange={(e) => setRecordName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Value</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold">
                    {saving ? 'Saving...' : 'Add Record'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 bg-slate-100 rounded-xl">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Current IP</h3>
            <p className="font-mono text-lg text-slate-800">{domain.ipv4 || '—'}</p>
            {domain.ipv6 && <p className="font-mono text-sm text-slate-500 mt-1">{domain.ipv6}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Update token</h3>
            <p className="font-mono text-xs text-slate-600 break-all">{domain.update_token}</p>
            <button
              onClick={() => domain.update_token && copyText('token', domain.update_token)}
              className="mt-2 text-sm text-brand-600 font-medium"
            >
              {copied === 'token' ? 'Copied!' : 'Copy token'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              Traffic (today)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Requests</span>
                <span className="font-semibold">{traffic?.requests ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bandwidth</span>
                <span className="font-semibold">{Number(traffic?.bandwidth_mb ?? 0).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
