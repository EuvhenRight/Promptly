import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DUMMY_CREATORS, placeholderImages } from '@/lib/dummy-data';
import type { Prompt } from '@/lib/dummy-data';
import { Star } from 'lucide-react';

type PromptCardProps = {
  prompt: Prompt;
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const author = DUMMY_CREATORS.find((c) => c.uid === prompt.authorId);
  const promptImage = placeholderImages.find(p => p.id === prompt.images[0]);

  return (
    <Card className="overflow-hidden break-inside-avoid shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          {promptImage && (
             <Image
                src={promptImage.imageUrl}
                alt={prompt.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={promptImage.imageHint}
             />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-headline text-lg font-semibold leading-tight truncate group-hover:text-primary transition-colors">{prompt.title}</h3>
        {author && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.avatarUrl} alt={author.displayName} />
              <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{author.displayName}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 p-4 pt-0">
        <div className="flex w-full justify-between items-center">
            <div className="text-lg font-bold text-primary">
                {prompt.price === 0 ? 'Free' : `$${prompt.price.toFixed(2)}`}
            </div>
            <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                <span className="font-bold">{prompt.rating.average.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({prompt.rating.count})</span>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {prompt.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
