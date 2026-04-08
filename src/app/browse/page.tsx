import { BrowseGrid } from "@/components/browse-grid";

export default function BrowsePage() {
  return (
    <div>
      <h1 className="mb-2 text-4xl font-bold uppercase tracking-tighter">
        Browse
      </h1>
      <p className="mb-8 text-xs uppercase tracking-widest text-gray-500">
        Explore books by genre. Scroll to discover more.
      </p>
      <BrowseGrid />
    </div>
  );
}
