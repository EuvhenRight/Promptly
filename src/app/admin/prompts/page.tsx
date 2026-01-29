
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Prompt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react';
import { PromptsTable } from './prompts-table';
import { Scraper } from './scraper';

export default function AdminPromptsPage() {
  const firestore = useFirestore();
  const promptsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'prompts'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: prompts, isLoading, error } = useCollection<Prompt>(promptsQuery);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-destructive">Error loading prompts: {error.message}</p>
      );
    }

    if (!prompts || prompts.length === 0) {
      return <p>No prompts found. Add one to get started!</p>;
    }

    return <PromptsTable prompts={prompts} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Prompt Manager</h1>
        <Button asChild>
          <Link href="/admin/prompts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Prompt
          </Link>
        </Button>
      </div>

      <Scraper />
      
      <Card>
        <CardHeader>
          <CardTitle>All Prompts</CardTitle>
          <CardDescription>
            A list of all prompts in the marketplace. You can edit or delete
            them here.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
