'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getDomainByName,
  addRecord,
  deleteRecord,
  updateDomain,
  createId,
} from '@/lib/storage';
import { Domain, DnsRecord, RecordType } from '@/lib/types';
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
} from 'lucide-react';

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS'];

export default function DomainPage() {
  const params = useParams();
  const router = useRouter();
  const name = decodeURIComponent(params.name as string);

  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // form
  const [type, setType] = useState<RecordType>('A');
  const [recordName, setRecordName] = useState('@');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState(3600);
  const [priority, setPriority] = useState(10);

  useEffect(() => {
    const d = getDomainByName(name);
    setDomain(d || null);
    setLoading(false);
  }, [name]);

  const refresh = () => {
    const d = getDomainByName(name);
    setDomain(d || null);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !value.trim()) return;

    setSaving(true);
    setMessage(null);
    await new Promise((r) => setTimeout(r, 700)); // real response feel

    const record: DnsRecord = {
      id: createId(),
      type,
      name: recordName.trim() || '@',
      value: value.trim(),
      ttl,
      priority: type === 'MX' ? priority : undefined,
      createdAt: new Date().toISOString(),
    };

    addRecord(domain.id, record);
    setSaving(false);
    setShowAdd(false);
    setValue('');
    setRecordName('@');
    setMessage('Record added successfully');
    refresh();

    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!domain) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    deleteRecord(domain.id, recordId);
    setSaving(false);
    setMessage('Record deleted');
    refresh();
    setTimeout(() => setMessage(null), 2500);
  };

  const copyNS = () => {
    if (!domain) return;
    navigator.clipboard.writeText(domain.nameservers.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <p className="text-slate-500 mt-2">This domain is not in your account.</p>
        <Link href="/dashboard" className="inline-block mt-6 text-brand-600 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{domain.name}</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  domain.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {domain.status}
              </span>
              · Free forever · {domain.records.length} DNS records
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main - DNS Records */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" />
                DNS Records
              </h2>
            </div>

            {domain.records.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No records yet. Add your first A or CNAME record.
              </div>
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
                    {domain.records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                            {r.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-800">{r.name}</td>
                        <td className="px-5 py-3 font-mono text-slate-600 max-w-[200px] truncate" title={r.value}>
                          {r.type === 'MX' && r.priority !== undefined ? `${r.priority} ` : ''}
                          {r.value}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{r.ttl}s</td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Add Record Modal-ish */}
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                    >
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={recordName}
                      onChange={(e) => setRecordName(e.target.value)}
                      placeholder="@ or www or subdomain"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Value {type === 'A' && '(IP address)'} {type === 'CNAME' && '(target domain)'}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={
                      type === 'A'
                        ? '76.76.21.21'
                        : type === 'CNAME'
                        ? 'example.com'
                        : type === 'TXT'
                        ? 'v=spf1 include:...'
                        : 'value'
                    }
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none font-mono"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">TTL (seconds)</label>
                    <input
                      type="number"
                      value={ttl}
                      onChange={(e) => setTtl(Number(e.target.value))}
                      min={60}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                    />
                  </div>
                  {type === 'MX' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                      <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        min={0}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold rounded-xl flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Record'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Nameservers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Nameservers</h3>
            <div className="space-y-2 font-mono text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
              {domain.nameservers.map((ns) => (
                <div key={ns}>{ns}</div>
              ))}
            </div>
            <button
              onClick={copyNS}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy Nameservers'}
            </button>
          </div>

          {/* Traffic */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              Traffic (24h)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Requests</span>
                <span className="font-semibold">{domain.traffic.requests24h}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Bandwidth</span>
                <span className="font-semibold">{domain.traffic.bandwidthMB} MB</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Mock data · updates on refresh</p>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Registered</span>
              <span>{new Date(domain.registeredAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expires</span>
              <span className="text-emerald-600 font-medium">Never (Free)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TLD</span>
              <span>.{domain.tld}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}