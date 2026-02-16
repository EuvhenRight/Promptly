'use client'

import { useState } from 'react'
import Link from 'next/link'
import { scrapePromptHero } from './actions'
import type { ScrapeResult } from '@/lib/types'
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
import { Loader2, AlertTriangle, Edit } from 'lucide-react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import Image from 'next/image'

type ScrapedPrompt = ScrapeResult & {
	status: 'success'
}

type ScrapeError = {
	url: string
	error: string
	status: 'error'
}

type ScrapeItem = ScrapedPrompt | ScrapeError

export function Scraper() {
	const { toast } = useToast()
	const [urls, setUrls] = useState('')
	const [isScraping, setIsScraping] = useState(false)
	const [results, setResults] = useState<ScrapeItem[]>([])

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

		setIsScraping(true)
		setResults([])
		const scrapePromises = urlList.map(
			async (url): Promise<ScrapeItem> => {
				try {
					const result = await scrapePromptHero(url)
					if ('error' in result) {
						if (result.duplicate) {
							return {
								url,
								error: 'Duplicate: This prompt has already been imported.',
								status: 'error',
							}
						}
						throw new Error(result.error)
					}
					return { ...result, status: 'success' }
				} catch (error: any) {
					return { url, error: error.message, status: 'error' }
				}
			},
		)

		const settledResults = await Promise.all(scrapePromises)
		setResults(settledResults)

		const successCount = settledResults.filter(
			r => r.status === 'success',
		).length
		const errorCount = settledResults.length - successCount

		toast({
			title: 'Scraping Complete',
			description: `${successCount} prompts scraped successfully. ${
				errorCount > 0 ? `${errorCount} failed.` : ''
			}`,
		})

		setIsScraping(false)
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Bulk Scrape from URL</CardTitle>
					<CardDescription>
						Paste multiple PromptHero URLs (one per line) to scrape them in
						bulk.
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
						<Button onClick={handleScrape} disabled={isScraping}>
							{isScraping ? (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							) : null}
							{`Scrape ${
								urls
									.split('\n')
									.map(u => u.trim())
									.filter(Boolean).length || ''
							} URL(s)`}
						</Button>
					</div>
				</CardContent>
			</Card>

			{results.length > 0 && (
				<Card className='mt-6'>
					<CardHeader>
						<CardTitle>Scraped Results</CardTitle>
						<CardDescription>
							Review the scraped prompts below and click "Edit & Create" to
							finalize them.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[100px]'>Image</TableHead>
									<TableHead>Details</TableHead>
									<TableHead className='text-right w-[150px]'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{results.map((item, index) => {
									if (item.status === 'error') {
										return (
											<TableRow
												key={`error-${index}`}
												className='bg-destructive/10'
											>
												<TableCell>
													<div className='w-16 h-16 bg-muted rounded-md flex items-center justify-center'>
														<AlertTriangle className='h-6 w-6 text-destructive' />
													</div>
												</TableCell>
												<TableCell>
													<p className='font-semibold text-destructive'>
														Scrape Failed
													</p>
													<p
														className='text-xs text-destructive/80 truncate'
														title={item.url}
													>
														{item.url}
													</p>
													<p className='text-sm mt-1'>{item.error}</p>
												</TableCell>
												<TableCell className='text-right'>-</TableCell>
											</TableRow>
										)
									}
									const queryParams = new URLSearchParams(
										item as ScrapeResult,
									).toString()
									return (
										<TableRow key={item.sourceId}>
											<TableCell>
												<Image
													src={item.imageUrl}
													alt={item.title}
													width={80}
													height={80}
													className='rounded-md object-cover w-16 h-16'
												/>
											</TableCell>
											<TableCell>
												<p className='font-semibold truncate' title={item.title}>
													{item.title}
												</p>
												<p
													className='text-xs text-muted-foreground line-clamp-2'
													title={item.privateContent}
												>
													{item.privateContent}
												</p>
											</TableCell>
											<TableCell className='text-right'>
												<Button asChild variant='outline'>
													<Link href={`/admin/prompts/new?${queryParams}`}>
														<Edit className='mr-2 h-4 w-4' /> Edit & Create
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</>
	)
}
