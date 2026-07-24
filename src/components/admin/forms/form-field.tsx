'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({
  name,
  label,
  description,
  required = false,
  error,
  children,
}: FormFieldProps) {
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={name}
        className="text-sm font-medium leading-none text-pure-white"
      >
        {label}
        {required && <span className="ml-1 text-signal-red">*</span>}
      </label>

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            id: name,
            'aria-describedby': cn(
              description && descriptionId,
              error && errorId,
            ) || undefined,
            'aria-invalid': !!error || undefined,
          })
        : children}

      {description && !error && (
        <p
          id={descriptionId}
          className="text-sm text-steel"
        >
          {description}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-signal-red"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField, type FormFieldProps };
