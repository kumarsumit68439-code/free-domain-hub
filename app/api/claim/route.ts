import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createOrUpdateDynuHostname, isDynuConfigured } from '@/lib/dynu';
import { PARENT_DOMAIN, isValidDomainName } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const hostname = String(body.hostname || '').toLowerCase().trim();
  const ipv4 = body.ipv4 ? String(body.ipv4).trim() : null;

  // Expect host like name.kozow.com or just name
  let full = hostname;
  let node = hostname;
  if (hostname.endsWith(`.${PARENT_DOMAIN}`)) {
    node = hostname.slice(0, -(PARENT_DOMAIN.length + 1));
    full = hostname;
  } else {
    node = hostname.split('.')[0];
    full = `${node}.${PARENT_DOMAIN}`;
  }

  if (!isValidDomainName(node)) {
    return NextResponse.json({ error: 'Invalid hostname' }, { status: 400 });
  }

  if (ipv4 && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ipv4)) {
    return NextResponse.json({ error: 'Invalid IPv4' }, { status: 400 });
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

  // Check availability in our DB
  const { data: available } = await supabase.rpc('is_domain_available', {
    check_name: full,
  });
  if (!available) {
    return NextResponse.json({ error: 'Hostname already taken' }, { status: 409 });
  }

  let dynuId: number | null = null;

  // Real public DNS via Dynu if configured
  if (isDynuConfigured()) {
    try {
      const dynu = await createOrUpdateDynuHostname(full, ipv4);
      dynuId = dynu.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Dynu API failed';
      return NextResponse.json(
        {
          error: `Dynu DNS error: ${msg}. Check DYNU_API_KEY and free hostname limits on Dynu.`,
        },
        { status: 502 }
      );
    }
  }

  // Store in Supabase
  const { data: domainId, error } = await supabase.rpc('claim_domain', {
    p_name: full,
    p_tld: PARENT_DOMAIN,
    p_ipv4: ipv4,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (dynuId && domainId) {
    await supabase.from('domains').update({ dynu_id: dynuId }).eq('id', domainId);
  }

  return NextResponse.json({
    ok: true,
    domain: full,
    ipv4,
    dynu_id: dynuId,
    public_dns: isDynuConfigured(),
    message: isDynuConfigured()
      ? `${full} is live on Dynu DNS → ${ipv4 || 'set IP next'}`
      : `${full} saved. Add DYNU_API_KEY for public resolution.`,
  });
}
