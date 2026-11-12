'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import {
  translationSchema,
  type TranslationInput,
} from '@/lib/validation/translate';
import { requestTranslation } from '@/lib/translate-client';
import InputPanel from './InputPanel';
import OutputPanel from './OutputPanel';
import IntensityControl from './IntensityControl';

export default function Translator() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');
  const [requestError, setRequestError] = useState('');
  const activeRequest = useRef<AbortController | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TranslationInput>({
    resolver: zodResolver(translationSchema),
    defaultValues: {
      text: '',
      mode: 'linkedinify',
      style: 'professional',
      intensity: 3,
    },
    mode: 'onChange',
  });
  const [text, mode] = useWatch({ control, name: ['text', 'mode'] });
  const source = mode === 'linkedinify' ? 'English' : 'LinkedIn Jargon';
  const target = mode === 'linkedinify' ? 'LinkedIn Jargon' : 'English';

  useEffect(() => () => activeRequest.current?.abort(), []);

  function clear() {
    setValue('text', '', { shouldDirty: true });
    clearErrors();
    setResult('');
    setRequestError('');
    setStatus('Cleared.');
    setFocus('text');
  }

  async function onSubmit(input: TranslationInput) {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setRequestError('');
    setStatus('Aligning strategic synergies…');
    try {
      const translated = await requestTranslation(input, controller.signal);
      if (controller.signal.aborted) return;
      setResult(translated);
      setStatus('Translation ready.');
    } catch (error) {
      if (controller.signal.aborted) return;
      setRequestError(
        error instanceof Error
          ? error.message
          : 'Translation failed. Please try again.',
      );
      setStatus('');
    } finally {
      activeRequest.current = null;
    }
  }

  return (
    <form
      className="translator"
      aria-busy={isSubmitting}
      onSubmit={(event) => {
        if (activeRequest.current) {
          event.preventDefault();
          return;
        }
        void handleSubmit(onSubmit)(event);
      }}
    >
      <input type="hidden" {...register('mode')} />
      <fieldset disabled={isSubmitting} className="translation-options">
        <legend className="sr-only">Translation options</legend>
        <div className="translator-grid">
          <InputPanel
            source={source}
            register={register}
            control={control}
            characterCount={text.length}
            error={errors.text?.message}
            submitDisabled={
              !text.trim() || Boolean(errors.text) || isSubmitting
            }
            isSubmitting={isSubmitting}
            onClear={clear}
          />
          <button
            type="button"
            className="icon-button swap-button"
            aria-label={`Swap direction: translate ${target} to ${source}`}
            onClick={() => {
              if (activeRequest.current) return;
              setValue(
                'mode',
                mode === 'linkedinify' ? 'reverse' : 'linkedinify',
                { shouldDirty: true },
              );
              if (result)
                setValue('text', result, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              setStatus('');
              setResult('');
              setRequestError('');
            }}
          >
            <ArrowLeftRight
              className="size-5 rotate-90 md:rotate-0"
              aria-hidden="true"
            />
          </button>
          <OutputPanel
            key={result}
            language={target}
            result={result}
            busy={isSubmitting}
            canRegenerate={Boolean(result && text.trim() && !errors.text)}
            onRegenerate={() => {
              void handleSubmit(onSubmit)();
            }}
          />
        </div>
        <div className="translator-settings">
          <IntensityControl control={control} />
          <p role="status" className="helper-text">
            {status}
          </p>
        </div>
      </fieldset>
      {isSubmitting && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            activeRequest.current?.abort();
            setStatus('Translation cancelled. Your input has been kept.');
          }}
        >
          Cancel translation
        </button>
      )}
      {requestError && (
        <div role="alert" className="request-error">
          <p>
            {requestError} Your input
            {result ? ' and last translation have' : ' has'} been kept.
          </p>
          <button
            type="submit"
            className="text-button"
            disabled={isSubmitting || !text.trim() || Boolean(errors.text)}
          >
            Retry translation
          </button>
        </div>
      )}
    </form>
  );
}
