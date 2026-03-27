import React from 'react';

interface AdminPageSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminPageSection = ({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AdminPageSectionProps) => (
  <section className="theme-admin-panel">
    <div className="flex flex-col gap-4 border-b border-[color:var(--app-divider)] px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-left">
        {eyebrow && <p className="theme-admin-eyebrow">{eyebrow}</p>}
        <h2 className="theme-title mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="theme-subtle mt-2 max-w-3xl text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);
