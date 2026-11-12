// The endpoint is reserved until the translation service is implemented.
export function POST() {
  return Response.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Translation is coming soon.' } },
    { status: 501 },
  );
}
