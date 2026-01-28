'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/home/search-bar';
import PromptFeed from '@/components/home/prompt-feed';
import SubHeader from '@/components/home/sub-header';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('Featured');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <SubHeader activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main>
        <SearchBar activeFilter={activeFilter} />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <PromptFeed />
        </div>
      </main>
      <Footer />
    </div>
  );
}
