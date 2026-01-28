import {
  Firestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import type { PromptFormValues } from '@/app/admin/prompts/new/prompt-form';

export async function createPrompt(
  firestore: Firestore,
  adminId: string,
  data: PromptFormValues
): Promise<{ success: boolean; error?: string; promptId?: string }> {
  const newPromptRef = doc(collection(firestore, 'prompts'));
  const privateContentRef = doc(newPromptRef, 'private', 'content');

  const batch = writeBatch(firestore);

  try {
    const publicData = {
      id: newPromptRef.id,
      authorId: adminId,
      title: data.title,
      description: data.description,
      price: data.price,
      images: [], // Placeholder for image URLs
      rating: {
        average: 0,
        count: 0,
      },
      tags: data.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      categories: data.categories.split(',').map((cat) => cat.trim()).filter(Boolean),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const privateData = {
      text: data.privateContent,
    };

    batch.set(newPromptRef, publicData);
    batch.set(privateContentRef, privateData);

    await batch.commit();

    return { success: true, promptId: newPromptRef.id };
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return { success: false, error: error.message || 'Failed to create prompt.' };
  }
}
