/**
 * Runs once when the Next.js server starts. Sanitizes noisy error output so the
 * terminal stays readable (TimeoutError dumps, upstream image 504).
 */

function sanitizeError(arg: unknown): string | null {
  if (arg instanceof Error) {
    const code = (arg as Error & { code?: number }).code;
    if (code === 23 || arg.name === 'TimeoutError' || arg.name === 'AbortError') {
      return 'Request timed out or was aborted. Check Firebase project and network.';
    }
    if ('statusCode' in arg && (arg as { statusCode?: number }).statusCode === 504) {
      return 'Upstream image response timed out (504).';
    }
  }
  if (arg && typeof arg === 'object' && 'code' in arg && (arg as { code?: number }).code === 23) {
    return 'Request timed out or was aborted.';
  }
  return null;
}

/** Detect if a string is the TimeoutError/504 dump we want to shorten */
function isNoisyDump(chunk: string | Buffer): boolean {
  const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  return (
    (s.includes('[Error [TimeoutError]') && s.includes('TIMEOUT_ERR: 23')) ||
    (s.includes('code: 23') && s.includes('INDEX_SIZE_ERR')) ||
    (s.includes('statusCode: 504') && s.includes('upstream')) ||
    (s.includes('upstream image response timed out') && s.trimStart().startsWith('⨯'))
  );
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const msg = sanitizeError(first);
    if (msg != null) {
      origError('Error:', msg);
      return;
    }
    origError.apply(console, args);
  };

  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (
    chunk: string | Buffer | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void
  ): boolean => {
    const enc = typeof encodingOrCb === 'function' ? undefined : encodingOrCb;
    const done = typeof encodingOrCb === 'function' ? encodingOrCb : cb;
    const str = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
    if (isNoisyDump(str)) {
      return origStderrWrite('Error: Request timed out or was aborted (or upstream image 504).\n', enc, done);
    }
    return origStderrWrite(chunk as string | Buffer, enc as BufferEncoding | undefined, done);
  };
}
