"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <article className={["empty", className].filter(Boolean).join(" ")}>
      <div className="empty-header">
        {icon ? <span className="empty-media">{icon}</span> : null}
        <h3 className="empty-title">{title}</h3>
        <p className="empty-description">{body}</p>
      </div>
      {action ? <div className="empty-content">{action}</div> : null}
    </article>
  );
}
