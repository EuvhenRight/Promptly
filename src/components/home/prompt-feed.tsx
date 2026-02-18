'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import PromptCard from './prompt-card';
import type { Prompt } from '@/lib/types';

interface PromptFeedProps {
  prompts: Prompt[];
  cartPromptIds?: Set<string>;
  purchasedPromptIds?: Set<string>;
}

export default function PromptFeed({ prompts, cartPromptIds, purchasedPromptIds }: PromptFeedProps) {
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

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
