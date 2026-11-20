# Free Domain Hub

**Real backend on Supabase** — domains, DNS records, transfers, and traffic are stored in a live PostgreSQL database (project: FreeDomain).

## What is real

| Feature | Implementation |
|---------|----------------|
| User accounts | Supabase Auth (email/password) |
| Domain ownership | `domains` table + RLS |
| DNS records (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA) | `dns_records` table |
| Domain transfer in/out | `domain_transfers` table |
| Traffic | `traffic_logs` table |
| Availability check | RPC `is_domain_available` |
| Claim domain | RPC `claim_domain` (atomic + default records) |

## Important note on public DNS

Records and ownership are **real in the database**. Public internet resolution of names like `something.free` requires a real TLD registry or a parent domain you control + authoritative nameservers. This app is the management plane (registrar-style panel). To make names resolve on the open internet you would integrate Cloudflare / deSEC / your own NS and own a domain for free subdomains.

## Stack

- Next.js 14 (App Router)
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS

## Supabase project

- Project name: **FreeDomain**
- URL: `https://igqgtfuhzojadgkvivxa.supabase.co`

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Vercel deploy

1. Import repo `kumarsumit68439-code/free-domain-hub`
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Auth tip

In Supabase Dashboard → Authentication → Providers → Email:
- For testing you can disable **Confirm email** so signup logs in immediately.
