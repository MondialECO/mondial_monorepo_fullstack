'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value: controlledValue, defaultValue, onValueChange, disabled, name: controlledName, children, ...props }, ref) => {
    const generatedName = React.useId();
    const name = controlledName || generatedName;

    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (val: string) => {
        if (!isControlled) {
          setUncontrolledValue(val);
        }
        onValueChange?.(val);
      },
      [isControlled, onValueChange]
    );

    return (
      <RadioGroupContext.Provider
        value={{
          name,
          value: currentValue,
          onValueChange: handleValueChange,
          disabled,
        }}
      >
        <div ref={ref} role="radiogroup" className={cn('grid gap-2', className)} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, disabled: itemDisabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const checked = context?.value === value;
    const disabled = itemDisabled || context?.disabled;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => {
          if (!disabled) {
            context?.onValueChange?.(value);
          }
        }}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center',
          className
        )}
        {...props}
      >
        {checked && <Circle className="h-2 w-2 fill-primary text-primary" />}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';
