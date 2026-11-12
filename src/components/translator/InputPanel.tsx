import { Mic, X } from 'lucide-react';
import type { Control, UseFormRegister } from 'react-hook-form';
import {
  MAX_INPUT_LENGTH,
  type TranslationInput,
} from '@/lib/validation/translate';
import PersonalitySelect from './PersonalitySelect';

type InputPanelProps = {
  source: string;
  register: UseFormRegister<TranslationInput>;
  control: Control<TranslationInput>;
  characterCount: number;
  error?: string;
  submitDisabled: boolean;
  isSubmitting?: boolean;
  onClear: () => void;
};

export default function InputPanel({
  source,
  register,
  control,
  characterCount,
  error,
  submitDisabled,
  isSubmitting = false,
  onClear,
}: InputPanelProps) {
  return (
    <section className="translation-column" aria-labelledby="input-label">
      <div className="panel-heading">
        <label id="input-label" htmlFor="text" className="panel-label">
          {source}
        </label>
        <button
          type="button"
          className="icon-button"
          onClick={onClear}
          disabled={!characterCount}
          aria-label="Clear translation"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="translation-panel input-panel">
        <textarea
          id="text"
          {...register('text')}
          rows={7}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (!submitDisabled) event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`Enter ${source} text…`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'text-count text-error' : 'text-count'}
          className="translation-input"
        />
        <div className="input-meta">
          <span id="text-count" className="tabular-nums">
            {characterCount} / {MAX_INPUT_LENGTH} characters
          </span>
        </div>
        <div className="input-footer">
          <button
            type="button"
            disabled
            aria-label="Voice input (coming soon)"
            title="Voice input coming soon"
            className="icon-button"
          >
            <Mic className="size-5" aria-hidden="true" />
          </button>
          <div className="input-actions">
            <PersonalitySelect control={control} />
            <button
              type="submit"
              disabled={submitDisabled}
              className="primary-button"
            >
              {isSubmitting ? 'Translating…' : 'Translate'}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <p id="text-error" role="alert" className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}
