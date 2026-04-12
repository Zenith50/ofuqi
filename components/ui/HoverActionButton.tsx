"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type HoverActionButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function HoverActionButton({
  children,
  className,
  href,
  variant = "primary",
  type = "button",
  ...props
}: HoverActionButtonProps) {
  const sharedClassName = [
    "hover-action-button",
    `hover-action-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="hover-action-button__label hover-action-button__label--idle">{children}</span>
      <span className="hover-action-button__label hover-action-button__label--hover" aria-hidden="true">
        <span>{children}</span>
        <ArrowRight size={16} strokeWidth={2.2} />
      </span>
      <span className="hover-action-button__fill" aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={sharedClassName} aria-label={typeof children === "string" ? children : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={sharedClassName} {...props}>
      {content}
    </button>
  );
}
