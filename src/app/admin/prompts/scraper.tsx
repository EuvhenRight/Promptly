'use client'

import { useState } from 'react'
import { scrapeAndAutoCreate } from './actions'
import { useToast } from '@/hooks/use-toast'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useUser } from '@/firebase'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ScrapeResults = {
	successCount: number
	errorCount: number
	errors: { url: string; reason: string }[]
}

export function Scraper() {
	const { toast } = useToast()
	const { user } = useUser()
	const [urls, setUrls] = useState('')
	const [isScraping, setIsScraping] = useState(false)
	const [results, setResults] = useState<ScrapeResults | null>(null)

	const handleScrape = async () => {
		const urlList = urls
			.split('\n')
			.map(u => u.trim())
			.filter(Boolean)
		if (urlList.length === 0) {
			toast({
				variant: 'destructive',
				title: 'URL(s) Required',
				description: 'Please enter at least one URL to scrape.',
			})
			return
		}
		if (!user) {
			toast({
				variant: 'destructive',
				title: 'Not signed in',
				description: 'You must be signed in to perform this action.',
			})
			return
		}

		setIsScraping(true)
		setResults(null)

		const scrapeResults = await scrapeAndAutoCreate(urlList, user.uid)

		setResults(scrapeResults)
		toast({
			title: 'Auto-Creation Complete',
			description: `${scrapeResults.successCount} prompts created. ${
				scrapeResults.errorCount > 0 ? `${scrapeResults.errorCount} failed.` : ''
			}`,
		})

		setIsScraping(false)
	}

	const urlCount = urls
		.split('\n')
		.map(u => u.trim())
		.filter(Boolean).length

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Bulk Scrape & Auto-Create</CardTitle>
					<CardDescription>
						Paste multiple PromptHero URLs (one per line). The system will scrape
						them, randomly fill in the remaining data, and create the prompts
						automatically.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid w-full gap-2'>
						<Textarea
							placeholder='https://prompthero.com/prompt/...\nhttps://prompthero.com/prompt/...'
							value={urls}
							onChange={e => setUrls(e.target.value)}
							disabled={isScraping}
							rows={5}
						/>
						<Button
							onClick={handleScrape}
							disabled={isScraping || urlCount === 0}
						>
							{isScraping ? (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							) : null}
							{isScraping
								? `Processing ${urlCount} URL(s)...`
								: `Scrape & Create ${urlCount > 0 ? urlCount : ''} Prompt(s)`}
						</Button>
					</div>
				</CardContent>
			</Card>

			{results && (
				<Card className='mt-6'>
					<CardHeader>
						<CardTitle>Scraping Results</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Alert
							variant='default'
							className='bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800'
						>
							<CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
							<AlertDescription className='text-green-800 dark:text-green-300'>
								Successfully created {results.successCount} prompts.
							</AlertDescription>
						</Alert>

						{results.errorCount > 0 && (
							<Alert variant='destructive'>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription>
									<p className='font-bold mb-2'>
										{results.errorCount} prompts failed:
									</p>
									<ul className='list-disc pl-5 space-y-1 text-xs'>
										{results.errors.map((item, index) => (
											<li key={index}>
												<strong
													className='block truncate max-w-sm'
													title={item.url}
												>
													{item.url}
												</strong>
												<span>Reason: {item.reason}</span>
											</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			)}
		</>
	)
}
