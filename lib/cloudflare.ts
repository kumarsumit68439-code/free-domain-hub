/**
 * Cloudflare DNS API — auto manage own-domain A/AAAA records
 * Env: CLOUDFLARE_API_TOKEN (Zone:DNS:Edit + Zone:Read)
 * Optional: CLOUDFLARE_ACCOUNT_ID (only needed to create new zones)
 */

const CF_BASE = 'https://api.cloudflare.com/client/v4';

function token(): string | null {
  return process.env.CLOUDFLARE_API_TOKEN || null;
}

export function isCloudflareConfigured(): boolean {
  return Boolean(token());
}

async function cfFetch(path: string, init?: RequestInit) {
  const t = token();
  if (!t) throw new Error('CLOUDFLARE_API_TOKEN not set');

  const res = await fetch(`${CF_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const json = (await res.json()) as {
    success: boolean;
    errors?: { message: string }[];
    result?: unknown;
  };

  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join('; ') || `Cloudflare HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json.result;
}

/** Find zone id for a hostname (walks up to apex) */
export async function findZoneId(hostname: string): Promise<{ zoneId: string; zoneName: string } | null> {
  const parts = hostname.toLowerCase().split('.');
  // try apex candidates: a.b.c.com → b.c.com, c.com
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    const result = (await cfFetch(
      `/zones?name=${encodeURIComponent(candidate)}&status=active`
    )) as { id: string; name: string }[];
    if (result?.length) {
      return { zoneId: result[0].id, zoneName: result[0].name };
    }
  }
  return null;
}

/** Relative record name for zone (@ for apex) */
function recordNameForZone(fullHostname: string, zoneName: string): string {
  const h = fullHostname.toLowerCase();
  const z = zoneName.toLowerCase();
  if (h === z) return '@';
  if (h.endsWith(`.${z}`)) return h.slice(0, -(z.length + 1));
  return h;
}

/** Upsert A or AAAA record */
export async function upsertDnsRecord(opts: {
  hostname: string;
  type: 'A' | 'AAAA';
  content: string;
  ttl?: number;
  proxied?: boolean;
}): Promise<{ id: string; name: string }> {
  const zone = await findZoneId(opts.hostname);
  if (!zone) {
    throw new Error(
      `Cloudflare zone not found for ${opts.hostname}. Add the domain in Cloudflare once (free), then try again.`
    );
  }

  const name = recordNameForZone(opts.hostname, zone.zoneName);
  const ttl = opts.ttl ?? 60;
  const proxied = opts.proxied ?? false;

  // List existing records of this type + name
  const list = (await cfFetch(
    `/zones/${zone.zoneId}/dns_records?type=${opts.type}&name=${encodeURIComponent(
      name === '@' ? zone.zoneName : `${name}.${zone.zoneName}`
    )}`
  )) as { id: string; name: string; content: string }[];

  if (list?.length) {
    const existing = list[0];
    const updated = (await cfFetch(`/zones/${zone.zoneId}/dns_records/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        type: opts.type,
        name: name === '@' ? zone.zoneName : name,
        content: opts.content,
        ttl,
        proxied,
      }),
    })) as { id: string; name: string };
    return { id: updated.id, name: updated.name };
  }

  const created = (await cfFetch(`/zones/${zone.zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: opts.type,
      name: name === '@' ? zone.zoneName : name,
      content: opts.content,
      ttl,
      proxied,
    }),
  })) as { id: string; name: string };

  return { id: created.id, name: created.name };
}

/** Point hostname (+ optional www) to IPv4 via Cloudflare */
export async function pointOwnDomainToIp(
  hostname: string,
  ipv4: string,
  alsoWww = true
): Promise<{ records: string[] }> {
  const records: string[] = [];

  const main = await upsertDnsRecord({
    hostname,
    type: 'A',
    content: ipv4,
    ttl: 60,
    proxied: false,
  });
  records.push(main.name);

  // www only if hostname is apex (example.com)
  if (alsoWww && hostname.split('.').length === 2) {
    try {
      const www = await upsertDnsRecord({
        hostname: `www.${hostname}`,
        type: 'A',
        content: ipv4,
        ttl: 60,
        proxied: false,
      });
      records.push(www.name);
    } catch {
      // ignore www failure
    }
  }

  return { records };
}
