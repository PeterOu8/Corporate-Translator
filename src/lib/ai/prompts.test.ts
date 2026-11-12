import { describe, expect, it } from 'vitest';
import { buildTranslationPrompt } from './prompts';
import { translationSchema } from '../validation/translate';

const input = {
  text: 'I finished a project.',
  mode: 'corporate',
  style: 'professional',
  intensity: 3,
} as const;

describe('translation prompts', () => {
  it.each([1, 2, 3, 4, 5])(
    'defines intensity %i with a concise prompt',
    (intensity) => {
      const prompt = buildTranslationPrompt({ ...input, intensity });
      expect(prompt.messages[0].content.length).toBeLessThan(5500);
      expect(prompt.messages[0].content).toContain(`Intensity ${intensity}/5`);
      expect(prompt.messages[0].content).toContain('Never invent metrics');
      expect(prompt.messages[1].content).toBe(input.text);
    },
  );

  it('ignores style and intensity in reverse mode', () => {
    expect(buildTranslationPrompt({ ...input, mode: 'reverse' })).toEqual(
      buildTranslationPrompt({
        ...input,
        mode: 'reverse',
        style: 'recruiter',
        intensity: 5,
      }),
    );
  });

  it('makes satire explicit without adding examples to reverse mode', () => {
    const forward = buildTranslationPrompt(input).messages[0].content;
    const reverse = buildTranslationPrompt({ ...input, mode: 'reverse' })
      .messages[0].content;
    expect(forward).toContain('large, absurdly enthusiastic LinkedIn post');
    expect(forward).toContain('Phrase guide');
    expect(forward).toContain('not from invented KPIs');
    expect(reverse).not.toContain('Phrase guide');
    expect(reverse).toContain('Never turn failure into success');
  });

  it.each([
    [1, 0.7],
    [2, 0.775],
    [3, 0.85],
    [4, 0.925],
    [5, 1],
  ])('uses temperature %s at level %s', (intensity, temperature) => {
    expect(buildTranslationPrompt({ ...input, intensity }).temperature).toBe(
      temperature,
    );
  });

  it.each(['professional', 'startup founder', 'recruiter'] as const)(
    'supports %s',
    (style) => {
      expect(
        buildTranslationPrompt({ ...input, style }).messages[0].content,
      ).not.toContain('undefined');
    },
  );

  it('expands short coffee input into a hashtagged post', () => {
    const text =
      'im thrilled to annouce that im thrilled to be happy and drinking coffee';
    const prompt = buildTranslationPrompt({ ...input, text, intensity: 5 });
    expect(prompt.messages[0].content).toContain('60–110');
    expect(prompt.messages[0].content).toContain(
      'Do not match the source word count',
    );
    expect(prompt.messages[0].content).toContain(
      'Always finish with 2–4 relevant hashtags',
    );
    expect(prompt.messages[0].content).toContain('coffee stays coffee');
    expect(prompt.messages[1].content).toBe(text);
  });

  it.each([
    'Hello → Thrilled to connect!',
    "No → Let's take this offline.",
    'How are you? → How are you crushing it today?',
    'Where is the bathroom? → Quick question for my network: where is the bathroom? 🤔',
  ])('retains the supplied phrase anchor: %s', (phrase) => {
    expect(buildTranslationPrompt(input).messages[0].content).toContain(phrase);
  });
  it.each([
    'You are an asshole and I want nothing to do with you.',
    'I hate this service and hope you get hurt.',
  ])(
    'preserves criticism while directing harmful wishes into boundaries',
    (text) => {
      const prompt = buildTranslationPrompt({ ...input, text });
      const system = prompt.messages[0].content;
      expect(system).toContain(
        'blend cutting corporate sarcasm with absurd professional disengagement',
      );
      expect(system).toContain('do not convert criticism into sincere praise');
      expect(system).toContain('Preserve emotional force, not literal harm');
      expect(system).toContain('Never disguise violence as business jargon');
      expect(system).toContain('#ProfessionalBoundaries #StrategicExit');
      expect(prompt.messages[1].content).toBe(text);
    },
  );

  it('keeps the forward sarcasm guidance out of reverse translation', () => {
    const system = buildTranslationPrompt({ ...input, mode: 'reverse' })
      .messages[0].content;
    expect(system).not.toContain('professional disengagement');
    expect(system).toContain('clear, concise everyday English');
  });
  it('enforces the final shared input contract', () => {
    expect(translationSchema.safeParse(input).success).toBe(true);
    for (const change of [
      { text: ' ' },
      { text: 'a'.repeat(501) },
      { intensity: 0 },
      { intensity: 1.5 },
      { mode: 'other' },
      { extra: true },
    ]) {
      expect(translationSchema.safeParse({ ...input, ...change }).success).toBe(
        false,
      );
    }
  });
});
