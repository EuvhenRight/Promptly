'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <section className="py-12 md:py-16 text-center bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Featured Prompts
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          About 2,718 results
        </p>

        <div className="mt-8 max-w-3xl mx-auto">
          <div className="relative">
            <div className="relative flex items-center w-full h-16 bg-card border rounded-full shadow-lg shadow-primary/10">
              <Search className="absolute left-6 h-6 w-6 text-muted-foreground" />
              <Input
                placeholder="Search for prompts, models, or inspiration…"
                className="pl-16 pr-32 h-full text-base rounded-full bg-transparent border-0 focus-visible:ring-0"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  type="submit"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-8"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center items-center gap-3">
          <Button variant="outline" className="rounded-full border bg-card">+ Type</Button>
          <Button variant="outline" className="rounded-full border bg-card">+ Model</Button>
          <Button variant="outline" className="rounded-full border bg-card">Sort ↑↓</Button>
        </div>
      </div>
    </section>
  );
}
