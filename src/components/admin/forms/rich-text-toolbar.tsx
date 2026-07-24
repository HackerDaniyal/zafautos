'use client';

import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Minus,
  type LucideIcon,
} from 'lucide-react';

type ToolbarAction =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'link'
  | 'image'
  | 'code'
  | 'codeblock'
  | 'quote'
  | 'hr';

interface ToolbarItem {
  action: ToolbarAction;
  icon: LucideIcon;
  label: string;
  syntax: string;
  wrap?: boolean;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { action: 'bold', icon: Bold, label: 'Bold', syntax: '**', wrap: true },
  { action: 'italic', icon: Italic, label: 'Italic', syntax: '*', wrap: true },
  { action: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', syntax: '~~', wrap: true },
  { action: 'h1', icon: Heading1, label: 'Heading 1', syntax: '# ' },
  { action: 'h2', icon: Heading2, label: 'Heading 2', syntax: '## ' },
  { action: 'h3', icon: Heading3, label: 'Heading 3', syntax: '### ' },
  { action: 'ul', icon: List, label: 'Bullet List', syntax: '- ' },
  { action: 'ol', icon: ListOrdered, label: 'Ordered List', syntax: '1. ' },
  { action: 'link', icon: Link, label: 'Link', syntax: '[', wrap: false },
  { action: 'image', icon: Image, label: 'Image', syntax: '![', wrap: false },
  { action: 'code', icon: Code, label: 'Inline Code', syntax: '`', wrap: true },
  { action: 'codeblock', icon: Code, label: 'Code Block', syntax: '```\n', wrap: false },
  { action: 'quote', icon: Quote, label: 'Blockquote', syntax: '> ' },
  { action: 'hr', icon: Minus, label: 'Horizontal Rule', syntax: '---\n' },
];

interface RichTextToolbarProps {
  onAction: (action: ToolbarAction) => void;
  disabled?: boolean;
  className?: string;
}

function RichTextToolbar({ onAction, disabled = false, className }: RichTextToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 border-b border-iron/30 bg-deep-carbon px-2 py-1.5',
        className,
      )}
    >
      {TOOLBAR_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const isGroupStart =
          index === 0 ||
          getGroup(TOOLBAR_ITEMS[index].action) !== getGroup(TOOLBAR_ITEMS[index - 1].action);

        return (
          <div key={item.action} className="flex items-center">
            {isGroupStart && index > 0 && (
              <div className="mx-1 h-5 w-px bg-iron/30" />
            )}
            <button
              type="button"
              onClick={() => onAction(item.action)}
              disabled={disabled}
              title={item.label}
              className={cn(
                'rounded-[4px] p-1.5 text-ash transition-colors hover:bg-iron/30 hover:text-pure-white',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-red/50',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <Icon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function getGroup(action: ToolbarAction): string {
  if (action === 'bold' || action === 'italic' || action === 'strikethrough') return 'inline';
  if (action === 'h1' || action === 'h2' || action === 'h3') return 'headings';
  if (action === 'ul' || action === 'ol') return 'lists';
  if (action === 'link' || action === 'image') return 'media';
  if (action === 'code' || action === 'codeblock') return 'code';
  if (action === 'quote' || action === 'hr') return 'blocks';
  return 'other';
}

export { RichTextToolbar, type ToolbarAction, type ToolbarItem };
