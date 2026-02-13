/** Map doc slug to filename in /docs. Used by server (docs pages) and client (sidebar links). */
export const DOC_SLUG_TO_FILE: Record<string, string> = {
	overview: '00-overview.md',
	architecture: '01-architecture.md',
	frontend: '02-frontend.md',
	backend: '03-backend.md',
	database: '04-database.md',
	'auth-security': '05-auth-security.md',
	api: '06-api.md',
	components: '07-components.md',
	deployment: '08-deployment.md',
	env: '09-env.md',
	'todo-refactor': '10-todo-refactor.md',
}

export function getDocFilename(slug: string): string | null {
	return DOC_SLUG_TO_FILE[slug] ?? null
}

export const DOC_SLUGS = Object.keys(DOC_SLUG_TO_FILE) as string[]

/** Ordered slugs for prev/next pagination (matches sidebar order, includes api-spec). */
export const DOC_ORDERED_SLUGS: string[] = [
	'overview',
	'architecture',
	'frontend',
	'backend',
	'database',
	'auth-security',
	'api',
	'api-spec',
	'components',
	'deployment',
	'env',
	'todo-refactor',
]
