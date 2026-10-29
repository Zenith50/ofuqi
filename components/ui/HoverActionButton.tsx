"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  disabled,
  ...props
}: HoverActionButtonProps) {
  const sharedClassName = ["hover-action-button", `hover-action-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  const content = <span className="hover-action-button__label">{children}</span>;

  if (href) {
    return (
      <Link href={href} className={sharedClassName} aria-label={typeof children === "string" ? children : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={sharedClassName} disabled={disabled} {...props}>
      {content}
    </button>
  );
}
