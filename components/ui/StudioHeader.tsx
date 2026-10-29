"use client";

import type { ReactNode } from "react";

type StudioMeta = {
  label: string;
  value: string;
};

export default function StudioHeader({
  label,
  title,
  body,
  action,
  meta,
}: {
  label: string;
  title: string;
  body: string;
  action?: ReactNode;
  meta?: ReadonlyArray<StudioMeta>;
}) {
  return (
    <header className="studio-header">
      <div className="studio-header__main">
        <div className="studio-header__copy">
          <p className="workspace-label">{label}</p>
          <h1 className="workspace-title">{title}</h1>
          <p className="muted-copy workspace-heading-copy">{body}</p>
        </div>
        {action ? <div className="studio-header__action">{action}</div> : null}
      </div>
      {meta && meta.length > 0 ? (
        <dl className="density-metrics">
          {meta.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
