'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Prompt } from '@/lib/types';

const PAGE_SIZE = 10;

export function usePromptsFeed() {
  const firestore = useFirestore();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPrompts = useCallback(
    async (initialLoad = false) => {
      if (loading) return;
      setLoading(true);
      setError(null);

      try {
        const promptsCollection = collection(firestore, 'prompts');
        let q;

        if (initialLoad) {
          q = query(
            promptsCollection,
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
          );
        } else if (lastVisible) {
          q = query(
            promptsCollection,
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(PAGE_SIZE)
          );
        } else {
          // This case handles when loadMore is called but there's no lastVisible doc,
          // which shouldn't happen if hasMore is false. We stop here.
          setLoading(false);
          setHasMore(false);
          return;
        }

        const documentSnapshots = await getDocs(q);

        const newPrompts = documentSnapshots.docs.map((doc) => {
          // Make sure to include the ID and handle Timestamps correctly if needed by components.
          return { id: doc.id, ...doc.data() } as Prompt;
        });

        const lastDoc =
          documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc || null);

        if (documentSnapshots.docs.length < PAGE_SIZE) {
          setHasMore(false);
        }

        setPrompts((prevPrompts) =>
          initialLoad ? newPrompts : [...prevPrompts, ...newPrompts]
        );

      } catch (err: any) {
        console.error('Error fetching prompts:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [firestore, loading, lastVisible]
  );

  // Initial load
  useEffect(() => {
    fetchPrompts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]); // Only re-run if firestore instance changes

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPrompts(false);
    }
  };

  return { prompts, loading, error, hasMore, loadMore };
}
