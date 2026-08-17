'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  Menu, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton, StatCardSkeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import {
  listMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  reorderMenus,
} from '@/server/actions/cmsActions';

interface MenuRow {
  id: string;
  location: string;
  label: string;
  url?: string | null;
  pageSlug?: string | null;
  externalUrl?: string | null;
  openInNewTab: boolean;
  isEnabled: boolean;
  displayOrder: number;
  parentId?: string | null;
  createdAt: string | Date;
}

const LOCATION_LABELS: Record<string, string> = {
  header: 'Header Navigation',
  footer: 'Footer Links',
  mobile: 'Mobile Menu',
};

export function MenusClient() {
  const { toast } = useToast();
  const [activeLocation, setActiveLocation] = React.useState<string>('header');
  const [menus, setMenus] = React.useState<MenuRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState('');
  const [editUrl, setEditUrl] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [createLabel, setCreateLabel] = React.useState('');
  const [createUrl, setCreateUrl] = React.useState('');

  const fetchMenus = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMenus(activeLocation);
      if (result.success) {
        setMenus((result.data as MenuRow[]) ?? []);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load menus', variant: 'error' });
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [activeLocation, toast]);

  React.useEffect(() => { fetchMenus(); }, [fetchMenus]);

  function startEdit(menu: MenuRow) {
    setEditingId(menu.id);
    setEditLabel(menu.label);
    setEditUrl(menu.url ?? menu.externalUrl ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel('');
    setEditUrl('');
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) {
      toast({ title: 'Error', description: 'Label is required', variant: 'error' });
      return;
    }
    const result = await updateMenu(id, { label: editLabel, url: editUrl || undefined });
    if (result.success) {
      toast({ title: 'Updated', description: 'Menu item updated', variant: 'success' });
      cancelEdit();
      fetchMenus();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleToggleEnabled(id: string, current: boolean) {
    const result = await updateMenu(id, { isEnabled: !current });
    if (result.success) {
      fetchMenus();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...menus];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const ids = newOrder.map((m) => m.id);
    const result = await reorderMenus(activeLocation, ids);
    if (result.success) {
      setMenus(newOrder.map((m, i) => ({ ...m, displayOrder: i + 1 })));
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleMoveDown(index: number) {
    if (index === menus.length - 1) return;
    const newOrder = [...menus];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const ids = newOrder.map((m) => m.id);
    const result = await reorderMenus(activeLocation, ids);
    if (result.success) {
      setMenus(newOrder.map((m, i) => ({ ...m, displayOrder: i + 1 })));
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this menu item?')) return;
    const result = await deleteMenu(id);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Menu item deleted', variant: 'success' });
      fetchMenus();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleCreate() {
    if (!createLabel.trim()) {
      toast({ title: 'Error', description: 'Label is required', variant: 'error' });
      return;
    }
    const result = await createMenu({
      location: activeLocation as 'header' | 'footer' | 'mobile',
      label: createLabel,
      url: createUrl || undefined,
      isEnabled: true,
      displayOrder: menus.length + 1,
    });
    if (result.success) {
      toast({ title: 'Created', description: 'Menu item created', variant: 'success' });
      setShowCreate(false);
      setCreateLabel('');
      setCreateUrl('');
      fetchMenus();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  const enabledCount = menus.filter((m) => m.isEnabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menus"
        description="Manage navigation menu items"
        action={{ label: 'Add Item', href: '#', icon: Plus }}
      />

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Items" value={menus.length} icon="Menu" />
          <StatCard title="Enabled" value={enabledCount} icon="Eye" />
          <StatCard title="Disabled" value={menus.length - enabledCount} icon="EyeOff" />
        </div>
      )}

      {/* Location tabs */}
      <div className="flex gap-2">
        {(['header', 'footer', 'mobile'] as const).map((loc) => (
          <Button
            key={loc}
            variant={activeLocation === loc ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveLocation(loc); setShowCreate(false); cancelEdit(); }}
          >
            {LOCATION_LABELS[loc]}
          </Button>
        ))}
      </div>

      {/* Menu items list */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="p-8 text-center">
            <Menu className="mx-auto h-12 w-12 text-steel mb-4" />
            <p className="text-steel">No menu items in this location</p>
            <p className="text-sm text-iron mt-1">Add your first menu item to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-iron/30">
            {menus.map((menu, index) => (
              <div key={menu.id} className="flex items-center gap-4 px-6 py-3 hover:bg-iron/5 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === menus.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === menu.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label"
                        className="h-8 w-40 text-sm"
                      />
                      <Input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="URL or /path"
                        className="h-8 flex-1 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-pure-white">{menu.label}</span>
                      {menu.url && (
                        <span className="text-xs text-steel truncate max-w-[200px]">{menu.url}</span>
                      )}
                      {menu.externalUrl && (
                        <ExternalLink className="h-3 w-3 text-steel" />
                      )}
                      {!menu.isEnabled && (
                        <Badge variant="secondary" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingId === menu.id ? (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => saveEdit(menu.id)}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleToggleEnabled(menu.id, menu.isEnabled)}
                      >
                        {menu.isEnabled ? (
                          <Eye className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-steel" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(menu)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(menu.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
          <h3 className="text-sm font-medium text-pure-white">New Menu Item — {LOCATION_LABELS[activeLocation]}</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-steel mb-1.5">Label</label>
              <Input
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                placeholder="Menu label"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-steel mb-1.5">URL</label>
              <Input
                value={createUrl}
                onChange={(e) => setCreateUrl(e.target.value)}
                placeholder="/page or https://..."
              />
            </div>
            <Button size="sm" onClick={handleCreate}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {!showCreate && (
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      )}
    </div>
  );
}
