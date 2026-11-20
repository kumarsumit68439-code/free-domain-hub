export const FREE_TLDS = [
  'free',
  'space',
  'online',
  'site',
  'xyz',
  'fun',
  'live',
  'blog',
  'dev',
  'app',
] as const;

export type FreeTld = (typeof FREE_TLDS)[number];

export function isValidDomainName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 63) return false;
  // simple validation: alphanumeric + hyphen, no start/end hyphen
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(name);
}

export function generateSuggestions(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'my';
  const suffixes = ['hub', 'zone', 'now', 'hq', 'io', 'pro', 'lab', 'cloud'];
  const suggestions: string[] = [];
  FREE_TLDS.forEach((tld) => {
    suggestions.push(`${clean}.${tld}`);
    if (suggestions.length < 8) {
      const s = suffixes[Math.floor(Math.random() * suffixes.length)];
      suggestions.push(`${clean}${s}.${tld}`);
    }
  });
  return [...new Set(suggestions)].slice(0, 12);
}