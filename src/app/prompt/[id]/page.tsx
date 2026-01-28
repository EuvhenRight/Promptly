import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import Image from 'next/image';
import { placeholderImages } from '@/lib/dummy-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DUMMY_CREATORS } from '@/lib/dummy-data';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const prompt = DUMMY_PROMPTS.find((p) => p.id === params.id);
  const author = DUMMY_CREATORS.find((c) => c.uid === prompt?.authorId);

  if (!prompt || !author) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p>Prompt not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const promptImage = placeholderImages.find(p => p.id === prompt.images[0]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              {promptImage && (
                <Image
                  src={promptImage.imageUrl}
                  alt={prompt.title}
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                  data-ai-hint={promptImage.imageHint}
                />
              )}
            </div>
            {/* Thumbnail images could go here */}
          </div>

          {/* Right Column: Prompt Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-headline text-3xl md:text-4xl font-bold">{prompt.title}</h1>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={author.avatarUrl} alt={author.displayName} />
                  <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{author.displayName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                <span className="font-bold">{prompt.rating.average.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({prompt.rating.count} ratings)</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <p className="text-muted-foreground">{prompt.description}</p>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">{prompt.price === 0 ? 'Free' : `$${prompt.price.toFixed(2)}`}</h2>
                 <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Buy Now
                 </Button>
              </div>
              <div className="p-8 bg-muted rounded-lg text-center relative">
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <div className="text-center font-bold text-lg">
                          Unlock to view prompt
                      </div>
                  </div>
                  <p className="text-muted-foreground italic line-clamp-3">
                      "A hyper-realistic 4K image of a majestic lion with a flowing mane, set against a backdrop of a golden sunset on the African savanna. The lighting should be dramatic, with long shadows and a warm, orange glow. The lion's expression should be noble and powerful. Use a shallow depth of field to isolate the lion from the background. Shot on a Sony A7R IV with a 200mm f/2.8 lens."
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments & Ratings Section */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="font-headline text-2xl font-bold mb-6">Reviews</h2>
          {/* AddComment and CommentList components will go here */}
          <div className="space-y-6">
            <p className="text-muted-foreground">Comments coming soon.</p>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
