"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface QuickSearchProps {
  makes: { id: string; name: string }[];
  bodyTypes: { id: string; name: string }[];
}

export function QuickSearch({ makes, bodyTypes }: QuickSearchProps) {
  return (
    <div className="relative -mt-12 z-20 mx-auto w-full max-w-5xl px-4 flex flex-col">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-md">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="make" className="text-[11px] font-medium text-gray-500">Make</Label>
            <select id="make" className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]">
              <option value="">Any Make</option>
              {makes.map((make) => (
                <option key={make.id} value={make.id}>{make.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-[11px] font-medium text-gray-500">Model</Label>
            <select id="model" className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]">
              <option value="">Any Model</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-[11px] font-medium text-gray-500">Min Year</Label>
            <input id="year" type="number" placeholder="e.g. 2015" className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-[11px] font-medium text-gray-500">Max Price</Label>
            <input id="price" type="number" placeholder="USD" className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bodyType" className="text-[11px] font-medium text-gray-500">Body Type</Label>
            <select id="bodyType" className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]">
              <option value="">Any Type</option>
              {bodyTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="button" className="w-full h-10 bg-[#E5231B] hover:bg-[#E5231B]/90 text-white rounded-lg font-semibold text-sm">
              <Search className="mr-1.5 h-4 w-4" />
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
