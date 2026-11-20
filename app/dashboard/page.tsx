'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Domain, DnsRecord, TrafficLog } from '@/lib/types';
import {
  Globe,
  ExternalLink,
  Trash2,
  Activity,
  Server,
  Plus,
  Loader2,
} from 'lucide-react';

type DomainWithMeta = Domain & {
  dns_records?: { count: number }[];
  traffic_logs?: TrafficLog[];
};

export default function DashboardPage() {
  const [domains, setDomains] = useState<DomainWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('domains')
      .select('*, dns_records(count), traffic_logs(*)')
      .order('registered_at', { ascending: false });

    if (!error && data) {
      setDomains(data as DomainWithMeta[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name} and all its DNS records?`)) return;
    setDeleting(id);
    const { error } = await supabase.from('domains').delete().eq('id', id);
    if (!error) {
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert(error.message);
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Domains</h1>
          <p className="text-slate-500 mt-1">
            {domains.length === 0
              ? 'No domains yet. Claim your first free domain!'
              : `${domains.length} domain${domains.length > 1 ? 's' : ''} in Supabase`}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Claim New Domain
        </Link>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No domains yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Search and claim a free domain. It will be saved permanently in your Supabase project.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium"
          >
            Go Search Domains
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => {
            const recordCount = domain.dns_records?.[0]?.count ?? 0;
            const todayTraffic = domain.traffic_logs?.find(
              (t) => t.recorded_at === new Date().toISOString().slice(0, 10)
            );
            return (
              <div
                key={domain.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900">{domain.name}</h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            domain.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : domain.status === 'transferring'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {domain.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Registered {new Date(domain.registered_at).toLocaleDateString()} · Free forever
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Server className="w-3.5 h-3.5" />
                          {recordCount} records
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          {todayTraffic?.requests ?? 0} req today
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Link
                      href={`/domain/${encodeURIComponent(domain.name)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition-colors"
                    >
                      Manage DNS
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(domain.id, domain.name)}
                      disabled={deleting === domain.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete domain"
                    >
                      {deleting === domain.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}