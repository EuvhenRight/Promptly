import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { DUMMY_CREATORS, placeholderImages } from '@/lib/dummy-data';
import type { Prompt } from '@/lib/dummy-data';
import { Heart } from 'lucide-react';

type PromptCardProps = {
  prompt: Prompt;
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const author = DUMMY_CREATORS.find((c) => c.uid === prompt.authorId);
  const promptImage = placeholderImages.find(p => p.id === prompt.images[0]);

  return (
    <Card className="overflow-hidden break-inside-avoid transition-all duration-300 group border-none relative shadow-md hover:shadow-xl">
      <div className="relative aspect-video">
        {promptImage && (
           <Image
              src={promptImage.imageUrl}
              alt={prompt.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
              data-ai-hint={promptImage.imageHint}
           />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        
        <div className="absolute top-2 right-2">
            <button className="p-1.5 bg-background/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm cursor-pointer">
                <Heart className="h-5 w-5 text-foreground" />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 p-4 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="font-semibold leading-tight truncate text-white drop-shadow-md">{prompt.title}</h3>
          {author && (
            <div className="mt-1 flex items-center gap-2">
              <Avatar className="h-6 w-6 border-2 border-background/50">
                <AvatarImage src={author.avatarUrl} alt={author.displayName} />
                <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-white/90 drop-shadow-sm">{author.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
