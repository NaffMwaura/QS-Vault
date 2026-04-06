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
    <div className="flex flex-col gap-4 border-b border-(--app-divider) px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-left">
        {eyebrow && <p className="theme-admin-eyebrow">{eyebrow}</p>}
        <h2 className="theme-admin-heading mt-2">{title}</h2>
        {description && (
          <p className="theme-admin-body mt-2.5 max-w-3xl text-sm sm:text-[0.98rem]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);
