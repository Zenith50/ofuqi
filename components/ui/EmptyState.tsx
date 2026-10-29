"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body: string;
  note?: string;
  steps?: ReadonlyArray<string>;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, body, note, steps, action }: EmptyStateProps) {
  return (
    <article className="empty-state">
      <div className="empty-state__header">
        {icon ? <span className="empty-state__media">{icon}</span> : null}
        <div className="empty-state__copy">
          <h3>{title}</h3>
          <p>{body}</p>
          {note ? <p className="empty-state__note">{note}</p> : null}
        </div>
      </div>
      {steps && steps.length > 0 ? (
        <ol className="empty-state__steps">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="empty-state__actions">{action}</div> : null}
    </article>
  );
}
