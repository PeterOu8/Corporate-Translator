# LinkedInify

### Say less. Synergise more.

A tiny full-stack translator for turning “I did a thing” into a strategic cross-functional value-delivery initiative. Also translates corporate fog back into English, for when someone has leveraged your last nerve.

Built as a mini project with Next.js, TypeScript, Tailwind CSS, and NVIDIA NIM. No accounts. No database. No mandatory inspirational story about the CEO's morning coffee.

## The deliverables, as promised in the meeting

- **Two-way translation:** English → LinkedIn Jargon, and back to civilisation.
- **Three personalities:** Professional, Startup Founder, and Recruiter. Same sentence, different networking event.
- **Five intensity levels:** from corporate seasoning to a bowl of executive word salad. Temperatures range from **0.70 to 1.00**.
- **500-character input limit:** because even synergy needs boundaries.
- **Copy, clear, regenerate, retry, and cancel:** a complete stakeholder recovery strategy.
- **Keyboard controls:** Enter translates; Shift+Enter adds a new line. Escape closes the personality picker.
- **Responsive panels:** side by side on desktop, stacked on mobile. The swap control carries your last result into the new input.
- **Honest failure states:** loading disables duplicate submissions; failed requests keep your text and last successful result.

The header links to the [GitHub repository](https://github.com/PeterOu8/LinkedInify) and [Buy Me a Coffee](https://buymeacoffee.com/peterou8). The microphone is an inactive placeholder; its roadmap is currently enjoying a well-earned coffee break.

## Screenshots from the synergy department

These are real screenshots of the running app with a **mocked translation fixture**, not a promise that every model response will be identical.

![Desktop translator showing a jargon-heavy homework translation](docs/screenshots/desktop.png)

<details>
<summary>Mobile: all the ambition, fewer pixels</summary>

<img src="docs/screenshots/mobile.png" alt="Mobile translator with stacked panels and copy and regenerate controls" width="360" />

</details>

## Run your own corporate communications department

Use **Node.js 24** and npm.

```bash
npm ci
cp .env.example .env.local
```

Add your server-only key to `.env.local`:

```env
NVIDIA_API_KEY=your_key_here
```

No `Bearer` prefix. No `NEXT_PUBLIC_` prefix. No posting the key on LinkedIn to celebrate radical transparency. `.env.local` is ignored by Git.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Restart the dev server after changing environment values.

## How the jargon sausage is made

```text
React Hook Form + Zod
        ↓ POST /api/translate
Bounded JSON reader → shared server validation
        ↓
NVIDIA NIM → z-ai/glm-5.3-flash
        ↓ validated final text
Result panel → copy / regenerate / swap
```

The forward prompt combines factual safeguards, personality vocabulary, intensity instructions, and original few-shot examples. Higher levels explicitly demand dense jargon and comic abstraction, rather than merely replacing “helped” with “assisted.” Comic expansion is allowed, with a prompt target of at most 160 words. The model is asked to preserve names, numbers, negations, and events; this is guidance, not a factual-accuracy guarantee.

Reverse mode ignores personality and intensity and uses temperature **0.70** to ask for concise everyday English.

Requests use low reasoning effort, non-streaming responses, and a generation ceiling of up to **2,498 tokens**, shared between reasoning and final text. The server timeout is **25 seconds**; the browser timeout is **35 seconds**. Hosted-model latency varies. Cancel stops the browser waiting; it does not guarantee the provider stops generation or refunds usage.

## Small codebase, impressive job titles

| Location                                         | Actual responsibility                                     |
| ------------------------------------------------ | --------------------------------------------------------- |
| `src/app/page.tsx` / `layout.tsx`                | Page and shared header                                    |
| `src/app/globals.css`                            | Palette, shared layout/button/panel classes               |
| `src/components/translator/Translator.tsx`       | Form state and translation lifecycle                      |
| `InputPanel.tsx` / `OutputPanel.tsx`             | Input, results, and their actions                         |
| `PersonalitySelect.tsx` / `IntensityControl.tsx` | Corporate personality management                          |
| `src/lib/translate-client.ts`                    | Browser request, response validation, timeouts            |
| `src/lib/ai/prompts.ts` / `nvidia.ts`            | Prompt construction and server-only NVIDIA client         |
| `src/lib/security/request-body.ts`               | 4 KB streamed request-body cap                            |
| `src/app/api/translate/route.ts`                 | Validation, provider call, safe JSON response             |
| `e2e/translator.spec.ts`                         | Desktop/mobile browser journeys with mocked API responses |

## API: the one meeting with a clear agenda

```http
POST /api/translate
Content-Type: application/json
```

```json
{
  "text": "I finished my homework.",
  "mode": "linkedinify",
  "style": "professional",
  "intensity": 3
}
```

- `mode`: `linkedinify` or `reverse`.
- `style`: `professional`, `startup founder`, or `recruiter`.
- `intensity`: integer from 1 to 5.
- `text`: trimmed, non-empty, at most 500 characters. Unexpected fields are rejected.

Success: `{ "result": "..." }`. Errors: `{ "error": { "code": "...", "message": "..." } }`. Responses use `Cache-Control: no-store`.

| Status | What happened to the initiative                                 |
| ------ | --------------------------------------------------------------- |
| 400    | Malformed JSON or invalid input                                 |
| 413    | Body exceeded 4 KB, even without Content-Length                 |
| 415    | Content type was not application/json                           |
| 502    | Provider failure or empty, invalid, or truncated output         |
| 503    | Missing key, provider unavailable, or provider quota/rate limit |
| 504    | Provider timeout                                                |

Vercel Firewall may separately reject requests with **429**, including non-JSON responses. The client handles those too. Raw provider errors and credentials are never returned to the browser; submitted text is not logged by the application.

## Quality assurance, without spending AI credits

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start the **production build on port 3100**, so run `npm run build` first. No NVIDIA key is needed for tests: unit tests mock the provider and browser tests intercept the API.

Coverage includes schema rules, prompt settings, provider validation/errors/timeouts, bounded request bodies, successful translation, keyboard submission, personality/intensity values, copy success/failure, regenerate, swap, clear, retry, cancellation, duplicate-request prevention, and desktop/mobile layout. These are automated checks, not a guarantee that the AI will stop saying “ecosystem.”

To refresh the README screenshots in PowerShell after building:

```powershell
$env:UPDATE_SCREENSHOTS = '1'
npx playwright test --grep=README
Remove-Item Env:\UPDATE_SCREENSHOTS
```

Use `npm run format` to format the source. Failed browser runs retain traces in `test-results/`; CI uploads the report for inspection.

## Deployment: take this initiative to production

1. Connect the repository to Vercel and use Node.js 24.
2. Add `NVIDIA_API_KEY` to the required deployment environments and redeploy.
3. Configure **Vercel Firewall** rate limiting for `POST /api/translate`. There is no application-level limiter or Upstash dependency.
4. Require the **CI / checks** GitHub check in branch protection, then run a live forward/reverse translation smoke test.

The workflow in `.github/workflows/ci.yml` runs formatting, lint, type generation/checking, unit tests, production build, and desktop/mobile Chromium tests on pull requests and pushes to `main`. CI needs no production secrets. Firewall rules, branch protection, and deployment credentials must be configured in their respective dashboards; this repo does not provision them.

If a swapped result exceeds the 500-character input limit, validation asks you to shorten it. This is an intentional limit, not a surprise promotion to long-form content strategy.

## Credits and other stakeholder acknowledgements

Powered by [NVIDIA NIM's GLM-5.3-Flash endpoint](https://build.nvidia.com/z-ai/glm-5-3-flash/build). The satire direction was informed by [Polytranslator's LinkedIn Speak guide](https://www.polytranslator.com/linkedin-speak/); the prompt examples in this project are original. Licensed under [LICENSE](LICENSE).
