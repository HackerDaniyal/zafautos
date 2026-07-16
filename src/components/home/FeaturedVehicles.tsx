import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const placeholderVehicles = [1, 2, 3, 4, 5, 6];

export function FeaturedVehicles() {
  return (
    <SectionWrapper className="bg-muted/30">
      <PageHeader 
        title="Featured Vehicles" 
        description="Explore our hand-picked selection of premium Japanese used cars."
        action={
          <Button variant="ghost" asChild>
            <Link href="/vehicles">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderVehicles.map((id) => (
          <Card key={id} className="overflow-hidden transition-all hover:shadow-md">
            <div className="aspect-[4/3] bg-muted relative">
              {/* Image Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Vehicle Image
              </div>
              <Badge className="absolute left-4 top-4">Featured</Badge>
            </div>
            <CardHeader className="pb-2">
              <h3 className="font-semibold line-clamp-1">2019 Toyota Land Cruiser Prado</h3>
              <p className="text-xl font-bold text-primary">$32,500</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Mileage: 45,000 km</div>
                <div>Engine: 2.7L</div>
                <div>Trans: Auto</div>
                <div>Location: Tokyo</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/vehicles/placeholder-${id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
