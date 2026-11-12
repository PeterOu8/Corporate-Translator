import 'server-only';
import { z } from 'zod';
import { ApiError } from '../api-error';
import type { TranslationInput } from '../validation/translate';
import { buildTranslationPrompt } from './prompts';

const providerResponse = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string(),
        message: z.object({ content: z.string().trim().min(1).max(6000) }),
      }),
    )
    .min(1),
});

function configurationError(variable: string): never {
  // Only fixed variable names are passed here, never their values.
  console.error(
    `[translation:groq] Invalid or missing server configuration: ${variable}`,
  );
  throw new ApiError(
    503,
    'SERVER_CONFIGURATION_ERROR',
    'Translation is temporarily unavailable.',
  );
}

function timeoutMilliseconds() {
  const raw = process.env.GROQ_TIMEOUT_MS;
  if (!raw) return 12_000;
  const value = Number(raw);
  // Stay below the browser's 35-second deadline.
  if (!Number.isInteger(value) || value < 1000 || value > 30_000) {
    return configurationError(
      'GROQ_TIMEOUT_MS (expected an integer from 1000 to 30000)',
    );
  }
  return value;
}

function invalidOutput(): never {
  console.warn('[translation:groq] Invalid final response');
  throw new ApiError(
    502,
    'INVALID_PROVIDER_RESPONSE',
    'Translation returned an incomplete response. Please try again.',
  );
}

export async function translate(input: TranslationInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) configurationError('GROQ_API_KEY');

  const signal = AbortSignal.timeout(timeoutMilliseconds());
  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          ...buildTranslationPrompt(input),
          reasoning_effort: 'low',
          include_reasoning: false,
          max_completion_tokens: 512,
          stream: false,
        }),
        signal,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      // Never read or log upstream error bodies: they can contain request details.
      console.warn('[translation:groq] Upstream HTTP error', {
        status: response.status,
      });
      await response.body?.cancel();
      if (response.status === 429) {
        throw new ApiError(
          429,
          'PROVIDER_RATE_LIMITED',
          'Too many translation requests. Please try again shortly.',
        );
      }
      if ([401, 403].includes(response.status)) {
        throw new ApiError(
          503,
          'PROVIDER_AUTH_ERROR',
          'Translation is temporarily unavailable.',
        );
      }
      if ([402, 503].includes(response.status)) {
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

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      if (signal.aborted) throw error;
      return invalidOutput();
    }
    const parsed = providerResponse.safeParse(body);
    if (!parsed.success) return invalidOutput();
    const choice = parsed.data.choices[0];
    if (choice.finish_reason === 'length') {
      console.warn('[translation:groq] Completion budget exhausted');
      throw new ApiError(
        502,
        'TRUNCATED_RESPONSE',
        'Translation was incomplete. Try a shorter input.',
      );
    }
    // Only final content is returned. Reject trace markers rather than leaking reasoning.
    if (
      choice.finish_reason !== 'stop' ||
      /<\/?(?:think|analysis)>|<\|(?:channel|im_start|im_end)\|>|^```/iu.test(
        choice.message.content,
      )
    ) {
      return invalidOutput();
    }
    return choice.message.content;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal.aborted) {
      console.warn('[translation:groq] Upstream timeout');
      throw new ApiError(
        504,
        'PROVIDER_TIMEOUT',
        'Translation took too long. Please try again.',
      );
    }
    // Avoid logging exceptions, which may embed URLs, headers or request bodies.
    console.error('[translation:groq] Upstream request failed');
    throw new ApiError(
      502,
      'PROVIDER_ERROR',
      'Translation failed. Please try again.',
    );
  }
}
