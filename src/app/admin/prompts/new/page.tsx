'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { PromptForm, type PromptFormValues } from './prompt-form';
import {
  createPrompt,
  uploadPromptImage,
  type CreatePromptData,
} from '@/firebase/prompts';
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

    try {
      let imageUrl: string | undefined = undefined;

      if (data.image) {
        toast({ title: 'Uploading image...', description: 'Please wait.' });
        imageUrl = await uploadPromptImage(data.image);
      }

      const promptData: CreatePromptData = {
        title: data.title,
        description: data.description,
        price: data.price,
        categories: data.categories,
        tags: data.tags,
        privateContent: data.privateContent,
        imageUrl: imageUrl,
      };
      
      toast({ title: 'Saving prompt...', description: 'Just a moment.' });
      const result = await createPrompt(firestore, user.uid, promptData);

      if (result.success) {
        toast({
          title: 'Prompt Created',
          description: 'Your new prompt has been successfully created.',
        });
        router.push('/admin/prompts');
      } else {
        throw new Error(
          result.error || 'An unknown error occurred while saving the prompt.'
        );
      }
    } catch (error: any) {
      console.error('Failed to create prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Prompt',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
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
