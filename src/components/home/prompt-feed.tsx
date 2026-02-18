'use client';

import PromptCard from './prompt-card';
import type { Prompt } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

interface PromptFeedProps {
  prompts: Prompt[];
  cartPromptIds?: Set<string>;
  purchasedPromptIds?: Set<string>;
}

export default function PromptFeed({ prompts, cartPromptIds, purchasedPromptIds }: PromptFeedProps) {
  const [isClient, setIsClient] = useState(false);
  const animationParent = useRef(null);

  useEffect(() => {
    setIsClient(true);
    if (animationParent.current) {
        // Dynamically import and use autoAnimate if needed, to avoid build issues.
        import('@formkit/auto-animate').then(mod => {
            if (animationParent.current) {
                mod.default(animationParent.current);
            }
        }).catch(err => console.error("Failed to load auto-animate", err));
    }
  }, []);

  if (!isClient || !prompts.length) {
    return null;
  }

  return (
    <div
      ref={animationParent}
      className="prompt-feed-grid grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          isInCart={cartPromptIds?.has(prompt.id) ?? false}
          isPurchased={purchasedPromptIds?.has(prompt.id) ?? false}
        />
      ))}
    </div>
  );
}
