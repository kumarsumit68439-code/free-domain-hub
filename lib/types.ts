export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';

export interface DnsRecord {
  id: string;
  type: RecordType;
  name: string; // @ or subdomain
  value: string;
  ttl: number;
  priority?: number; // for MX
  createdAt: string;
}

export interface Domain {
  id: string;
  name: string; // full domain e.g. myblog.free
  tld: string;
  status: 'active' | 'pending' | 'expired' | 'transferring';
  registeredAt: string;
  expiresAt: string; // far future for free
  nameservers: string[];
  records: DnsRecord[];
  traffic: {
    requests24h: number;
    bandwidthMB: number;
  };
}

export interface SearchResult {
  domain: string;
  tld: string;
  available: boolean;
  isFree: true;
}