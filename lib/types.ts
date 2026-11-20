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
  ipv4: string | null;
  ipv6: string | null;
  update_token: string | null;
  dynu_id: number | null;
  is_own: boolean;
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

/** Free Dynu-style parent */
export const PARENT_DOMAIN = 'kozow.com';

export const FREE_TLDS = ['kozow.com'] as const;

export type FreeTld = (typeof FREE_TLDS)[number];

export function isValidHostnameLabel(name: string): boolean {
  if (!name || name.length < 1 || name.length > 63) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(name);
}

/** Own domain: example.com or sub.example.com */
export function isValidOwnDomain(name: string): boolean {
  const n = name.toLowerCase().trim();
  if (n.length < 3 || n.length > 253) return false;
  if (!n.includes('.')) return false;
  if (n.endsWith('.')) return false;
  const parts = n.split('.');
  if (parts.length < 2) return false;
  return parts.every((p) => isValidHostnameLabel(p));
}

export function generateSuggestions(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'my';
  const suffixes = ['', 'hub', 'zone', 'now', 'hq', 'pro', 'lab', 'cloud', 'web', 'home', 'pc', 'nas'];
  const out: string[] = [];
  suffixes.forEach((s) => {
    const host = s ? `${clean}${s}` : clean;
    out.push(`${host}.${PARENT_DOMAIN}`);
  });
  return Array.from(new Set(out)).slice(0, 12);
}

/** @deprecated use isValidHostnameLabel */
export function isValidDomainName(name: string): boolean {
  return isValidHostnameLabel(name);
}
