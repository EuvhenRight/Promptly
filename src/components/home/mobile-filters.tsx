'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DUMMY_FILTERS } from '@/lib/dummy-data';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileFilters() {
  const [activeFilter, setActiveFilter] = useState('all');
  const allFilters = [
    ...DUMMY_FILTERS.categories,
    ...DUMMY_FILTERS.models,
  ];

  return (
    <div className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 py-2">
            <Button
              variant="ghost"
              className={cn(
                "rounded-none px-3 h-auto hover:bg-transparent",
                activeFilter === 'all'
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
              onClick={() => setActiveFilter('all')}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" /> All Filters
            </Button>
            {allFilters.map((filter) => (
              <Button
                key={filter.id}
                variant="ghost"
                className={cn(
                  "rounded-none px-3 h-auto hover:bg-transparent",
                  activeFilter === filter.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-muted-foreground"
                )}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
