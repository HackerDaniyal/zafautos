import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { CurrencySwitcher } from '@/components/marketplace/CurrencySwitcher';

export function QuickSearch() {
  return (
    <div className="relative -mt-16 z-20 mx-auto w-full max-w-5xl px-4 flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl bg-card rounded-xl p-4 shadow-sm border">
        <h3 className="text-sm font-medium mb-3 text-center text-muted-foreground">Select Your Currency</h3>
        <CurrencySwitcher />
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
            
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <select id="make" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Any Make</option>
                <option value="toyota">Toyota</option>
                <option value="honda">Honda</option>
                <option value="nissan">Nissan</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select id="model" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Any Model</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Min Year</Label>
              <Input id="year" type="number" placeholder="e.g. 2015" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Max Price</Label>
              <Input id="price" type="number" placeholder="USD" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyType">Body Type</Label>
              <select id="bodyType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Any Type</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="button" className="w-full h-10">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
