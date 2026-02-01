// Firebase App Hosting injects FIREBASE_WEBAPP_CONFIG; use as fallback when NEXT_PUBLIC_* not set
function getConfigFromWebappConfig() {
	const raw = process.env.FIREBASE_WEBAPP_CONFIG
	if (!raw) return null
	try {
		return JSON.parse(raw) as {
			apiKey?: string
			authDomain?: string
			projectId?: string
			messagingSenderId?: string
			appId?: string
			storageBucket?: string
		}
	} catch {
		return null
	}
}

const webappConfig = getConfigFromWebappConfig()

export const firebaseConfig = {
	apiKey:
		process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? webappConfig?.apiKey ?? '',
	authDomain:
		process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
		webappConfig?.authDomain ??
		'',
	projectId:
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
		webappConfig?.projectId ??
		'',
	messagingSenderId:
		process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
		webappConfig?.messagingSenderId ??
		'',
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? webappConfig?.appId ?? '',
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
	storageBucket:
		process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
		webappConfig?.storageBucket ??
		'',
}
