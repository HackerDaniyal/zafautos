'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { markdownToHtml } from '@/lib/cms/markdown';
import {
  RichTextToolbar,
  type ToolbarAction,
} from '@/components/admin/forms/rich-text-toolbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Pencil, Copy, Download } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxLength?: number;
}

type Tab = 'edit' | 'preview';

function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content in markdown...',
  disabled = false,
  minHeight = 200,
  maxLength,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('edit');
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [imageAlt, setImageAlt] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const characterCount = value.length;
  const isOverLimit = maxLength !== undefined && characterCount > maxLength;

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
  }, [minHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const insertAtCursor = React.useCallback(
    (before: string, after: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const replacement = before + (selected || 'text') + after;

      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + before.length + (selected ? selected.length : 4);
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [value, onChange],
  );

  const insertAtLineStart = React.useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', start);
      const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

      // Check if line already has this prefix
      if (line.startsWith(prefix)) {
        // Remove prefix
        const newValue =
          value.substring(0, lineStart) + line.substring(prefix.length) + value.substring(lineEnd === -1 ? value.length : lineEnd);
        onChange(newValue);
      } else {
        // Add prefix
        const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        onChange(newValue);
      }

      requestAnimationFrame(() => {
        textarea.focus();
      });
    },
    [value, onChange],
  );

  const insertLink = React.useCallback(() => {
    if (!linkUrl) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const text = linkText || selected || 'link text';

    const markdown = `[${text}](${linkUrl})`;
    const newValue = value.substring(0, start) + markdown + value.substring(end);
    onChange(newValue);

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');

    requestAnimationFrame(() => {
      textarea.focus();
    });
  }, [linkUrl, linkText, value, onChange]);

  const insertImage = React.useCallback(() => {
    if (!imageUrl) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const markdown = `![${imageAlt || 'image'}](${imageUrl})`;
    const newValue = value.substring(0, start) + markdown + value.substring(start);
    onChange(newValue);

    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');

    requestAnimationFrame(() => {
      textarea.focus();
    });
  }, [imageUrl, imageAlt, value, onChange]);

  const handleToolbarAction = React.useCallback(
    (action: ToolbarAction) => {
      switch (action) {
        case 'bold':
          insertAtCursor('**', '**');
          break;
        case 'italic':
          insertAtCursor('*', '*');
          break;
        case 'strikethrough':
          insertAtCursor('~~', '~~');
          break;
        case 'h1':
          insertAtLineStart('# ');
          break;
        case 'h2':
          insertAtLineStart('## ');
          break;
        case 'h3':
          insertAtLineStart('### ');
          break;
        case 'ul':
          insertAtLineStart('- ');
          break;
        case 'ol':
          insertAtLineStart('1. ');
          break;
        case 'link':
          setLinkText('');
          setLinkUrl('');
          setLinkDialogOpen(true);
          break;
        case 'image':
          setImageUrl('');
          setImageAlt('');
          setImageDialogOpen(true);
          break;
        case 'code':
          insertAtCursor('`', '`');
          break;
        case 'codeblock':
          insertAtCursor('```\n', '\n```');
          break;
        case 'quote':
          insertAtLineStart('> ');
          break;
        case 'hr':
          insertAtCursor('\n---\n');
          break;
      }
    },
    [insertAtCursor, insertAtLineStart],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleToolbarAction('bold');
            break;
          case 'i':
            e.preventDefault();
            handleToolbarAction('italic');
            break;
          case 'k':
            e.preventDefault();
            handleToolbarAction('link');
            break;
        }
      }

      // Tab key inserts spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        insertAtCursor('  ');
      }
    },
    [handleToolbarAction, insertAtCursor],
  );

  const copyHtml = React.useCallback(() => {
    const html = markdownToHtml(value);
    navigator.clipboard.writeText(html);
  }, [value]);

  const copyMarkdown = React.useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  const downloadMarkdown = React.useCallback(() => {
    const blob = new Blob([value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className="rounded-[8px] border border-iron/30 bg-carbon">
      {/* Tabs + Actions bar */}
      <div className="flex items-center justify-between border-b border-iron/30">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'edit'
                ? 'border-b-2 border-signal-red text-pure-white'
                : 'text-ash hover:text-pure-white',
            )}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'preview'
                ? 'border-b-2 border-signal-red text-pure-white'
                : 'text-ash hover:text-pure-white',
            )}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-1 pr-2">
          <button
            type="button"
            onClick={copyMarkdown}
            disabled={disabled || !value}
            title="Copy markdown"
            className={cn(
              'rounded-[4px] p-1.5 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-red/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={copyHtml}
            disabled={disabled || !value}
            title="Copy as HTML"
            className={cn(
              'rounded-[4px] p-1.5 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-red/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <span className="text-xs font-bold">{'<>'}</span>
          </button>
          <button
            type="button"
            onClick={downloadMarkdown}
            disabled={disabled || !value}
            title="Download markdown"
            className={cn(
              'rounded-[4px] p-1.5 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-red/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Download className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar (edit mode only) */}
      {activeTab === 'edit' && (
        <RichTextToolbar onAction={handleToolbarAction} disabled={disabled} />
      )}

      {/* Editor / Preview */}
      {activeTab === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full resize-none bg-transparent p-4 font-mono text-sm text-pure-white placeholder-steel',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          style={{ minHeight: `${minHeight}px` }}
          aria-label="Markdown editor"
        />
      ) : (
        <div
          ref={previewRef}
          className={cn(
            'prose prose-invert max-w-none p-4',
            'text-sm text-pure-white',
            '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-pure-white [&_h1]:mb-4 [&_h1]:mt-6',
            '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-pure-white [&_h2]:mb-3 [&_h2]:mt-5',
            '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-pure-white [&_h3]:mb-2 [&_h3]:mt-4',
            '[&_p]:mb-3 [&_p]:text-ash [&_p]:leading-relaxed',
            '[&_strong]:text-pure-white [&_strong]:font-semibold',
            '[&_em]:italic',
            '[&_del]:line-through [&_del]:text-steel',
            '[&_a]:text-signal-red [&_a]:underline [&_a]:hover:text-signal-red/80',
            '[&_code]:rounded-[4px] [&_code]:bg-iron/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-signal-red',
            '[&_pre]:rounded-[8px] [&_pre]:bg-deep-carbon [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto',
            '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-ash',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-signal-red/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-steel [&_blockquote]:mb-3',
            '[&_ul]:mb-3 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:text-ash',
            '[&_ol]:mb-3 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:text-ash',
            '[&_li]:mb-1',
            '[&_hr]:my-6 [&_hr]:border-iron/30',
            '[&_img]:max-w-full [&_img]:rounded-[8px]',
            '[&_table]:w-full [&_table]:border-collapse [&_table]:mb-3',
            '[&_th]:border [&_th]:border-iron/30 [&_th]:bg-deep-carbon [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-ash',
            '[&_td]:border [&_td]:border-iron/30 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-pure-white',
          )}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
        />
      )}

      {/* Character count */}
      <div className="flex items-center justify-between border-t border-iron/30 px-4 py-2">
        <div className="text-xs text-steel">
          Markdown
        </div>
        <div
          className={cn(
            'text-xs',
            isOverLimit ? 'text-signal-red font-medium' : 'text-steel',
          )}
        >
          {characterCount.toLocaleString()}
          {maxLength !== undefined && ` / ${maxLength.toLocaleString()}`}
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-carbon border-iron/30">
          <DialogHeader>
            <DialogTitle className="text-pure-white">Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="link-text" className="text-ash">Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
                className="bg-deep-carbon border-iron/30 text-pure-white placeholder-steel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url" className="text-ash">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-deep-carbon border-iron/30 text-pure-white placeholder-steel"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') insertLink();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              className="border-iron/30 text-ash hover:text-pure-white"
            >
              Cancel
            </Button>
            <Button
              onClick={insertLink}
              disabled={!linkUrl}
              className="bg-signal-red text-pure-white hover:bg-signal-red/90"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="bg-carbon border-iron/30">
          <DialogHeader>
            <DialogTitle className="text-pure-white">Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="image-alt" className="text-ash">Alt Text</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Image description"
                className="bg-deep-carbon border-iron/30 text-pure-white placeholder-steel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-url" className="text-ash">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/photo.jpg"
                className="bg-deep-carbon border-iron/30 text-pure-white placeholder-steel"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') insertImage();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageDialogOpen(false)}
              className="border-iron/30 text-ash hover:text-pure-white"
            >
              Cancel
            </Button>
            <Button
              onClick={insertImage}
              disabled={!imageUrl}
              className="bg-signal-red text-pure-white hover:bg-signal-red/90"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { RichTextEditor, type RichTextEditorProps };
