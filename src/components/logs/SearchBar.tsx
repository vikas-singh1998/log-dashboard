import { Search, X } from "lucide-react";

interface Props {
  query: string;
  onChange: (q: string) => void;
  placeholder?: string;
}

export function SearchBar({
  query,
  onChange,
  placeholder = "Search logs… (typo-tolerant)",
}: Props) {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent pl-9 pr-8 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
      />
      {query && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
