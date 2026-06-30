'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {
	BarChart3,
	BookOpen,
	Calendar,
	CheckCircle2,
	Circle,
	FileText,
	Target,
	TrendingUp,
	Users,
} from 'lucide-react'

/** Метрики — оновлюйте по мірі просування. */
const METRICS = {
	prompts: { current: 0, target: 300, label: 'Промпти' },
	creators: { current: 0, target: 30, label: 'Креатори' },
	users: { current: 0, target: 500, label: 'Користувачі' },
	mrr: { current: 0, target: 500, label: 'MRR (€)' },
	geoPages: { current: 0, target: 15, label: 'GEO-сторінки' },
	geoArticles: { current: 0, target: 15, label: 'GEO-статті' },
}

/** 90-денний план запуску. */
const PLAN_90_DAYS = [
	{
		id: 'd1-30',
		name: 'Дні 1–30: Посів',
		done: 0,
		total: 5,
		tasks: [
			'50 авторів, 200 топових промптів',
			'30 «героїчних» промптів (складні ланцюжки)',
			'0% комісії бета-авторам, баунті $10–20',
			'20–30 внутрішніх промптів (маркетинг, дизайн)',
			'Контроль якості: 50→100→50 промптів/тиждень',
		],
	},
	{
		id: 'd31-60',
		name: 'Дні 31–60: Сигнал',
		done: 0,
		total: 3,
		tasks: [
			'10 GEO-статей (Q&A, answer capsules, Schema.org)',
			'Запуск безкоштовної бета Playground',
			'Перші 5–10 продажів через Twitter/Reddit',
		],
	},
	{
		id: 'd61-90',
		name: 'Дні 61–90: Масштаб',
		done: 0,
		total: 3,
		tasks: [
			'Stripe, Pro-плани з API',
			'Реферальна петля «Приведи друга — $5»',
			'100+ клієнтів',
		],
	},
]

/** Дорожня карта по фазах (Tier 1/2/3). */
const ROADMAP_TIERS = [
	{
		id: 'tier1',
		name: 'Tier 1 — Виживання',
		done: 0,
		total: 6,
		tasks: [
			'200–300 промптів вручну',
			'30 креаторів (персональний outreach)',
			'10–15 landing/GEO-сторінок',
			'15 GEO-статей',
			'Empty State + Instant Demo',
			'Discord з першого дня',
		],
	},
	{
		id: 'tier2',
		name: 'Tier 2 — Перший цикл росту',
		done: 0,
		total: 5,
		tasks: [
			'Leaderboard креаторів',
			'Bundles (Prompt Packs)',
			'Кейс-стаді',
			'Referral credits',
			'Ratings, «Refine this prompt»',
		],
	},
	{
		id: 'tier3',
		name: 'Tier 3 — Після PMF',
		done: 0,
		total: 4,
		tasks: [
			'B2B, API, університети',
			'Платна реклама',
			'Enterprise (SSO, team plans)',
			'White-label для освіти',
		],
	},
]

/** Топ-8 дій на 4 тижні. */
const TOP_8_ACTIONS = [
	'Empty State + Try Promptly Now',
	'Generate на сторінках промптів',
	'50+ seed-промптів',
	'Discord + outreach 20 креаторів',
	'5 GEO-сторінок (answer capsules!)',
	'Credits teaser + onboarding',
	'Submit форма з AI-допомогою',
	'Dashboard + PMF Radar',
]

export default function DashboardPage() {
	const allPhases = [...PLAN_90_DAYS, ...ROADMAP_TIERS]
	const totalDone = allPhases.reduce((s, p) => s + p.done, 0)
	const totalTasks = allPhases.reduce((s, p) => s + p.total, 0)
	const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-headline text-3xl font-bold tracking-tight">Дашборд планів</h1>
				<p className="mt-1 text-muted-foreground">
					Відстежуйте прогрес по 90-денному плану та дорожній карті. Оновлюйте метрики в міру просування.
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Link href="/docs/strategy-2026">
						<Badge variant="secondary" className="cursor-pointer gap-1 py-1.5 hover:bg-secondary/80">
							<FileText className="h-3.5 w-3.5" />
							Стратегія 2026
						</Badge>
					</Link>
					<Link href="/docs/team-plan">
						<Badge variant="secondary" className="cursor-pointer gap-1 py-1.5 hover:bg-secondary/80">
							<Users className="h-3.5 w-3.5" />
							Повний план команди
						</Badge>
					</Link>
				</div>
			</div>

			{/* Metrics */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<BarChart3 className="h-5 w-5" />
						Ключові метрики
					</CardTitle>
					<CardDescription>
						Поточні vs цільові значення. Оновлюйте у вихідному файлі в міру просування.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
						{Object.entries(METRICS).map(([key, m]) => {
							const pct = m.target > 0 ? Math.min(100, (m.current / m.target) * 100) : 0
							return (
								<div key={key} className="rounded-lg border bg-muted/30 p-4">
									<p className="text-sm font-medium text-muted-foreground">{m.label}</p>
									<p className="mt-1 text-2xl font-bold">
										{m.current}
										<span className="text-sm font-normal text-muted-foreground">
											{' '}
											/ {m.target}
										</span>
									</p>
									<Progress value={pct} className="mt-2 h-2" />
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Top 8 actions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Target className="h-5 w-5" />
						Топ-8 дій на 4 тижні
					</CardTitle>
					<CardDescription>
						Пріоритетні кроки для швидкого запуску
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="grid gap-2 sm:grid-cols-2">
						{TOP_8_ACTIONS.map((action, i) => (
							<li key={i} className="flex items-center gap-2">
								<Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								{action}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			{/* Overall progress */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Target className="h-5 w-5" />
						Загальний прогрес
					</CardTitle>
					<CardDescription>
						{totalDone} з {totalTasks} пунктів дорожньої карти
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Progress value={progressPct} className="h-3" />
					<p className="mt-2 text-sm text-muted-foreground">
						Оновлюйте поле <code className="rounded bg-muted px-1 py-0.5">done</code> в кожному етапі (у вихідному коді) по мірі виконання.
					</p>
				</CardContent>
			</Card>

			{/* 90-day plan */}
			<div>
				<h2 className="mb-4 font-headline text-xl font-semibold">90-денний план запуску</h2>
				<div className="grid gap-4 lg:grid-cols-3">
					{PLAN_90_DAYS.map((phase) => {
						const phasePct = phase.total > 0 ? (phase.done / phase.total) * 100 : 0
						return (
							<Card key={phase.id}>
								<CardHeader className="pb-2">
									<CardTitle className="text-base">{phase.name}</CardTitle>
									<CardDescription className="flex items-center gap-1">
										<Calendar className="h-3.5 w-3.5" />
										{phase.done}/{phase.total} виконано
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<Progress value={phasePct} className="h-2" />
									<ul className="space-y-1.5 text-sm">
										{phase.tasks.map((task, i) => (
											<li key={i} className="flex items-center gap-2">
												{i < phase.done ? (
													<CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
												) : (
													<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
												)}
												{task}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>

			{/* Roadmap tiers */}
			<div>
				<h2 className="mb-4 font-headline text-xl font-semibold">Дорожня карта (Tier 1–3)</h2>
				<div className="grid gap-4 lg:grid-cols-3">
					{ROADMAP_TIERS.map((tier) => {
						const tierPct = tier.total > 0 ? (tier.done / tier.total) * 100 : 0
						return (
							<Card key={tier.id}>
								<CardHeader className="pb-2">
									<CardTitle className="text-base">{tier.name}</CardTitle>
									<CardDescription className="flex items-center gap-1">
										<Calendar className="h-3.5 w-3.5" />
										{tier.done}/{tier.total} виконано
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<Progress value={tierPct} className="h-2" />
									<ul className="space-y-1.5 text-sm">
										{tier.tasks.map((task, i) => (
											<li key={i} className="flex items-center gap-2">
												{i < tier.done ? (
													<CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
												) : (
													<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
												)}
												{task}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>

			{/* PMF Radar reminder */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<TrendingUp className="h-5 w-5" />
						PMF Radar — 5 сегментів
					</CardTitle>
					<CardDescription>
						UX / Positioning / Trust / Supply / Pricing — визначайте weakest segment щотижня
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Дивіться <Link href="/docs/team-plan" className="text-primary underline">Повний план команди</Link> для деталей по PMF Validation System та розподілу ролей.
					</p>
				</CardContent>
			</Card>

			{/* Weekly sync */}
			<Card className="border-primary/20 bg-primary/5">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<BookOpen className="h-5 w-5" />
						Щотижневий синк (понеділок, 30 хв)
					</CardTitle>
					<CardDescription>
						1. Dashboard → 2. PMF Radar (weakest?) → 3. Phase 0 чекліст → 4. 1–2 експерименти → 5. Блокування
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm font-medium">
						Правило: Тиждень без progress на supply = червоний прапор.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
