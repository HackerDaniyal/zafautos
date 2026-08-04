'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/components/admin/ui/use-toast';

function CopyButton({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied', description: `${label} copied to clipboard`, variant: 'default' });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 shrink-0 rounded p-1 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3.5 text-available-green" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export { CopyButton };
