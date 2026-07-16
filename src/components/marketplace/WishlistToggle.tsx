'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WishlistToggleProps {
  initialAdded?: boolean;
  onToggle?: (added: boolean) => void;
  className?: string;
}

export function WishlistToggle({
  initialAdded = false,
  onToggle,
  className,
}: WishlistToggleProps) {
  const [added, setAdded] = useState(initialAdded);

  const handleClick = () => {
    const next = !added;
    setAdded(next);
    onToggle?.(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn('rounded-full hover:bg-red-50 transition-colors', className)}
      aria-pressed={added}
      aria-label={added ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn('h-5 w-5', added ? 'fill-current text-red-500' : 'text-muted-foreground')}
        aria-hidden="true"
      />
    </Button>
  );
}
