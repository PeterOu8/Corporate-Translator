import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { translate } from './nvidia';

const input = {
  text: 'I helped Sam.',
  mode: 'linkedinify',
  style: 'professional',
  intensity: 3,
} as const;
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('NVIDIA client', () => {
  it('returns trimmed content with bounded generation settings', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: '  Supported Sam.  ' },
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await translate(input)).toBe('Supported Sam.');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('z-ai/glm-5.3-flash');
    expect(body.reasoning_effort).toBe('low');
    expect(body.max_tokens).toBeGreaterThan(2048);
    expect(body.max_tokens).toBeLessThanOrEqual(2498);
    expect(body.stream).toBe(false);
  });

  it.each([401, 402, 403, 429, 503, 500])(
    'sanitizes provider HTTP %i',
    async (status) => {
      vi.stubEnv('NVIDIA_API_KEY', 'test-key');
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response('secret provider details', { status }),
          ),
      );
      await expect(translate(input)).rejects.toMatchObject({
        status: status === 500 ? 502 : 503,
      });
    },
  );

  it.each([
    {},
    {
      choices: [{ finish_reason: 'length', message: { content: 'Truncated' } }],
    },
    { choices: [{ finish_reason: 'stop', message: { content: ' ' } }] },
  ])('rejects malformed, empty or truncated output', async (body) => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(translate(input)).rejects.toMatchObject({ status: 502 });
  });

  it('fails without credentials before making a request', async () => {
    vi.stubEnv('NVIDIA_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(translate(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps timeout to 504', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('aborted')));
    await expect(translate(input)).rejects.toMatchObject({ status: 504 });
  });
});
