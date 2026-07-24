// ---------------------------------------------------------------------------
// FormField Component (in components/admin/ui/form-field.tsx)
// ---------------------------------------------------------------------------
import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactElement;
}

export function FormField({ label, name, required, description, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-pure-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-ash">{description}</p>}
      {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { id: name, 'aria-invalid': !!error })}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}