'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  LayoutTemplate, GripVertical,
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
  extraData?: unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  search: 'Search Bar',
  featured_vehicles: 'Featured Vehicles',
  latest_vehicles: 'Latest Vehicles',
  browse_make: 'Browse by Make',
  browse_body_type: 'Browse by Body Type',
  browse_country: 'Browse by Country',
  browse_continent: 'Browse by Continent',
  why_choose_us: 'Why Choose Us',
  statistics: 'Statistics',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  cta: 'Call to Action',
  footer: 'Footer',
};

export function HomepageClient() {
  const { toast } = useToast();
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<SectionRow>>({});
  const [showCreate, setShowCreate] = React.useState(false);
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
    setEditForm({ title: section.title ?? '', subtitle: section.subtitle ?? '', content: section.content ?? '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: string) {
    const result = await updateHomepageSection(id, editForm);
    if (result.success) {
      toast({ title: 'Updated', description: 'Section updated', variant: 'success' });
      cancelEdit();
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Sections"
        description="Configure the sections displayed on your homepage"
        action={{ label: 'Add Section', href: '#', icon: Plus }}
      />

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Sections" value={sections.length} icon="LayoutTemplate" />
          <StatCard title="Enabled" value={enabledCount} icon="Eye" />
          <StatCard title="Disabled" value={sections.length - enabledCount} icon="EyeOff" />
        </div>
      )}

      {/* Sections list */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sections.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === section.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.title ?? ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Section title"
                        className="h-8 text-sm"
                      />
                      <Textarea
                        value={editForm.content ?? ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Section content"
                        className="min-h-[60px] text-sm"
                      />
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
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => saveEdit(section.id)}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleToggleEnabled(section.id, section.isEnabled)}
                      >
                        {section.isEnabled ? (
                          <Eye className="h-4 w-4 text-green-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-steel" />
                        )}
                      </Button>
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
            <Input
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Section title (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-steel mb-1.5">Content</label>
            <Textarea
              value={createForm.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Section content (optional)"
              className="min-h-[80px]"
            />
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
    </div>
  );
}
