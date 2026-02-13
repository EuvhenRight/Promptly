'use client'

import mermaid from 'mermaid'
import { useTheme } from 'next-themes'
import { useEffect, useId, useRef, useState } from 'react'

let lastInitializedTheme: string | null = null
let renderQueue: Promise<unknown> = Promise.resolve()

function initMermaidOnce(theme: 'dark' | 'neutral') {
	if (lastInitializedTheme === theme) return
	lastInitializedTheme = theme
	mermaid.initialize({
		startOnLoad: false,
		theme,
		securityLevel: 'loose',
		flowchart: {
			htmlLabels: true,
			padding: 36,
			diagramPadding: 24,
			nodeSpacing: 50,
			rankSpacing: 50,
		},
	})
}

export function MermaidDiagram({ code }: { code: string }) {
	const id = useId().replace(/:/g, '')
	const ref = useRef<HTMLDivElement>(null)
	const [error, setError] = useState<string | null>(null)
	const [svg, setSvg] = useState<string | null>(null)
	const { resolvedTheme } = useTheme()

	useEffect(() => {
		if (!code.trim()) return
		if (!resolvedTheme) return
		const theme = resolvedTheme === 'dark' ? 'dark' : 'neutral'
		setError(null)
		setSvg(null)
		initMermaidOnce(theme)
		const renderId = `mermaid-${id}-${Math.random().toString(36).slice(2, 9)}`
		renderQueue = renderQueue
			.then(() => mermaid.render(renderId, code))
			.then(({ svg: result }) => {
				if (result) setSvg(result)
			})
			.catch((err) => {
				setError(err?.message ?? 'Mermaid render failed')
			})
	}, [code, id, resolvedTheme])

	if (error) {
		return (
			<pre className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
				{error}
			</pre>
		)
	}
	if (svg) {
		return (
			<div
				ref={ref}
				className="docs-mermaid-wrapper my-4 flex justify-center rounded-lg border border-border bg-muted/30 p-4 overflow-visible"
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
		)
	}
	return (
		<div ref={ref} className="docs-mermaid-wrapper my-4 flex justify-center rounded-lg border border-border bg-muted/30 p-8 overflow-visible">
			<span className="text-muted-foreground">Завантаження діаграми…</span>
		</div>
	)
}
