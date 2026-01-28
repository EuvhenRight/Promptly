import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/home/search-bar';
import PromptFeed from '@/components/home/prompt-feed';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <SearchBar />
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <PromptFeed />
        </div>
      </main>
      <Footer />
    </div>
  );
}
