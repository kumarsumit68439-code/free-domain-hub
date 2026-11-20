/**
 * Dynu REST API v2 helper
 * Docs: https://www.dynu.com/support/api
 * Requires DYNU_API_KEY env (from Dynu Control Panel → API Credentials)
 */

const DYNU_BASE = 'https://api.dynu.com/v2';

function apiKey(): string | null {
  return process.env.DYNU_API_KEY || null;
}

export function isDynuConfigured(): boolean {
  return Boolean(apiKey());
}

async function dynuFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) throw new Error('DYNU_API_KEY not configured');

  const res = await fetch(`${DYNU_BASE}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'API-Key': key,
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (json as { message?: string })?.message ||
      text ||
      `Dynu API error ${res.status}`;
    throw new Error(msg);
  }

  return json as Record<string, unknown>;
}

/** List hostnames in Dynu account */
export async function listDynuDomains() {
  return dynuFetch('/dns');
}

/**
 * Create or ensure hostname exists under kozow.com (or full name)
 * Returns Dynu domain id
 */
export async function createOrUpdateDynuHostname(
  fullHostname: string,
  ipv4?: string | null
): Promise<{ id: number; name: string }> {
  // Try create
  try {
    const body: Record<string, unknown> = {
      name: fullHostname.toLowerCase(),
      group: '',
      ipv4: true,
      ipv6: false,
      ipv4WildcardAlias: false,
      ipv6WildcardAlias: false,
      ttl: 60,
      ipv4Address: ipv4 || '0.0.0.0',
    };

    const created = await dynuFetch('/dns', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const id = Number(created.id);
    return { id, name: String(created.name || fullHostname) };
  } catch (err) {
    // Already exists — find and update
    const list = (await listDynuDomains()) as {
      domains?: { id: number; name: string }[];
    };
    const domains = list.domains || (Array.isArray(list) ? list : []);
    const found = (domains as { id: number; name: string }[]).find(
      (d) => d.name?.toLowerCase() === fullHostname.toLowerCase()
    );
    if (!found) throw err;

    if (ipv4) {
      await updateDynuIp(found.id, ipv4);
    }
    return { id: found.id, name: found.name };
  }
}

/** Update IPv4 for existing Dynu domain id */
export async function updateDynuIp(domainId: number, ipv4: string) {
  return dynuFetch(`/dns/${domainId}`, {
    method: 'POST',
    body: JSON.stringify({
      ipv4: true,
      ipv6: false,
      ipv4Address: ipv4,
      ttl: 60,
    }),
  });
}

/** Find Dynu domain id by full hostname */
export async function findDynuDomainId(fullHostname: string): Promise<number | null> {
  const list = (await listDynuDomains()) as {
    domains?: { id: number; name: string }[];
  };
  const domains = list.domains || (Array.isArray(list) ? list : []);
  const found = (domains as { id: number; name: string }[]).find(
    (d) => d.name?.toLowerCase() === fullHostname.toLowerCase()
  );
  return found?.id ?? null;
}
