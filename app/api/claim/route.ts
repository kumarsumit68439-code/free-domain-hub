import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createOrUpdateDynuHostname, isDynuConfigured } from '@/lib/dynu';
import { isCloudflareConfigured, pointOwnDomainToIp } from '@/lib/cloudflare';
import {
  PARENT_DOMAIN,
  isValidHostnameLabel,
  isValidOwnDomain,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'own' ? 'own' : 'free';
  const hostname = String(body.hostname || '').toLowerCase().trim();
  const ipv4 = body.ipv4 ? String(body.ipv4).trim() : null;

  if (ipv4 && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ipv4)) {
    return NextResponse.json({ error: 'Invalid IPv4' }, { status: 400 });
  }

  let full: string;
  let tld: string;
  let isOwn = false;

  if (mode === 'own') {
    if (!isValidOwnDomain(hostname)) {
      return NextResponse.json(
        { error: 'Invalid own domain. Example: myblog.com' },
        { status: 400 }
      );
    }
    full = hostname;
    const parts = full.split('.');
    tld = parts.slice(-2).join('.');
    isOwn = true;
  } else {
    let node = hostname;
    if (hostname.endsWith(`.${PARENT_DOMAIN}`)) {
      node = hostname.slice(0, -(PARENT_DOMAIN.length + 1));
      full = hostname;
    } else {
      node = hostname.split('.')[0];
      full = `${node}.${PARENT_DOMAIN}`;
    }
    if (!isValidHostnameLabel(node)) {
      return NextResponse.json({ error: 'Invalid free hostname' }, { status: 400 });
    }
    tld = PARENT_DOMAIN;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: available } = await supabase.rpc('is_domain_available', {
    check_name: full,
  });
  if (!available) {
    return NextResponse.json({ error: 'Domain already registered here' }, { status: 409 });
  }

  let dynuId: number | null = null;
  let cfNote = '';

  // Free kozow.com → Dynu
  if (!isOwn && isDynuConfigured()) {
    try {
      const dynu = await createOrUpdateDynuHostname(full, ipv4);
      dynuId = dynu.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Dynu API failed';
      return NextResponse.json({ error: `Dynu DNS error: ${msg}` }, { status: 502 });
    }
  }

  // Own domain → Cloudflare auto A records (no manual add at registrar)
  if (isOwn && ipv4 && isCloudflareConfigured()) {
    try {
      const cf = await pointOwnDomainToIp(full, ipv4, true);
      cfNote = ` Cloudflare updated: ${cf.records.join(', ')} → ${ipv4}`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cloudflare failed';
      return NextResponse.json(
        {
          error: `Cloudflare: ${msg}`,
          hint: 'Domain must already be added in your Cloudflare account (free). Nameservers once at registrar, then this app manages all records.',
        },
        { status: 502 }
      );
    }
  } else if (isOwn && ipv4 && !isCloudflareConfigured()) {
    cfNote =
      ' (CLOUDFLARE_API_TOKEN not set — domain saved in DB only. Add token on Vercel for auto DNS.)';
  }

  const { data: domainId, error } = await supabase.rpc('claim_domain', {
    p_name: full,
    p_tld: tld,
    p_ipv4: ipv4,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (domainId) {
    await supabase
      .from('domains')
      .update({
        dynu_id: dynuId,
        is_own: isOwn,
        nameservers: isOwn
          ? ['(Cloudflare nameservers for your zone)']
          : ['ns0.dynu.com', 'ns1.dynu.com', 'ns3.dynu.com', 'ns4.dynu.com'],
      })
      .eq('id', domainId);
  }

  return NextResponse.json({
    ok: true,
    domain: full,
    ipv4,
    is_own: isOwn,
    dynu_id: dynuId,
    cloudflare: isOwn && isCloudflareConfigured(),
    message: isOwn
      ? `${full} added.${cfNote}`
      : isDynuConfigured()
      ? `${full} live on Dynu → ${ipv4 || 'set IP next'}`
      : `${full} saved.`,
  });
}
