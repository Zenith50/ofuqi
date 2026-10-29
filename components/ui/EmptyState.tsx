"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  spread?: boolean;
};

export default function EmptyState({ icon, title, body, action, spread = false }: EmptyStateProps) {
  return (
    <article className={spread ? "empty-state empty-spread" : "empty-state"}>
      {spread ? (
        <>
          <p className="empty-spread-name" lang="en" dir="ltr">Ofuqi</p>
          <div className="empty-sheet" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="empty-spread-name" lang="ar" dir="rtl">أُفُقي</p>
        </>
      ) : icon ? <span className="empty-state__icon">{icon}</span> : null}
      <div className="empty-state__copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </article>
  );
}
