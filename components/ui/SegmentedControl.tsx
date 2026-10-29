"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { pillTransition } from "@/lib/ui/motion";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
  className?: string;
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  compact = false,
  className,
}: SegmentedControlProps<T>) {
  const pillId = useId();
  const reduced = useReducedMotion();

  return (
    <div
      className={["choice-control", compact ? "choice-control--compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={selected ? "choice-control__button active" : "choice-control__button"}
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {selected ? (
              <motion.span
                layoutId={pillId}
                className="choice-control__pill"
                transition={reduced ? { duration: 0 } : pillTransition}
              />
            ) : null}
            <span className="choice-control__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
