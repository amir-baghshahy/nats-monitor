import { Filter, Search } from "lucide-react";

interface ConnectionFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterServer: string;
  setFilterServer: (value: string) => void;
  servers: string[];
}

export default function ConnectionFilters({
  searchQuery,
  setSearchQuery,
  filterServer,
  setFilterServer,
  servers,
}: ConnectionFiltersProps) {
  return (
    <div className="card mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            placeholder="Search by user or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterServer}
            onChange={(e) => setFilterServer(e.target.value)}
            className="input w-full min-w-40 lg:w-auto"
          >
            <option value="all">All Servers</option>
            {servers
              .filter((server) => server !== "all")
              .map((server) => (
                <option key={server} value={server}>
                  {server}
                </option>
              ))}
          </select>
          <button className="btn-secondary inline-flex shrink-0 items-center gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
}
