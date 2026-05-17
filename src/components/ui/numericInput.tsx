"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Input } from './input';

interface NumericInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  defaultValue: number;
  decimal?: boolean;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function NumericInput({
  id,
  label,
  value,
  onChange,
  defaultValue,
  decimal = false,
  helperText,
  error = false,
  disabled,
  className,
}: NumericInputProps) {
  // Track the raw string the user is typing so intermediate states like "0."
  // are preserved rather than being stripped by React's controlled-input cycle.
  const [inputValue, setInputValue] = useState(String(value));
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  // Sync from the external value only when the parent changes it to something
  // that doesn't match what the user has typed (e.g. a model switch forces
  // temperature to 1.0). If the parsed inputValue already equals the incoming
  // value we leave the raw string alone so in-progress edits are preserved.
  useEffect(() => {
    const parse = decimal ? parseFloat : (s: string) => parseInt(s, 10);
    const parsed = parse(inputValueRef.current);
    if (isNaN(parsed) || parsed !== value) {
      setInputValue(String(value));
    }
  }, [value, decimal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = decimal ? parseFloat(raw) : parseInt(raw, 10);
    onChange(isNaN(parsed) ? defaultValue : parsed);
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        pattern={decimal ? '[0-9.]*' : '[0-9]*'}
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        className={error ? 'border-destructive' : ''}
      />
      {helperText && (
        <p className={cn('text-xs mt-1', error ? 'text-destructive' : 'text-muted-foreground')}>
          {helperText}
        </p>
      )}
    </div>
  );
}
