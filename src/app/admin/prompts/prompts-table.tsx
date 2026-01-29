'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { deletePrompt } from '@/firebase/prompts';
import type { Prompt } from '@/lib/types';

interface PromptsTableProps {
  prompts: Prompt[];
}

export function PromptsTable({ prompts }: PromptsTableProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

  const handleDelete = async () => {
    if (!promptToDelete || !firestore) return;

    try {
      await deletePrompt(firestore, promptToDelete.id);
      toast({
        title: 'Prompt Deleted',
        description: `"${promptToDelete.title}" has been successfully deleted.`,
      });
      // The useCollection hook will automatically update the UI
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Prompt',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setPromptToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                Image
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Stats</TableHead>
              <TableHead className="hidden md:table-cell">Created At</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell className="hidden sm:table-cell">
                  {prompt.images && prompt.images[0] ? (
                    <Image
                      alt={prompt.title}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={prompt.images[0]}
                      width="64"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="font-medium">{prompt.title}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {prompt.categories.join(', ')}
                  </div>
                </TableCell>
                <TableCell>
                  {prompt.price === 0 ? 'Free' : `$${prompt.price.toFixed(2)}`}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col text-sm">
                    <span>Views: {prompt.stats?.views ?? 0}</span>
                    <span>Sales: {prompt.stats?.sales ?? 0}</span>
                    <span>Likes: {prompt.stats?.likes ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {prompt.createdAt
                    ? format(prompt.createdAt.toDate(), 'PPP')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/prompts/edit/${prompt.id}`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          setPromptToDelete(prompt);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog
        open={!!promptToDelete}
        onOpenChange={(open) => !open && setPromptToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              prompt and its associated private content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
