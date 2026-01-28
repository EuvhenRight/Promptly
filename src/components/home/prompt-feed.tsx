import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import PromptCard from './prompt-card';

export default function PromptFeed() {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {DUMMY_PROMPTS.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
