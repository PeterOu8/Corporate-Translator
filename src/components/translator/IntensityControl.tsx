import { Controller, type Control } from 'react-hook-form';
import type { TranslationInput } from '@/lib/validation/translate';
import { Slider } from '@/components/ui/slider';

export default function IntensityControl({
  control,
}: {
  control: Control<TranslationInput>;
}) {
  return (
    <Controller
      name="intensity"
      control={control}
      render={({ field }) => (
        <div className="intensity-control">
          <p
            id="intensity-label"
            className="flex justify-between gap-4 text-sm font-medium"
          >
            Corporate intensity{' '}
            <span className="tabular-nums text-muted-foreground">
              {field.value} / 5
            </span>
          </p>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[field.value]}
            onValueChange={(value) =>
              field.onChange(Array.isArray(value) ? value[0] : value)
            }
            onBlur={field.onBlur}
            aria-labelledby="intensity-label"
          />
        </div>
      )}
    />
  );
}
