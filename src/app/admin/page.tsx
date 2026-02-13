'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { Prompt, PromptComment, UserProfile } from '@/lib/types'
import { collection, collectionGroup, query } from 'firebase/firestore'
import { DollarSign, FileText, Loader2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

function StatCard({
	title,
	value,
	icon: Icon,
	isLoading,
}: {
	title: string
	value: string | number
	icon: React.ElementType
	isLoading: boolean
}) {
	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>{title}</CardTitle>
				<Icon className='h-4 w-4 text-muted-foreground' />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
				) : (
					<div className='text-2xl font-bold'>{value}</div>
				)}
			</CardContent>
		</Card>
	)
}

const chartConfig = {
	count: {
		label: 'Count',
		color: 'hsl(var(--primary))',
	},
} satisfies ChartConfig

export default function AdminDashboardPage() {
	const firestore = useFirestore()

	const usersQuery = useMemoFirebase(
		() => query(collection(firestore, 'users')),
		[firestore],
	)
	const { data: users, isLoading: usersLoading } =
		useCollection<UserProfile>(usersQuery)

	const promptsQuery = useMemoFirebase(
		() => query(collection(firestore, 'prompts')),
		[firestore],
	)
	const { data: prompts, isLoading: promptsLoading } =
		useCollection<Prompt>(promptsQuery)

	const commentsQuery = useMemoFirebase(
		() => query(collectionGroup(firestore, 'comments')),
		[firestore],
	)
	const { data: allComments, isLoading: commentsLoading } =
		useCollection<PromptComment>(commentsQuery)

	const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
	})

	useEffect(() => {
		if (allComments) {
			const counts = allComments.reduce(
				(acc, comment) => {
					const rating = Math.round(comment.rating)
					if (rating >= 1 && rating <= 5) {
						acc[rating] = (acc[rating] || 0) + 1
					}
					return acc
				},
				{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
			)
			setRatingCounts(counts)
		}
	}, [allComments])

	const chartData = useMemo(() => {
		return [
			{ rating: '5 Stars', count: ratingCounts[5] },
			{ rating: '4 Stars', count: ratingCounts[4] },
			{ rating: '3 Stars', count: ratingCounts[3] },
			{ rating: '2 Stars', count: ratingCounts[2] },
			{ rating: '1 Star', count: ratingCounts[1] },
		]
	}, [ratingCounts])

	// Note: Total Sales calculation would require querying 'orders' collection which is not implemented yet.
	// Using a placeholder for now.
	const totalSales = 'Not Implemented'

	return (
		<div className='min-w-0 space-y-4'>
			<div className='flex items-center'>
				<h1 className='font-headline text-2xl font-bold tracking-tight sm:text-3xl'>Dashboard</h1>
			</div>
			<div className='grid min-w-0 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7'>
				<Card className='min-w-0 lg:col-span-4'>
					<CardHeader>
						<CardTitle>Review Ratings</CardTitle>
						<CardDescription>
							A summary of all ratings given by users.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{commentsLoading ? (
							<div className='flex justify-center items-center h-48'>
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							</div>
						) : (
							<ChartContainer
								config={chartConfig}
								className='min-h-[240px] w-full max-w-full sm:min-h-[280px]'
							>
								<BarChart
									accessibilityLayer
									data={chartData}
									layout='vertical'
									margin={{
										left: 10,
									}}
								>
									<CartesianGrid horizontal={false} />
									<YAxis
										dataKey='rating'
										type='category'
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										className='text-sm'
									/>
									<XAxis dataKey='count' type='number' hide />
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator='dot' />}
									/>
									<Bar
										dataKey='count'
										fill='var(--color-count)'
										radius={4}
										barSize={24}
									/>
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
				<div className='min-w-0 space-y-4 lg:col-span-3'>
					<StatCard
						title='Total Users'
						value={users?.length ?? 0}
						icon={Users}
						isLoading={usersLoading}
					/>
					<StatCard
						title='Total Prompts'
						value={prompts?.length ?? 0}
						icon={FileText}
						isLoading={promptsLoading}
					/>
					<StatCard
						title='Total Sales'
						value={totalSales}
						icon={DollarSign}
						isLoading={false}
					/>
				</div>
			</div>
		</div>
	)
}
