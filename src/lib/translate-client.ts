import { z } from 'zod';
import type { TranslationInput } from './validation/translate';

const resultSchema = z.object({ result: z.string().trim().min(1).max(6000) });

const messages: Record<number, string> = {
  400: 'Check your text and translation options, then try again.',
  413: 'Your request is too large. Shorten the text and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  502: 'Translation failed. Please try again.',
  503: 'Translation is temporarily unavailable. Please try again shortly.',
  504: 'Translation took too long. Please try again.',
};

export async function requestTranslation(
  input: TranslationInput,
  cancellation?: AbortSignal,
): Promise<string> {
  let response: Response;
  const timeout = AbortSignal.timeout(35_000);
  const signal = cancellation
    ? AbortSignal.any([timeout, cancellation])
    : timeout;
  try {
    response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    });
  } catch {
    if (cancellation?.aborted) throw new Error('Translation cancelled.');
    throw new Error(
      timeout.aborted
        ? 'Translation took too long. Please try again.'
        : 'Could not connect. Check your connection and try again.',
    );
  }

  // Firewall errors may be HTML rather than the API's JSON contract.
  if (!response.ok) {
    throw new Error(
      messages[response.status] ?? 'Translation failed. Please try again.',
    );
  }

  try {
    const parsed = resultSchema.safeParse(await response.json());
    if (parsed.success) return parsed.data.result;
  } catch {
    if (signal.aborted)
      throw new Error('Translation took too long. Please try again.');
  }
  throw new Error('Received an invalid translation. Please try again.');
}
