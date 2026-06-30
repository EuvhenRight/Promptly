'use client'

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import type { PublicProfile, UserProfile } from '@/lib/types'
import { FirebaseApp } from 'firebase/app'
import {
	Auth,
	User,
	onAuthStateChanged,
} from 'firebase/auth'
import {
	Firestore,
	doc,
	runTransaction,
	serverTimestamp,
    setDoc,
    arrayUnion,
} from 'firebase/firestore'
import React, {
	DependencyList,
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

const LOCAL_CART_KEY = 'promptly_local_cart';

interface FirebaseProviderProps {
	children: ReactNode
	firebaseApp: FirebaseApp
	firestore: Firestore
	auth: Auth
}

// Internal state for user authentication
interface UserAuthState {
	user: User | null
	isUserLoading: boolean
	userError: Error | null
}

// Combined state for the Firebase context
export interface FirebaseContextState {
	areServicesAvailable: boolean // True if core services (app, firestore, auth instance) are provided
	firebaseApp: FirebaseApp | null
	firestore: Firestore | null
	auth: Auth | null // The Auth service instance
	// User authentication state
	user: User | null
	isUserLoading: boolean // True during initial auth check
	userError: Error | null // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
	firebaseApp: FirebaseApp
	firestore: Firestore
	auth: Auth
	user: User | null
	isUserLoading: boolean
	userError: Error | null
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
	// Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
	user: User | null
	isUserLoading: boolean
	userError: Error | null
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(
	undefined,
)

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
	children,
	firebaseApp,
	firestore,
	auth,
}) => {
	const [userAuthState, setUserAuthState] = useState<UserAuthState>({
		user: null,
		isUserLoading: true, // Start loading until first auth event
		userError: null,
	})

	// Effect to subscribe to Firebase auth state changes
	useEffect(() => {
		if (!auth || !firestore) {
			// If no Auth service instance, cannot determine user state
			setUserAuthState({
				user: null,
				isUserLoading: false,
				userError: new Error('Auth or Firestore service not provided.'),
			})
			return
		}

		setUserAuthState({ user: null, isUserLoading: true, userError: null }) // Reset on auth instance change

		const unsubscribe = onAuthStateChanged(
			auth,
			async firebaseUser => {
				// Auth state determined
				if (firebaseUser) {

					// --- Start of Cart Merge Logic ---
					try {
						const localCartRaw = localStorage.getItem(LOCAL_CART_KEY);
						if (localCartRaw) {
							const localCart = JSON.parse(localCartRaw);
							if (localCart.promptIds && localCart.promptIds.length > 0) {
								const userCartRef = doc(firestore, 'users', firebaseUser.uid, 'carts', 'active');
								
								// Use setDoc with merge:true and arrayUnion to safely merge
								await setDoc(userCartRef, {
									promptIds: arrayUnion(...localCart.promptIds),
									updatedAt: serverTimestamp(),
								}, { merge: true });
				
								// Clear the local cart after successful merge
								localStorage.removeItem(LOCAL_CART_KEY);
								// Dispatch storage event to update any listening components (like header)
								window.dispatchEvent(new Event('storage'));
							}
						}
					} catch (error) {
						console.error('Error merging local cart:', error);
						// Don't block login process for this, just log it.
					}
					// --- End of Cart Merge Logic ---

					// User is signed in. Ensure their Firestore document exists.
					const userDocRef = doc(firestore, 'users', firebaseUser.uid)
					const publicProfileRef = doc(
						firestore,
						'public-profiles',
						firebaseUser.uid,
					)

					try {
						await runTransaction(firestore, async transaction => {
							const userDocSnap = await transaction.get(userDocRef)
							const publicProfileSnap = await transaction.get(publicProfileRef)

							if (!userDocSnap.exists()) {
								// This is a new user. Create both their private and public profiles.
								const email = firebaseUser.email ?? ''
								const username = email.split('@')[0] || firebaseUser.uid

								const newUserProfile: UserProfile = {
									uid: firebaseUser.uid,
									email: email || 'no-email@promptly.com',
									displayName: firebaseUser.displayName ?? 'Anonymous User',
									username: username,
									photoURL: firebaseUser.photoURL ?? '',
									coverImageURL: '',
									description: '',
									role: 'user',
									planId: 'free',
									credits: 0,
									purchasedPrompts: [],
									favoritePrompts: [],
									followers: 0,
									following: 0,
									views: 0,
									xProfile: '',
									instagramProfile: '',
									facebookProfile: '',
									createdAt: serverTimestamp(),
								}

								const publicProfileData: PublicProfile = {
									uid: firebaseUser.uid,
									username: username,
									displayName: newUserProfile.displayName,
									photoURL: newUserProfile.photoURL,
									description: newUserProfile.description,
									coverImageURL: newUserProfile.coverImageURL,
									// Initialize counters to 0 for new public profiles
									followers: 0,
									following: 0,
									views: 0,
									xProfile: '',
									instagramProfile: '',
									facebookProfile: '',
									createdAt: serverTimestamp(),
								}

								transaction.set(userDocRef, newUserProfile)
								transaction.set(publicProfileRef, publicProfileData)
							} else if (!publicProfileSnap.exists()) {
								// The user profile exists, but the public one is missing.
								// Create the public profile from the existing user data, but
								// initialize counters to 0, as they are managed separately.
								const userProfile = userDocSnap.data() as UserProfile
								const publicProfileData: PublicProfile = {
									uid: firebaseUser.uid,
									username:
										userProfile.username ||
										firebaseUser.email?.split('@')[0] ||
										firebaseUser.uid,
									displayName: userProfile.displayName,
									photoURL: userProfile.photoURL,
									description: userProfile.description || '',
									coverImageURL: userProfile.coverImageURL || '',
									followers: 0, // Initialize to 0
									following: 0, // Initialize to 0
									views: 0, // Initialize to 0
									xProfile: userProfile.xProfile ?? '',
									instagramProfile: userProfile.instagramProfile ?? '',
									facebookProfile: userProfile.facebookProfile ?? '',
									createdAt: userProfile.createdAt ?? serverTimestamp(),
								}
								transaction.set(publicProfileRef, publicProfileData)
								// Also update the main user document with the generated username if it's missing
								if (!userProfile.username) {
									transaction.update(userDocRef, {
										username: publicProfileData.username,
									})
								}
							}
						})
					} catch (error) {
						console.error(
							'FirebaseProvider: Error in user profile transaction:',
							error,
						)
						if (
							error instanceof Error &&
							'code' in error &&
							(error as any).code.includes('permission-denied')
						) {
							errorEmitter.emit(
								'permission-error',
								new FirestorePermissionError({
									path: userDocRef.path,
									operation: 'write',
								}),
							)
						}
					}
				}
				// Now that the profile is guaranteed to exist (or we've tried to create it), set the auth state.
				setUserAuthState({
					user: firebaseUser,
					isUserLoading: false,
					userError: null,
				})
			},
			error => {
				// Auth listener error
				console.error('FirebaseProvider: onAuthStateChanged error:', error)
				setUserAuthState({ user: null, isUserLoading: false, userError: error })
			},
		)
		return () => unsubscribe() // Cleanup
	}, [auth, firestore]) // Depends on the auth and firestore instances

	// Memoize the context value
	const contextValue = useMemo((): FirebaseContextState => {
		const servicesAvailable = !!(firebaseApp && firestore && auth)
		return {
			areServicesAvailable: servicesAvailable,
			firebaseApp: servicesAvailable ? firebaseApp : null,
			firestore: servicesAvailable ? firestore : null,
			auth: servicesAvailable ? auth : null,
			user: userAuthState.user,
			isUserLoading: userAuthState.isUserLoading,
			userError: userAuthState.userError,
		}
	}, [firebaseApp, firestore, auth, userAuthState])

	return (
		<FirebaseContext.Provider value={contextValue}>
			<FirebaseErrorListener />
			{children}
		</FirebaseContext.Provider>
	)
}

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
	const context = useContext(FirebaseContext)

	if (context === undefined) {
		throw new Error('useFirebase must be used within a FirebaseProvider.')
	}

	if (
		!context.areServicesAvailable ||
		!context.firebaseApp ||
		!context.firestore ||
		!context.auth
	) {
		throw new Error(
			'Firebase core services not available. Check FirebaseProvider props.',
		)
	}

	return {
		firebaseApp: context.firebaseApp,
		firestore: context.firestore,
		auth: context.auth,
		user: context.user,
		isUserLoading: context.isUserLoading,
		userError: context.userError,
	}
}

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
	const { auth } = useFirebase()
	return auth
}

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
	const { firestore } = useFirebase()
	return firestore
}

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
	const { firebaseApp } = useFirebase()
	return firebaseApp
}

type MemoFirebase<T> = T & { __memo?: boolean }

export function useMemoFirebase<T>(
	factory: () => T,
	deps: DependencyList,
): T | MemoFirebase<T> {
	const memoized = useMemo(factory, deps)

	if (typeof memoized !== 'object' || memoized === null) return memoized
	;(memoized as MemoFirebase<T>).__memo = true

	return memoized
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
	// Renamed from useAuthUser
	const { user, isUserLoading, userError } = useFirebase() // Leverages the main hook
	return { user, isUserLoading, userError }
}
