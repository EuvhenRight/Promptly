import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import PromptCard from './prompt-card';

export default function PromptFeed() {
  return (
    <div className="columns-1 gap-8 space-y-8 md:columns-2 xl:columns-3">
      {DUMMY_PROMPTS.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
