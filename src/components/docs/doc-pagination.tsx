'use client'

import React from 'react'
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import { DOC_ORDERED_SLUGS } from '@/lib/docs-map'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const TOTAL = DOC_ORDERED_SLUGS.length

function getCurrentIndex(pathname: string): number {
	if (pathname === '/docs' || pathname === '/docs/overview') return 0
	const slug = pathname.replace(/^\/docs\/?/, '') || 'overview'
	const i = DOC_ORDERED_SLUGS.indexOf(slug)
	return i >= 0 ? i : 0
}

export function DocPagination() {
	const pathname = usePathname()
	const router = useRouter()
	const currentIndex = getCurrentIndex(pathname)
	const currentPage = currentIndex + 1
	const prevSlug = currentIndex > 0 ? DOC_ORDERED_SLUGS[currentIndex - 1] : null
	const nextSlug =
		currentIndex < TOTAL - 1 ? DOC_ORDERED_SLUGS[currentIndex + 1] : null
	const prevHref = prevSlug ? `/docs/${prevSlug}` : ''
	const nextHref = nextSlug ? `/docs/${nextSlug}` : ''

	// Page numbers: show first, last, and window around current (e.g. 2 pages each side)
	const showPages = (() => {
		const window = 2
		const left = Math.max(1, currentPage - window)
		const right = Math.min(TOTAL, currentPage + window)
		const set = new Set<number>([1, TOTAL])
		for (let p = left; p <= right; p++) set.add(p)
		return Array.from(set).sort((a, b) => a - b)
	})()

	return (
		<nav className='mt-10 border-t border-border pt-6' aria-label='Doc pagination'>
			<Pagination className='overflow-x-auto'>
				<PaginationContent className='flex-wrap justify-center gap-1 sm:flex-nowrap sm:gap-1'>
					<PaginationItem className='shrink-0'>
						{prevSlug ? (
							<PaginationPrevious
								onClick={() => router.push(prevHref, { scroll: false })}
								className='cursor-pointer min-w-0 px-2 text-xs sm:px-2.5 sm:text-sm'
							/>
						) : (
							<PaginationPrevious className='pointer-events-none opacity-50 min-w-0 px-2 text-xs sm:px-2.5 sm:text-sm' />
						)}
					</PaginationItem>
					{/* Page numbers: hidden on small screens so only Prev/Next fit */}
					{showPages.map((page, i) => {
						const needEllipsisBefore = i > 0 && showPages[i]! - showPages[i - 1]! > 1
						const slug = DOC_ORDERED_SLUGS[page - 1]!
						const href = `/docs/${slug}`
						return (
							<React.Fragment key={page}>
								{needEllipsisBefore && (
									<PaginationItem className='hidden sm:list-item'>
										<PaginationEllipsis />
									</PaginationItem>
								)}
								<PaginationItem className='hidden sm:list-item'>
									<PaginationLink asChild isActive={page === currentPage}>
										<Link href={href} scroll={false}>
											{page}
										</Link>
									</PaginationLink>
								</PaginationItem>
							</React.Fragment>
						)
					})}
					<PaginationItem className='shrink-0'>
						{nextSlug ? (
							<PaginationNext
								onClick={() => router.push(nextHref, { scroll: false })}
								className='cursor-pointer min-w-0 px-2 text-xs sm:px-2.5 sm:text-sm'
							/>
						) : (
							<PaginationNext className='pointer-events-none opacity-50 min-w-0 px-2 text-xs sm:px-2.5 sm:text-sm' />
						)}
					</PaginationItem>
				</PaginationContent>
			</Pagination>
			{/* Mobile: current page indicator */}
			<p className='mt-2 text-center text-xs text-muted-foreground sm:hidden' aria-hidden>
				{currentPage} / {TOTAL}
			</p>
		</nav>
	)
}
