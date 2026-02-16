'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
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
import { TopSellersTable, type TopSeller } from './top-sellers-table'

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

type Period = '1d' | '7d' | '30d' | 'all'

type Stats = {
	totalRevenue: number
	platformEarnings: number
	totalSalesCount: number
	promptSalesCount: number
}

type RevenueChartItem = {
	date: string // ISO string or format like 'YYYY-MM-DD HH:00'
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
    const [period, setPeriod] = useState<Period>('30d')
	const [sales, setSales] = useState<EnrichedSaleRecord[]>([])
	const [stats, setStats] = useState<Stats | null>(null)
	const [revenueChartData, setRevenueChartData] = useState<RevenueChartItem[]>([])
	const [topSellers, setTopSellers] = useState<TopSeller[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setLoading(true)
		setError(null)
		fetch(`/api/admin/sales?period=${period}`)
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
				setRevenueChartData(data.revenueChartData || [])
				// Top sellers are always all-time, so we only set them once
                if (topSellers.length === 0) {
				    setTopSellers(data.topSellers || [])
                }
			})
			.catch(err => {
				setError(err.message)
				console.error(err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [period, topSellers.length]) // Re-fetch when period changes

    const chartTickFormatter = (value: string) => {
        if (period === '1d') {
            return format(new Date(value), 'HH:00');
        }
        if (period === 'all') {
            return format(new Date(value), 'MMM yyyy');
        }
        return format(new Date(value), 'MMM d');
    };

	return (
		<div className='space-y-6'>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			    <h1 className='text-lg font-semibold md:text-2xl'>Sales Dashboard</h1>
                <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="1d">24H</TabsTrigger>
                        <TabsTrigger value="7d">7D</TabsTrigger>
                        <TabsTrigger value="30d">30D</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
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

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className='flex justify-center items-center h-72'>
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							</div>
						) : revenueChartData.length === 0 ? (
							<p className='text-muted-foreground text-center py-8'>
								No revenue data for this period.
							</p>
						) : (
							<ChartContainer config={chartConfig} className='min-h-[280px] w-full'>
								<BarChart accessibilityLayer data={revenueChartData} margin={{ top: 20 }}>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey='date'
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										tickFormatter={chartTickFormatter}
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
						<CardTitle>Top Sellers (All Time)</CardTitle>
						<CardDescription>
							Ranking by earnings from prompt sales.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{loading && topSellers.length === 0 ? ( // Show loader only on initial load
							<div className='flex justify-center py-8'>
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							</div>
						) : error ? (
							<p className='text-destructive'>Error: {error}</p>
						) : (
							<TopSellersTable sellers={topSellers} />
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Sales</CardTitle>
					<CardDescription>
						A list of the most recent transactions for the selected period.
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
