'use client'

import { Button } from '@/components/ui/button'
import { ADMIN_NAV_CONFIG, PanelLayout } from '@/components/panel'
import { useUser } from '@/firebase'
import { signOutUser } from '@/firebase/auth'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { user, isUserLoading } = useUser()
	const [authStatus, setAuthStatus] = useState<
		'loading' | 'admin' | 'guest' | 'no_claim'
	>('loading')
	const router = useRouter()

	useEffect(() => {
		if (isUserLoading) {
			setAuthStatus('loading')
			return
		}

		if (!user) {
			setAuthStatus('guest')
			router.replace('/')
			return
		}

		user
			.getIdTokenResult(true)
			.then(idTokenResult => {
				if (idTokenResult.claims.admin === true) {
					setAuthStatus('admin')
				} else {
					setAuthStatus('no_claim')
				}
			})
			.catch(() => {
				setAuthStatus('no_claim')
			})
	}, [user, isUserLoading, router])

	if (authStatus === 'loading') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	if (authStatus === 'no_claim') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background p-4'>
				<div className='text-center p-8 border rounded-lg shadow-lg max-w-md bg-card'>
					<h1 className='text-2xl font-bold text-destructive'>
						Access Denied
					</h1>
					<p className='mt-4 text-muted-foreground'>
						Your account does not have administrator privileges. The admin panel
						requires a special permission flag ('admin: true') which is not
						present in your current session.
					</p>
					<p className='mt-2 font-semibold text-foreground'>How to fix this:</p>
					<ul className='text-sm text-muted-foreground list-decimal list-inside text-left mt-2 space-y-1'>
						<li>
							Ensure an existing admin has run the 'set-admin.js' script for
							your User ID.
						</li>
						<li>
							Log out and log back in to refresh your authentication token with
							the new admin permission.
						</li>
					</ul>
					<Button
						onClick={async () => {
							await signOutUser()
							router.push('/')
						}}
						className='mt-6'
					>
						Log Out and Go to Homepage
					</Button>
				</div>
			</div>
		)
	}

	if (authStatus !== 'admin') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	return (
		<PanelLayout navConfig={ADMIN_NAV_CONFIG}>
			{children}
		</PanelLayout>
	)
}
