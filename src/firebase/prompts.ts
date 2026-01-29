import {
  Firestore,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import type { PromptFormValues } from '@/app/admin/prompts/new/prompt-form';
import type { Prompt, PromptPrivateContent } from '@/lib/types';

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
      stats: {
        views: 0,
        sales: 0,
        likes: 0,
      },
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

/**
 * Deletes a prompt and its associated private content and storage files.
 */
export async function deletePrompt(
  firestore: Firestore,
  promptId: string
): Promise<void> {
  const promptRef = doc(firestore, 'prompts', promptId);
  const privateContentRef = doc(promptRef, 'private', 'content');
  const storage = getStorage();

  const batch = writeBatch(firestore);

  try {
    const promptSnap = await getDoc(promptRef);
    if (!promptSnap.exists()) {
      throw new Error('Prompt not found.');
    }

    const promptData = promptSnap.data() as Prompt;

    // Delete image from storage if it exists
    if (promptData.images && promptData.images[0]) {
      try {
        const imageRef = ref(storage, promptData.images[0]);
        await deleteObject(imageRef);
      } catch (storageError: any) {
        // Log storage error but don't block firestore deletion
        if (storageError.code !== 'storage/object-not-found') {
          console.error(
            'Could not delete prompt image from storage:',
            storageError
          );
        }
      }
    }

    batch.delete(promptRef);
    batch.delete(privateContentRef);

    await batch.commit();
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    throw new Error(error.message || 'Failed to delete prompt.');
  }
}

/**
 * Fetches a single prompt along with its private content.
 */
export async function getPromptWithContent(
  firestore: Firestore,
  promptId: string
): Promise<(Prompt & { privateContent: string }) | null> {
  const promptRef = doc(firestore, 'prompts', promptId);
  const privateContentRef = doc(promptRef, 'private', 'content');

  const [promptSnap, privateContentSnap] = await Promise.all([
    getDoc(promptRef),
    getDoc(privateContentRef),
  ]);

  if (!promptSnap.exists()) {
    return null;
  }

  const promptData = promptSnap.data() as Prompt;
  const privateContent =
    (privateContentSnap.data() as PromptPrivateContent)?.text || '';

  // The tags and categories are stored as arrays, but the form expects comma-separated strings.
  const tagsString = Array.isArray(promptData.tags)
    ? promptData.tags.join(', ')
    : '';
  const categoriesString = Array.isArray(promptData.categories)
    ? promptData.categories.join(', ')
    : '';

  return {
    ...promptData,
    tags: tagsString,
    categories: categoriesString,
    privateContent,
  };
}

export type UpdatePromptData = Omit<PromptFormValues, 'image'> & {
  imageUrl?: string;
};

/**
 * Updates a prompt and its private content.
 */
export async function updatePrompt(
  firestore: Firestore,
  promptId: string,
  data: UpdatePromptData
) {
  const promptRef = doc(firestore, 'prompts', promptId);
  const privateContentRef = doc(promptRef, 'private', 'content');

  const batch = writeBatch(firestore);

  const publicDataToUpdate: any = {
    title: data.title,
    description: data.description || '',
    price: data.price,
    tags: data.tags
      ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [],
    categories: data.categories
      .split(',')
      .map((cat) => cat.trim())
      .filter(Boolean),
    updatedAt: serverTimestamp(),
  };

  if (data.imageUrl) {
    publicDataToUpdate.images = [data.imageUrl];
  }

  const privateDataToUpdate = {
    text: data.privateContent,
  };

  batch.update(promptRef, publicDataToUpdate);
  batch.set(privateContentRef, privateDataToUpdate, { merge: true }); // Use set with merge to be safe

  await batch.commit();
}
