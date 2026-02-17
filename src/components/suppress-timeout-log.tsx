'use client';

import { messageForLog } from '@/lib/error-log';
import { useEffect } from 'react';

function isTimeoutOrAbort(err: unknown): boolean {
	if (err instanceof Error) {
		const code = (err as Error & { code?: number }).code;
		if (code === 23) return true;
		if (err.name === 'TimeoutError' || err.name === 'AbortError') return true;
	}
	return false;
}

/**
 * Suppresses TimeoutError/AbortError dumps in the console (client only).
 * - Wraps console.error so any TimeoutError is logged as a short message.
 * - Handles unhandledrejection so promise timeouts don't dump the full object.
 */
export function SuppressTimeoutLog() {
	useEffect(() => {
		const orig = console.error;
		console.error = (...args: unknown[]) => {
			const first = args[0];
			if (isTimeoutOrAbort(first)) {
				orig('Error:', messageForLog(first));
				return;
			}
			// If first arg is an Error-like object with code 23 (e.g. serialized from server)
			if (first && typeof first === 'object' && 'code' in first && (first as { code?: number }).code === 23) {
				orig('Error: Request timed out or was aborted. Check Firebase project and network.');
				return;
			}
			orig.apply(console, args);
		};

		const handle = (event: PromiseRejectionEvent) => {
			if (isTimeoutOrAbort(event.reason)) {
				orig('Unhandled rejection:', messageForLog(event.reason));
				event.preventDefault();
			}
		};
		window.addEventListener('unhandledrejection', handle);

		return () => {
			console.error = orig;
			window.removeEventListener('unhandledrejection', handle);
		};
	}, []);
	return null;
}
