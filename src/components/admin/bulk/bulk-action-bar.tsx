'use client';

import * as React from 'react';
import { type LucideIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/ui/use-toast';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { cn } from '@/lib/utils';

interface BulkAction {
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive';
  confirmMessage?: string;
  action: (selectedIds: string[]) => Promise<void>;
}

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
  className?: string;
}

function BulkActionBar({
  selectedCount,
  selectedIds,
  actions,
  onClearSelection,
  className,
}: BulkActionBarProps) {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: BulkAction | null;
  }>({ open: false, action: null });

  async function executeAction(action: BulkAction, selectedIds: string[]) {
    setLoadingAction(action.label);
    try {
      await action.action(selectedIds);
      toast({
        title: 'Success',
        description: `${action.label} completed successfully`,
        variant: 'success',
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `${action.label} failed`,
        variant: 'error',
      });
    } finally {
      setLoadingAction(null);
    }
  }

  function handleActionClick(action: BulkAction) {
    if (action.confirmMessage) {
      setConfirmDialog({ open: true, action });
    } else {
      executeAction(action, selectedIds);
    }
  }

  function handleConfirm() {
    if (confirmDialog.action) {
      executeAction(confirmDialog.action, selectedIds);
    }
    setConfirmDialog({ open: false, action: null });
  }

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-[10px] border border-signal-red/20 bg-carbon px-4 py-3 shadow-lg',
          className
        )}
      >
        <div className="flex items-center gap-2 border-r border-iron/30 pr-3">
          <span className="text-sm font-medium text-signal-red">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.label;

            return (
              <Button
                key={action.label}
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={loadingAction !== null}
                className={cn(
                  'h-8',
                  action.variant === 'destructive' &&
                    'bg-destructive text-white hover:bg-destructive/90'
                )}
              >
                {isLoading ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : Icon ? (
                  <Icon className="mr-1.5 size-3.5" />
                ) : null}
                {action.label}
              </Button>
            );
          })}
        </div>

        <button
          onClick={onClearSelection}
          className="ml-2 rounded-[4px] p-1 text-steel hover:bg-white/5 hover:text-pure-white"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title="Confirm action"
        description={confirmDialog.action?.confirmMessage}
        variant={confirmDialog.action?.variant === 'destructive' ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
        loading={loadingAction !== null}
      />
    </>
  );
}

export { BulkActionBar };
export type { BulkActionBarProps, BulkAction };
