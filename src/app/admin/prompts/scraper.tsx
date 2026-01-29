
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scrapePromptHero, type ScrapeResult } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Link as LinkIcon } from 'lucide-react';

export function Scraper() {
  const router = useRouter();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async () => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'URL Required',
        description: 'Please enter a URL to scrape.',
      });
      return;
    }

    setIsScraping(true);
    try {
      const result = await scrapePromptHero(url);

      if ('error' in result) {
        throw new Error(result.error);
      }

      toast({
        title: 'Scraping Successful!',
        description: 'Redirecting to the new prompt form...',
      });

      const queryParams = new URLSearchParams(result as ScrapeResult).toString();
      router.push(`/admin/prompts/new?${queryParams}`);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Scraping Failed',
        description: error.message,
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrape from URL</CardTitle>
        <CardDescription>
          Automatically fill the form by scraping a URL from a supported site (e.g., PromptHero).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
          <div className="relative flex-grow">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://prompthero.com/prompt/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScraping}
              className="pl-9"
            />
          </div>
          <Button onClick={handleScrape} disabled={isScraping}>
            {isScraping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Scrape & Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
