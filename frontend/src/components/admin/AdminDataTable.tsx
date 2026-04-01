import React from 'react';

export const AdminDataTable = ({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) => (
  <div className="hidden overflow-x-auto custom-scrollbar lg:block">
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead>
        <tr className="border-b border-[color:var(--app-divider)]">
          {headers.map((header, index) => (
            <th
              key={header}
              className={`theme-admin-label px-4 py-3.5 ${index === headers.length - 1 ? 'text-right' : ''}`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
