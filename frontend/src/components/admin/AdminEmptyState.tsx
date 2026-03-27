export const AdminEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="theme-admin-empty text-center">
    <p className="theme-admin-subheading">{title}</p>
    <p className="theme-admin-body mt-2 text-sm">{description}</p>
  </div>
);
