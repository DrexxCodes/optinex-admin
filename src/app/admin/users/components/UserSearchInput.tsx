import { Search } from 'lucide-react';

export default function UserSearchInput({
  value,
  onChange,
  onSearch,
  searching
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  searching: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type="text"
          placeholder="Search by email or username…"
          className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={searching || !value.trim()}
        className="shrink-0 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {searching ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
