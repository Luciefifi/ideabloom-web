'use client';

import { CheckIcon } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { CATEGORY_STYLES } from '../idea-styles';
import { CATEGORY_COLORS, type CategoryColor } from '../types';

const LABELS: Record<CategoryColor, string> = {
  lavender: 'Lavender',
  rose: 'Rose',
  amber: 'Amber',
  emerald: 'Emerald',
  sky: 'Sky',
  teal: 'Teal',
  orange: 'Orange',
  slate: 'Slate',
};

/**
 * Colour swatches that are real radio buttons underneath: arrow keys move
 * between colours, and screen readers announce "Sky, selected".
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Colour',
}: {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  label?: string;
}) {
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLORS.map((color) => (
          <label
            key={color}
            className="relative cursor-pointer"
            title={LABELS[color]}
          >
            <input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="peer sr-only"
            />
            <span className="sr-only">{LABELS[color]}</span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card peer-checked:ring-2 peer-checked:ring-foreground/70 peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                CATEGORY_STYLES[color].dot,
              )}
            >
              {value === color && <CheckIcon className="size-4 text-white" />}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
