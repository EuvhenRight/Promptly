'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/home/search-bar';
import PromptFeed from '@/components/home/prompt-feed';
import SubHeader from '@/components/home/sub-header';
import { usePromptsFeed } from '@/hooks/use-prompts-feed';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FeedSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
);

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('Featured');
  const { prompts, loading, error, hasMore, loadMore } = usePromptsFeed();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <SubHeader activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main>
        <SearchBar activeFilter={activeFilter} />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {error && <p className="text-destructive text-center">Error: {error.message}</p>}
          
          <PromptFeed prompts={prompts} />

          {loading && (
             <div className="mt-8">
                <FeedSkeleton />
             </div>
          )}

          {!loading && hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load More
              </Button>
            </div>
          )}

          {!hasMore && !loading && prompts.length > 0 && (
             <p className="mt-8 text-center text-muted-foreground">You've reached the end!</p>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
