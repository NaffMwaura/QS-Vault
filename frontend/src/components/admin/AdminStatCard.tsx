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
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="theme-admin-label">{label}</p>
        <p className="theme-title mt-2.5 text-[1.9rem] font-black tracking-tight sm:text-[2.25rem]">
          {value}
        </p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone}`}>
        <Icon size={19} />
      </div>
    </div>
    <p className="theme-admin-body text-sm">{description}</p>
  </div>
);
