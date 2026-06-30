import { DocContent } from '@/components/docs/doc-content'
import { getDocFilename } from '@/lib/docs-map'
import { readFile } from 'fs/promises'
import path from 'path'

export default async function DocsOverviewPage() {
	const filename = getDocFilename('overview')
	const filepath = path.join(process.cwd(), 'docs', filename ?? '00-overview.md')
	const content = await readFile(filepath, 'utf-8').catch(() => '# Документація\n\nФайл не знайдено.')
	return <DocContent content={content} />
}
