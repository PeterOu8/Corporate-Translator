import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/ai/groq', () => ({ translate: vi.fn() }));
import { translate } from '@/lib/ai/groq';
import { POST } from './route';
import { ApiError } from '@/lib/api-error';

const validInput = {
  text: 'I helped Sam.',
  mode: 'corporate',
  style: 'professional',
  intensity: 3,
};
function request(body: unknown) {
  return new Request('http://localhost/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/translate', () => {
  it.each(['corporate', 'reverse'])(
    'returns validated results without caching in %s mode',
    async (mode) => {
      vi.mocked(translate).mockResolvedValue('Supported Sam.');
      const response = await POST(request({ ...validInput, mode }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ result: 'Supported Sam.' });
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    },
  );

  it.each([
    { ...validInput, text: '' },
    { ...validInput, text: 'x'.repeat(501) },
    { ...validInput, intensity: 7 },
  ])('rejects invalid input before external calls', async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(translate).not.toHaveBeenCalled();
  });

  it('caps streamed bytes without trusting Content-Length', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(4097));
        controller.close();
      },
    });
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect((await POST(req)).status).toBe(413);
    expect(translate).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    expect(
      (
        await POST(
          new Request('http://localhost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{',
          }),
        )
      ).status,
    ).toBe(400);
  });

  it('rejects unsupported content types', async () => {
    expect(
      (
        await POST(
          new Request('http://localhost', { method: 'POST', body: 'hello' }),
        )
      ).status,
    ).toBe(415);
  });

  it.each([
    [429, 'PROVIDER_RATE_LIMITED'],
    [503, 'PROVIDER_AUTH_ERROR'],
    [503, 'SERVER_CONFIGURATION_ERROR'],
    [504, 'PROVIDER_TIMEOUT'],
    [502, 'TRUNCATED_RESPONSE'],
  ] as const)(
    'preserves structured HTTP %i provider errors',
    async (status, code) => {
      vi.mocked(translate).mockRejectedValueOnce(
        new ApiError(status, code, 'Safe translation error.'),
      );
      const response = await POST(request(validInput));
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({
        error: { code, message: 'Safe translation error.' },
      });
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    },
  );

  it('hides unexpected internal errors', async () => {
    vi.mocked(translate).mockRejectedValueOnce(new Error('secret details'));
    const response = await POST(request(validInput));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('secret');
  });
});
