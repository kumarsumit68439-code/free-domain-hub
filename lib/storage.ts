'use client';

import { Domain, DnsRecord } from './types';

const STORAGE_KEY = 'free-domain-hub-domains';

export function getDomains(): Domain[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDomains(domains: Domain[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
}

export function addDomain(domain: Domain) {
  const domains = getDomains();
  domains.unshift(domain);
  saveDomains(domains);
  return domains;
}

export function updateDomain(id: string, updates: Partial<Domain>) {
  const domains = getDomains();
  const idx = domains.findIndex((d) => d.id === id);
  if (idx === -1) return domains;
  domains[idx] = { ...domains[idx], ...updates };
  saveDomains(domains);
  return domains;
}

export function deleteDomain(id: string) {
  const domains = getDomains().filter((d) => d.id !== id);
  saveDomains(domains);
  return domains;
}

export function getDomainByName(name: string): Domain | undefined {
  return getDomains().find((d) => d.name.toLowerCase() === name.toLowerCase());
}

export function addRecord(domainId: string, record: DnsRecord) {
  const domains = getDomains();
  const domain = domains.find((d) => d.id === domainId);
  if (!domain) return domains;
  domain.records = [record, ...domain.records];
  saveDomains(domains);
  return domains;
}

export function updateRecord(domainId: string, recordId: string, updates: Partial<DnsRecord>) {
  const domains = getDomains();
  const domain = domains.find((d) => d.id === domainId);
  if (!domain) return domains;
  const idx = domain.records.findIndex((r) => r.id === recordId);
  if (idx === -1) return domains;
  domain.records[idx] = { ...domain.records[idx], ...updates };
  saveDomains(domains);
  return domains;
}

export function deleteRecord(domainId: string, recordId: string) {
  const domains = getDomains();
  const domain = domains.find((d) => d.id === domainId);
  if (!domain) return domains;
  domain.records = domain.records.filter((r) => r.id !== recordId);
  saveDomains(domains);
  return domains;
}

export function createId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}