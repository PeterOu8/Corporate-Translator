import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { translate } from './groq';

const input = {
  text: 'I helped Sam.',
  mode: 'corporate',
  style: 'professional',
  intensity: 3,
} as const;
const complete = (
  content: unknown = ' Supported Sam. ',
  finish_reason = 'stop',
) => ({
  choices: [
    {
      finish_reason,
      message: {
        content,
        reasoning: 'Private reasoning must never be returned.',
      },
    },
  ],
});

beforeEach(() => {
  vi.stubEnv('GROQ_API_KEY', 'test-secret');
  vi.stubEnv('GROQ_TIMEOUT_MS', '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Groq client', () => {
  it.each(['corporate', 'reverse'] as const)(
    'sends the correct request in %s mode and returns only final text',
    async (mode) => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json(complete()));
      vi.stubGlobal('fetch', fetchMock);
      expect(await translate({ ...input, mode })).toBe('Supported Sam.');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [endpoint, options] = fetchMock.mock.calls[0];
      expect(endpoint).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(options.headers).toEqual({
        Authorization: 'Bearer test-secret',
        'Content-Type': 'application/json',
      });
      expect(options.cache).toBe('no-store');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        model: 'openai/gpt-oss-20b',
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: 512,
        stream: false,
      });
      expect(body).not.toHaveProperty('max_tokens');
      expect(body).not.toHaveProperty('reasoning_format');
      expect(body.temperature).toBe(mode === 'reverse' ? 0.7 : 0.85);
      expect(body.messages[1]).toEqual({ role: 'user', content: input.text });
      expect(body.messages[0].content).toContain(
        mode === 'reverse'
          ? 'Decode corporate jargon'
          : 'large, absurdly enthusiastic LinkedIn post',
      );
    },
  );

  it.each([
    [401, 503, 'PROVIDER_AUTH_ERROR'],
    [403, 503, 'PROVIDER_AUTH_ERROR'],
    [429, 429, 'PROVIDER_RATE_LIMITED'],
    [503, 503, 'SERVICE_UNAVAILABLE'],
    [500, 502, 'PROVIDER_ERROR'],
    [400, 502, 'PROVIDER_ERROR'],
  ] as const)(
    'sanitizes upstream HTTP %i without retries',
    async (upstream, status, code) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response('test-secret private provider details', {
          status: upstream,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      await expect(translate(input)).rejects.toMatchObject({ status, code });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const logs = JSON.stringify(vi.mocked(console.warn).mock.calls);
      expect(logs).toContain(String(upstream));
      expect(logs).not.toContain('test-secret');
      expect(logs).not.toContain(input.text);
      expect(logs).not.toContain('private provider details');
    },
  );

  it.each([
    {},
    { choices: [] },
    complete(null),
    complete(' '),
    complete(12),
    complete('<think>private</think>answer'),
    complete('```text\nanswer\n```'),
    complete('answer', 'tool_calls'),
  ])('rejects malformed, empty, or reasoning-bearing output', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(translate(input)).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
    });
  });

  it('rejects truncation instead of returning a partial translation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json(complete('Unfinished sentence', 'length')),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(translate(input)).rejects.toMatchObject({
      status: 502,
      code: 'TRUNCATED_RESPONSE',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles invalid JSON gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(translate(input)).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
    });
  });

  it('reports missing configuration on the server without calling Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', ' ');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(translate(input)).rejects.toMatchObject({
      status: 503,
      code: 'SERVER_CONFIGURATION_ERROR',
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('GROQ_API_KEY'),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['bad', '0', '30001', '1500.5'])(
    'rejects invalid timeout configuration %s',
    async (value) => {
      vi.stubEnv('GROQ_TIMEOUT_MS', value);
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      await expect(translate(input)).rejects.toMatchObject({
        code: 'SERVER_CONFIGURATION_ERROR',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['', 12000],
    ['8000', 8000],
  ])(
    'sets the upstream deadline from configuration',
    async (value, expected) => {
      vi.stubEnv('GROQ_TIMEOUT_MS', value);
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(Response.json(complete())),
      );
      await translate(input);
      expect(timeoutSpy).toHaveBeenCalledWith(expected);
    },
  );

  it('maps timeout to 504', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('aborted')));
    await expect(translate(input)).rejects.toMatchObject({
      status: 504,
      code: 'PROVIDER_TIMEOUT',
    });
  });

  it('sanitizes network failures and logs no exception details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('test-secret ' + input.text)),
    );
    await expect(translate(input)).rejects.toMatchObject({
      status: 502,
      code: 'PROVIDER_ERROR',
    });
    expect(console.error).toHaveBeenCalledWith(
      '[translation:groq] Upstream request failed',
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      'test-secret',
    );
  });
});
