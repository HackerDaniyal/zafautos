'use client';

import React, { useState } from 'react';
import { Send, Phone, Mail, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { submitVehicleEnquiry, type EnquiryInput } from '@/server/actions/publicConversionActions';

interface VehicleContactFormProps {
  vehicleId: string;
  vehicleTitle: string;
  className?: string;
  onSubmitted?: () => void;
}

export function VehicleContactForm({ vehicleId, vehicleTitle, className, onSubmitted }: VehicleContactFormProps) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    message: `Hi, I'm interested in the ${vehicleTitle} listed on ZafAutos. Please send me more details.`,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const input: EnquiryInput = {
        vehicleId,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        country: values.country.trim() || undefined,
        message: values.message.trim(),
      };
      await submitVehicleEnquiry(input);
      setStatus('success');
      onSubmitted?.();
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={cn('rounded-[10px] border border-gray-200 bg-white p-6 text-center space-y-3', className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/30">
          <Send className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="font-[Oswald] font-bold uppercase tracking-wider text-base text-gray-900">Enquiry Sent!</h3>
        <p className="text-sm text-gray-600 max-w-xs mx-auto">
          Thank you for your interest in the <strong>{vehicleTitle}</strong>. We&apos;ll get back to you within 24 hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setStatus('idle'); setValues((v) => ({ ...v, name: '', email: '', phone: '', country: '' })); }}
          className="mt-2 border-gray-200 text-gray-900 hover:bg-gray-100"
        >
          Send Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <section id="enquiry-form" className={cn('rounded-[10px] border border-gray-200 bg-white p-5 space-y-4', className)}>
      <div className="space-y-1">
        <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-signal-red" />
          Enquire About This Vehicle
        </h2>
        <p className="text-xs text-gray-600">Our team typically responds within a few hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-name" className="text-xs">Full Name *</Label>
          <Input
            id="enquiry-name"
            type="text"
            placeholder="Your name"
            value={values.name}
            onChange={set('name')}
            required
            className="h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-email" className="text-xs flex items-center gap-1">
            <Mail className="h-3 w-3" /> Email *
          </Label>
          <Input
            id="enquiry-email"
            type="email"
            placeholder="your@email.com"
            value={values.email}
            onChange={set('email')}
            required
            className="h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Phone + Country row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="enquiry-phone" className="text-xs flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone
            </Label>
            <Input
              id="enquiry-phone"
              type="tel"
              placeholder="+1 234 567 890"
              value={values.phone}
              onChange={set('phone')}
              className="h-9 text-sm bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="enquiry-country" className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Country
            </Label>
            <Input
              id="enquiry-country"
              type="text"
              placeholder="Your country"
              value={values.country}
              onChange={set('country')}
              className="h-9 text-sm bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-message" className="text-xs">Message *</Label>
          <textarea
            id="enquiry-message"
            rows={4}
            placeholder="Tell us what you are looking for…"
            value={values.message}
            onChange={set('message')}
            required
            className="w-full rounded-[6px] border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none"
          />
        </div>

        {status === 'error' && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-signal-red hover:bg-deep-red text-gray-900 font-[Oswald] uppercase tracking-wider"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending…
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
