'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ContactPageClient() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise((r) => setTimeout(r, 1500));
    setStatus('success');
  };

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '+81 3-1234-5678', href: 'tel:+81312345678' },
    { icon: Mail, label: 'Email', value: 'sales@zafautos.jp', href: 'mailto:sales@zafautos.jp' },
    { icon: MapPin, label: 'Office', value: 'Shinjuku, Tokyo, Japan', href: null },
    { icon: Clock, label: 'Hours', value: 'Mon–Fri 9:00–18:00 JST', href: null },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-12 lg:py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-[Oswald] text-4xl font-bold uppercase tracking-[0.3px] text-pure-white sm:text-5xl">
          Contact Us
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ash">
          Have a question about a vehicle or need help with your import? Our team typically responds within a few hours.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
        {/* Contact Form */}
        <div className="rounded-[10px] border border-[#2A2A2A] bg-[#1A1A1A] p-6 sm:p-8">
          <h2 className="font-[Oswald] text-lg font-bold uppercase tracking-wider text-pure-white mb-6">
            Send a Message
          </h2>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3BA55D]/20">
                <Send className="h-7 w-7 text-[#3BA55D]" />
              </div>
              <h3 className="font-[Oswald] text-xl font-bold uppercase text-pure-white">Message Sent</h3>
              <p className="mt-2 text-sm text-ash">We&apos;ll get back to you within a few hours.</p>
              <Button
                variant="outline"
                className="mt-6 border-[#2A2A2A] text-pure-white hover:bg-white/5"
                onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-steel">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="rounded-[6px] border-[#2A2A2A] bg-[#141414] text-pure-white placeholder:text-[#6E6E6E]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-steel">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="rounded-[6px] border-[#2A2A2A] bg-[#141414] text-pure-white placeholder:text-[#6E6E6E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-steel">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                    className="rounded-[6px] border-[#2A2A2A] bg-[#141414] text-pure-white placeholder:text-[#6E6E6E]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subject" className="text-xs font-medium uppercase tracking-wider text-steel">Subject *</Label>
                  <Input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="How can we help?"
                    className="rounded-[6px] border-[#2A2A2A] bg-[#141414] text-pure-white placeholder:text-[#6E6E6E]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-steel">Message *</Label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you are looking for..."
                  className="rounded-[6px] border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-pure-white placeholder:text-[#6E6E6E] focus:outline-none focus:border-[#6E6E6E]/50 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={status === 'loading'}
                className="mt-2 w-full rounded-[6px] bg-[#E5231B] font-[Oswald] uppercase tracking-wider text-pure-white hover:bg-[#C41E18]"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="flex flex-col gap-4">
          {contactInfo.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 rounded-[10px] border border-[#2A2A2A] bg-[#1A1A1A] p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#141414]">
                <item.icon className="h-5 w-5 text-[#E5231B]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#6E6E6E]">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="mt-0.5 text-sm font-medium text-pure-white hover:text-[#E5231B] transition-colors">
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-pure-white">{item.value}</p>
                )}
              </div>
            </div>
          ))}

          {/* FAQ CTA */}
          <div className="mt-4 rounded-[10px] border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <h3 className="font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">
              Looking for answers?
            </h3>
            <p className="mt-2 text-sm text-ash">
              Check our FAQ for instant answers about shipping, customs, inspections, and payments.
            </p>
            <Button
              variant="outline"
              asChild
              className="mt-4 w-full rounded-[6px] border-[#2A2A2A] font-[Oswald] uppercase tracking-wider text-pure-white hover:bg-white/5"
            >
              <Link href="/#faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
