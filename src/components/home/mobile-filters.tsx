import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DUMMY_FILTERS } from '@/lib/dummy-data';
import { SlidersHorizontal } from 'lucide-react';

export default function MobileFilters() {
  const allFilters = [
    ...DUMMY_FILTERS.categories,
    ...DUMMY_FILTERS.models,
  ];

  return (
    <div className="lg:hidden">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 pb-4">
          <Button variant="outline" className="border-accent text-accent-foreground">
            <SlidersHorizontal className="mr-2 h-4 w-4" /> All Filters
          </Button>
          {allFilters.map((filter) => (
            <Button key={filter.id} variant="outline" className="rounded-full">
              {filter.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
