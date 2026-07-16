'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  className,
}: PaginationProps) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange?.(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange?.(currentPage + 1);
  };
  const goToPage = (page: number) => {
    if (page !== currentPage) onPageChange?.(page);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show up to 5 page buttons, with ellipsis if many pages
  const visiblePages = pageNumbers.filter((p) => {
    if (totalPages <= 5) return true;
    if (p === 1 || p === totalPages) return true;
    if (p >= currentPage - 1 && p <= currentPage + 1) return true;
    return false;
  });

  return (
    <nav className={cn('flex items-center space-x-2', className)} aria-label="Pagination">
      <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentPage === 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {visiblePages.map((page, idx) => (
        <React.Fragment key={page}>
          <Button
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
          {/* Insert ellipsis when there is a gap */}
          {idx < visiblePages.length - 1 && visiblePages[idx + 1] - page > 1 && <span className="px-1 text-muted-foreground">…</span>}
        </React.Fragment>
      ))}
      <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentPage === totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
