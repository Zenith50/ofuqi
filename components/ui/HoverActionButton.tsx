"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type HoverActionSharedProps = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

type HoverActionButtonAsButton = HoverActionSharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

type HoverActionButtonAsLink = HoverActionSharedProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

type HoverActionButtonProps = HoverActionButtonAsButton | HoverActionButtonAsLink;

function actionClassName(variant: "primary" | "secondary", className?: string) {
  return ["hover-action-button", `hover-action-button--${variant}`, className].filter(Boolean).join(" ");
}

function ActionContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="hover-action-button__label hover-action-button__label--idle">{children}</span>
      <span className="hover-action-button__label hover-action-button__label--hover" aria-hidden="true">
        <span>{children}</span>
        <ArrowRight size={16} strokeWidth={2.2} />
      </span>
      <span className="hover-action-button__fill" aria-hidden="true" />
    </>
  );
}

function isLinkAction(props: HoverActionButtonProps): props is HoverActionButtonAsLink {
  return "href" in props && props.href != null;
}

export default function HoverActionButton(props: HoverActionButtonProps) {
  if (isLinkAction(props)) {
    const { children, className, variant = "primary", ...linkProps } = props;

    return (
      <Link
        className={actionClassName(variant, className)}
        aria-label={typeof children === "string" ? children : undefined}
        {...linkProps}
      >
        <ActionContent>{children}</ActionContent>
      </Link>
    );
  }

  const { children, className, variant = "primary", type = "button", ...buttonProps } = props;

  return (
    <button type={type} className={actionClassName(variant, className)} {...buttonProps}>
      <ActionContent>{children}</ActionContent>
    </button>
  );
}
