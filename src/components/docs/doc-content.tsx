'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DOC_SLUG_TO_FILE } from '@/lib/docs-map'
import { MermaidDiagram } from './mermaid-diagram'
import type { Components } from 'react-markdown'

const mdComponents: Components = {
	code({ node, className, children, ...props }) {
		const match = /language-(\w+)/.exec(className ?? '')
		const code = String(children).replace(/\n$/, '')
		if (match?.[1] === 'mermaid') {
			return <MermaidDiagram code={code} />
		}
		return (
			<code className={className} {...props}>
				{children}
			</code>
		)
	},
	a({ href, children, ...props }) {
		if (href?.startsWith('http')) {
			return (
				<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
					{children}
				</a>
			)
		}
		// Internal doc links: 01-architecture.md or architecture -> /docs/architecture
		const clean = href?.replace(/\.md$/, '').replace(/^\d{2}-/, '')
		if (clean && DOC_SLUG_TO_FILE[clean]) {
			return (
				<Link href={`/docs/${clean}`} {...props}>
					{children}
				</Link>
			)
		}
		return (
			<a href={href ?? '#'} {...props}>
				{children}
			</a>
		)
	},
	table({ children, ...props }) {
		return (
			<div className="docs-table-wrapper">
				<table {...props}>{children}</table>
			</div>
		)
	},
}

export function DocContent({ content }: { content: string }) {
	return (
		<article className="max-w-none">
			<div className="docs-content">
				<ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
					{content}
				</ReactMarkdown>
			</div>
		</article>
	)
}
