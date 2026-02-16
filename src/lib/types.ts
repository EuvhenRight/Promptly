import { Timestamp } from 'firebase/firestore'

export type Cart = {
	id: string
	userId: string
	promptIds: string[]
	createdAt?: Timestamp
	updatedAt?: Timestamp
}

/** One record per successful Stripe checkout, written by fulfill API. */
export type PurchaseHistoryRecord = {
	id: string
	/** 'credits' | 'prompt' | 'cart' | 'plan' */
	type: 'credits' | 'prompt' | 'cart' | 'plan'
	amountCents: number
	currency: string
	createdAt: Timestamp
	/** For prompt/cart: prompt IDs. */
	promptIds?: string[]
	/** For prompt/cart: prompt titles (same order as promptIds). */
	promptTitles?: string[]
	/** For credits: amount added to wallet. */
	creditsAmount?: number
	/** For plan: e.g. 'starter' | 'pro'. */
	plan?: string
	/** For plan: 'monthly' | 'yearly'. */
	billing?: string
	/** Human-readable description for the table. */
	description?: string
}

export type UserProfile = {
	uid: string
	email: string
	username?: string
	displayName: string
	photoURL: string
	coverImageURL?: string
	description?: string
	headline?: string
	aiTools?: string
	xProfile?: string
	instagramProfile?: string
	facebookProfile?: string
	role: 'user' | 'admin'
	planId?: 'free' | 'starter' | 'pro'
	planPurchasedAt?: Timestamp
	planBillingPeriod?: 'monthly' | 'yearly'
	planWillCancelAtPeriodEnd?: boolean
	/** Wallet balance for image/generation credits (incremented when user buys credits). */
	credits?: number
	/** Credit balance earned from prompt sales, available for payout. */
	earnings?: number
	/** Current status of a pending payout request. */
	payoutStatus?:
		| 'none'
		| 'pending'
		| 'approved'
		| 'processing'
		| 'paid'
		| 'rejected'
	purchasedPrompts?: string[]
	favoritePrompts?: string[]
	isSeller?: boolean
	followers?: number
	following?: number
	views?: number
	stats?: {
		totalSales: number
		monthlySales: number
		weeklySales: number
		reputation: number
	}
}

export type PublicProfile = Pick<
	UserProfile,
	| 'uid'
	| 'username'
	| 'displayName'
	| 'photoURL'
	| 'coverImageURL'
	| 'description'
	| 'followers'
	| 'following'
	| 'views'
	| 'xProfile'
	| 'instagramProfile'
	| 'facebookProfile'
	| 'planId'
>

export type Prompt = {
	id: string
	authorId: string
	authorDisplayName?: string
	authorPhotoURL?: string
	authorUsername?: string
	authorPlanId?: 'free' | 'starter' | 'pro'
	title: string
	titleLowercase: string
	searchTerms: string[]
	description: string
	price: number
	isPrivate?: boolean
	images: string[] // URLs to images in Firebase Storage
	rating: {
		average: number
		count: number
	}
	tags: string[]
	/** One category per prompt (one-to-many: category has many prompts). */
	categoryId?: string
	/** @deprecated Use categoryId. Kept for backward compat. */
	categories?: string[]
	/** Content type (Video, Images, Audio) from Types collection. */
	typeId?: string
	/** Model (Nano Banana, Flux) from Models collection. */
	modelId?: string
	stats?: {
		views: number
		sales: number
		likes: number
	}
	createdAt?: Timestamp
	updatedAt?: Timestamp
}

export type PromptPrivateContent = {
	text: string
}

export type PromptComment = {
	id: string
	text: string
	rating: number
	userId: string
	authorDisplayName?: string
	authorPhotoURL?: string
	authorPlanId?: 'free' | 'starter' | 'pro'
	timestamp?: Timestamp
}

export type AdminComment = PromptComment & {
	promptId: string
}

export type ScrapeResult = {
	title: string
	privateContent: string
	categories: string
	imageUrl: string
	sourceId: string
	tags: string
}

export type PayoutRequest = {
	id: string
	userId: string
	amountCredits: number
	amountCurrency: number
	currency: string
	status: 'pending' | 'approved' | 'rejected' | 'paid'
	requestedAt: Timestamp
	processedAt?: Timestamp
}

export type Notification = {
    id: string;
    userId: string;
    type: 'sale' | 'payout' | 'follow' | 'comment' | 'like';
    title: string;
    body: string;
    link?: string;
    isRead: boolean;
    createdAt: Timestamp;
}
