'use client';

import Masonry from 'react-masonry-css';
import PromptCard from './prompt-card';
import type { Prompt } from '@/lib/types';

const breakpointColumnsObj = {
  default: 5,   // For screens > 1280px
  1280: 4,    // For screens <= 1280px
  1024: 3,    // For screens <= 1024px
  767: 1,     // For screens <= 767px
};

interface PromptFeedProps {
  prompts: Prompt[];
}

export default function PromptFeed({ prompts }: PromptFeedProps) {
  if (!prompts.length) {
    return null; // Don't render anything if there are no prompts yet
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="prompt-feed-grid"
      columnClassName="prompt-feed-grid_column"
    >
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </Masonry>
  );
}
