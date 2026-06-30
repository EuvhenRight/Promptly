'use client'

import { DocPagination } from '@/components/docs/doc-pagination'
import { DocsThemeWrapper } from '@/components/docs/docs-theme-wrapper'
import { DOCS_NAV_CONFIG, PanelLayout } from '@/components/panel'

export default function DocsLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<DocsThemeWrapper>
			<PanelLayout
				navConfig={DOCS_NAV_CONFIG}
				sidebarVisibleFrom='lg'
				mainClassName='bg-background px-3 py-4 sm:px-5 sm:py-6 lg:p-10'
			>
				{children}
				<DocPagination />
			</PanelLayout>
		</DocsThemeWrapper>
	)
}
