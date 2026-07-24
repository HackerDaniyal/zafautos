'use client';

import { useState, useRef } from 'react';
import { Upload, Download, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { useToast } from '@/components/admin/ui/use-toast';
import { addOrderDocument, deleteOrderDocument } from '@/server/actions/orderActions';
import type { OrderDocument } from '../types';

interface OrderDocumentsProps {
  orderId: string;
  documents: OrderDocument[];
  onDocumentsChanged: () => void;
}

export function OrderDocuments({ orderId, documents, onDocumentsChanged }: OrderDocumentsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await addOrderDocument(orderId, file.name);
        if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      }
      toast({ title: 'Documents uploaded', variant: 'success' });
      onDocumentsChanged();
    } catch {
      toast({ title: 'Error', description: 'Failed to upload documents', variant: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      const result = await deleteOrderDocument(docId);
      if (result.success) {
        toast({ title: 'Document deleted', variant: 'success' });
        onDocumentsChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  function getDocumentName(url: string) {
    return url.split('/').pop() || url;
  }

  function getDocumentType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const types: Record<string, string> = {
      pdf: 'PDF',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      doc: 'Word Doc',
      docx: 'Word Doc',
      xls: 'Excel',
      xlsx: 'Excel',
    };
    return types[ext] || 'File';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          multiple
        />
        <Button
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1 size-4" />
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Upload documents related to this order (invoices, bills of lading, inspection reports, etc.)."
          icon={FileText}
          action={
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 size-4" />
              Upload Document
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-4 shrink-0 text-steel" />
                <div className="min-w-0">
                  <p className="text-sm text-pure-white truncate">
                    {getDocumentName(doc.documentUrl)}
                  </p>
                  <p className="text-xs text-steel">{getDocumentType(doc.documentUrl)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  asChild
                >
                  <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  asChild
                >
                  <a href={doc.documentUrl} download>
                    <Download className="size-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={deletingId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="size-3.5 text-signal-red" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
