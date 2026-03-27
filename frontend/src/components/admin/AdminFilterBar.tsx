import { Search } from 'lucide-react';

interface AdminFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const AdminFilterBar = ({
  value,
  onChange,
  placeholder,
}: AdminFilterBarProps) => (
  <div className="sticky top-0 z-10 -mx-1 mb-5 bg-transparent px-1 pb-2">
    <label className="relative block text-left">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="theme-input w-full rounded-2xl border py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-amber-500"
      />
    </label>
  </div>
);
