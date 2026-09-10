'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, DollarSign, FileText, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/admin/forms/form-field';
import { useToast } from '@/components/admin/ui/use-toast';
import { createInvoice } from '@/server/actions/paymentActions';
import { INVOICE_STATUS_OPTIONS } from '../constants';
import type { Invoice } from '../types';

interface InvoiceFormProps {
  orderId: string;
  existingInvoice?: Invoice;
  onSave: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ orderId, existingInvoice, onSave, onCancel }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    invoiceNumber: existingInvoice?.invoiceNumber || '',
    invoiceDate: existingInvoice?.invoiceDate ? new Date(existingInvoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: existingInvoice?.dueDate ? new Date(existingInvoice.dueDate).toISOString().split('T')[0] : '',
    tax: existingInvoice?.tax || 0,
    discount: existingInvoice?.discount || 0,
    shipping: existingInvoice?.shipping || 0,
    subtotal: existingInvoice?.subtotal || 0,
    total: existingInvoice?.total || 0,
    balanceDue: existingInvoice?.balanceDue || 0,
    status: existingInvoice?.status || 'draft',
    notes: existingInvoice?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  const calculateTotals = () => {
    const subtotal = formData.subtotal || 0;
    const tax = formData.tax || 0;
    const discount = formData.discount || 0;
    const shipping = formData.shipping || 0;
    
    const total = subtotal + tax - discount + shipping;
    const balanceDue = total;
    
    setFormData(prev => ({ ...prev, total, balanceDue }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.subtotal, formData.tax, formData.discount, formData.shipping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        orderId,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: new Date(formData.invoiceDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        tax: formData.tax,
        discount: formData.discount,
        shipping: formData.shipping,
        subtotal: formData.subtotal,
        total: formData.total,
        balanceDue: formData.balanceDue,
        status: formData.status,
        notes: formData.notes || undefined,
      };
      
      const result = await createInvoice(data);
      if (result.success) {
        toast({ title: 'Success', description: 'Invoice created successfully', variant: 'success' });
        onSave();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-pure-white">Invoice Details</h2>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Invoice Number" required name="invoiceNumber">
          <input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            placeholder="INV-2024-001"
            className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
        </FormField>

        <FormField label="Invoice Date" required name="invoiceDate">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Due Date" name="dueDate">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Status" required name="status">
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as typeof formData.status }))}
            className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          >
            {INVOICE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Subtotal" name="subtotal">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.subtotal}
              onChange={(e) => setFormData(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Tax" name="tax">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.tax}
              onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Discount" name="discount">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Shipping" name="shipping">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.shipping}
              onChange={(e) => setFormData(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon pl-9 pr-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </FormField>

        <FormField label="Total" name="total">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.total}
              readOnly
              className="w-full rounded-[6px] border border-iron/30 bg-iron/20 pl-9 pr-3 py-2 text-sm text-pure-white font-medium focus:outline-none"
            />
          </div>
        </FormField>

        <FormField label="Balance Due" name="balanceDue">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <input
              type="number"
              value={formData.balanceDue}
              readOnly
              className="w-full rounded-[6px] border border-iron/30 bg-iron/20 pl-9 pr-3 py-2 text-sm text-pure-white font-medium focus:outline-none"
            />
          </div>
        </FormField>
      </div>

      <FormField label="Notes" description="Additional notes for this invoice" name="notes">
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Enter additional notes..."
          className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          rows={3}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-signal-red hover:bg-deep-red">
          {loading ? 'Saving...' : 'Save Invoice'}
        </Button>
      </div>
    </form>
  );
}