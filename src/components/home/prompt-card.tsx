import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DUMMY_CREATORS, placeholderImages } from '@/lib/dummy-data';
import type { Prompt } from '@/lib/dummy-data';

type PromptCardProps = {
  prompt: Prompt;
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const author = DUMMY_CREATORS.find((c) => c.uid === prompt.authorId);
  const promptImage = placeholderImages.find(p => p.id === prompt.images[0]);

  return (
    <div className="break-inside-avoid group">
        <div className="relative overflow-hidden rounded-lg transition-shadow duration-300 group-hover:shadow-xl bg-card">
            {promptImage && (
               <div className="overflow-hidden rounded-t-lg">
                 <Image
                    src={promptImage.imageUrl}
                    alt={prompt.title}
                    width={500}
                    height={300}
                    className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
                    data-ai-hint={promptImage.imageHint}
                 />
               </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold leading-tight truncate text-foreground">{prompt.title}</h3>
              {author && (
                <div className="mt-2 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={author.avatarUrl} alt={author.displayName} />
                    <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{author.displayName}</span>
                </div>
              )}
            </div>
        </div>
    </div>
  );
}
