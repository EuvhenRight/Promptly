import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/dummy-data';

export default function Hero() {
  const heroImage = placeholderImages.find(p => p.id === 'hero-banner');

  return (
    <section className="relative h-[400px] w-full lg:h-[500px]">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          data-ai-hint={heroImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
        <div className="container mx-auto px-4">
          <h1 className="font-headline text-4xl font-bold md:text-6xl lg:text-7xl">
            Discover Your Next AI Masterpiece
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200 md:text-xl">
            Explore a universe of high-quality prompts from top creators to fuel your AI-powered projects.
          </p>
          <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            Explore Prompts
          </Button>
        </div>
      </div>
    </section>
  );
}
