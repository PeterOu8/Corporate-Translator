'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { translationSchema, type TranslationInput } from '@/lib/validation/translate';
import InputPanel from './InputPanel';
import OutputPanel from './OutputPanel';
import IntensityControl from './IntensityControl';

export default function Translator() {
  const [status, setStatus] = useState('');
  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<TranslationInput>({
    resolver: zodResolver(translationSchema),
    defaultValues: { text: '', mode: 'linkedinify', style: 'professional', intensity: 3 },
    mode: 'onChange',
  });
  const [text, mode] = useWatch({ control, name: ['text', 'mode'] });
  const source = mode === 'linkedinify' ? 'English' : 'LinkedIn Jargon';
  const target = mode === 'linkedinify' ? 'LinkedIn Jargon' : 'English';

  return (
    <form className="translator" onChange={() => setStatus('')} onSubmit={handleSubmit(() => setStatus('Translation is not connected yet.'))}>
      <input type="hidden" {...register('mode')} />
      <div className="translator-grid">
        <InputPanel
          source={source}
          register={register}
          control={control}
          characterCount={text.length}
          error={errors.text?.message}
          submitDisabled={!text.trim() || Boolean(errors.text) || isSubmitting}
        />
        <button
          type="button"
          className="icon-button swap-button"
          aria-label={`Swap direction: translate ${target} to ${source}`}
          onClick={() => {
            setValue('mode', mode === 'linkedinify' ? 'reverse' : 'linkedinify', { shouldDirty: true });
            setStatus('');
          }}
        >
          <ArrowLeftRight className="size-5 rotate-90 md:rotate-0" aria-hidden="true" />
        </button>
        <OutputPanel language={target} />
      </div>
      <div className="translator-settings">
        <IntensityControl control={control} />
        <p role="status" className="helper-text">{status}</p>
      </div>
    </form>
  );
}



