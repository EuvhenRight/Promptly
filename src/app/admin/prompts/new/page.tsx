'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { PromptForm, type PromptFormValues } from './prompt-form';
import { createPrompt } from '@/firebase/prompts';
import { useState } from 'react';

export default function NewPromptPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PromptFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a prompt.',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createPrompt(firestore, user.uid, data);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Prompt Created',
        description: 'Your new prompt has been successfully created.',
      });
      router.push('/admin/prompts');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Prompt',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Create New Prompt</h1>
      </div>
      <PromptForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}
