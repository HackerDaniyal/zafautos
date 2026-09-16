"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { getModelsByManufacturer } from "@/server/actions/publicVehicleActions";

interface QuickSearchProps {
  makes: { id: string; name: string; slug: string }[];
  bodyTypes: { id: string; name: string }[];
}

export function QuickSearch({ makes, bodyTypes }: QuickSearchProps) {
  const router = useRouter();
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelSlug, setSelectedModelSlug] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");
  const [models, setModels] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const handleMakeChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const makeId = e.target.value;
    setSelectedMakeId(makeId);
    setSelectedModelSlug("");
    setModels([]);

    if (!makeId) return;

    setLoadingModels(true);
    try {
      const result = await getModelsByManufacturer(makeId);
      setModels(result);
    } catch {
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedMakeId) {
      const make = makes.find((m) => m.id === selectedMakeId);
      if (make) params.set("make", make.slug);
    }
    if (selectedModelSlug) params.set("model", selectedModelSlug);
    if (minYear) params.set("yearMin", minYear);
    if (maxPrice) params.set("priceMax", maxPrice);
    if (selectedBodyType) params.set("bodyType", selectedBodyType);

    router.push(`/vehicles?${params.toString()}`);
  }, [selectedMakeId, selectedModelSlug, minYear, maxPrice, selectedBodyType, makes, router]);

  return (
    <div className="relative -mt-12 z-20 mx-auto w-full max-w-5xl px-4 flex flex-col">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-gray-500">Make</Label>
            <select
              value={selectedMakeId}
              onChange={handleMakeChange}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]"
            >
              <option value="">Any Make</option>
              {makes.map((make) => (
                <option key={make.id} value={make.id}>{make.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-gray-500">Model</Label>
            <select
              value={selectedModelSlug}
              onChange={(e) => setSelectedModelSlug(e.target.value)}
              disabled={!selectedMakeId || loadingModels}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingModels ? "Loading..." : !selectedMakeId ? "Select make first" : "Any Model"}
              </option>
              {models.map((model) => (
                <option key={model.id} value={model.slug}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-gray-500">Min Year</Label>
            <input
              type="number"
              placeholder="e.g. 2015"
              value={minYear}
              onChange={(e) => setMinYear(e.target.value)}
              min="1990"
              max="2026"
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-gray-500">Max Price (USD)</Label>
            <input
              type="number"
              placeholder="e.g. 30000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-gray-500">Body Type</Label>
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]"
            >
              <option value="">Any Type</option>
              {bodyTypes.map((bt) => (
                <option key={bt.id} value={bt.name}>{bt.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleSearch}
              className="w-full h-10 bg-[#E5231B] hover:bg-[#E5231B]/90 text-white rounded-lg font-semibold text-sm"
            >
              <Search className="mr-1.5 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
