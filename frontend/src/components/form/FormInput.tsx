import { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  label?: string;
  labelClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, hint, label, labelClassName = "", className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={props.id}
            className={`text-sm font-medium text-foreground ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-4 py-3 rounded-lg border border-input
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed
            bg-background text-foreground placeholder:text-muted-foreground
            ${error ? 'border-destructive focus:ring-destructive' : ''}
            ${className}
          `}
        />
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
