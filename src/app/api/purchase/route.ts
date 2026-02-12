'use server';

import { adminDb } from '@/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await getAdminAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { promptId } = await req.json();
        if (!promptId) {
            return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
        }

        const userRef = adminDb.doc(`users/${userId}`);
        const promptRef = adminDb.doc(`prompts/${promptId}`);
        let promptData: any;
        let creditPrice: number;

        await adminDb.runTransaction(async (transaction) => {
            const [userDoc, promptDoc] = await Promise.all([
                transaction.get(userRef),
                transaction.get(promptRef),
            ]);

            if (!userDoc.exists) throw new Error('User not found.');
            if (!promptDoc.exists) throw new Error('Prompt not found.');

            const userData = userDoc.data()!;
            promptData = promptDoc.data()!;

            if (userData.purchasedPrompts?.includes(promptId)) {
                return; // User already owns this prompt
            }

            creditPrice = Math.round(promptData.price * 100);
            const userCredits = userData.credits ?? 0;

            if (userCredits < creditPrice) {
                throw new Error('Insufficient credits.');
            }

            transaction.update(userRef, {
                credits: admin.firestore.FieldValue.increment(-creditPrice),
                purchasedPrompts: admin.firestore.FieldValue.arrayUnion(promptId),
            });

            transaction.update(promptRef, {
                'stats.sales': admin.firestore.FieldValue.increment(1),
            });
        });

        // After successful transaction, write to purchase history
        if (promptData) {
            const historyRef = adminDb.collection('users').doc(userId).collection('purchaseHistory').doc();
            await historyRef.set({
                type: 'prompt',
                amountCents: creditPrice,
                currency: 'crd', // Special currency code for credits
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                promptIds: [promptId],
                promptTitles: [promptData.title],
                description: promptData.title,
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Purchase transaction failed:', error);
        return NextResponse.json({ error: error.message || 'An internal error occurred.' }, { status: 400 });
    }
}
