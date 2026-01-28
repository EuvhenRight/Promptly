'use client';

import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages, DUMMY_CREATORS } from '@/lib/dummy-data';
import type { Prompt } from '@/lib/types';
import { Heart, Eye, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type PromptCardProps = {
  prompt: Prompt;
};

const formatStat = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const author = DUMMY_CREATORS.find((c) => c.uid === prompt.authorId);
  const promptImage = placeholderImages.find(p => p.id === prompt.images[0]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Later, you can add state management or a server action for liking
    console.log("Liked prompt:", prompt.id);
  };
  
  return (
    <div className="mb-4 break-inside-avoid">
        <div className="group relative w-full overflow-hidden rounded-2xl bg-card">
            <Link href={`/prompt/${prompt.id}`} className="block cursor-pointer">
                {promptImage && (
                    <Image
                        src={promptImage.imageUrl}
                        alt={prompt.title}
                        width={400}
                        height={640}
                        className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        data-ai-hint={promptImage.imageHint}
                    />
                )}
            </Link>

            {/* Overlay with gradient and content. pointer-events-none lets clicks pass through to the Link */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-base leading-tight truncate">{prompt.title}</h3>
                    {prompt.stats && (
                        <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-300">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4"/>
                                    {formatStat(prompt.stats.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ShoppingCart className="h-4 w-4"/>
                                    {formatStat(prompt.stats.sales)}
                                </span>
                            </div>
                            {prompt.categories?.[0] && (
                                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0 font-medium">
                                    {prompt.categories[0]}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Like button - positioned over the card, becomes interactive on hover */}
            <button 
                onClick={handleLike}
                className="absolute top-3 right-3 z-10 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 opacity-0 group-hover:opacity-100"
                aria-label="Like prompt"
            >
                <Heart className="h-5 w-5" />
            </button>
        </div>
        
        {/* Author info below the image */}
        {author && (
            <div className="mt-3 flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={author.photoURL} alt={author.displayName} />
                    <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{author.displayName}</span>
            </div>
        )}
    </div>
  );
}
