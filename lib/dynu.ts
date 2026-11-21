/**
 * Dynu REST API v2
 * Docs: https://www.dynu.com/support/api
 * Env: DYNU_API_KEY
 *
 * Note: Free *.kozow.com hostnames often must exist in Dynu Control Panel first.
 * This client lists → updates if found → otherwise creates.
 */

const DYNU_BASE = 'https://api.dynu.com/v2';

function apiKey(): string | null {
  const k = process.env.DYNU_API_KEY?.trim();
  return k || null;
}

export function isDynuConfigured(): boolean {
  return Boolean(apiKey());
}

type DynuDomain = {
  id: number;
  name: string;
  ipv4Address?: string;
  ipv4_address?: string;
  ipv4?: boolean | string;
  ttl?: number | string;
  state?: string;
};

function extractError(json: unknown, httpStatus: number, raw: string): string {
  if (!json || typeof json !== 'object') {
    return raw?.slice(0, 200) || `Dynu HTTP ${httpStatus}`;
  }
  const j = json as Record<string, unknown>;
  const parts: string[] = [];
  if (j.message) parts.push(String(j.message));
  if (j.type) parts.push(String(j.type));
  if (j.statusCode) parts.push(`code ${j.statusCode}`);
  if (Array.isArray(j.errors)) {
    parts.push(
      (j.errors as { message?: string }[]).map((e) => e.message || JSON.stringify(e)).join('; ')
    );
  }
  if (parts.length === 0 && j.statusMessage) parts.push(String(j.statusMessage));
  if (parts.length === 0) parts.push(raw?.slice(0, 200) || `HTTP ${httpStatus}`);
  return parts.filter(Boolean).join(' — ');
}

async function dynuFetch(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const key = apiKey();
  if (!key) throw new Error('DYNU_API_KEY not configured on Vercel');

  const res = await fetch(`${DYNU_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'API-Key': key,
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text };
  }

  // Dynu often returns HTTP 200 with statusCode in body
  const bodyCode = Number(json.statusCode ?? res.status);
  const okHttp = res.ok;
  const okBody = !json.statusCode || bodyCode === 200 || bodyCode === 201;

  if (!okHttp || !okBody) {
    throw new Error(extractError(json, res.status, text));
  }

  return json;
}

function parseDomainList(payload: unknown): DynuDomain[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;

  // Common shapes: { domains: [...] } or { dnsDomains: [...] } or direct array
  const candidates = [p.domains, p.dnsDomains, p.data, payload];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c
        .filter((d) => d && typeof d === 'object' && 'id' in d && 'name' in d)
        .map((d) => d as DynuDomain);
    }
  }
  return [];
}

export async function listDynuDomains(): Promise<DynuDomain[]> {
  const json = await dynuFetch('/dns');
  return parseDomainList(json);
}

export async function findDynuDomainId(fullHostname: string): Promise<number | null> {
  const domains = await listDynuDomains();
  const found = domains.find((d) => d.name?.toLowerCase() === fullHostname.toLowerCase());
  return found?.id ?? null;
}

/** Update existing hostname IP (POST /dns/{id}) */
export async function updateDynuIp(domainId: number, ipv4: string) {
  // GET current then merge (Dynu is happier with fuller body)
  let current: Record<string, unknown> = {};
  try {
    current = await dynuFetch(`/dns/${domainId}`);
  } catch {
    current = {};
  }

  const body = {
    name: current.name,
    group: current.group ?? '',
    ipv4: true,
    ipv6: current.ipv6 === true || current.ipv6 === 'true',
    ttl: Number(current.ttl) || 90,
    ipv4Address: ipv4,
    ipv4_address: ipv4,
    ipv4WildcardAlias: current.ipv4WildcardAlias ?? false,
    ipv6WildcardAlias: current.ipv6WildcardAlias ?? false,
  };

  return dynuFetch(`/dns/${domainId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Ensure hostname exists on Dynu and points to ipv4 when provided.
 */
export async function createOrUpdateDynuHostname(
  fullHostname: string,
  ipv4?: string | null
): Promise<{ id: number; name: string }> {
  const host = fullHostname.toLowerCase().trim();
  const ip = ipv4?.trim() || null;

  // 1) List first — most free hostnames already exist in control panel
  let domains: DynuDomain[] = [];
  try {
    domains = await listDynuDomains();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Cannot list Dynu domains (${msg}). Check DYNU_API_KEY is correct (Control Panel → API Credentials).`
    );
  }

  const existing = domains.find((d) => d.name?.toLowerCase() === host);
  if (existing) {
    if (ip) {
      try {
        await updateDynuIp(existing.id, ip);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Dynu update IP failed for ${host}: ${msg}`);
      }
    }
    return { id: existing.id, name: existing.name };
  }

  // 2) Create new DNS service
  const createBody = {
    name: host,
    group: '',
    ipv4: true,
    ipv6: false,
    ttl: 90,
    ipv4Address: ip || '0.0.0.0',
    ipv4WildcardAlias: false,
    ipv6WildcardAlias: false,
    allowZoneTransfer: false,
    dnssec: false,
  };

  try {
    const created = await dynuFetch('/dns', {
      method: 'POST',
      body: JSON.stringify(createBody),
    });

    const id = Number(created.id);
    if (!id || Number.isNaN(id)) {
      // Some responses nest result
      const nested = created as { id?: number; result?: { id?: number } };
      const id2 = Number(nested.result?.id || nested.id);
      if (!id2 || Number.isNaN(id2)) {
        throw new Error('Dynu create returned no id');
      }
      return { id: id2, name: host };
    }
    return { id, name: String(created.name || host) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    // Re-list in case create raced / already exists under another message
    try {
      const again = await listDynuDomains();
      const found = again.find((d) => d.name?.toLowerCase() === host);
      if (found) {
        if (ip) await updateDynuIp(found.id, ip);
        return { id: found.id, name: found.name };
      }
    } catch {
      // ignore
    }

    throw new Error(
      `Dynu create failed for ${host}: ${msg}. ` +
        `Tip: open Dynu Control Panel → DDNS → Add → create "${host}" once, then Connect again (API will only update IP). ` +
        `Free accounts have hostname limits.`
    );
  }
}
