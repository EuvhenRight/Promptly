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
    // The dynamic import was causing build issues, so it has been removed.
    // We can re-evaluate animation libraries in the future if needed.
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
