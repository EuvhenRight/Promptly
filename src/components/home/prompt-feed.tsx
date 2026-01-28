'use client';

import Masonry from 'react-masonry-css';
import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import PromptCard from './prompt-card';

const breakpointColumnsObj = {
  default: 5,   // For screens > 1280px
  1280: 4,    // For screens <= 1280px
  1024: 3,    // For screens <= 1024px
  767: 1,     // For screens <= 767px
};

export default function PromptFeed() {
  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="prompt-feed-grid"
      columnClassName="prompt-feed-grid_column"
    >
      {DUMMY_PROMPTS.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </Masonry>
  );
}
