'use client';

import React, { useState } from 'react';
import { Send, Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface VehicleContactFormProps {
  vehicleTitle?: string;
  className?: string;
  /** Called with form values when submitted. Replace with API call later. */
  onSubmit?: (values: ContactFormValues) => void | Promise<void>;
}

const DEFAULT_MESSAGE = (title?: string) =>
  title
    ? `Hi, I'm interested in the ${title} listed on ZafAutos. Please send me more details.`
    : `Hi, I'm interested in this vehicle. Please send me more details.`;

export function VehicleContactForm({ vehicleTitle, className, onSubmit }: VehicleContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>({
    name: '',
    email: '',
    phone: '',
    message: DEFAULT_MESSAGE(vehicleTitle),
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (field: keyof ContactFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await onSubmit?.(values);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={cn('rounded-[10px] border border-iron bg-carbon p-6 text-center space-y-2', className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
          <Send className="h-5 w-5 text-green-400" />
        </div>
        <h3 className="font-[Oswald] font-bold uppercase tracking-wider text-base text-pure-white">Enquiry Sent!</h3>
        <p className="text-sm text-ash">We&apos;ll get back to you within 24 hours.</p>
        <Button variant="outline" size="sm" onClick={() => setStatus('idle')} className="mt-2">
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <section id="enquiry-form" className={cn('rounded-[10px] border border-iron bg-carbon p-5 space-y-4', className)}>
      <div className="space-y-1">
        <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-pure-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-signal-red" />
          Send an Enquiry
        </h2>
        <p className="text-xs text-ash">Our team typically responds within a few hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-name" className="text-xs">Full Name *</Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Your name"
            value={values.name}
            onChange={set('name')}
            required
            className="h-9 text-sm"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-email" className="text-xs flex items-center gap-1">
            <Mail className="h-3 w-3" /> Email *
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="your@email.com"
            value={values.email}
            onChange={set('email')}
            required
            className="h-9 text-sm"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone" className="text-xs flex items-center gap-1">
            <Phone className="h-3 w-3" /> Phone
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="+1 234 567 890"
            value={values.phone}
            onChange={set('phone')}
            className="h-9 text-sm"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-message" className="text-xs">Message *</Label>
          <textarea
            id="contact-message"
            rows={4}
            placeholder="Tell us what you are looking forâ€¦"
            value={values.message}
            onChange={set('message')}
            required
            className="w-full rounded-[6px] border border-iron bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:border-steel/50 resize-none"
          />
        </div>

        {status === 'error' && (
          <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sendingâ€¦
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Send Enquiry
            </span>
          )}
        </Button>
      </form>
    </section>
  );
}
