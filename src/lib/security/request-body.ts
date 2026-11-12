import { ApiError } from '../api-error';

export const MAX_BODY_BYTES = 4096;

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (contentType !== 'application/json') {
    throw new ApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Send the request as application/json.',
    );
  }
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new ApiError(413, 'BODY_TOO_LARGE', 'Request body exceeds 4 KB.');
  }

  const reader = request.body?.getReader();
  if (!reader)
    throw new ApiError(400, 'INVALID_JSON', 'Please send a valid JSON body.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new ApiError(413, 'BODY_TOO_LARGE', 'Request body exceeds 4 KB.');
      }
      chunks.push(chunk.value);
    }
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Buffer.concat(chunks, bytes),
      ),
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_JSON', 'Please send a valid JSON body.');
  } finally {
    reader.releaseLock();
  }
}
