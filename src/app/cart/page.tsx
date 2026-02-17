'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { purchaseCartWithCredits, removePromptFromCart } from '@/firebase/cart'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import { useToast } from '@/hooks/use-toast'
import type { Cart, Prompt, UserProfile } from '@/lib/types'
import { collection, doc, documentId, query, where } from 'firebase/firestore'
import { Coins, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { signInWithGoogle } from '@/firebase/auth'

const LOCAL_CART_KEY = 'promptly_local_cart';

function CartSkeleton() {
	return (
		<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
			<div className='lg:col-span-2 space-y-4'>
				<Card className='flex items-center p-4'>
					<Skeleton className='w-24 h-24 rounded-md mr-4' />
					<div className='flex-grow space-y-2'>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-4 w-full' />
					</div>
				</Card>
				<Card className='flex items-center p-4'>
					<Skeleton className='w-24 h-24 rounded-md mr-4' />
					<div className='flex-grow space-y-2'>
						<Skeleton className='h-5 w-2/3' />
						<Skeleton className='h-4 w-4/5' />
					</div>
				</Card>
			</div>
			<div className='lg:col-span-1'>
				<Card>
					<CardHeader>
						<Skeleton className='h-7 w-2/4' />
					</CardHeader>
					<CardContent className='space-y-4'>
						<Skeleton className='h-5 w-full' />
						<Skeleton className='h-5 w-full' />
						<Separator />
						<Skeleton className='h-7 w-full' />
					</CardContent>
					<CardFooter>
						<Skeleton className='h-12 w-full' />
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}

export default function CartPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()
	const [removingId, setRemovingId] = useState<string | null>(null)
	const [isPurchasing, setIsPurchasing] = useState(false)
	const [localCartIds, setLocalCartIds] = useState<string[]>([]);

	// Effect to handle local storage for guests
	useEffect(() => {
		if (user) {
			setLocalCartIds([]);
			return;
		}

		const updateLocalCart = () => {
			try {
				const localCartRaw = localStorage.getItem(LOCAL_CART_KEY);
				if (localCartRaw) {
					const localCart = JSON.parse(localCartRaw);
					setLocalCartIds(localCart.promptIds ?? []);
				} else {
					setLocalCartIds([]);
				}
			} catch {
				setLocalCartIds([]);
			}
		};

		updateLocalCart();
		window.addEventListener('storage', updateLocalCart);
		return () => {
			window.removeEventListener('storage', updateLocalCart);
		};
	}, [user]);

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const cartRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid, 'carts', 'active') : null),
		[firestore, user],
	)
	const { data: cart, isLoading: isCartLoading } = useDoc<Cart>(cartRef)

	const cartPromptIds = useMemo(() => (user ? cart?.promptIds : localCartIds), [user, cart, localCartIds]);

	const promptsQuery = useMemoFirebase(() => {
		if (!firestore || !cartPromptIds || cartPromptIds.length === 0) {
			return null;
		}
		return query(
			collection(firestore, 'prompts'),
			where(documentId(), 'in', cartPromptIds),
		)
	}, [firestore, cartPromptIds]);

	const { data: cartItems, isLoading: areItemsLoading } =
		useCollection<Prompt>(promptsQuery)

	const isLoading =
		isUserLoading || isCartLoading ||
		(cartPromptIds && cartPromptIds.length > 0 && areItemsLoading)

	const totalCreditCost = useMemo(() => {
		if (!cartItems) return 0
		return cartItems.reduce((acc, item) => acc + Math.round(item.price * 100), 0)
	}, [cartItems])

	const handleRemove = (promptId: string, title: string) => {
		if (removingId) return;
		setRemovingId(promptId)
		removePromptFromCart(user ? firestore : null, user?.uid ?? null, promptId)
		toast({
			title: 'Removed from cart',
			description: `"${title}" has been removed from your cart.`,
		})
		setRemovingId(null)
	}

	const handlePurchase = async () => {
		if (!user || !firestore || !cart?.promptIds || cart.promptIds.length === 0) {
			return
		}
		setIsPurchasing(true)
		try {
			await purchaseCartWithCredits(firestore, user.uid, cart.promptIds)
			toast({
				title: 'Purchase Successful!',
				description: 'The prompts have been added to your account.',
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Purchase Failed',
				description: error.message || 'An unknown error occurred.',
			})
		} finally {
			setIsPurchasing(false)
		}
	}

	const renderContent = () => {
		if (isLoading && !cartItems) {
			return <CartSkeleton />
		}

		if (!cartItems || cartItems.length === 0) {
			return (
				<div className='text-center py-16 bg-muted/50 rounded-lg'>
					<h2 className='text-2xl font-semibold'>Your cart is empty.</h2>
					<p className='text-muted-foreground mt-2'>
						Looks like you haven't added any prompts yet.
					</p>
					<Button asChild className='mt-6'>
						<a href='/'>Explore Prompts</a>
					</Button>
				</div>
			)
		}

		const hasEnoughCredits = (userProfile?.credits ?? 0) >= totalCreditCost

		return (
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				<div className='lg:col-span-2 space-y-4'>
					{cartItems.map(item => {
						const imageIdentifier = item.images?.[0]
						let itemImage: string | undefined

						if (imageIdentifier) {
							if (imageIdentifier.startsWith('http')) {
								itemImage = imageIdentifier
							} else {
								const imageData = PlaceHolderImages.find(
									p => p.id === imageIdentifier,
								)
								if (imageData) {
									itemImage = imageData.imageUrl
								}
							}
						}
						const creditPrice = Math.round(item.price * 100)

						return (
							<Card key={item.id} className='flex items-center p-4'>
								<div className='relative w-24 h-24 aspect-square overflow-hidden rounded-md mr-4 bg-muted'>
									{itemImage && (
										<Image
											src={itemImage}
											alt={item.title}
											fill
											className='object-cover'
										/>
									)}
								</div>
								<div className='flex-grow'>
									<h3 className='font-semibold'>{item.title}</h3>
									<p className='text-sm text-muted-foreground line-clamp-2'>
										{item.description}
									</p>
								</div>
								<div className='flex items-center gap-4'>
									<div className='flex items-center gap-1 font-bold text-lg'>
										<Coins className='h-5 w-5 text-amber-500' />
										<span>{creditPrice}</span>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='text-muted-foreground hover:text-destructive'
										onClick={() => handleRemove(item.id, item.title)}
										disabled={removingId === item.id}
										aria-label={`Remove ${item.title} from cart`}
									>
										{removingId === item.id ? (
											<Loader2 className='h-5 w-5 animate-spin' />
										) : (
											<Trash2 className='h-5 w-5' />
										)}
									</Button>
								</div>
							</Card>
						)
					})}
				</div>

				<div className='lg:col-span-1'>
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex justify-between'>
								<span>Your balance</span>
								<span className='flex items-center gap-1'>
									<Coins className='h-4 w-4 text-amber-500' />
									{userProfile?.credits ?? 0}
								</span>
							</div>
							<Separator />
							<div className='flex justify-between font-bold text-lg'>
								<span>Total Cost</span>
								<span className='flex items-center gap-1'>
									<Coins className='h-5 w-5 text-amber-500' />
									{totalCreditCost}
								</span>
							</div>
						</CardContent>
						<CardFooter>
						{!user ? (
								<Button
									size='lg'
									className='w-full'
									onClick={() => signInWithGoogle()}
								>
									Sign In to Purchase
								</Button>
							) : hasEnoughCredits ? (
								<Button
									size='lg'
									className='w-full'
									onClick={handlePurchase}
									disabled={isPurchasing}
								>
									{isPurchasing && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									Complete Purchase
								</Button>
							) : (
								<div className='w-full text-center'>
									<p className='text-sm text-destructive mb-2'>
										Insufficient credits.
									</p>
									<Button size='lg' className='w-full' asChild>
										<Link href='/account/plans#credits'>Buy More Credits</Link>
									</Button>
								</div>
							)}
						</CardFooter>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8'>
				<h1 className='font-headline text-3xl md:text-4xl font-bold mb-8'>
					Your Cart
				</h1>
				{renderContent()}
			</main>
			<Footer />
		</div>
	)
}
