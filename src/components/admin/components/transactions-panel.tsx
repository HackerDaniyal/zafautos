'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, ExternalLink, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/admin/ui/use-toast';
import { listTransactions, deleteTransaction } from '@/server/actions/paymentActions';
import { TRANSACTION_TYPE_OPTIONS } from '@/app/(admin)/admin/payments/constants';
import type { PaymentTransaction } from '@/app/(admin)/admin/payments/types';

interface TransactionsPanelProps {
  paymentId: string;
}

export function TransactionsPanel({ paymentId }: TransactionsPanelProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const result = await listTransactions({ paymentId });
      if (result.success && result.data) {
        setTransactions(result.data as PaymentTransaction[]);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load transactions', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [paymentId]);

  const handleDelete = async (transactionId: string) => {
    setDeletingId(transactionId);
    try {
      const result = await deleteTransaction(transactionId);
      if (result.success) {
        toast({ title: 'Transaction deleted', variant: 'success' });
        fetchTransactions();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const option = TRANSACTION_TYPE_OPTIONS.find((opt: { value: string; label: string }) => opt.value === type);
    return option ? option.label : type;
  };

  const getTransactionTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted' => {
    switch (type) {
      case 'deposit':
      case 'balance_payment':
        return 'success';
      case 'refund':
        return 'warning';
      case 'adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-iron/20 p-2">
                <DollarSign className="size-4 text-steel" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-iron/50 rounded" />
                <div className="h-3 w-24 bg-iron/50 rounded" />
              </div>
              <div className="h-6 w-16 bg-iron/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
          <p className="text-ash">No transactions recorded for this payment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4 hover:bg-deep-carbon/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-iron/20 p-2">
                    <DollarSign className="size-4 text-steel" />
                  </div>
                  <div>
                    <p className="text-sm text-pure-white font-medium">
                      {getTransactionTypeLabel(transaction.type)} - {formatPrice(transaction.amount)}
                    </p>
                    <p className="text-xs text-steel">
                      {transaction.transactionDate ? format(new Date(transaction.transactionDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    label={getTransactionTypeLabel(transaction.type)}
                    variant={getTransactionTypeVariant(transaction.type)}
                  />
                  {transaction.referenceNumber && (
                    <Badge variant="outline" className="text-xs">
                      Ref: {transaction.referenceNumber}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    {transaction.receipt && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                      >
                        <a href={transaction.receipt} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    )}
                    {transaction.receipt && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                      >
                        <a href={transaction.receipt} download>
                          <Download className="size-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletingId === transaction.id}
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="size-3.5 text-signal-red" />
                    </Button>
                  </div>
                </div>
              </div>
              {transaction.notes && (
                <div className="mt-3 pt-3 border-t border-iron/30">
                  <p className="text-xs text-steel">{transaction.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}