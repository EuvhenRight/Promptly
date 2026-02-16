'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import Link from 'next/link'

export default function SubmitPromptCta() {
	return (
		<Card className='bg-primary text-primary-foreground'>
			<CardContent className='pt-6 text-center'>
				<div className='mx-auto h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4'>
					<Upload className='h-6 w-6' />
				</div>
				<h3 className='font-headline text-xl font-bold'>Got a great prompt?</h3>
				<p className='mt-2 text-sm text-primary-foreground/80'>
					Share your creativity with thousands of others and start earning today.
				</p>
				<Button variant='secondary' asChild className='mt-5 w-full'>
					<Link href='/submit'>Submit a prompt</Link>
				</Button>
			</CardContent>
		</Card>
	)
}
