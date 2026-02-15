
import { adminDb } from '@/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const PLATFORM_COMMISSION_RATE = 0.20; // 20% platform fee

async function handleSinglePromptPurchase(
	userId: string,
	promptId: string,
): Promise<NextResponse> {
	const db = adminDb;
	if (!db) {
		return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
	}

	let creditPrice: number;
	let promptData: any;

	await db.runTransaction(async transaction => {
		const userRef = db.doc(`users/${userId}`);
		const promptRef = db.doc(`prompts/${promptId}`);
		const [userDoc, promptDoc] = await Promise.all([
			transaction.get(userRef),
			transaction.get(promptRef),
		]);

		if (!userDoc.exists) throw new Error('User not found.');
		if (!promptDoc.exists) throw new Error('Prompt not found.');

		const userData = userDoc.data()!;
		promptData = promptDoc.data()!;

		if (userData.purchasedPrompts?.includes(promptId)) {
			return; // User already owns this prompt, transaction succeeds silently
		}

		creditPrice = Math.round(promptData.price * 100);
		const userCredits = userData.credits ?? 0;

		if (userCredits < creditPrice) {
			throw new Error('Insufficient credits.');
		}

        // Add author crediting logic
        const authorId = promptData.authorId;
        if (authorId && authorId !== userId) {
            const earnings = Math.floor(creditPrice * (1 - PLATFORM_COMMISSION_RATE));
            const authorRef = db.doc(`users/${authorId}`);
            transaction.update(authorRef, {
                earnings: admin.firestore.FieldValue.increment(earnings),
            });
        }

		transaction.update(userRef, {
			credits: admin.firestore.FieldValue.increment(-creditPrice),
			purchasedPrompts: admin.firestore.FieldValue.arrayUnion(promptId),
		});

		transaction.update(promptRef, {
			'stats.sales': admin.firestore.FieldValue.increment(1),
		});
	});

	if (promptData) {
		const historyRef = db
			.collection('users')
			.doc(userId)
			.collection('purchaseHistory')
			.doc();
		await historyRef.set({
			type: 'prompt',
			amountCents: creditPrice!,
			currency: 'crd',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			promptIds: [promptId],
			promptTitles: [promptData.title],
			description: promptData.title,
		});
	}

	return NextResponse.json({ success: true });
}

async function handleCartPurchase(
	userId: string,
	promptIds: string[],
): Promise<NextResponse> {
	const db = adminDb;
	if (!db) {
		return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
	}

	let totalCreditCost = 0;
	const promptDocsData: { title: string; id: string, authorId: string, price: number }[] = [];
    const authorEarnings: { [authorId: string]: number } = {};

	await db.runTransaction(async transaction => {
		const userRef = db.doc(`users/${userId}`);
		const cartRef = db.collection('users').doc(userId).collection('carts').doc('active');
		const userDoc = await transaction.get(userRef);
		if (!userDoc.exists) throw new Error('User not found.');

		const promptRefs = promptIds.map(id => db.doc(`prompts/${id}`));
		const promptDocs = await transaction.getAll(...promptRefs);

		for (const pDoc of promptDocs) {
			if (!pDoc.exists) throw new Error(`Prompt with ID ${pDoc.id} not found.`);
			const pData = pDoc.data()!;
            const creditPrice = Math.round(pData.price * 100);

			promptDocsData.push({ title: pData.title, id: pDoc.id, authorId: pData.authorId, price: creditPrice });
			totalCreditCost += creditPrice;
            
            // Calculate earnings for the author
            const authorId = pData.authorId;
            if (authorId && authorId !== userId) {
                const earnings = Math.floor(creditPrice * (1 - PLATFORM_COMMISSION_RATE));
                authorEarnings[authorId] = (authorEarnings[authorId] || 0) + earnings;
            }
		}

		const userCredits = userDoc.data()!.credits ?? 0;
		if (userCredits < totalCreditCost) {
			throw new Error('Insufficient credits.');
		}

		// All checks passed, perform writes
		transaction.update(userRef, {
			credits: admin.firestore.FieldValue.increment(-totalCreditCost),
			purchasedPrompts: admin.firestore.FieldValue.arrayUnion(...promptIds),
		});

		for (const pDocRef of promptRefs) {
			transaction.update(pDocRef, {
				'stats.sales': admin.firestore.FieldValue.increment(1),
			});
		}

        // Credit earnings to authors
        for (const authorId in authorEarnings) {
            const authorRef = db.doc(`users/${authorId}`);
            transaction.update(authorRef, {
                earnings: admin.firestore.FieldValue.increment(authorEarnings[authorId]),
            });
        }
        
        // Also clear the cart in the same transaction
        transaction.update(cartRef, { promptIds: [] });
	});

	// After successful transaction, write history
	const historyRef = db
		.collection('users')
		.doc(userId)
		.collection('purchaseHistory')
		.doc();
	await historyRef.set({
		type: 'cart',
		amountCents: totalCreditCost,
		currency: 'crd',
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		promptIds: promptIds,
		promptTitles: promptDocsData.map(d => d.title),
		description: `${promptIds.length} prompts from cart`,
	});

	return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
	try {
		const token = req.headers.get('Authorization')?.split('Bearer ')[1];
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const adminAuth = getAdminAuth();
		if (!adminAuth) {
			return NextResponse.json({ error: 'Server auth not configured' }, { status: 500 });
		}
		const decodedToken = await adminAuth.verifyIdToken(token);
		const userId = decodedToken.uid;

		const body = await req.json();
		const { promptId, promptIds, type } = body;

		if (type === 'cart' && Array.isArray(promptIds) && promptIds.length > 0) {
			return await handleCartPurchase(userId, promptIds);
		} else if (promptId) {
			return await handleSinglePromptPurchase(userId, promptId);
		} else {
			return NextResponse.json(
				{ error: 'Invalid request body' },
				{ status: 400 },
			);
		}
	} catch (error: any) {
		console.error('Purchase transaction failed:', error);
		return NextResponse.json(
			{ error: error.message || 'An internal error occurred.' },
			{ status: 400 },
		);
	}
}
