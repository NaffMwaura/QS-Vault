export const AdminEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="theme-admin-empty text-center">
    <p className="theme-title text-base font-black">{title}</p>
    <p className="theme-subtle mt-2 text-sm leading-relaxed">{description}</p>
  </div>
);
