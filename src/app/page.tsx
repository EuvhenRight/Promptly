import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Hero from '@/components/home/hero';
import MobileFilters from '@/components/home/mobile-filters';
import PromptFeed from '@/components/home/prompt-feed';
import TopCreatorsWidget from '@/components/home/top-creators-widget';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Hero />
      <MobileFilters />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8 xl:col-span-9">
              <PromptFeed />
            </div>
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <TopCreatorsWidget />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
