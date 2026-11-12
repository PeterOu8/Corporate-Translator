import { ApiError } from '@/lib/api-error';
import { translate } from '@/lib/ai/nvidia';
import { readJsonBody } from '@/lib/security/request-body';
import { translationSchema } from '@/lib/validation/translate';

export async function POST(request: Request) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  try {
    const input = translationSchema.safeParse(await readJsonBody(request));
    if (!input.success) {
      throw new ApiError(
        400,
        'INVALID_INPUT',
        'Enter 1–500 characters and valid translation options.',
      );
    }
    const result = await translate(input.data);
    return Response.json({ result }, { headers });
  } catch (error) {
    const failure =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            'INTERNAL_ERROR',
            'Something went wrong. Please try again.',
          );
    return Response.json(
      { error: { code: failure.code, message: failure.message } },
      { status: failure.status, headers },
    );
  }
}
