"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Magnetic from "@/components/ui/Magnetic";

type HoverActionButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary";
  magnetic?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function HoverActionButton({
  children,
  className,
  href,
  variant = "primary",
  magnetic,
  type = "button",
  disabled,
  ...props
}: HoverActionButtonProps) {
  const sharedClassName = ["hover-action-button", `hover-action-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  const textLabel = typeof children === "string" || typeof children === "number";
  const pull = magnetic ?? variant === "primary";

  const content = textLabel ? (
    <>
      <span className="hover-action-button__label hover-action-button__label--idle">{children}</span>
      <span className="hover-action-button__label hover-action-button__label--hover" aria-hidden="true">
        <span>{children}</span>
        <ArrowRight size={16} strokeWidth={2.2} />
      </span>
      <span className="hover-action-button__fill" aria-hidden="true" />
    </>
  ) : (
    <>
      <span className="hover-action-button__label">{children}</span>
      <span className="hover-action-button__fill" aria-hidden="true" />
    </>
  );

  const control = href ? (
    <Link href={href} className={sharedClassName} aria-label={textLabel ? String(children) : undefined}>
      {content}
    </Link>
  ) : (
    <button type={type} className={sharedClassName} disabled={disabled} {...props}>
      {content}
    </button>
  );

  if (!pull || disabled) {
    return control;
  }

  return <Magnetic disabled={disabled}>{control}</Magnetic>;
}
