import { Slider as SliderPrimitive } from '@base-ui/react/slider';

// Single-value horizontal slider used by the intensity control.
export function Slider({
  className = '',
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      {...props}
      min={min}
      max={max}
      thumbAlignment="edge"
      className={`w-full ${className}`}
    >
      <SliderPrimitive.Control className="relative flex min-h-11 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Indicator className="h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 shrink-0 rounded-full border-2 border-primary bg-surface ring-primary/25 after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
