'use client'

import { signInWithGoogle } from '@/firebase/auth'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function AuthModal({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md text-center p-8'>
				<DialogHeader className='space-y-4'>
					<DialogTitle className='font-headline text-3xl font-bold tracking-tight text-center'>
						Unlock Millions of Prompts
					</DialogTitle>
					<DialogDescription className='text-center text-lg text-muted-foreground'>
						Sign in to continue exploring and creating.
					</DialogDescription>
				</DialogHeader>
				<div className='py-6'>
					<Button
						size='lg'
						className='w-full'
						onClick={() => signInWithGoogle()}
					>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
							className='mr-3'
						>
							<path
								d='M22.56 12.25C22.56 11.42 22.49 10.61 22.34 9.82H12V14.45H18.47C18.18 16.02 17.34 17.35 16.08 18.22V20.75H19.95C21.66 19.01 22.56 16.25 22.56 12.25Z'
								fill='#4285F4'
							/>
							<path
								d='M12 23C14.97 23 17.45 22.09 19.13 20.43L15.25 17.9C14.2 18.59 12.89 19 11.2 19C8.36 19 5.92 17.27 5.09 14.85H1.08V17.4C2.76 20.69 6.2 23 12 23Z'
								fill='#34A853'
							/>
							<path
								d='M5.09 14.85C4.89 14.25 4.78 13.62 4.78 12.98C4.78 12.35 4.89 11.71 5.09 11.12V8.58H1.08C0.38 9.94 0 11.4 0 12.98C0 14.57 0.38 16.03 1.08 17.4L5.09 14.85Z'
								fill='#FBBC05'
							/>
							<path
								d='M12 4.98C13.68 4.98 15.08 5.58 16.14 6.6L19.21 3.54C17.45 1.93 14.97 1 12 1C6.2 1 2.76 4.31 1.08 8.58L5.09 11.12C5.92 8.73 8.36 6.98 12 6.98'
								fill='#EA4335'
							/>
						</svg>
						Sign in with Google
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
