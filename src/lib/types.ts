import { Timestamp } from 'firebase/firestore'

export type Cart = {
	id: string
	userId: string
	promptIds: string[]
	createdAt: Timestamp
	updatedAt: Timestamp
}

export type UserProfile = {
	uid: string
	email: string
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

export type Prompt = {
	id: string
	authorId: string
	authorDisplayName?: string
	authorPhotoURL?: string
	title: string
	titleLowercase: string
	searchTerms: string[]
	description: string
	price: number
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
