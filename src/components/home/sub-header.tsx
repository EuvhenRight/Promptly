'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DUMMY_MODELS_AND_STYLES } from '@/lib/dummy-data';
import { Video, Image as ImageIcon, Sparkles, Bot } from 'lucide-react'; // Example icons

const mainLinks = ['Featured', 'Hot', 'New', 'Top'];

// A simple mapping for demo icons
const iconMap: { [key: string]: React.ElementType } = {
  video: Video,
  'chatgpt-image': ImageIcon,
  midjourney: Sparkles,
  default: Bot,
};


export default function SubHeader() {
  const [activeMainLink, setActiveMainLink] = useState('Featured');
  const [activeStyleLink, setActiveStyleLink] = useState('');

  return (
    <div className="border-b bg-background/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-2">
            {mainLinks.map((link) => (
              <Link
                key={link}
                href="#"
                onClick={() => {
                    setActiveMainLink(link)
                    setActiveStyleLink('')
                }}
                className={cn(
                  'py-3 px-2 text-sm font-semibold whitespace-nowrap',
                  activeMainLink === link
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                {link}
              </Link>
            ))}
          </nav>
          <div className="hidden sm:block h-6 border-l" />
          <ScrollArea className="w-full whitespace-nowrap -mx-4 sm:mx-0">
            <div className="flex w-max items-center space-x-1 py-2 px-4 sm:px-0">
              {DUMMY_MODELS_AND_STYLES.map((item) => {
                const Icon = iconMap[item.id] || iconMap.default;
                return (
                    <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setActiveStyleLink(item.id)
                        setActiveMainLink('')
                    }}
                    className={cn(
                        'rounded-full px-3 h-9 gap-2',
                        activeStyleLink === item.id ? 'bg-muted text-primary font-semibold' : 'hover:bg-muted'
                    )}
                    >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    </Button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" className="sm:hidden" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
