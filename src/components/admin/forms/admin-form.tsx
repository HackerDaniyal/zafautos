'use client';

import * as React from 'react';
import {
  useForm,
  type UseFormReturn,
  type FieldErrors,
  type Path,
  type DefaultValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/ui/use-toast';
import { useUnsavedChangesWarning } from './unsaved-changes-warning';
import { cn } from '@/lib/utils';

type FormMode = 'create' | 'edit' | 'view';

interface AdminFormProps<T extends Record<string, unknown>> {
  mode: FormMode;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  children: (props: {
    form: UseFormReturn<T>;
    mode: FormMode;
    isSubmitting: boolean;
    isDirty: boolean;
    errors: FieldErrors<T>;
  }) => React.ReactNode;
}

function AdminForm<T extends Record<string, unknown>>({
  mode,
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  children,
}: AdminFormProps<T>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isDirty, errors },
    reset,
    setError,
  } = form;

  const { interceptNavigation, confirmNavigation, cancelNavigation, hasPendingNavigation } =
    useUnsavedChangesWarning({
      isDirty: isDirty && mode !== 'view',
    });

  React.useEffect(() => {
    if (defaultValues) {
      reset(defaultValues as DefaultValues<T>);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = React.useCallback(
    async (data: T) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
        toast({
          title: mode === 'create' ? 'Created' : 'Updated',
          description: `${mode === 'create' ? 'Record created' : 'Record updated'} successfully.`,
        });
        if (hasPendingNavigation) {
          confirmNavigation();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        if (error && typeof error === 'object' && 'fieldErrors' in error) {
          const fieldErrors = error.fieldErrors as Record<string, string[]>;
          for (const [field, messages] of Object.entries(fieldErrors)) {
            setError(field as Path<T>, {
              type: 'server',
              message: messages.join(', '),
            });
          }
        }

        toast({
          title: 'Error',
          description: errorMessage,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, toast, mode, hasPendingNavigation, confirmNavigation, setError],
  );

  const handleCancel = React.useCallback(() => {
    if (isDirty && mode !== 'view') {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?',
      );
      if (!confirmed) return;
    }
    onCancel?.();
  }, [isDirty, mode, onCancel]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (mode !== 'view') {
          handleSubmit(handleFormSubmit as never)();
        }
      }
    },
    [handleSubmit, handleFormSubmit, mode],
  );

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit as never)}
      onKeyDown={handleKeyDown}
      className="grid gap-6"
      noValidate
    >
      {children({
        form,
        mode,
        isSubmitting,
        isDirty: isDirty && mode !== 'view',
        errors,
      })}

      {mode !== 'view' && (
        <div
          className={cn(
            'flex items-center justify-end gap-3 border-t border-iron pt-4',
          )}
        >
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || (mode === 'edit' && !isDirty)}
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create'
                : 'Save Changes'}
          </Button>
        </div>
      )}
    </form>
  );
}

export { AdminForm, type FormMode, type AdminFormProps };
