"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

type UseCharacterLimitProps = {
  maxLength: number;
  initialValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function useCharacterLimit({
  maxLength,
  initialValue = "",
  value: controlledValue,
  onValueChange,
}: UseCharacterLimitProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const value = controlledValue ?? internalValue;
  const setValue = (nextValue: string) => {
    const limitedValue = nextValue.slice(0, maxLength);

    if (controlledValue !== undefined) {
      onValueChange?.(limitedValue);
      return;
    }

    setInternalValue(limitedValue);
  };

  const characterCount = value.length;
  const remaining = maxLength - characterCount;
  const ratio = characterCount / maxLength;

  const tone = useMemo(() => {
    if (ratio >= 1) {
      return "limit";
    }

    if (ratio >= 0.85) {
      return "warning";
    }

    return "default";
  }, [ratio]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  return {
    value,
    setValue,
    handleChange,
    characterCount,
    remaining,
    maxLength,
    tone,
  } as const;
}
