import type { ReactNode } from "react";

export default function SheetLife({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const classNames = ["sheet-life", className].filter(Boolean).join(" ");

  return <div className={classNames}>{children}</div>;
}
