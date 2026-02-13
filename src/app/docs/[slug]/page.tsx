import { DocContent } from '@/components/docs/doc-content'
import { getDocFilename } from '@/lib/docs-map'
import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'path'

export default async function DocPage({
	params,
}: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const filename = getDocFilename(slug)
	if (!filename) notFound()
	const filepath = path.join(process.cwd(), 'docs', filename)
	const content = await readFile(filepath, 'utf-8').catch(() => null)
	if (content === null) notFound()
	return <DocContent content={content} />
}
