'use client'

import { useEffect, useState } from 'react'

/**
 * Embeds Swagger UI via iframe (static /swagger.html) so that the app's React tree
 * does not include swagger-ui-react, avoiding UNSAFE_componentWillReceiveProps
 * warnings from ModelCollapse and other legacy lifecycle code inside Swagger UI.
 */
export function SwaggerUIWrapper() {
	const [baseUrl, setBaseUrl] = useState('')

	useEffect(() => {
		setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
	}, [])

	if (!baseUrl) {
		return (
			<div className="flex h-64 items-center justify-center text-muted-foreground">
				Завантаження API документації…
			</div>
		)
	}

	return (
		<iframe
			title="Promptly API — Swagger UI"
			src={`${baseUrl}/swagger.html`}
			className="h-full min-h-[80vh] w-full rounded-md border border-border"
		/>
	)
}
