import { afterEach, expect, it, vi } from 'vitest';
import { requestTranslation } from './translate-client';

const input = {
  text: 'I helped Sam.',
  mode: 'corporate',
  style: 'professional',
  intensity: 3,
} as const;
afterEach(() => vi.unstubAllGlobals());

it('passes cancellation to fetch and reports a cancelled request', async () => {
  const controller = new AbortController();
  const fetchMock = vi.fn().mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(new Error('aborted')),
        );
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  const pending = requestTranslation(input, controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow('Translation cancelled.');
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});

it('posts the complete input and returns the validated result', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json({ result: ' Supported Sam. ' }));
  vi.stubGlobal('fetch', fetchMock);
  expect(await requestTranslation(input)).toBe('Supported Sam.');
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/translate',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
    }),
  );
});

it.each([400, 413, 429, 500, 502, 503, 504])(
  'handles HTTP %i, including HTML firewall responses',
  async (status) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('<html>Blocked</html>', { status })),
    );
    await expect(requestTranslation(input)).rejects.toThrow();
  },
);

it.each([{ result: '' }, {}, { result: 123 }])(
  'rejects invalid success payloads',
  async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(requestTranslation(input)).rejects.toThrow(
      'invalid translation',
    );
  },
);

it('handles a non-JSON success response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('<html>Error</html>')),
  );
  await expect(requestTranslation(input)).rejects.toThrow(
    'invalid translation',
  );
});

it('provides actionable network error feedback', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
  );
  await expect(requestTranslation(input)).rejects.toThrow(
    'Check your connection',
  );
});
