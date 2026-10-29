"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <article className="empty-state">
      {icon ? <span className="empty-state__icon">{icon}</span> : null}
      <div className="empty-state__copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </article>
  );
}
