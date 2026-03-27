import React from 'react';

export const AdminToolbar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">{children}</div>
);
