import React from 'react';
import { cn } from '@/lib/utils';

interface MainContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainContainer({ children, className, ...props }: MainContainerProps) {
  return (
    <div 
      className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8", className)} 
      {...props}
    >
      {children}
    </div>
  );
}
