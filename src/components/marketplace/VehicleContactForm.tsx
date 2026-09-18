'use client';

import React, { useState } from 'react';
import { Send, Phone, Mail, MessageSquare, MapPin, CheckCircle2 } from 'lucide-react';
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
      <div className={cn('rounded-xl border border-gray-200 bg-white p-8 text-center space-y-4 shadow-sm', className)}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-wider text-gray-900">Enquiry Sent!</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Thank you for your interest in the <span className="font-medium text-gray-700">{vehicleTitle}</span>. We&apos;ll get back to you within 24 hours.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setStatus('idle'); setValues((v) => ({ ...v, name: '', email: '', phone: '', country: '' })); }}
          className="mt-2 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
        >
          Send Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <section id="enquiry-form" className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {/* Form Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-red/10">
            <MessageSquare className="h-4 w-4 text-signal-red" />
          </div>
          <div>
            <h2 className="font-[Oswald] text-[15px] font-bold uppercase tracking-wider text-gray-900">
              Send an Enquiry
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Our team typically responds within a few hours.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-name" className="text-xs font-medium text-gray-600">Full Name *</Label>
          <Input
            id="enquiry-name"
            type="text"
            placeholder="Your name"
            value={values.name}
            onChange={set('name')}
            required
            className="h-10 text-sm bg-gray-50/80 border-gray-200 rounded-lg focus:border-signal-red focus:ring-signal-red/20 placeholder:text-gray-400"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-email" className="text-xs font-medium text-gray-600">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="enquiry-email"
              type="email"
              placeholder="your@email.com"
              value={values.email}
              onChange={set('email')}
              required
              className="h-10 text-sm bg-gray-50/80 border-gray-200 rounded-lg pl-9 focus:border-signal-red focus:ring-signal-red/20 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Phone + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="enquiry-phone" className="text-xs font-medium text-gray-600">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="enquiry-phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={values.phone}
                onChange={set('phone')}
                className="h-10 text-sm bg-gray-50/80 border-gray-200 rounded-lg pl-9 focus:border-signal-red focus:ring-signal-red/20 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="enquiry-country" className="text-xs font-medium text-gray-600">Country</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="enquiry-country"
                type="text"
                placeholder="Your country"
                value={values.country}
                onChange={set('country')}
                className="h-10 text-sm bg-gray-50/80 border-gray-200 rounded-lg pl-9 focus:border-signal-red focus:ring-signal-red/20 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-message" className="text-xs font-medium text-gray-600">Message *</Label>
          <textarea
            id="enquiry-message"
            rows={4}
            placeholder="Tell us what you're looking for..."
            value={values.message}
            onChange={set('message')}
            required
            className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-signal-red focus:ring-2 focus:ring-signal-red/20 resize-none transition-colors"
          />
        </div>

        {status === 'error' && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-signal-red hover:bg-deep-red text-white rounded-lg font-[Oswald] text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm shadow-signal-red/20 hover:shadow-md hover:shadow-signal-red/30"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Send Enquiry
            </span>
          )}
        </Button>

        <p className="text-center text-[11px] text-gray-400">We respect your privacy. No spam, ever.</p>
      </form>
    </section>
  );
}
