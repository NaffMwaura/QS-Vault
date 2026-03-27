import React from 'react';

export const AdminStatsGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
);
