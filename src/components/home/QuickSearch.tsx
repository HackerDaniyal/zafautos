"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

export function QuickSearch() {
  return (
    <div className="relative -mt-14 z-20 mx-auto w-full max-w-5xl px-4 flex flex-col">
      <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-5 py-4">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="make" className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6E6E6E]">Make</Label>
            <select id="make" className="flex h-9 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3D3D3D]">
              <option value="">Any Make</option>
              <option value="toyota">Toyota</option>
              <option value="honda">Honda</option>
              <option value="nissan">Nissan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6E6E6E]">Model</Label>
            <select id="model" className="flex h-9 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3D3D3D]">
              <option value="">Any Model</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6E6E6E]">Min Year</Label>
            <input id="year" type="number" placeholder="e.g. 2015" className="flex h-9 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3D3D3D]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6E6E6E]">Max Price</Label>
            <input id="price" type="number" placeholder="USD" className="flex h-9 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3D3D3D]" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bodyType" className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6E6E6E]">Body Type</Label>
            <select id="bodyType" className="flex h-9 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3D3D3D]">
              <option value="">Any Type</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="truck">Truck</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="button" className="w-full h-9 bg-[#E5231B] hover:bg-[#E5231B]/90 text-white rounded-[5px] font-[Oswald] uppercase tracking-wider text-[12px]">
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
