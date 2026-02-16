'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	CircleDollarSign,
	CreditCard,
	Loader2,
	Package,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SalesTable, type EnrichedSaleRecord } from './sales-table'
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

// Reusable StatCard component
function StatCard({
	title,
	value,
	icon: Icon,
	isLoading,
	format = 'number',
}: {
	title: string
	value: string | number
	icon: React.ElementType
	isLoading: boolean
	format?: 'number' | 'currency'
}) {
	const formattedValue = useMemo(() => {
		if (typeof value !== 'number') return value
		if (format === 'currency') {
			return new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(value)
		}
		return value.toLocaleString()
	}, [value, format])

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
					<div className='text-2xl font-bold'>{formattedValue}</div>
				)}
			</CardContent>
		</Card>
	)
}

type Stats = {
	totalRevenue: number
	platformEarnings: number
	totalSalesCount: number
	promptSalesCount: number
}

type DailyRevenue = {
	date: string
	Revenue: number
}

const chartConfig = {
	Revenue: {
		label: 'Revenue',
		color: 'hsl(var(--primary))',
	},
} satisfies ChartConfig

// Main Page Component
export default function AdminSalesPage() {
	const [sales, setSales] = useState<EnrichedSaleRecord[]>([])
	const [stats, setStats] = useState<Stats | null>(null)
	const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setLoading(true)
		setError(null)
		fetch('/api/admin/sales')
			.then(res => {
				if (!res.ok) {
					throw new Error('Failed to fetch sales data')
				}
				return res.json()
			})
			.then(data => {
				setStats(data.stats)
				const salesWithDates = data.sales.map((sale: any) => ({
					...sale,
					createdAt: new Date(sale.createdAt),
				}))
				setSales(salesWithDates)
				setDailyRevenue(data.dailyRevenue || [])
			})
			.catch(err => {
				setError(err.message)
				console.error(err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	return (
		<div className='space-y-6'>
			<h1 className='text-lg font-semibold md:text-2xl'>Sales Dashboard</h1>
			<div className='grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4'>
				<StatCard
					title='Total Revenue'
					value={stats?.totalRevenue ?? 0}
					icon={CircleDollarSign}
					isLoading={loading}
					format='currency'
				/>
				<StatCard
					title='Platform Earnings'
					value={stats?.platformEarnings ?? 0}
					icon={CreditCard}
					isLoading={loading}
					format='currency'
				/>
				<StatCard
					title='Total Sales'
					value={stats?.totalSalesCount ?? 0}
					icon={Package}
					isLoading={loading}
				/>
				<StatCard
					title='Prompts Sold'
					value={stats?.promptSalesCount ?? 0}
					icon={Package}
					isLoading={loading}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Revenue Last 30 Days</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex justify-center items-center h-72'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : dailyRevenue.length === 0 ? (
						<p className='text-muted-foreground text-center py-8'>
							No revenue data for the last 30 days.
						</p>
					) : (
						<ChartContainer config={chartConfig} className='min-h-[280px] w-full'>
							<BarChart accessibilityLayer data={dailyRevenue} margin={{ top: 20 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey='date'
									tickLine={false}
									tickMargin={10}
									axisLine={false}
									tickFormatter={value => format(new Date(value), 'MMM d')}
								/>
								<YAxis
									tickFormatter={value => `€${value}`}
									tickLine={false}
									axisLine={false}
									width={40}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											formatter={value => `€${(value as number).toFixed(2)}`}
											indicator='dot'
										/>
									}
								/>
								<Bar dataKey='Revenue' fill='var(--color-Revenue)' radius={4} />
							</BarChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recent Sales</CardTitle>
					<CardDescription>
						A list of the most recent transactions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : error ? (
						<p className='text-destructive'>Error: {error}</p>
					) : (
						<SalesTable sales={sales} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
