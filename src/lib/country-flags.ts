import countriesReference from '@/data/reference/countries.json';

const _nameToFlagPath = new Map<string, string>();
const _slugToFlagPath = new Map<string, string>();

for (const c of countriesReference) {
  if (c.flagImage) {
    _nameToFlagPath.set(c.name.toLowerCase(), c.flagImage);
    _slugToFlagPath.set(c.slug, c.flagImage);
  }
}

export function getCountryFlagPath(name?: string, slug?: string): string | null {
  if (slug) {
    const fromSlug = _slugToFlagPath.get(slug);
    if (fromSlug) return fromSlug;
  }
  if (name) {
    const fromName = _nameToFlagPath.get(name.toLowerCase());
    if (fromName) return fromName;
  }
  return null;
}
