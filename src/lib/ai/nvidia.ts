import 'server-only';
import { z } from 'zod';
import { ApiError } from '../api-error';
import type { TranslationInput } from '../validation/translate';
import { buildTranslationPrompt } from './prompts';

const providerResponse = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.literal('stop'),
        message: z.object({ content: z.string().trim().min(1).max(6000) }),
      }),
    )
    .min(1),
});

export async function translate(input: TranslationInput): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      'SERVICE_UNAVAILABLE',
      'Translation is temporarily unavailable.',
    );
  }

  const prompt = buildTranslationPrompt(input);
  const signal = AbortSignal.timeout(25_000);
  try {
    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'z-ai/glm-5.3-flash',
          ...prompt,
          // Reserve generation headroom for reasoning as well as the final text.
          max_tokens: prompt.max_tokens + 2048,
          reasoning_effort: 'low',
          stream: false,
        }),
        signal,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      // Never expose provider errors, which may include request or account details.
      await response.body?.cancel();
      if ([401, 403, 402, 429, 503].includes(response.status)) {
        throw new ApiError(
          503,
          'SERVICE_UNAVAILABLE',
          'Translation is temporarily unavailable. Please try again shortly.',
        );
      }
      throw new ApiError(
        502,
        'PROVIDER_ERROR',
        'Translation failed. Please try again.',
      );
    }

    const parsed = providerResponse.safeParse(await response.json());
    if (!parsed.success) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'Translation returned an incomplete response. Please try again.',
      );
    }
    return parsed.data.choices[0].message.content;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal.aborted) {
      throw new ApiError(
        504,
        'PROVIDER_TIMEOUT',
        'Translation took too long. Please try again.',
      );
    }
    throw new ApiError(
      502,
      'PROVIDER_ERROR',
      'Translation failed. Please try again.',
    );
  }
}
