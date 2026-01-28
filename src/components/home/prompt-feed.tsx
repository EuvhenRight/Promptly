import { DUMMY_PROMPTS } from '@/lib/dummy-data';
import PromptCard from './prompt-card';
import Link from 'next/link';

export default function PromptFeed() {
  return (
    <div className="columns-1 gap-8 space-y-8 md:columns-2 xl:columns-3">
      {DUMMY_PROMPTS.map((prompt) => (
        <Link key={prompt.id} href={`/prompt/${prompt.id}`} className="block">
          <PromptCard prompt={prompt} />
        </Link>
      ))}
    </div>
  );
}
