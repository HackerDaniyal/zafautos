'use client';

import * as React from 'react';
import {
  Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  LayoutTemplate, Settings, Save, X, Check, GripVertical,
  RotateCcw, Loader2, Search,
  Image, Coins, CarFront, Globe2, Car, Flag,
  Star, Sparkles, ThumbsUp, BarChart3, MessageSquare,
  HelpCircle, Megaphone, Paperclip, Minus,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { MakeLogo } from '@/components/admin/vehicles/entity-visuals';
import { getCountryFlagPath } from '@/lib/country-flags';
import {
  listHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  updateAllHomepageSections,
  deleteHomepageSection,
  reorderHomepageSections,
  getHomepageConfigData,
  getHomepageLookupData,
  toggleHomepageLookupItem,
  reorderHomepageLookupItems,
} from '@/server/actions/cmsActions';
import { ConfigDrawer } from './config-drawer';
import type { HomepageData } from '@/lib/homepage-data';

// ── Types ──────────────────────────────────────────────────────────────────

interface SectionRow {
  id: string;
  type: string;
  isEnabled: boolean;
  displayOrder: number;
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  button2Label?: string | null;
  button2Url?: string | null;
  extraData?: Record<string, unknown> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  search: 'Search Bar',
  featured_vehicles: 'Featured Vehicles',
  latest_vehicles: 'Latest Arrivals',
  browse_make: 'Shop By Make',
  browse_body_type: 'Browse by Body Type',
  browse_country: 'Browse by Country',
  browse_continent: 'Browse by Continent',
  browse_currency: 'Currency Selector',
  why_choose_us: 'Why Choose Us',
  statistics: 'Statistics',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  cta: 'Call to Action',
  footer: 'Footer',
};

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hero: Image,
  browse_currency: Coins,
  browse_make: CarFront,
  browse_continent: Globe2,
  browse_body_type: Car,
  browse_country: Flag,
  featured_vehicles: Star,
  latest_vehicles: Sparkles,
  why_choose_us: ThumbsUp,
  statistics: BarChart3,
  testimonials: MessageSquare,
  faq: HelpCircle,
  cta: Megaphone,
  search: Search,
  footer: Paperclip,
};

const WIDGET_TYPES = ['browse_currency', 'browse_make', 'browse_continent', 'browse_body_type', 'browse_country'];

const CURRENCY_FLAG_CODES: Record<string, string> = {
  USD: 'us', JPY: 'jp', EUR: 'eu', GBP: 'gb', AUD: 'au', CAD: 'ca',
  CHF: 'ch', CNY: 'cn', KRW: 'kr', NZD: 'nz', INR: 'in', AED: 'ae',
  SGD: 'sg', MYR: 'my', THB: 'th', SAR: 'sa', QAR: 'qa', KWD: 'kw',
  BHD: 'bh', OMR: 'om', PKR: 'pk', BDT: 'bd', PHP: 'ph',
};

function SectionIcon({ type, className }: { type: string; className?: string }) {
  const Icon = SECTION_ICONS[type] ?? FileText;
  return <Icon className={className} />;
}

// ── Shared UI Components ────────────────────────────────────────────────────

function ConfigSearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel/60 focus:outline-none focus:border-signal-red/50"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-pure-white">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ConfigSectionHeader({ label, description, count, totalCount, onSelectAll, onDeselectAll }: {
  label: string; description?: string; count: number; totalCount: number;
  onSelectAll: () => void; onDeselectAll: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-pure-white">{label}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-iron/30 text-steel">
          {count}/{totalCount}
        </Badge>
      </div>
      {description && <p className="text-[11px] text-steel mb-2">{description}</p>}
      <div className="flex items-center gap-1">
        <button onClick={onSelectAll} className="text-[10px] text-signal-red hover:text-signal-red/80 transition-colors">
          Select all
        </button>
        <span className="text-steel/40 text-[10px]">|</span>
        <button onClick={onDeselectAll} className="text-[10px] text-steel hover:text-pure-white transition-colors">
          Deselect all
        </button>
      </div>
    </div>
  );
}

function CurrencyFlagIcon({ code, size = 20 }: { code: string; size?: number }) {
  const flagCode = CURRENCY_FLAG_CODES[code];
  const [imgFailed, setImgFailed] = React.useState(false);
  if (!flagCode || imgFailed) return <Flag className="text-steel" style={{ width: size, height: size }} />;
  return (
    <img
      src={`/flags/${flagCode}.svg`}
      alt={`${code} flag`}
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );
}

function CountryFlagImage({ flagImage, name, slug, size = 22 }: { flagImage?: string | null; name: string; slug?: string; size?: number }) {
  const resolvedPath = flagImage || getCountryFlagPath(name, slug);
  const [imgFailed, setImgFailed] = React.useState(false);

  if (resolvedPath && !imgFailed) {
    return (
      <img
        src={resolvedPath}
        alt={`${name} flag`}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <Flag className="text-steel flex-shrink-0" style={{ width: size, height: size }} />;
}

// ── SHOP BY MAKE CONFIG ─────────────────────────────────────────────────────

interface MakeItem {
  id: string;
  name: string;
  logoUrl: string | null;
  count: number;
}

function MakesConfig({ section, onExtraDataChange }: { section: SectionRow; onExtraDataChange: (ed: Record<string, unknown>) => void }) {
  const [makes, setMakes] = React.useState<MakeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const extraData = (section.extraData ?? {}) as { visibleMakeIds?: string[] };

  React.useEffect(() => {
    async function load() {
      try {
        const result = await getHomepageConfigData();
        if (result.success && result.data) {
          const cfg = result.data as { manufacturers: Array<{ id: string; name: string; logo_url: string | null; count: number }> };
          const loadedMakes: MakeItem[] = cfg.manufacturers.map((m) => ({
            id: m.id, name: m.name, logoUrl: m.logo_url, count: m.count ?? 0,
          }));
          setMakes(loadedMakes);

          if ('visibleMakeIds' in extraData) {
            setSelectedIds(new Set(extraData.visibleMakeIds ?? []));
          } else {
            setSelectedIds(new Set(loadedMakes.map((m) => m.id)));
          }
        }
      } catch (err) { console.error('[HomepageBuilder] load error:', err); }
      setLoading(false);
    }
    load();
  }, [section.id]);

  const filteredMakes = React.useMemo(() => {
    if (!search) return makes;
    const q = search.toLowerCase();
    return makes.filter((m) => m.name.toLowerCase().includes(q));
  }, [makes, search]);

  function emitChange(ids: Set<string>) {
    onExtraDataChange({ visibleMakeIds: Array.from(ids) });
  }

  function toggleMake(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      emitChange(next);
      return next;
    });
  }

  function selectAll() {
    const all = new Set(makes.map((m) => m.id));
    setSelectedIds(all);
    emitChange(all);
  }

  function deselectAll() {
    const empty = new Set<string>();
    setSelectedIds(empty);
    emitChange(empty);
  }

  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="space-y-3">
      <ConfigSectionHeader label="Shop By Make" description="Choose which vehicle makes appear in the homepage widget." count={selectedIds.size} totalCount={makes.length} onSelectAll={selectAll} onDeselectAll={deselectAll} />
      <ConfigSearchInput value={search} onChange={setSearch} placeholder="Search makes..." />
      <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredMakes.map((make) => {
          const isChecked = selectedIds.has(make.id);
          return (
            <div
              key={make.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleMake(make.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMake(make.id); } }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left cursor-pointer ${isChecked ? 'bg-signal-red/5 border border-signal-red/20' : 'border border-transparent hover:bg-iron/5'}`}
            >
              <Checkbox checked={isChecked} className="flex-shrink-0 pointer-events-none" />
              <MakeLogo name={make.name} url={make.logoUrl} className="h-6 w-6 flex-shrink-0" />
              <span className="text-sm text-pure-white flex-1 truncate">{make.name}</span>
              <span className="text-[11px] text-steel tabular-nums">{make.count} vehicles</span>
            </div>
          );
        })}
        {filteredMakes.length === 0 && (
          <p className="text-xs text-steel text-center py-4">No makes match &ldquo;{search}&rdquo;</p>
        )}
      </div>
    </div>
  );
}

// ── CURRENCY SELECTOR CONFIG ────────────────────────────────────────────────

interface CurrencyItem {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

function CurrencyConfig({ section, onExtraDataChange }: { section: SectionRow; onExtraDataChange: (ed: Record<string, unknown>) => void }) {
  const [currencies, setCurrencies] = React.useState<CurrencyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [defaultCurrencyId, setDefaultCurrencyId] = React.useState<string>('');

  const extraData = (section.extraData ?? {}) as { visibleCurrencyIds?: string[]; defaultCurrencyId?: string };

  React.useEffect(() => {
    async function load() {
      try {
        const result = await getHomepageConfigData();
        if (result.success && result.data) {
          const cfg = result.data as { currencies: Array<{ id: string; code: string; name: string; symbol: string | null; is_active: boolean }> };
          const active = cfg.currencies.filter((c) => c.is_active).map((c) => ({ id: c.id, code: c.code, name: c.name, symbol: c.symbol ?? '', isActive: c.is_active }));
          setCurrencies(active);

          if ('visibleCurrencyIds' in extraData) {
            setSelectedIds(new Set(extraData.visibleCurrencyIds ?? []));
          } else {
            setSelectedIds(new Set(active.map((c) => c.id)));
          }

          const defId = extraData.defaultCurrencyId;
          if (defId) {
            const match = active.find((c) => c.id === defId);
            setDefaultCurrencyId(match?.id ?? active[0]?.id ?? '');
          } else {
            setDefaultCurrencyId(active[0]?.id ?? '');
          }
        }
      } catch (err) { console.error('[HomepageBuilder] load error:', err); }
      setLoading(false);
    }
    load();
  }, [section.id]);

  const filteredCurrencies = React.useMemo(() => {
    if (!search) return currencies;
    const q = search.toLowerCase();
    return currencies.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [currencies, search]);

  const selectedCurrencies = React.useMemo(() => currencies.filter((c) => selectedIds.has(c.id)), [currencies, selectedIds]);

  function emitChange(ids: Set<string>, defId: string) {
    onExtraDataChange({ visibleCurrencyIds: Array.from(ids), defaultCurrencyId: defId });
  }

  function toggleCurrency(id: string) {
    const next = new Set(selectedIds);
    let newDef = defaultCurrencyId;
    if (next.has(id)) {
      // Prevent deselecting the last currency
      if (next.size <= 1) return;
      next.delete(id);
      if (defaultCurrencyId === id) {
        const remaining = currencies.filter((c) => next.has(c.id));
        newDef = remaining[0]?.id ?? '';
      }
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    setDefaultCurrencyId(newDef);
    emitChange(next, newDef);
  }

  function selectAll() {
    const all = new Set(currencies.map((c) => c.id));
    setSelectedIds(all);
    emitChange(all, defaultCurrencyId);
  }

  function deselectAll() {
    // Keep at least one currency selected
    const first = currencies[0];
    if (!first) return;
    const keepOne = new Set([first.id]);
    setSelectedIds(keepOne);
    emitChange(keepOne, first.id);
  }

  function handleDefaultChange(newId: string) {
    setDefaultCurrencyId(newId);
    emitChange(selectedIds, newId);
  }

  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="flex flex-col h-full">
      <ConfigSectionHeader label="Currency Selector" description="Choose which currencies customers can use across the website." count={selectedIds.size} totalCount={currencies.length} onSelectAll={selectAll} onDeselectAll={deselectAll} />
      <ConfigSearchInput value={search} onChange={setSearch} placeholder="Search currencies..." />
      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {filteredCurrencies.map((currency) => {
          const isChecked = selectedIds.has(currency.id);
          return (
            <div
              key={currency.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleCurrency(currency.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCurrency(currency.id); } }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors text-left cursor-pointer ${isChecked ? 'bg-signal-red/5 border border-signal-red/20' : 'border border-iron/15 hover:bg-iron/5'}`}
            >
              <Checkbox checked={isChecked} className="flex-shrink-0 pointer-events-none" />
              <CurrencyFlagIcon code={currency.code} size={18} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-pure-white block">{currency.code}</span>
                <span className="text-[10px] text-steel truncate block">{currency.name}</span>
              </div>
              {currency.symbol && <span className="text-[10px] text-steel/60 flex-shrink-0">{currency.symbol}</span>}
            </div>
          );
        })}
        {filteredCurrencies.length === 0 && (
          <p className="col-span-2 text-xs text-steel text-center py-4">No currencies match &ldquo;{search}&rdquo;</p>
        )}
      </div>
      {selectedCurrencies.length > 0 && (
        <div className="pt-3 mt-3 border-t border-iron/20">
          <label className="text-xs text-steel block mb-1.5">Default currency</label>
          <select
            value={defaultCurrencyId}
            onChange={(e) => handleDefaultChange(e.target.value)}
            className="w-full rounded-lg border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:border-signal-red/50"
          >
            {selectedCurrencies.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── DESTINATION COUNTRY / CONTINENT CONFIG ──────────────────────────────────

interface CountryItem {
  id: string;
  name: string;
  slug: string;
  flagImage: string | null;
  count: number;
  isActive: boolean;
}

interface ContinentItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  countries: CountryItem[];
}

function ContinentsConfig({ section, onExtraDataChange }: { section: SectionRow; onExtraDataChange: (ed: Record<string, unknown>) => void }) {
  const [continents, setContinents] = React.useState<ContinentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'selected'>('all');
  const [expandedConts, setExpandedConts] = React.useState<Set<string>>(new Set());
  const [selectedContinentIds, setSelectedContinentIds] = React.useState<Set<string>>(new Set());
  const [selectedCountryIds, setSelectedCountryIds] = React.useState<Set<string>>(new Set());

  const extraData = (section.extraData ?? {}) as { visibleContinentIds?: string[]; visibleCountryIds?: string[] };

  React.useEffect(() => {
    async function load() {
      try {
        const result = await getHomepageConfigData();
        if (result.success && result.data) {
          const cfg = result.data as {
            continents: Array<{ id: string; name: string; slug: string }>;
            countries: Array<{ id: string; name: string; slug: string; flag_image: string | null; continent_id: string }>;
          };
          const loaded: ContinentItem[] = cfg.continents.map((cont) => ({
            id: cont.id, name: cont.name, slug: cont.slug, isActive: true,
            countries: cfg.countries
              .filter((co) => co.continent_id === cont.id)
              .map((co) => ({ id: co.id, name: co.name, slug: co.slug, flagImage: co.flag_image, count: 0, isActive: true })),
          }));
          setContinents(loaded);

          if ('visibleContinentIds' in extraData) {
            setSelectedContinentIds(new Set(extraData.visibleContinentIds ?? []));
          } else {
            setSelectedContinentIds(new Set(loaded.map((c) => c.id)));
          }
          if ('visibleCountryIds' in extraData) {
            setSelectedCountryIds(new Set(extraData.visibleCountryIds ?? []));
          } else {
            setSelectedCountryIds(new Set(loaded.flatMap((c) => c.countries.map((co) => co.id))));
          }
        }
      } catch (err) { console.error('[HomepageBuilder] load error:', err); }
      setLoading(false);
    }
    load();
  }, [section.id]);

  const filteredContinents = React.useMemo(() => {
    let result = continents;
    if (search) {
      const q = search.toLowerCase();
      result = continents.map((cont) => ({
        ...cont,
        countries: cont.countries.filter((co) => co.name.toLowerCase().includes(q)),
      })).filter((cont) => cont.countries.length > 0);
    }
    if (filter === 'selected') {
      result = result.map((cont) => ({
        ...cont,
        countries: cont.countries.filter((co) => selectedCountryIds.has(co.id)),
      })).filter((cont) => cont.countries.length > 0);
    }
    return result;
  }, [continents, search, filter, selectedCountryIds]);

  function toggleExpand(contId: string) {
    setExpandedConts((prev) => {
      const next = new Set(prev);
      if (next.has(contId)) next.delete(contId); else next.add(contId);
      return next;
    });
  }

  function emitChange(contIds: Set<string>, countryIds: Set<string>) {
    onExtraDataChange({
      visibleContinentIds: Array.from(contIds),
      visibleCountryIds: Array.from(countryIds),
    });
  }

  function toggleContinent(contId: string) {
    const cont = continents.find((c) => c.id === contId);
    if (!cont) return;

    const nextCont = new Set(selectedContinentIds);
    const nextCountry = new Set(selectedCountryIds);

    if (nextCont.has(contId)) {
      nextCont.delete(contId);
      cont.countries.forEach((co) => nextCountry.delete(co.id));
    } else {
      nextCont.add(contId);
      cont.countries.forEach((co) => nextCountry.add(co.id));
    }
    setSelectedContinentIds(nextCont);
    setSelectedCountryIds(nextCountry);
    emitChange(nextCont, nextCountry);
  }

  function toggleCountry(contId: string, countryId: string) {
    const nextCountry = new Set(selectedCountryIds);
    if (nextCountry.has(countryId)) {
      nextCountry.delete(countryId);
    } else {
      nextCountry.add(countryId);
    }

    const nextCont = new Set(selectedContinentIds);
    const cont = continents.find((c) => c.id === contId);
    if (cont) {
      const allSelected = cont.countries.every((co) => nextCountry.has(co.id));
      if (allSelected) nextCont.add(contId); else nextCont.delete(contId);
    }
    setSelectedCountryIds(nextCountry);
    setSelectedContinentIds(nextCont);
    emitChange(nextCont, nextCountry);
  }

  function selectAll() {
    const allConts = new Set(continents.map((c) => c.id));
    const allCountries = new Set(continents.flatMap((c) => c.countries.map((co) => co.id)));
    setSelectedContinentIds(allConts);
    setSelectedCountryIds(allCountries);
    emitChange(allConts, allCountries);
  }

  function deselectAll() {
    const empty = new Set<string>();
    setSelectedContinentIds(empty);
    setSelectedCountryIds(empty);
    emitChange(empty, empty);
  }

  const totalSelected = React.useMemo(() => {
    return continents.reduce((sum, c) => sum + c.countries.filter((co) => selectedCountryIds.has(co.id)).length, 0);
  }, [continents, selectedCountryIds]);

  const totalCountries = React.useMemo(() => continents.reduce((sum, c) => sum + c.countries.length, 0), [continents]);

  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="flex flex-col h-full">
      <ConfigSectionHeader label="Destination Countries" description="Choose which destination countries appear on the homepage." count={totalSelected} totalCount={totalCountries} onSelectAll={selectAll} onDeselectAll={deselectAll} />
      <div className="flex items-center gap-2 mt-2">
        <ConfigSearchInput value={search} onChange={setSearch} placeholder="Search countries..." />
      </div>
      <div className="flex gap-1 mt-2 mb-2">
        <button onClick={() => setFilter('all')} className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${filter === 'all' ? 'bg-signal-red/10 text-signal-red border border-signal-red/20' : 'text-steel hover:text-pure-white border border-iron/20'}`}>All</button>
        <button onClick={() => setFilter('selected')} className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${filter === 'selected' ? 'bg-signal-red/10 text-signal-red border border-signal-red/20' : 'text-steel hover:text-pure-white border border-iron/20'}`}>Selected ({totalSelected})</button>
      </div>
      <div className="space-y-1.5">
        {filteredContinents.map((cont) => {
          const selectedInCont = cont.countries.filter((co) => selectedCountryIds.has(co.id)).length;
          const allSelected = selectedInCont === cont.countries.length && cont.countries.length > 0;
          const someSelected = selectedInCont > 0 && !allSelected;
          const contChecked: boolean | 'indeterminate' = allSelected ? true : someSelected ? 'indeterminate' : false;
          const isExpanded = expandedConts.has(cont.id) || search.length > 0;

          return (
            <div key={cont.id} className="rounded-lg border border-iron/20 overflow-hidden">
              <div className="flex items-center">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(cont.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(cont.id); } }}
                  className="flex-shrink-0 px-2 py-2.5 cursor-pointer"
                >
                  <svg className={`h-3 w-3 text-steel transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleContinent(cont.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleContinent(cont.id); } }}
                  className={`flex-1 flex items-center gap-2.5 py-2.5 pr-3 transition-colors text-left cursor-pointer ${allSelected ? 'bg-signal-red/5' : someSelected ? 'bg-signal-red/5' : 'hover:bg-iron/5'}`}
                >
                  <Checkbox checked={contChecked} className="flex-shrink-0 pointer-events-none" />
                  <Globe2 className="h-3.5 w-3.5 text-steel flex-shrink-0" />
                  <span className="text-sm font-medium text-pure-white flex-1">{cont.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-iron/30 text-steel">
                    {selectedInCont}/{cont.countries.length}
                  </Badge>
                </div>
              </div>
              {isExpanded && cont.countries.length > 0 && (
                <div className="px-3 py-1.5 space-y-0.5 bg-carbon border-t border-iron/10">
                  {cont.countries.map((country) => {
                    const coChecked = selectedCountryIds.has(country.id);
                    return (
                      <div
                        key={country.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleCountry(cont.id, country.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCountry(cont.id, country.id); } }}
                        className={`w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors text-left cursor-pointer ${coChecked ? 'bg-signal-red/5' : 'hover:bg-iron/5'}`}
                      >
                        <Checkbox checked={coChecked} className="flex-shrink-0 pointer-events-none" />
                        <CountryFlagImage flagImage={country.flagImage} name={country.name} slug={country.slug} size={16} />
                        <span className="text-sm text-steel flex-1">{country.name}</span>
                        {country.count > 0 && (
                          <span className="text-[10px] text-steel tabular-nums">{country.count}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredContinents.length === 0 && (
          <p className="text-xs text-steel text-center py-4">No countries match &ldquo;{search}&rdquo;</p>
        )}
      </div>
    </div>
  );
}

// ── LOOKUP CONFIG (Body Types, Fuel Types, etc.) ───────────────────────────

function LookupConfig({ tableName, label }: { tableName: string; label: string }) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const result = await getHomepageLookupData(tableName);
        if (result.success && result.data) {
          setItems(result.data as Array<{ id: string; name: string; isActive: boolean }>);
        }
      } catch (err) { console.error('[HomepageBuilder] load error:', err); }
      setLoading(false);
    }
    load();
  }, [tableName]);

  async function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newActive = !item.isActive;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isActive: newActive } : i));
    const result = await toggleHomepageLookupItem(tableName, id, newActive);
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'error' });
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, isActive: item.isActive } : i));
      return;
    }
    toast({ title: 'Updated', description: `${item.name} ${newActive ? 'activated' : 'deactivated'}`, variant: 'success' });
  }

  async function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
    await reorderHomepageLookupItems(tableName, newItems.map((i) => i.id));
  }

  if (loading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-pure-white">{label}</h4>
        <span className="text-xs text-steel">{items.filter((i) => i.isActive).length} active</span>
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={item.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${item.isActive ? 'border-iron/30 bg-carbon' : 'border-iron/10 bg-deep-carbon opacity-60'}`}>
            <div className="flex flex-col gap-0.5">
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => moveItem(idx, idx - 1)} disabled={idx === 0}>
                <ChevronUp className="h-2.5 w-2.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => moveItem(idx, idx + 1)} disabled={idx === items.length - 1}>
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </div>
            <button onClick={() => toggleItem(item.id)} className="flex-shrink-0">
              <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${item.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-iron/40 bg-deep-carbon'}`}>
                {item.isActive && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
            </button>
            <span className="text-sm text-pure-white">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOMEPAGE CLIENT ─────────────────────────────────────────────────────────

interface HomepageClientProps {
  homepageData: HomepageData;
}

export function HomepageClient({ homepageData }: HomepageClientProps) {
  const { toast } = useToast();
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = React.useState(false);
  const [configuringId, setConfiguringId] = React.useState<string | null>(null);
  const [createForm, setCreateForm] = React.useState<{ type: string; title: string; content: string }>({
    type: 'hero', title: '', content: '',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const markDirty = () => setHasUnsavedChanges(true);

  const fetchSections = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listHomepageSections();
      if (result.success) {
        setSections((result.data as SectionRow[]) ?? []);
        setHasUnsavedChanges(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load sections', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchSections(); }, [fetchSections]);

  function handleExtraDataChange(sectionId: string, extraData: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, extraData } : s));
    markDirty();
  }

  function startEdit(section: SectionRow) {
    setEditingId(section.id);
    setEditForm({
      title: section.title ?? '',
      subtitle: section.subtitle ?? '',
      content: section.content ?? '',
      imageUrl: section.imageUrl ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: string) {
    const payload: Record<string, unknown> = {
      title: editForm.title || null,
      subtitle: editForm.subtitle || null,
      content: editForm.content || null,
      imageUrl: editForm.imageUrl || null,
    };
    const result = await updateHomepageSection(id, payload);
    if (result.success) {
      toast({ title: 'Updated', description: 'Section updated', variant: 'success' });
      cancelEdit();
      fetchSections();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  function handleToggleEnabled(id: string, current: boolean) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, isEnabled: !current } : s));
    markDirty();
  }

  async function persistToggleEnabled(id: string, current: boolean) {
    const result = await updateHomepageSection(id, { isEnabled: !current });
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'error' });
      fetchSections();
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...sections];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSections(newOrder.map((s, i) => ({ ...s, displayOrder: i + 1 })));
    markDirty();
  }

  function handleMoveDown(index: number) {
    if (index === sections.length - 1) return;
    const newOrder = [...sections];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSections(newOrder.map((s, i) => ({ ...s, displayOrder: i + 1 })));
    markDirty();
  }

  async function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const fromIndex = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (fromIndex === null || fromIndex === dropIndex) return;

    const newOrder = [...sections];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(dropIndex, 0, moved);
    setSections(newOrder.map((s, i) => ({ ...s, displayOrder: i + 1 })));
    markDirty();
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this section?')) return;
    const result = await deleteHomepageSection(id);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Section deleted', variant: 'success' });
      fetchSections();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleCreate() {
    if (!createForm.type) return;
    const result = await createHomepageSection({
      type: createForm.type,
      title: createForm.title || undefined,
      content: createForm.content || undefined,
      isEnabled: true,
      displayOrder: sections.length + 1,
    });
    if (result.success) {
      toast({ title: 'Created', description: 'Section created', variant: 'success' });
      setShowCreate(false);
      setCreateForm({ type: 'hero', title: '', content: '' });
      fetchSections();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleSaveAll() {
    setIsSaving(true);
    try {
      const ids = sections.map((s) => s.id);
      const reorderResult = await reorderHomepageSections(ids);
      if (!reorderResult.success) {
        toast({ title: 'Error', description: reorderResult.error, variant: 'error' });
        return;
      }
      const result = await updateAllHomepageSections(
        sections.map((s) => ({
          id: s.id,
          isEnabled: s.isEnabled,
          displayOrder: s.displayOrder,
          title: s.title ?? null,
          subtitle: s.subtitle ?? null,
          content: s.content ?? null,
          imageUrl: s.imageUrl ?? null,
          extraData: s.extraData ?? null,
        })),
      );
      if (result.success) {
        toast({ title: 'Saved', description: 'All changes saved', variant: 'success' });
        setHasUnsavedChanges(false);
        fetchSections();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRevert() {
    if (confirm('Discard all unsaved changes?')) {
      fetchSections();
    }
  }

  const enabledCount = sections.filter((s) => s.isEnabled).length;
  const configuringSection = configuringId ? sections.find((s) => s.id === configuringId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-iron/20 bg-carbon flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold text-pure-white flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-signal-red" />
            Homepage Builder
          </h1>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleRevert} className="text-xs h-8">
              <RotateCcw className="mr-1.5 h-3 w-3" /> Revert
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
            className="text-xs h-8"
          >
            {isSaving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          <div className="rounded-lg border border-iron/20 bg-deep-carbon px-3 py-2 text-center">
            <p className="text-lg font-bold text-pure-white">{sections.length}</p>
            <p className="text-[10px] text-steel uppercase tracking-wider">Sections</p>
          </div>
          <div className="rounded-lg border border-iron/20 bg-deep-carbon px-3 py-2 text-center">
            <p className="text-lg font-bold text-green-400">{enabledCount}</p>
            <p className="text-[10px] text-steel uppercase tracking-wider">Visible</p>
          </div>
          <div className="rounded-lg border border-iron/20 bg-deep-carbon px-3 py-2 text-center">
            <p className="text-lg font-bold text-blue-400">{sections.filter((s) => WIDGET_TYPES.includes(s.type)).length}</p>
            <p className="text-[10px] text-steel uppercase tracking-wider">Widgets</p>
          </div>
        </div>

        {/* Sections List */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-steel uppercase tracking-wider">Sections</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-iron/30 p-8 text-center">
              <LayoutTemplate className="mx-auto h-8 w-8 text-steel mb-3" />
              <p className="text-sm text-steel">No sections yet</p>
              <p className="text-xs text-iron mt-1">Add your first section to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all cursor-grab active:cursor-grabbing ${
                    dragOverIndex === index
                      ? 'border-signal-red/50 bg-signal-red/5'
                      : dragIndex === index
                      ? 'border-iron/30 bg-deep-carbon opacity-50'
                      : section.isEnabled
                      ? 'border-iron/20 bg-deep-carbon hover:border-iron/40'
                      : 'border-iron/10 bg-deep-carbon/50 opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0 text-steel group-hover:text-pure-white cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <SectionIcon type={section.type} className="h-4 w-4 flex-shrink-0 text-steel" />
                  <div className="flex-1 min-w-0">
                    {editingId === section.id ? (
                      <div className="space-y-1.5">
                        <Input
                          value={editForm.title ?? ''}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Section title"
                          className="h-7 text-xs"
                        />
                        <Input
                          value={editForm.subtitle ?? ''}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                          placeholder="Subtitle"
                          className="h-7 text-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-pure-white truncate">
                          {section.title || (SECTION_TYPE_LABELS[section.type] ?? section.type)}
                        </p>
                        <p className="text-[11px] text-steel truncate">
                          {SECTION_TYPE_LABELS[section.type] ?? section.type}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {editingId === section.id ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEdit(section.id)}>
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5 text-steel" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            handleToggleEnabled(section.id, section.isEnabled);
                            persistToggleEnabled(section.id, section.isEnabled);
                          }}
                        >
                          {section.isEnabled ? (
                            <Eye className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-steel" />
                          )}
                        </Button>
                        {WIDGET_TYPES.includes(section.type) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setConfiguringId(configuringId === section.id ? null : section.id)}
                          >
                            <Settings className={`h-3.5 w-3.5 ${configuringId === section.id ? 'text-signal-red' : 'text-steel'}`} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(section)}>
                          <GripVertical className="h-3.5 w-3.5 text-steel" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(section.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Form */}
          {showCreate && (
            <div className="mt-3 rounded-lg border border-signal-red/30 bg-deep-carbon p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-pure-white">New Section</h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCreate(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <select
                value={createForm.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-md border border-iron/30 bg-carbon px-3 py-1.5 text-sm text-pure-white"
              >
                {Object.entries(SECTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title (optional)"
                className="h-8 text-sm"
              />
              <Textarea
                value={createForm.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Content (optional)"
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>Create</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Attribute Management */}
        <div className="px-6 pb-6">
          <div className="rounded-lg border border-iron/20 bg-deep-carbon p-4 space-y-4">
            <h3 className="text-xs font-medium text-steel uppercase tracking-wider">Vehicle Attributes</h3>
            <div className="grid grid-cols-1 gap-4">
              <LookupConfig tableName="body_types" label="Body Types" />
              <LookupConfig tableName="fuel_types" label="Fuel Types" />
              <LookupConfig tableName="transmissions" label="Transmissions" />
              <LookupConfig tableName="drive_types" label="Drive Types" />
            </div>
          </div>
        </div>
      </div>

      {/* Config Drawer */}
      <ConfigDrawer
        open={!!configuringSection && WIDGET_TYPES.includes(configuringSection.type)}
        title={`Configure: ${configuringSection ? (SECTION_TYPE_LABELS[configuringSection.type] ?? configuringSection.type) : ''}`}
        onClose={() => setConfiguringId(null)}
      >
        {configuringSection && configuringSection.type === 'browse_currency' && (
          <CurrencyConfig section={configuringSection} onExtraDataChange={(ed) => handleExtraDataChange(configuringSection.id, ed)} />
        )}
        {configuringSection && configuringSection.type === 'browse_make' && (
          <MakesConfig section={configuringSection} onExtraDataChange={(ed) => handleExtraDataChange(configuringSection.id, ed)} />
        )}
        {configuringSection && configuringSection.type === 'browse_continent' && (
          <ContinentsConfig section={configuringSection} onExtraDataChange={(ed) => handleExtraDataChange(configuringSection.id, ed)} />
        )}
      </ConfigDrawer>
    </div>
  );
}
