import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Dynu-compatible IP update endpoint
 * GET /api/update?hostname=name.free&token=TOKEN&myip=1.2.3.4
 * Returns plain text: good | badauth | nochg | badip
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hostname =
    searchParams.get('hostname') ||
    searchParams.get('domain') ||
    searchParams.get('host');
  const token =
    searchParams.get('token') ||
    searchParams.get('password') ||
    searchParams.get('key');
  let myip = searchParams.get('myip') || searchParams.get('ip') || searchParams.get('ipv4');
  const myipv6 = searchParams.get('myipv6') || searchParams.get('ipv6');

  // Auto-detect client IP if myip=auto or missing (optional)
  if (!myip || myip === 'auto') {
    myip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;
  }

  if (!hostname || !token) {
    return new NextResponse('badauth', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (!myip && !myipv6) {
    return new NextResponse('badip', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Basic IPv4 validation
  if (myip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(myip)) {
    return new NextResponse('badip', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('update_domain_ip', {
    p_name: hostname.toLowerCase(),
    p_token: token,
    p_ipv4: myip || null,
    p_ipv6: myipv6 || null,
  });

  if (error) {
    return new NextResponse('badauth', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const result = (data as string) || 'badauth';
  const status = result === 'good' || result === 'nochg' ? 200 : 401;

  return new NextResponse(result, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}
