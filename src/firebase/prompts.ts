import {
  Firestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { PromptFormValues } from '@/app/admin/prompts/new/prompt-form';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param file The image file to upload.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export async function uploadPromptImage(file: File): Promise<string> {
  if (!file) throw new Error('No file provided for upload.');

  const storage = getStorage();
  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `prompts/${fileName}`);

  const uploadResult = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(uploadResult.ref);

  return downloadURL;
}

export type CreatePromptData = Omit<PromptFormValues, 'image'> & {
  imageUrl?: string;
};

export async function createPrompt(
  firestore: Firestore,
  adminId: string,
  data: CreatePromptData
): Promise<{ success: boolean; error?: string; promptId?: string }> {
  const newPromptRef = doc(collection(firestore, 'prompts'));
  const privateContentRef = doc(newPromptRef, 'private', 'content');

  const batch = writeBatch(firestore);

  try {
    const publicData = {
      id: newPromptRef.id,
      authorId: adminId,
      title: data.title,
      description: data.description || '',
      price: data.price,
      images: data.imageUrl ? [data.imageUrl] : [],
      rating: {
        average: 0,
        count: 0,
      },
      tags: data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
      categories: data.categories
        .split(',')
        .map((cat) => cat.trim())
        .filter(Boolean),
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
    return {
      success: false,
      error: error.message || 'Failed to create prompt.',
    };
  }
}
