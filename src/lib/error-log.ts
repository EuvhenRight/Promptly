/**
 * Returns a short, readable message for logging. Avoids dumping full DOM/timeout
 * error objects (e.g. TimeoutError with code 23) which flood the console.
 */
export function messageForLog(err: unknown): string {
	if (err == null) return 'Unknown error'
	if (typeof err === 'string') return err
	if (err instanceof Error) {
		// TimeoutError / AbortError from fetch or Firebase SDK (code 23 = TIMEOUT_ERR)
		const code = (err as Error & { code?: number }).code
		if (code === 23 || err.name === 'TimeoutError' || err.name === 'AbortError') {
			return 'Request timed out or was aborted. Check Firebase project and network.'
		}
		return err.message || err.name || 'Error'
	}
	return String(err)
}
