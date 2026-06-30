'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Wraps docs layout: theme + body scroll lock. Renders children (e.g. PanelLayout).
 */
export function DocsThemeWrapper({ children }: { children: React.ReactNode }) {
	const { resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	useEffect(() => {
		const html = document.documentElement
		const body = document.body
		html.classList.add('docs-route')
		body.classList.add('docs-route')
		return () => {
			html.classList.remove('docs-route')
			body.classList.remove('docs-route')
		}
	}, [])

	const wrapperClass = cn(
		'docs-wrapper flex h-screen flex-col overflow-hidden bg-background',
		mounted && resolvedTheme === 'dark' && 'dark',
	)

	return (
		<div className={wrapperClass}>
			<div className='flex min-h-0 flex-1 flex-col overflow-hidden size-full'>
				{children}
			</div>
		</div>
	)
}
