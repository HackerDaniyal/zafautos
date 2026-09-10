'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  LayoutTemplate, Settings, Save, X, Check, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton, StatCardSkeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import {
  listHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
} from '@/server/actions/cmsActions';

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

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  search: 'Search Bar',
  featured_vehicles: 'Featured Vehicles',
  latest_vehicles: 'Latest Vehicles',
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

const WIDGET_TYPES = ['browse_currency', 'browse_make', 'browse_continent', 'browse_body_type', 'browse_country'];

function ReorderableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, moveUp: () => void, moveDown: () => void) => React.ReactNode;
}) {
  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    onReorder(newItems);
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) =>
        renderItem(item, index, () => moveItem(index, index - 1), () => moveItem(index, index + 1))
      )}
    </div>
  );
}

function ToggleRow({
  label,
  subtitle,
  enabled,
  onToggle,
  moveUp,
  moveDown,
  isFirst,
  isLast,
}: {
  label: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${enabled ? 'border-iron/30 bg-carbon' : 'border-iron/10 bg-deep-carbon opacity-60'}`}>
      <div className="flex flex-col gap-0.5">
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={moveUp} disabled={isFirst}>
          <ChevronUp className="h-2.5 w-2.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={moveDown} disabled={isLast}>
          <ChevronDown className="h-2.5 w-2.5" />
        </Button>
      </div>
      <button onClick={onToggle} className="flex-shrink-0">
        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${enabled ? 'bg-emerald-500 border-emerald-500' : 'border-iron/40 bg-deep-carbon'}`}>
          {enabled && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-pure-white">{label}</span>
        {subtitle && <span className="ml-2 text-xs text-steel">{subtitle}</span>}
      </div>
    </div>
  );
}

function CurrencyConfig({ section, onSave }: { section: SectionRow; onSave: (extraData: Record<string, unknown>) => void }) {
  const { toast } = useToast();
  const [currencies, setCurrencies] = React.useState<Array<{ id: string; code: string; name: string; symbol: string; isActive: boolean }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [defaultCurrencyId, setDefaultCurrencyId] = React.useState<string>('');
  const extraData = (section.extraData ?? {}) as { visibleCurrencyIds?: string[]; defaultCurrencyId?: string };

  React.useEffect(() => {
    async function load() {
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
        const supabase = createServiceRoleClient();
        const { data } = await supabase.from('currencies').select('id, code, name, symbol, is_active').order('display_order');
        if (data) {
          const visible = extraData.visibleCurrencyIds ?? data.filter((c: any) => c.is_active).map((c: any) => c.id);
          setCurrencies(data.map((c: any) => ({ ...c, isActive: visible.includes(c.id) })));
          setDefaultCurrencyId(extraData.defaultCurrencyId ?? data.find((c: any) => c.is_active)?.id ?? '');
        }
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, [section.id]);

  function toggleCurrency(id: string) {
    setCurrencies((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  }

  function moveCurrency(from: number, to: number) {
    if (to < 0 || to >= currencies.length) return;
    const newCurrencies = [...currencies];
    const [moved] = newCurrencies.splice(from, 1);
    newCurrencies.splice(to, 0, moved);
    setCurrencies(newCurrencies);
  }

  function handleSave() {
    const visibleIds = currencies.filter((c) => c.isActive).map((c) => c.id);
    onSave({ visibleCurrencyIds: visibleIds, defaultCurrencyId });
    toast({ title: 'Saved', description: 'Currency widget updated', variant: 'success' });
  }

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-3">
      <ReorderableList
        items={currencies}
        onReorder={setCurrencies}
        renderItem={(currency, idx, moveUp, moveDown) => (
          <ToggleRow
            key={currency.id}
            label={`${currency.symbol}  ${currency.code}`}
            subtitle={currency.name}
            enabled={currency.isActive}
            onToggle={() => toggleCurrency(currency.id)}
            moveUp={moveUp}
            moveDown={moveDown}
            isFirst={idx === 0}
            isLast={idx === currencies.length - 1}
          />
        )}
      />
      <div className="flex items-center gap-3 pt-2 border-t border-iron/20">
        <label className="text-sm text-steel">Default Currency</label>
        <select
          value={defaultCurrencyId}
          onChange={(e) => setDefaultCurrencyId(e.target.value)}
          className="rounded-md border border-iron/30 bg-deep-carbon px-3 py-1.5 text-sm text-pure-white"
        >
          {currencies.filter((c) => c.isActive).map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
      </div>
      <Button size="sm" onClick={handleSave} className="mt-2">
        <Save className="mr-2 h-3 w-3" /> Save Currency Config
      </Button>
    </div>
  );
}

function MakesConfig({ section, onSave }: { section: SectionRow; onSave: (extraData: Record<string, unknown>) => void }) {
  const { toast } = useToast();
  const [makes, setMakes] = React.useState<Array<{ id: string; name: string; logoUrl: string | null; count: number; isActive: boolean }>>([]);
  const [loading, setLoading] = React.useState(true);
  const extraData = (section.extraData ?? {}) as { visibleMakeIds?: string[] };

  React.useEffect(() => {
    async function load() {
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
        const supabase = createServiceRoleClient();
        const { data: makeRows } = await supabase.from('manufacturers').select('id, name, logo_url, is_active').order('display_order').order('name');
        const { data: vehicleCounts } = await supabase.from('vehicles').select('manufacturer_id').is('deleted_at', null).eq('status', 'active');
        const countMap = new Map<string, number>();
        (vehicleCounts ?? []).forEach((v: any) => { countMap.set(v.manufacturer_id, (countMap.get(v.manufacturer_id) ?? 0) + 1); });
        const visible = extraData.visibleMakeIds ?? (makeRows ?? []).filter((m: any) => m.is_active).map((m: any) => m.id);
        setMakes((makeRows ?? []).map((m: any) => ({
          id: m.id, name: m.name, logoUrl: m.logo_url, count: countMap.get(m.id) ?? 0, isActive: visible.includes(m.id),
        })));
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, [section.id]);

  function toggleMake(id: string) {
    setMakes((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));
  }

  function moveMake(from: number, to: number) {
    if (to < 0 || to >= makes.length) return;
    const newMakes = [...makes];
    const [moved] = newMakes.splice(from, 1);
    newMakes.splice(to, 0, moved);
    setMakes(newMakes);
  }

  function handleSave() {
    const visibleIds = makes.filter((m) => m.isActive).map((m) => m.id);
    onSave({ visibleMakeIds: visibleIds });
    toast({ title: 'Saved', description: 'Makes widget updated', variant: 'success' });
  }

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-3">
      <ReorderableList
        items={makes}
        onReorder={setMakes}
        renderItem={(make, idx, moveUp, moveDown) => (
          <ToggleRow
            key={make.id}
            label={make.name}
            subtitle={`${make.count.toLocaleString()} vehicles`}
            enabled={make.isActive}
            onToggle={() => toggleMake(make.id)}
            moveUp={moveUp}
            moveDown={moveDown}
            isFirst={idx === 0}
            isLast={idx === makes.length - 1}
          />
        )}
      />
      <Button size="sm" onClick={handleSave} className="mt-2">
        <Save className="mr-2 h-3 w-3" /> Save Makes Config
      </Button>
    </div>
  );
}

function ContinentsConfig({ section, onSave }: { section: SectionRow; onSave: (extraData: Record<string, unknown>) => void }) {
  const { toast } = useToast();
  const [continents, setContinents] = React.useState<Array<{ id: string; name: string; isActive: boolean; countries: Array<{ id: string; name: string; slug: string; isActive: boolean }> }>>([]);
  const [loading, setLoading] = React.useState(true);
  const extraData = (section.extraData ?? {}) as { visibleContinentIds?: string[]; visibleCountryIds?: string[] };

  React.useEffect(() => {
    async function load() {
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
        const supabase = createServiceRoleClient();
        const { data: contRows } = await supabase.from('continents').select('id, name, is_active').order('display_order');
        const { data: countryRows } = await supabase.from('countries').select('id, name, slug, continent_id, is_active').order('display_order').order('name');
        const visConts = extraData.visibleContinentIds ?? (contRows ?? []).filter((c: any) => c.is_active).map((c: any) => c.id);
        const visCountries = extraData.visibleCountryIds ?? (countryRows ?? []).filter((c: any) => c.is_active).map((c: any) => c.id);
        setContinents((contRows ?? []).map((cont: any) => ({
          id: cont.id, name: cont.name, isActive: visConts.includes(cont.id),
          countries: (countryRows ?? []).filter((co: any) => co.continent_id === cont.id).map((co: any) => ({
            id: co.id, name: co.name, slug: co.slug, isActive: visCountries.includes(co.id),
          })),
        })));
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, [section.id]);

  function toggleContinent(id: string) {
    setContinents((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  }

  function toggleCountry(contId: string, countryId: string) {
    setContinents((prev) => prev.map((c) => c.id === contId ? {
      ...c, countries: c.countries.map((co) => co.id === countryId ? { ...co, isActive: !co.isActive } : co),
    } : c));
  }

  function handleSave() {
    const visibleContIds = continents.filter((c) => c.isActive).map((c) => c.id);
    const visibleCountryIds = continents.filter((c) => c.isActive).flatMap((c) => c.countries.filter((co) => co.isActive).map((co) => co.id));
    onSave({ visibleContinentIds: visibleContIds, visibleCountryIds: visibleCountryIds });
    toast({ title: 'Saved', description: 'Continents config updated', variant: 'success' });
  }

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      {continents.map((cont) => (
        <div key={cont.id} className="rounded-lg border border-iron/20 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-deep-carbon">
            <button onClick={() => toggleContinent(cont.id)}>
              <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${cont.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-iron/40 bg-carbon'}`}>
                {cont.isActive && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
            </button>
            <span className="text-sm font-medium text-pure-white">{cont.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">{cont.countries.filter((c) => c.isActive).length} countries</Badge>
          </div>
          {cont.isActive && cont.countries.length > 0 && (
            <div className="px-3 py-2 space-y-1 bg-carbon">
              {cont.countries.map((country) => (
                <div key={country.id} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-iron/5">
                  <button onClick={() => toggleCountry(cont.id, country.id)}>
                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${country.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-iron/40 bg-deep-carbon'}`}>
                      {country.isActive && <Check className="h-2 w-2 text-white" />}
                    </div>
                  </button>
                  <span className="text-sm text-steel">{country.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <Button size="sm" onClick={handleSave} className="mt-2">
        <Save className="mr-2 h-3 w-3" /> Save Continents Config
      </Button>
    </div>
  );
}

function LookupConfig({ tableName, label, sectionId, onSave }: { tableName: string; label: string; sectionId?: string; onSave?: (extraData: Record<string, unknown>) => void }) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
        const supabase = createServiceRoleClient();
        const { data } = await supabase.from(tableName).select('id, name, is_active').order('display_order').order('name');
        setItems((data ?? []).map((r: any) => ({ id: r.id, name: r.name, isActive: r.is_active })));
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, [tableName]);

  async function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();
    await supabase.from(tableName).update({ is_active: !item.isActive, updated_at: new Date().toISOString() }).eq('id', id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isActive: !i.isActive } : i));
    toast({ title: 'Updated', description: `${item.name} ${!item.isActive ? 'activated' : 'deactivated'}`, variant: 'success' });
  }

  async function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();
    for (let i = 0; i < newItems.length; i++) {
      await supabase.from(tableName).update({ display_order: i, updated_at: new Date().toISOString() }).eq('id', newItems[i].id);
    }
  }

  if (loading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-pure-white">{label}</h4>
        <span className="text-xs text-steel">{items.filter((i) => i.isActive).length} active</span>
      </div>
      <ReorderableList
        items={items}
        onReorder={setItems}
        renderItem={(item, idx, moveUp, moveDown) => (
          <ToggleRow
            key={item.id}
            label={item.name}
            enabled={item.isActive}
            onToggle={() => toggleItem(item.id)}
            moveUp={() => moveItem(idx, idx - 1)}
            moveDown={() => moveItem(idx, idx + 1)}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
          />
        )}
      />
    </div>
  );
}

export function HomepageClient() {
  const { toast } = useToast();
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = React.useState(false);
  const [configuringId, setConfiguringId] = React.useState<string | null>(null);
  const [createForm, setCreateForm] = React.useState<{ type: string; title: string; content: string }>({
    type: 'hero', title: '', content: '',
  });

  const fetchSections = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listHomepageSections();
      if (result.success) {
        setSections((result.data as SectionRow[]) ?? []);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load sections', variant: 'error' });
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchSections(); }, [fetchSections]);

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

  async function saveExtraData(id: string, extraData: Record<string, unknown>) {
    const result = await updateHomepageSection(id, { extraData });
    if (result.success) {
      fetchSections();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleToggleEnabled(id: string, current: boolean) {
    const result = await updateHomepageSection(id, { isEnabled: !current });
    if (result.success) {
      fetchSections();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...sections];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const ids = newOrder.map((s) => s.id);
    const result = await reorderHomepageSections(ids);
    if (result.success) {
      setSections(newOrder.map((s, i) => ({ ...s, displayOrder: i + 1 })));
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleMoveDown(index: number) {
    if (index === sections.length - 1) return;
    const newOrder = [...sections];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const ids = newOrder.map((s) => s.id);
    const result = await reorderHomepageSections(ids);
    if (result.success) {
      setSections(newOrder.map((s, i) => ({ ...s, displayOrder: i + 1 })));
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
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

  const enabledCount = sections.filter((s) => s.isEnabled).length;
  const configuringSection = configuringId ? sections.find((s) => s.id === configuringId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Control Center"
        description="Configure all sections and widgets displayed on the homepage"
        action={{ label: 'Add Section', href: '#', icon: Plus }}
      />

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Sections" value={sections.length} icon="LayoutTemplate" />
          <StatCard title="Enabled" value={enabledCount} icon="Eye" />
          <StatCard title="Widgets" value={sections.filter((s) => WIDGET_TYPES.includes(s.type)).length} icon="Settings" />
        </div>
      )}

      {/* Widget Config Panel */}
      {configuringSection && WIDGET_TYPES.includes(configuringSection.type) && (
        <div className="rounded-[10px] border border-emerald-500/30 bg-carbon p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-pure-white">
              Configure: {SECTION_TYPE_LABELS[configuringSection.type] ?? configuringSection.type}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setConfiguringId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {configuringSection.type === 'browse_currency' && (
            <CurrencyConfig section={configuringSection} onSave={(ed) => saveExtraData(configuringSection.id, ed)} />
          )}
          {configuringSection.type === 'browse_make' && (
            <MakesConfig section={configuringSection} onSave={(ed) => saveExtraData(configuringSection.id, ed)} />
          )}
          {configuringSection.type === 'browse_continent' && (
            <ContinentsConfig section={configuringSection} onSave={(ed) => saveExtraData(configuringSection.id, ed)} />
          )}
        </div>
      )}

      {/* Sections list */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <div className="px-6 py-3 border-b border-iron/20">
          <h3 className="text-sm font-medium text-pure-white">Homepage Sections</h3>
          <p className="text-xs text-steel mt-0.5">Drag to reorder. Click eye to show/hide. Click gear to configure widget.</p>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center">
            <LayoutTemplate className="mx-auto h-12 w-12 text-steel mb-4" />
            <p className="text-steel">No sections configured yet</p>
            <p className="text-sm text-iron mt-1">Add your first homepage section to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-iron/30">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center gap-4 px-6 py-4 hover:bg-iron/5 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveDown(index)} disabled={index === sections.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === section.id ? (
                    <div className="space-y-2">
                      <Input value={editForm.title ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Section title" className="h-8 text-sm" />
                      <Input value={editForm.subtitle ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle (optional)" className="h-8 text-sm" />
                      <Textarea value={editForm.content ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Section content" className="min-h-[60px] text-sm" />
                      <Input value={editForm.imageUrl ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="Image URL (optional)" className="h-8 text-sm" />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-pure-white">
                          {section.title || (SECTION_TYPE_LABELS[section.type] ?? section.type)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {SECTION_TYPE_LABELS[section.type] ?? section.type}
                        </Badge>
                        {!section.isEnabled && (
                          <Badge variant="secondary" className="text-xs">Hidden</Badge>
                        )}
                      </div>
                      {section.content && (
                        <p className="text-sm text-steel truncate mt-0.5">{section.content}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingId === section.id ? (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => saveEdit(section.id)}>Save</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={cancelEdit}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleEnabled(section.id, section.isEnabled)}>
                        {section.isEnabled ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-steel" />}
                      </Button>
                      {WIDGET_TYPES.includes(section.type) && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setConfiguringId(configuringId === section.id ? null : section.id)}>
                          <Settings className={`h-4 w-4 ${configuringId === section.id ? 'text-emerald-400' : ''}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(section)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(section.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-4">
          <h3 className="text-sm font-medium text-pure-white">New Section</h3>
          <div>
            <label className="block text-sm font-medium text-steel mb-1.5">Type</label>
            <select
              value={createForm.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-md border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
            >
              {Object.entries(SECTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-steel mb-1.5">Title</label>
            <Input value={createForm.title} onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Section title (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-steel mb-1.5">Content</label>
            <Textarea value={createForm.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Section content (optional)" className="min-h-[80px]" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>Create</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {!showCreate && (
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      )}

      {/* Lookup Table Management */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-pure-white">Vehicle Attribute Management</h3>
          <p className="text-xs text-steel mt-0.5">Configure which body types, fuel types, transmissions, and drive types appear on the homepage sidebar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LookupConfig tableName="body_types" label="Body Types" />
          <LookupConfig tableName="fuel_types" label="Fuel Types" />
          <LookupConfig tableName="transmissions" label="Transmissions" />
          <LookupConfig tableName="drive_types" label="Drive Types" />
        </div>
      </div>
    </div>
  );
}
