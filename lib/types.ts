export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA';

export type DomainStatus = 'active' | 'pending' | 'expired' | 'transferring' | 'locked';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Domain {
  id: string;
  user_id: string;
  name: string;
  tld: string;
  status: DomainStatus;
  registered_at: string;
  expires_at: string;
  nameservers: string[];
  created_at: string;
  updated_at: string;
}

export interface DnsRecord {
  id: string;
  domain_id: string;
  type: RecordType;
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

export interface DomainTransfer {
  id: string;
  domain_name: string;
  direction: 'in' | 'out';
  user_id: string;
  domain_id: string | null;
  auth_code: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  message: string | null;
  created_at: string;
}

export interface TrafficLog {
  id: string;
  domain_id: string;
  requests: number;
  bandwidth_mb: number;
  recorded_at: string;
}

export const FREE_TLDS = [
  'free',
  'space',
  'online',
  'site',
  'xyz',
  'fun',
  'live',
  'blog',
  'dev',
  'app',
] as const;

export type FreeTld = (typeof FREE_TLDS)[number];

export function isValidDomainName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 63) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(name);
}

export function generateSuggestions(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'my';
  const suffixes = ['hub', 'zone', 'now', 'hq', 'pro', 'lab', 'cloud', 'web'];
  const out: string[] = [];
  FREE_TLDS.forEach((tld) => {
    out.push(`${clean}.${tld}`);
  });
  suffixes.forEach((s) => {
    FREE_TLDS.slice(0, 4).forEach((tld) => {
      out.push(`${clean}${s}.${tld}`);
    });
  });
  return Array.from(new Set(out)).slice(0, 12);
}
