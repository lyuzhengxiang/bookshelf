import { SearchResults } from "@/components/search-results";

export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold uppercase tracking-tighter">
        Search
      </h1>
      <SearchResults />
    </div>
  );
}
