import React from 'react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  tone: string;
}

export const AdminStatCard = ({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: AdminStatCardProps) => (
  <div className="theme-admin-card text-left">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="theme-admin-label">{label}</p>
        <p className="theme-title mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {value}
        </p>
      </div>
      <div className={`rounded-2xl border p-3 ${tone}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="theme-subtle text-sm leading-relaxed">{description}</p>
  </div>
);
